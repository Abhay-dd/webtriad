#!/usr/bin/env python3
"""
clean_db_store.py
-----------------
Safely removes fake / transactional data from db_store.json
while preserving real content (team, projects, blogs, settings, reviews, etc.).

Run from the backend/ directory:
    python3 clean_db_store.py

A backup of the original file is saved as db_store.json.bak before any changes.
"""

import json
import shutil
from pathlib import Path

STORE_FILE = Path(__file__).parent / "db_store.json"
BACKUP_FILE = STORE_FILE.with_suffix(".json.bak")

# ── Arrays to CLEAR entirely (all entries are transactional/fake) ─────────────
CLEAR_COLLECTIONS = [
    "leads",          # form submissions — all fake test data
    "contacts",       # form submissions — all fake test data
    "applications",   # job applications — all fake test data
    "attendance",     # staff attendance records — all fake test data
    "consultations",  # booking slots — all fake test data
]

# ── Arrays to KEEP exactly as-is (real data) ──────────────────────────────────
KEEP_COLLECTIONS = [
    "team",           # 25 real team members
    "projects",       # 100 real / seeded projects
    "blogs",          # 4 real blog posts
    "settings",       # 3 real settings records (launch_popup, homepage, team)
    "reviews",        # 3 real reviews
    "experience",     # 11 real experience records
    "users",          # 3 admin/staff accounts (seeded from .env)
    "organizations",  # 2 organisation records
]


def clean():
    # ── 1. Read the existing store ─────────────────────────────────────────────
    if not STORE_FILE.exists():
        print(f"[ERROR] {STORE_FILE} not found. Are you running from backend/? Exiting.")
        return

    with open(STORE_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    # ── 2. Create a backup before touching anything ────────────────────────────
    shutil.copy2(STORE_FILE, BACKUP_FILE)
    print(f"[OK]   Backup written → {BACKUP_FILE}")

    # ── 3. Report what we found ────────────────────────────────────────────────
    print("\nCurrent state:")
    for key, val in data.items():
        tag = "CLEAR" if key in CLEAR_COLLECTIONS else "KEEP "
        count = len(val) if isinstance(val, list) else "—"
        print(f"  [{tag}] {key}: {count} items")

    # ── 4. Clear the transactional / fake collections ─────────────────────────
    for col in CLEAR_COLLECTIONS:
        if col in data:
            removed = len(data[col])
            data[col] = []
            print(f"\n[CLEARED] '{col}': removed {removed} items → now []")
        else:
            print(f"[INFO]    '{col}': key not found in file (skipped)")

    # ── 5. Write the cleaned data back ────────────────────────────────────────
    with open(STORE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\n[DONE] Cleaned data written back to {STORE_FILE}")
    print(f"       Restore original any time:  cp {BACKUP_FILE} {STORE_FILE}")


if __name__ == "__main__":
    clean()
