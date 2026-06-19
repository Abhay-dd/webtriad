#!/usr/bin/env python3
"""
clear_fake_project_data.py
One-time migration: strip placeholder/fake data from all seeded projects.

Fields cleared:
  - gallery        (generic Unsplash apartment photos)
  - floor_plan     (generic "person looking at blueprints" stock photo)
  - map_image      (generic world map image)
  - amenities      (hardcoded Swimming Pool, Gymnasium etc.)
  - payment_plan   (hardcoded 10/50/40% milestones)
  - transactions   (fake transaction records)

After this runs, these sections will NOT appear on any project page until
an admin explicitly provides real content for them.
"""
import asyncio, sys, os

# ── Make sure we can import from the backend ──────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from server import db   # uses the same MongoDB connection as the live server

# The generic images that were baked in by seed_data.py
_FAKE_UNSPLASH = {
    # hero/gallery images recycled as gallery
    "https://images.unsplash.com/photo-1768069794857-9306ac167c6e",
    "https://images.unsplash.com/photo-1696880443820-3bc2838a0be0",
    "https://images.unsplash.com/photo-1772175057193-5f58ed26a785",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9",
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00",
    "https://images.unsplash.com/photo-1638454795595-0a0abf68614d",
    "https://images.unsplash.com/photo-1709153880759-ed27e0590618",
    "https://images.unsplash.com/photo-1715985160053-d339e8b6eb94",
    # floor plan stock photo
    "https://images.unsplash.com/photo-1503387762-592deb58ef4e",
    # world map stock photo
    "https://images.unsplash.com/photo-1524661135-423995f22d0b",
}

_FAKE_AMENITIES = {
    "Swimming Pool", "Gymnasium", "Concierge",
    "Smart Home", "Covered Parking", "Children's Play Area",
}

_FAKE_PAYMENT_MILESTONES = {"Booking", "Construction", "Handover"}


def is_fake_url(url: str) -> bool:
    """Return True if the URL is one of our seeded placeholder images."""
    if not url:
        return True
    for prefix in _FAKE_UNSPLASH:
        if url.startswith(prefix):
            return True
    return False


def is_fake_gallery(gallery: list) -> bool:
    """Return True if every image in the gallery is a known placeholder."""
    if not gallery:
        return True
    return all(is_fake_url(url) for url in gallery)


def is_fake_amenities(amenities: list) -> bool:
    """Return True if the amenities list is exactly the hardcoded set."""
    if not amenities:
        return True
    return set(amenities) == _FAKE_AMENITIES


def is_fake_payment_plan(pp: list) -> bool:
    """Return True if the payment plan is the generic Booking/Construction/Handover template."""
    if not pp:
        return True
    milestones = {stage.get("milestone") for stage in pp}
    return milestones == _FAKE_PAYMENT_MILESTONES


def is_fake_transactions(txns: list) -> bool:
    """Return True if transactions look like the auto-generated fake ones."""
    if not txns:
        return True
    # Fake transactions always have dates "2024-11-15" and "2024-08-20"
    dates = {t.get("date") for t in txns}
    return dates.issubset({"2024-11-15", "2024-08-20"})


async def main():
    col = db["projects"]
    projects = await col.find({}).to_list(length=10000)
    print(f"Found {len(projects)} projects in the database.")

    updated = 0
    for p in projects:
        clear = {}

        gallery = p.get("gallery") or []
        if is_fake_gallery(gallery):
            clear["gallery"] = []

        floor_plan = p.get("floor_plan") or ""
        if is_fake_url(floor_plan):
            clear["floor_plan"] = ""

        map_image = p.get("map_image") or ""
        if is_fake_url(map_image):
            clear["map_image"] = ""

        amenities = p.get("amenities") or []
        if is_fake_amenities(amenities):
            clear["amenities"] = []

        payment_plan = p.get("payment_plan") or []
        if is_fake_payment_plan(payment_plan):
            clear["payment_plan"] = []

        transactions = p.get("transactions") or []
        if is_fake_transactions(transactions):
            clear["transactions"] = []

        if clear:
            await col.update_one({"_id": p["_id"]}, {"$set": clear})
            print(f"  Cleared from '{p.get('name', p.get('id'))}': {list(clear.keys())}")
            updated += 1

    print(f"\nDone. Cleared fake data from {updated} / {len(projects)} projects.")


if __name__ == "__main__":
    asyncio.run(main())
