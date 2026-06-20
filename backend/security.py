"""JWT signing, password hashing, password validation, and reset-token helpers."""

import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Optional

import bcrypt
import jwt

# ---------------------------------------------------------------------------
# JWT configuration
# ---------------------------------------------------------------------------
JWT_SECRET: str = os.environ.get("JWT_SECRET", "")
if not JWT_SECRET or JWT_SECRET == "change-me-in-production":
    _secret_file = Path(__file__).parent / ".jwt_secret"
    if _secret_file.exists():
        try:
            JWT_SECRET = _secret_file.read_text().strip()
        except Exception:
            JWT_SECRET = secrets.token_hex(32)
    else:
        JWT_SECRET = secrets.token_hex(32)
        try:
            _secret_file.write_text(JWT_SECRET)
        except Exception:
            pass

if len(JWT_SECRET) < 32 or JWT_SECRET == "change-me-in-production":
    raise ValueError("JWT_SECRET must be at least 32 characters long and cannot be default value.")

JWT_ALGORITHM = "HS256"
# Default is 8 hours; override via JWT_EXPIRE_HOURS in .env
JWT_EXPIRE_HOURS = int(os.environ.get("JWT_EXPIRE_HOURS", "8"))
# Short-lived access tokens (15 minutes)
JWT_EXPIRE_MINUTES = int(os.environ.get("JWT_EXPIRE_MINUTES", "15"))

# ---------------------------------------------------------------------------
# Roles
# ---------------------------------------------------------------------------
ROLE_DEVELOPER = "developer"
ROLE_OWNER = "owner"
ROLE_STAFF = "staff"
ALL_ROLES = {ROLE_DEVELOPER, ROLE_OWNER, ROLE_STAFF}

# ---------------------------------------------------------------------------
# Password strength
# ---------------------------------------------------------------------------
MIN_PASSWORD_LENGTH = 8


def validate_password_strength(password: str) -> None:
    """Raise ValueError if *password* does not meet minimum strength requirements.

    Rules:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    """
    errors: list[str] = []
    if len(password) < MIN_PASSWORD_LENGTH:
        errors.append(f"at least {MIN_PASSWORD_LENGTH} characters")
    if not any(c.isupper() for c in password):
        errors.append("at least one uppercase letter")
    if not any(c.islower() for c in password):
        errors.append("at least one lowercase letter")
    if not any(c.isdigit() for c in password):
        errors.append("at least one digit")
    if errors:
        raise ValueError("Password must contain " + ", ".join(errors) + ".")


# ---------------------------------------------------------------------------
# Bcrypt helpers
# ---------------------------------------------------------------------------

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:
        return False


# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------

def create_access_token(
    user_id: str,
    role: str,
    organization_id: Optional[str] = None,
    session_version: Optional[str] = None,
) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload: dict[str, Any] = {
        "sub": user_id,
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    if organization_id:
        payload["organization_id"] = organization_id
    if session_version:
        payload["session_version"] = session_version
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> Optional[dict[str, Any]]:
    try:
        # Explicitly reject 'none' algorithm by inspecting the unverified header
        unverified_header = jwt.get_unverified_header(token)
        if unverified_header.get("alg", "").lower() == "none":
            return None
        return jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
            options={"require": ["exp", "iat", "sub", "role"]},
        )
    except jwt.PyJWTError:
        return None


def generate_refresh_token() -> str:
    return secrets.token_hex(32)


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def has_strong_jwt_secret() -> bool:
    if JWT_SECRET == "change-me-in-production":
        return False
    return len(JWT_SECRET) >= 32


# ---------------------------------------------------------------------------
# Password reset token helpers
# ---------------------------------------------------------------------------
RESET_TOKEN_EXPIRE_MINUTES = 15


def generate_reset_token() -> tuple[str, str, str]:
    """Return (plain_token, sha256_hash_of_token, expiry_iso).

    Only the *hash* is stored in the database.  The plain token is sent to
    the user (via email or API response in dev mode).
    """
    plain = secrets.token_urlsafe(32)
    hashed = hashlib.sha256(plain.encode()).hexdigest()
    expiry = datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    return plain, hashed, expiry.isoformat()


def verify_reset_token(plain_token: str, stored_hash: str, expiry_iso: str) -> bool:
    """Return True only if the token matches and has not expired."""
    try:
        expiry = datetime.fromisoformat(expiry_iso)
        if datetime.now(timezone.utc) > expiry:
            return False
        candidate_hash = hashlib.sha256(plain_token.encode()).hexdigest()
        return secrets.compare_digest(candidate_hash, stored_hash)
    except Exception:
        return False
