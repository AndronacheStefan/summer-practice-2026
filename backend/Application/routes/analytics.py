"""Time-range analytics endpoints.

Buckets by range:
  1h   -> 12 five-minute buckets (synthesized from daily rates + diurnal profile)
  24h  -> 24 hourly buckets      (synthesized from daily rates + diurnal profile)
  7d   -> 7  daily buckets       (true $group on Saving.log)
  30d  -> 30 daily buckets       (true $group on Saving.log)
  1y   -> 12 monthly buckets     (true $group on YYYY-MM prefix of Saving.log.date)

The stored data only has daily granularity (Saving.DailySaving), so sub-daily
ranges cannot be produced by a straight $group. For those we still use $group
to obtain per-device totals over a recent window, then distribute across the
requested bucket resolution using a diurnal weight profile.
"""
from datetime import date, datetime, timedelta
from math import cos, pi

from flask import jsonify, request  # type: ignore

from Application import app
from ..database.models import Device, Saving

# --- Rate model (mirrors dashboard.py) -------------------------------------
RATE_WINDOW_DAYS = 60
MIN_HOURS_OFF = 0.5
FALLBACK_KWH_PER_HOUR = 0.1

# 24 non-negative weights summing to ~1.0 shaping a plausible diurnal load
# (low overnight, morning ramp, midday peak, evening peak). Used only to
# distribute daily consumption across sub-daily buckets in 1h/24h ranges.
_DIURNAL = [
    0.020, 0.018, 0.017, 0.016, 0.017, 0.022,
    0.032, 0.045, 0.055, 0.058, 0.056, 0.054,
    0.055, 0.053, 0.050, 0.048, 0.050, 0.062,
    0.070, 0.068, 0.058, 0.045, 0.033, 0.026,
]
_DIURNAL_SUM = sum(_DIURNAL) or 1.0


def _device_rates(rate_from: str, rate_to: str) -> dict[str, float]:
    pipeline = [
        {"$unwind": "$log"},
        {"$match": {
            "log.date": {"$gte": rate_from, "$lte": rate_to},
            "log.hoursOff": {"$gte": MIN_HOURS_OFF},
        }},
        {"$group": {
            "_id": "$deviceName",
            "rate": {"$avg": {"$divide": ["$log.energySaved", "$log.hoursOff"]}},
        }},
    ]
    return {d["_id"]: float(d["rate"]) for d in Saving.objects.aggregate(pipeline)}


# --- Date helpers -----------------------------------------------------------

def _daterange_iso(start: date, days: int):
    return [(start + timedelta(days=i)).isoformat() for i in range(days)]


def _month_key(d: date) -> str:
    return f"{d.year:04d}-{d.month:02d}"


def _last_n_months(end: date, n: int) -> list[str]:
    keys = []
    y, m = end.year, end.month
    for _ in range(n):
        keys.append(f"{y:04d}-{m:02d}")
        m -= 1
        if m == 0:
            m = 12
            y -= 1
    keys.reverse()
    return keys


# --- Aggregations -----------------------------------------------------------

def _daily_bucket(start: str, end: str, device_id: str | None):
    match: dict = {"log.date": {"$gte": start, "$lte": end}}
    stages: list = []
    if device_id:
        stages.append({"$match": {"deviceName": device_id}})
    stages += [
        {"$unwind": "$log"},
        {"$match": match},
        {"$group": {
            "_id": "$log.date",
            "energySaved": {"$sum": "$log.energySaved"},
            "hoursOff": {"$sum": "$log.hoursOff"},
        }},
    ]
    return list(Saving.objects.aggregate(stages))


def _daily_by_device(start: str, end: str):
    """Per-device totals for the window, used to compute consumption per bucket."""
    pipeline = [
        {"$unwind": "$log"},
        {"$match": {"log.date": {"$gte": start, "$lte": end}}},
        {"$group": {
            "_id": {"device": "$deviceName", "date": "$log.date"},
            "energySaved": {"$sum": "$log.energySaved"},
            "hoursOff": {"$sum": "$log.hoursOff"},
        }},
    ]
    return list(Saving.objects.aggregate(pipeline))


def _monthly_by_device(start: str, end: str, device_id: str | None):
    stages: list = []
    if device_id:
        stages.append({"$match": {"deviceName": device_id}})
    stages += [
        {"$unwind": "$log"},
        {"$match": {"log.date": {"$gte": start, "$lte": end}}},
        {"$group": {
            "_id": {"device": "$deviceName", "month": {"$substr": ["$log.date", 0, 7]}},
            "energySaved": {"$sum": "$log.energySaved"},
            "hoursOff": {"$sum": "$log.hoursOff"},
            "days": {"$sum": 1},
        }},
    ]
    return list(Saving.objects.aggregate(stages))


def _device_totals(start: str, end: str):
    """Per-device totals for the window (any range), device_id NOT applied."""
    pipeline = [
        {"$unwind": "$log"},
        {"$match": {"log.date": {"$gte": start, "$lte": end}}},
        {"$group": {
            "_id": "$deviceName",
            "energySaved": {"$sum": "$log.energySaved"},
            "hoursOff": {"$sum": "$log.hoursOff"},
            "days": {"$sum": 1},
        }},
    ]
    return list(Saving.objects.aggregate(pipeline))


# --- Consumption model ------------------------------------------------------

def _consumption(hours_off: float, rate: float) -> float:
    running_hours = max(0.0, min(24.0, 24.0 - float(hours_off)))
    return running_hours * rate


def _daily_totals_for_window(start: str, end: str, rates: dict[str, float], device_id: str | None):
    """Return dict {iso_date: {consumption, energySaved}} across the window."""
    rows = _daily_by_device(start, end)
    out: dict[str, dict[str, float]] = {}
    for row in rows:
        dev = row["_id"]["device"]
        if device_id and dev != device_id:
            continue
        day = row["_id"]["date"]
        rate = rates.get(dev, FALLBACK_KWH_PER_HOUR)
        agg = out.setdefault(day, {"consumption": 0.0, "energySaved": 0.0})
        agg["consumption"] += _consumption(row["hoursOff"], rate)
        agg["energySaved"] += float(row["energySaved"])
    return out


# --- Sub-daily distribution -------------------------------------------------

def _split_by_diurnal(total: float, hours: list[int]) -> list[float]:
    """Split `total` across the given absolute hours-of-day using diurnal weights."""
    weights = [_DIURNAL[h % 24] for h in hours]
    s = sum(weights) or 1.0
    return [total * (w / s) for w in weights]


# --- Endpoints --------------------------------------------------------------

VALID_RANGES = {"1h", "24h", "7d", "30d", "1y"}


def _labels_daily(dates: list[str]) -> list[str]:
    """Labels for 7d ('Mon') and 30d ('Jul 12')."""
    return dates  # caller decides formatting


def _weekday_labels(dates: list[str]) -> list[str]:
    names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    out = []
    for iso in dates:
        y, m, d = (int(x) for x in iso.split("-"))
        out.append(names[date(y, m, d).weekday()])
    return out


def _month_day_labels(dates: list[str]) -> list[str]:
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    out = []
    for iso in dates:
        y, m, d = (int(x) for x in iso.split("-"))
        out.append(f"{months[m - 1]} {d}")
    return out


def _month_labels_from_keys(keys: list[str]) -> list[str]:
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return [months[int(k.split("-")[1]) - 1] for k in keys]


def _validate_range() -> tuple[str | None, tuple | None]:
    r = (request.args.get("range") or "").strip()
    if not r:
        return None, (jsonify({"error": "range is required"}), 400)
    if r not in VALID_RANGES:
        return None, (jsonify({"error": f"invalid range '{r}'"}), 400)
    return r, None


def _rate_lookup(today: date) -> dict[str, float]:
    rate_from = (today - timedelta(days=RATE_WINDOW_DAYS - 1)).isoformat()
    return _device_rates(rate_from, today.isoformat())


@app.route('/analytics/consumption', methods=['GET'])
def analytics_consumption():
    try:
        range_key, err = _validate_range()
        if err:
            return err
        device_id = request.args.get("device_id") or None

        today = date.today()
        now = datetime.now()
        rates = _rate_lookup(today)

        if range_key == "7d":
            days = _daterange_iso(today - timedelta(days=6), 7)
            start, end = days[0], days[-1]
            totals = _daily_totals_for_window(start, end, rates, device_id)
            labels = _weekday_labels(days)
            consumption = [round(totals.get(d, {}).get("consumption", 0.0), 2) for d in days]
            energy_saved = [round(totals.get(d, {}).get("energySaved", 0.0), 2) for d in days]

        elif range_key == "30d":
            days = _daterange_iso(today - timedelta(days=29), 30)
            start, end = days[0], days[-1]
            totals = _daily_totals_for_window(start, end, rates, device_id)
            labels = _month_day_labels(days)
            consumption = [round(totals.get(d, {}).get("consumption", 0.0), 2) for d in days]
            energy_saved = [round(totals.get(d, {}).get("energySaved", 0.0), 2) for d in days]

        elif range_key == "1y":
            keys = _last_n_months(today, 12)
            first = f"{keys[0]}-01"
            last = today.isoformat()
            rows = _monthly_by_device(first, last, device_id)
            buckets: dict[str, dict[str, float]] = {k: {"consumption": 0.0, "energySaved": 0.0} for k in keys}
            for row in rows:
                dev = row["_id"]["device"]
                mk = row["_id"]["month"]
                if mk not in buckets:
                    continue
                rate = rates.get(dev, FALLBACK_KWH_PER_HOUR)
                buckets[mk]["energySaved"] += float(row["energySaved"])
                total_hours = 24.0 * int(row["days"])
                running_hours = max(0.0, total_hours - float(row["hoursOff"]))
                buckets[mk]["consumption"] += running_hours * rate
            labels = _month_labels_from_keys(keys)
            consumption = [round(buckets[k]["consumption"], 2) for k in keys]
            energy_saved = [round(buckets[k]["energySaved"], 2) for k in keys]

        elif range_key == "24h":
            # Average the last 7 days of totals for a stable diurnal shape.
            window_days = _daterange_iso(today - timedelta(days=6), 7)
            totals = _daily_totals_for_window(window_days[0], window_days[-1], rates, device_id)
            avg_daily_cons = sum(t["consumption"] for t in totals.values()) / max(1, len(window_days))
            avg_daily_saved = sum(t["energySaved"] for t in totals.values()) / max(1, len(window_days))

            end_hour = now.replace(minute=0, second=0, microsecond=0)
            hours = [(end_hour - timedelta(hours=23 - i)) for i in range(24)]
            labels = [h.strftime("%H:00") for h in hours]
            hour_of_day = [h.hour for h in hours]
            consumption = [round(v, 2) for v in _split_by_diurnal(avg_daily_cons, hour_of_day)]
            # savings tend to be inverse of consumption; use gentler flat distribution
            energy_saved = [round(avg_daily_saved / 24.0, 2)] * 24

        else:  # "1h"
            window_days = _daterange_iso(today - timedelta(days=6), 7)
            totals = _daily_totals_for_window(window_days[0], window_days[-1], rates, device_id)
            avg_daily_cons = sum(t["consumption"] for t in totals.values()) / max(1, len(window_days))
            avg_daily_saved = sum(t["energySaved"] for t in totals.values()) / max(1, len(window_days))

            end_min = now.replace(second=0, microsecond=0)
            end_min = end_min.replace(minute=(end_min.minute // 5) * 5)
            bucket_times = [end_min - timedelta(minutes=5 * (11 - i)) for i in range(12)]
            labels = [t.strftime("%H:%M") for t in bucket_times]

            # Distribute across 12 five-min buckets using diurnal weight at the
            # bucket's hour, then scale to (hourly average * 5min/60min).
            hourly_avg = avg_daily_cons / 24.0
            per_bucket_hourly = _split_by_diurnal(hourly_avg * 12.0, [t.hour for t in bucket_times])
            # scale so the sum equals hourly_avg (one hour's worth over 12 buckets)
            s = sum(per_bucket_hourly) or 1.0
            per_bucket_hourly = [v * hourly_avg / s for v in per_bucket_hourly]
            # add a gentle intra-hour ripple so the line isn't perfectly flat
            consumption = []
            for i, v in enumerate(per_bucket_hourly):
                ripple = 1.0 + 0.08 * cos(2 * pi * i / 12.0)
                consumption.append(round(v * ripple, 3))
            saved_bucket = (avg_daily_saved / 24.0) / 12.0
            energy_saved = [round(saved_bucket, 3)] * 12

        return jsonify({
            "range": range_key,
            "labels": labels,
            "consumption": consumption,
            "energy_saved": energy_saved,
            "total_consumption": round(sum(consumption), 2),
            "total_saved": round(sum(energy_saved), 2),
            "unit": "kWh",
        }), 200
    except Exception as e:
        print('analytics_consumption error:', e)
        return jsonify({'error': str(e)}), 500


@app.route('/analytics/by-device', methods=['GET'])
def analytics_by_device():
    try:
        range_key, err = _validate_range()
        if err:
            return err

        today = date.today()
        rates = _rate_lookup(today)

        # Window in days for each range.
        window_days_map = {"1h": 7, "24h": 7, "7d": 7, "30d": 30, "1y": 365}
        window_days = window_days_map[range_key]
        start = (today - timedelta(days=window_days - 1)).isoformat()
        end = today.isoformat()

        totals = _device_totals(start, end)

        # Build per-device consumption estimates.
        per_device: list[dict] = []
        for row in totals:
            dev = row["_id"]
            rate = rates.get(dev, FALLBACK_KWH_PER_HOUR)
            total_hours = 24.0 * int(row["days"])
            running_hours = max(0.0, total_hours - float(row["hoursOff"]))
            per_device.append({
                "deviceName": dev,
                "consumption": running_hours * rate,
                "energySaved": float(row["energySaved"]),
            })

        # Scale to the requested range: 1h / 24h are fractions of the 7-day window.
        scale_map = {"1h": 1.0 / (7 * 24), "24h": 1.0 / 7, "7d": 1.0, "30d": 1.0, "1y": 1.0}
        scale = scale_map[range_key]
        for p in per_device:
            p["consumption"] *= scale
            p["energySaved"] *= scale

        # Enrich with device metadata.
        meta = {d.deviceName: d for d in Device.objects.only('deviceName', 'deviceType', 'group')}
        grand_total = sum(p["consumption"] for p in per_device) or 1.0
        result = []
        for p in per_device:
            d = meta.get(p["deviceName"])
            result.append({
                "device_id": p["deviceName"],
                "name": p["deviceName"],
                "type": (d.deviceType if d else None) or "Unknown",
                "consumption": round(p["consumption"], 2),
                "energy_saved": round(p["energySaved"], 2),
                "percentage": round(100.0 * p["consumption"] / grand_total, 1),
            })
        result.sort(key=lambda x: x["consumption"], reverse=True)
        return jsonify(result), 200
    except Exception as e:
        print('analytics_by_device error:', e)
        return jsonify({'error': str(e)}), 500


@app.route('/analytics/hourly-profile', methods=['GET'])
def analytics_hourly_profile():
    """Average consumption per hour-of-day (0..23) over the selected range."""
    try:
        range_key, err = _validate_range()
        if err:
            return err
        device_id = request.args.get("device_id") or None

        today = date.today()
        rates = _rate_lookup(today)

        window_days_map = {"1h": 1, "24h": 1, "7d": 7, "30d": 30, "1y": 365}
        window_days = window_days_map[range_key]
        start = (today - timedelta(days=window_days - 1)).isoformat()
        end = today.isoformat()

        totals = _daily_totals_for_window(start, end, rates, device_id)
        avg_daily_cons = (sum(t["consumption"] for t in totals.values()) / window_days) if window_days else 0.0

        # Distribute the daily average across 24 hours using the diurnal profile.
        consumption = [round(avg_daily_cons * (w / _DIURNAL_SUM), 3) for w in _DIURNAL]
        labels = [f"{h:02d}:00" for h in range(24)]
        return jsonify({
            "labels": labels,
            "consumption": consumption,
            "unit": "kWh",
        }), 200
    except Exception as e:
        print('analytics_hourly_profile error:', e)
        return jsonify({'error': str(e)}), 500
