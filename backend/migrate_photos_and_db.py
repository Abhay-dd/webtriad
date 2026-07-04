#!/usr/bin/env python3
"""
migrate_photos_and_db.py
--------------------
1. Reads db_store.json.bak.
2. Uploads all local files under backend/uploads/ referenced in the DB to Cloudinary.
3. Replaces local /uploads/... URLs with Cloudinary secure URLs.
4. Saves updated data to db_store.json.
5. Migrates everything to MongoDB Atlas.
"""

import os
import json
import asyncio
from pathlib import Path
from dotenv import load_dotenv
import cloudinary
import cloudinary.uploader
from pymongo import MongoClient

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# ── Fallback Defaults ────────────────────────────────────────────────────────
DEFAULT_MONGO_URL = "mongodb+srv://king8637g4ff_db_user:Triad123456@triad-cluster.zfjnhni.mongodb.net/?retryWrites=true&w=majority&appName=triad-cluster"
MONGO_URL = os.environ.get("MONGO_URL", os.environ.get("MONGO_URI", DEFAULT_MONGO_URL))
DB_NAME = os.environ.get("DB_NAME", "triad_realty")

CLOUDINARY_CLOUD_NAME = os.environ.get("CLOUDINARY_CLOUD_NAME", "dhxttgpfj")
CLOUDINARY_API_KEY = os.environ.get("CLOUDINARY_API_KEY", "586595859119989")
CLOUDINARY_API_SECRET = os.environ.get("CLOUDINARY_API_SECRET", "ZOv0THiwXmBw4KvhYoFdP3CeuEE")

# Initialize Cloudinary
cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET,
    secure=True
)

UPLOADS_DIR = ROOT_DIR / "uploads"

# Cache to avoid duplicate uploads of the same file
upload_cache = {}

def upload_to_cloudinary(url_path: str) -> str:
    """Uploads a local file path (e.g. /uploads/abc.png) to Cloudinary and returns the secure URL."""
    if not url_path or not url_path.startswith("/uploads/"):
        return url_path
    
    if url_path in upload_cache:
        return upload_cache[url_path]
    
    filename = url_path.replace("/uploads/", "")
    local_file = UPLOADS_DIR / filename
    
    if not local_file.exists():
        print(f"  [!] Warning: Local file {local_file} not found. Skipping upload.")
        return url_path
    
    try:
        print(f"  [->] Uploading {filename} to Cloudinary...")
        public_id = filename.rsplit(".", 1)[0]
        res = cloudinary.uploader.upload(
            str(local_file),
            public_id=public_id,
            resource_type="auto",
            folder="triad-realty"
        )
        cloudinary_url = res.get("secure_url", "")
        if cloudinary_url:
            upload_cache[url_path] = cloudinary_url
            print(f"      [OK] Success: {cloudinary_url}")
            return cloudinary_url
    except Exception as e:
        print(f"      [ERR] Failed to upload {filename}: {e}")
        
    return url_path

def process_value(val):
    """Recursively search for and replace upload paths in strings, lists, or dicts."""
    if isinstance(val, str):
        return upload_to_cloudinary(val)
    elif isinstance(val, list):
        return [process_value(item) for item in val]
    elif isinstance(val, dict):
        return {k: process_value(v) for k, v in val.items()}
    return val

async def main():
    print("=== [1/4] Loading database backup ===")
    backup_file = ROOT_DIR / "db_store.json.bak"
    if not backup_file.exists():
        print(f"[ERROR] Backup file {backup_file} does not exist!")
        return

    with open(backup_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    print("\n=== [2/4] Uploading photos to Cloudinary ===")
    # Recursively process the JSON database to upload all referenced assets
    updated_data = process_value(data)

    print("\n=== [3/4] Saving updated database to db_store.json ===")
    store_file = ROOT_DIR / "db_store.json"
    with open(store_file, "w", encoding="utf-8") as f:
        json.dump(updated_data, f, indent=2)
    print(f"Saved updated DB containing Cloudinary URLs to {store_file}")

    print("\n=== [4/4] Connecting & Migrating to MongoDB Atlas ===")
    masked_url = MONGO_URL
    if "@" in MONGO_URL:
        parts = MONGO_URL.split("@")
        prefix = parts[0].split("://")
        masked_url = f"{prefix[0]}://****:****@{parts[-1]}"
    print(f"Connecting to: {masked_url}")
    
    try:
        client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
        # Test connection
        client.admin.command('ping')
        print("[OK] Connected to MongoDB Atlas successfully!")
        db = client[DB_NAME]
    except Exception as e:
        print(f"[ERROR] Failed to connect to MongoDB: {e}")
        print("Please check your database credentials, network connection, or Atlas IP Whitelist.")
        return

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

    for col in collections_to_migrate:
        items = updated_data.get(col, [])
        if not items:
            print(f"  [-] Collection '{col}' is empty in JSON (skipped)")
            continue

        print(f"  [+] Migrating '{col}' ({len(items)} items)...")
        # Clear existing collection in MongoDB to prevent duplicates
        db[col].delete_many({})
        # Insert all items into MongoDB
        db[col].insert_many(items)
        print(f"      -> Successfully migrated {len(items)} items to MongoDB collection '{col}'")

    print("\n[SUCCESS] Migration complete! MongoDB Atlas database fully updated with Cloudinary URLs!")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
