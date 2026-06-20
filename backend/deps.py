"""FastAPI dependencies for auth and RBAC."""

from datetime import datetime, timezone
from typing import Callable, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from db import db_find_one
from security import decode_token

bearer_scheme = HTTPBearer(auto_error=False)


def _parse_utc_datetime(value):
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(value, tz=timezone.utc)
    if isinstance(value, str):
        try:
            dt = datetime.fromisoformat(value)
            if dt.tzinfo is None:
                return dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc)
        except ValueError:
            return None
    return None


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
):
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user = await db_find_one("users", {"id": payload["sub"]})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    session_version = user.get("session_version")
    if session_version and payload.get("session_version") != session_version:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired; please log in again")
    token_issued_at = _parse_utc_datetime(payload.get("iat"))
    password_changed_at = _parse_utc_datetime(user.get("password_changed_at"))
    if not token_issued_at:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    if not session_version and password_changed_at and token_issued_at < password_changed_at:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Password changed; please log in again")
    return user


def require_roles(*roles: str) -> Callable:
    allowed = set(roles)

    async def checker(user=Depends(get_current_user)):
        if user.get("role") not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return checker


require_developer = require_roles("developer")
require_owner = require_roles("owner")
require_staff = require_roles("staff")
require_owner_or_developer = require_roles("owner", "developer")
require_staff_or_owner = require_roles("staff", "owner")
