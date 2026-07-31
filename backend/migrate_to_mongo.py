#!/usr/bin/env python3
"""
migrate_to_mongo.py
--------------------
Migrates all cleaned database tables (projects, team, blogs, settings, etc.)
from db_store.json into your MongoDB Atlas database.

Run this script after your MONGO_URL is connected:
    python3 migrate_to_mongo.py
"""

import json
import os
import asyncio
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ.get("MONGO_URL", os.environ.get("MONGO_URI", ""))
DB_NAME = os.environ.get("DB_NAME", "triad_realty")


async def migrate():
    if not MONGO_URL:
        print("[ERROR] MONGO_URL is not set in backend/.env. Please configure it first.")
        return

    # Hide password in output for security
    masked_url = MONGO_URL
    if "@" in MONGO_URL:
        parts = MONGO_URL.split("@")
        prefix = parts[0].split("://")
        masked_url = f"{prefix[0]}://****:****@{parts[-1]}"

    print(f"Connecting to MongoDB at: {masked_url}")
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]

        # Test connection by pinging
        await db.command("ping")
        print("[OK]    Connected to MongoDB Atlas successfully!")
    except Exception as e:
        print(f"\n[ERROR] Failed to connect to MongoDB: {e}")
        print("Please check:")
        print("  1. That your MONGO_URL username and password are correct.")
        print("  2. That your Atlas Cluster is active (not paused/suspended).")
        print("  3. That your current IP address is whitelisted in Atlas Network Access.")
        return

    store_file = ROOT_DIR / "db_store.json"
    if not store_file.exists():
        print(f"[ERROR] {store_file} does not exist. Nothing to migrate.")
        return

    with open(store_file, "r", encoding="utf-8") as f:
        store = json.load(f)

    # Collections containing real data that we want to migrate
    collections_to_migrate = [
        "team",
        "projects",
        "blogs",
        "settings",
        "reviews",
        "experience",
        "users",
        "organizations"
    ]

    print("\nStarting data migration...")
    for col in collections_to_migrate:
        items = store.get(col, [])
        if not items:
            print(f"  [-] Collection '{col}' is empty in JSON (skipped)")
            continue

        print(f"  [+] Migrating '{col}' ({len(items)} items)...")
        # Clear existing collection in MongoDB to prevent duplicate key/document errors
        await db[col].delete_many({})
        # Insert all items into MongoDB
        await db[col].insert_many(items)
        print(f"      → Successfully migrated {len(items)} items to MongoDB collection '{col}'")

    print("\n🎉 Data migration completed successfully!")
    print("   Your MongoDB Atlas database is now fully updated with db_store.json data.")
    client.close()


if __name__ == "__main__":
    asyncio.run(migrate())
