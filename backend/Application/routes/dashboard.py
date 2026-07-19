"""Dashboard aggregation endpoints.

Consumption is not stored on Device docs in the current data set. We derive an
effective kWh/h rate per device from its own savings log:

    rate(device) = mean(energySaved / hoursOff) over the last RATE_WINDOW_DAYS
                   of that device's log where hoursOff >= MIN_HOURS_OFF

Then for any DailySaving entry:

    runningHours       = clamp(24 - hoursOff, 0, 24)
    consumptionForDay  = runningHours * rate(device)

If a device has no usable rows to compute a rate we fall back to
FALLBACK_KWH_PER_HOUR. In the seeded data every device has ample history, so
the fallback should not trigger.
"""
from datetime import date, timedelta

from flask import jsonify  # type: ignore

from Application import app
from ..database.models import Device, Saving

RATE_WINDOW_DAYS = 60
MIN_HOURS_OFF = 0.5
FALLBACK_KWH_PER_HOUR = 0.1


def _week_window(end: date, days: int = 7):
    start = end - timedelta(days=days - 1)
    return start.isoformat(), end.isoformat()


def _device_rates(rate_from: str, rate_to: str) -> dict[str, float]:
    """Effective kWh/h per device, derived from the log itself."""
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


def _sum_window(start: str, end: str):
    """Sum energySaved and hoursOff per device within [start, end]."""
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


def _daily_totals(start: str, end: str):
    """Per-day, per-device sums so we can compute consumption day-by-day."""
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


def _consumption(hours_off: float, rate: float) -> float:
    running_hours = max(0.0, min(24.0, 24.0 - float(hours_off)))
    return running_hours * rate


@app.route('/dashboard/summary', methods=['GET'])
def dashboard_summary():
    try:
        today = date.today()
        this_start, this_end = _week_window(today)
        prev_start, prev_end = _week_window(today - timedelta(days=7))

        rate_from = (today - timedelta(days=RATE_WINDOW_DAYS - 1)).isoformat()
        rates = _device_rates(rate_from, today.isoformat())

        def totals_for(start: str, end: str):
            energy = 0.0
            consumption = 0.0
            for row in _sum_window(start, end):
                dev = row["_id"]
                rate = rates.get(dev, FALLBACK_KWH_PER_HOUR)
                energy += float(row["energySaved"])
                # 24h * days is the max hours; hoursOff sum is already the total off
                total_hours = 24.0 * int(row["days"])
                running_hours = max(0.0, total_hours - float(row["hoursOff"]))
                consumption += running_hours * rate
            return energy, consumption

        energy_this, consumption_this = totals_for(this_start, this_end)
        energy_prev, consumption_prev = totals_for(prev_start, prev_end)

        return jsonify({
            'registeredDevices': Device.objects.count(),
            'energySavedThisWeek': round(energy_this, 2),
            'totalConsumptionThisWeek': round(consumption_this, 2),
            'previousWeek': {
                'energySaved': round(energy_prev, 2),
                'totalConsumption': round(consumption_prev, 2),
            },
            'windowStart': this_start,
            'windowEnd': this_end,
        }), 200
    except Exception as e:
        print('dashboard_summary error:', e)
        return jsonify({'error': str(e)}), 500


@app.route('/dashboard/weekly', methods=['GET'])
def dashboard_weekly():
    try:
        today = date.today()
        start_str, end_str = _week_window(today)
        rate_from = (today - timedelta(days=RATE_WINDOW_DAYS - 1)).isoformat()
        rates = _device_rates(rate_from, today.isoformat())

        # Bucket per-day totals for the 7-day window.
        buckets: dict[str, dict[str, float]] = {}
        for i in range(7):
            d = today - timedelta(days=6 - i)
            buckets[d.isoformat()] = {'energySaved': 0.0, 'consumption': 0.0}

        for row in _daily_totals(start_str, end_str):
            dev = row['_id']['device']
            day = row['_id']['date']
            rate = rates.get(dev, FALLBACK_KWH_PER_HOUR)
            buckets[day]['energySaved'] += float(row['energySaved'])
            buckets[day]['consumption'] += _consumption(row['hoursOff'], rate)

        weekday_names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        days = []
        for iso, agg in sorted(buckets.items()):
            y, m, d = (int(x) for x in iso.split('-'))
            days.append({
                'date': iso,
                'weekday': weekday_names[date(y, m, d).weekday()],
                'energySaved': round(agg['energySaved'], 2),
                'consumption': round(agg['consumption'], 2),
            })

        return jsonify({'days': days}), 200
    except Exception as e:
        print('dashboard_weekly error:', e)
        return jsonify({'error': str(e)}), 500
