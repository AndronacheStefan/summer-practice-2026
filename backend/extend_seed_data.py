"""Catch up the Saving collection to today's real date.

The seeded Saving history stops at a fixed day in the past (all logs are 365 days
long). This script appends the missing DailySaving entries — from each device's
last recorded day up to and including today — so the dashboard/analytics windows
have fresh data. It never wipes or rewrites existing history and is idempotent:
running it again the same day adds nothing.

New days are made indistinguishable from the old ones by learning each device's
own behaviour from its log:
  * rate      = mean(energySaved / hoursOff)  over a recent window (hoursOff >= 0.5),
                which is exactly how dashboard.py / analytics.py derive it. We use
                this instead of Device.consumptionPerHour because that field is
                null on every device in the seeded data.
  * hoursOff  = drawn around the device's learned weekday / weekend mean & std,
                with a mild yearly-seasonal nudge and small noise, clamped to [0, 24].
  * energySaved = hoursOff * rate * (1 +/- small noise), clamped to >= 0.

Only the `device` (read) and `saving` (read + $push) collections are touched.
`schedule` and `user` are never modified.
"""

import configparser
import math
import os
import random
import sys
from datetime import date, timedelta
from statistics import mean, pstdev

from bson import ObjectId  # type: ignore
import mongoengine  # type: ignore

# --- Tunables ---------------------------------------------------------------
WINDOW = 90            # how many recent log days to learn behaviour from
MIN_HOURS_OFF = 0.5    # ignore near-zero days when deriving the rate (matches dashboard)
FALLBACK_RATE = 0.1    # kWh/h fallback when a device has no usable rows
SEASON_AMP = 0.05      # amplitude of the mild yearly-seasonal nudge
RATE_NOISE = 0.05      # +/- noise on energySaved around hoursOff * rate

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def _connect():
    """Open the single mongoengine connection using the app's own config.ini.

    Mirrors Application/database/db.py::initialize_db without importing the
    Application package (which would boot the APScheduler background jobs).
    """
    cfg = configparser.ConfigParser()
    cfg.read(os.path.join(BASE_DIR, "Application", "scripts", "config.ini"))
    mongo_url = cfg["db"]["MONGO_URL"].strip()
    mongoengine.connect(host=mongo_url)
    return mongo_url


def _load_models():
    """Reuse the exact model classes defined in Application/database/models.py."""
    sys.path.insert(0, os.path.join(BASE_DIR, "Application", "database"))
    from models import Device, Saving, DailySaving  # type: ignore
    return Device, Saving, DailySaving


def _parse(iso: str) -> date:
    return date.fromisoformat(iso)


def _mu_sigma(values, fallback):
    """Mean/std of a hoursOff group, falling back when the group is too small."""
    data = values if len(values) >= 3 else fallback
    if not data:
        return 0.0, 1.0
    mu = mean(data)
    sigma = pstdev(data) if len(data) > 1 else max(0.5, 0.1 * mu)
    return mu, sigma


def _learn(entries):
    """Derive (rate, weekday mu/sigma, weekend mu/sigma) from a recent window."""
    window = entries[-WINDOW:]

    ratios = [
        e.energySaved / e.hoursOff
        for e in window
        if e.hoursOff and e.hoursOff >= MIN_HOURS_OFF and e.energySaved is not None
    ]
    rate = mean(ratios) if ratios else FALLBACK_RATE

    all_h = [e.hoursOff for e in window if e.hoursOff is not None]
    wd = [e.hoursOff for e in window if _parse(e.date).weekday() < 5 and e.hoursOff is not None]
    we = [e.hoursOff for e in window if _parse(e.date).weekday() >= 5 and e.hoursOff is not None]

    wd_mu, wd_sig = _mu_sigma(wd, all_h)
    we_mu, we_sig = _mu_sigma(we, all_h)
    return rate, (wd_mu, wd_sig), (we_mu, we_sig)


def _make_day(DailySaving, d: date, last_date: date, rate, weekday_p, weekend_p):
    """Generate one realistic DailySaving for date `d`."""
    mu, sigma = weekend_p if d.weekday() >= 5 else weekday_p

    # Mild yearly seasonality, expressed as a delta from the last known day so it
    # is ~1 for a short catch-up yet still correct if the gap is large.
    seasonal = 1.0 + SEASON_AMP * (
        math.cos(2 * math.pi * d.timetuple().tm_yday / 365.0)
        - math.cos(2 * math.pi * last_date.timetuple().tm_yday / 365.0)
    )

    hours_off = random.gauss(mu, sigma) * seasonal
    hours_off = round(max(0.0, min(24.0, hours_off)), 2)

    energy_saved = hours_off * rate * (1.0 + random.gauss(0.0, RATE_NOISE))
    energy_saved = round(max(0.0, energy_saved), 3)

    return DailySaving(
        subId=ObjectId(),
        date=d.isoformat(),
        hoursOff=hours_off,
        energySaved=energy_saved,
    )


def main():
    mongo_url = _connect()
    Device, Saving, DailySaving = _load_models()

    today = date.today()
    print(f"Connected to {mongo_url}")
    print(f"Catching up Saving history up to {today.isoformat()}\n")

    updated = 0
    already = 0
    skipped = []              # device names without a usable Saving doc
    total_new = 0
    filled_dates = set()

    for dev in Device.objects:
        saving = Saving.objects(deviceName=dev.deviceName).first()
        if saving is None or not saving.log:
            skipped.append(dev.deviceName)
            continue

        entries = sorted(saving.log, key=lambda e: e.date)
        last_date = _parse(entries[-1].date)
        if last_date >= today:
            already += 1
            continue

        rate, weekday_p, weekend_p = _learn(entries)

        new_entries = []
        d = last_date + timedelta(days=1)
        while d <= today:
            new_entries.append(_make_day(DailySaving, d, last_date, rate, weekday_p, weekend_p))
            filled_dates.add(d)
            d += timedelta(days=1)

        # True $push of each embedded doc — appends without rewriting the array.
        for entry in new_entries:
            Saving.objects(pk=saving.pk).update(push__log=entry)

        updated += 1
        total_new += len(new_entries)

    # --- Summary ------------------------------------------------------------
    print("=" * 60)
    if filled_dates:
        lo, hi = min(filled_dates).isoformat(), max(filled_dates).isoformat()
        print(f"filled {lo} to {hi} for {updated} devices, {total_new} new entries; "
              f"{already} already up to date; {len(skipped)} skipped (no Saving).")
    else:
        print(f"nothing to fill: {already} devices already up to date; "
              f"{len(skipped)} skipped (no Saving).")
    if skipped:
        print("skipped devices:", ", ".join(skipped))
    print("=" * 60)


if __name__ == "__main__":
    main()
