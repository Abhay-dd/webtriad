"""Sliding-window rate limiting and per-account login lockout."""

import time
from collections import defaultdict, deque
from dataclasses import dataclass
from typing import DefaultDict, Deque, Optional, Tuple

from fastapi import HTTPException, Request, status

# ---------------------------------------------------------------------------
# Generic per-(IP, path) sliding-window rate limiter
# ---------------------------------------------------------------------------
_buckets: DefaultDict[Tuple[str, str], Deque[float]] = defaultdict(deque)

DEFAULT_LIMIT = 120
DEFAULT_WINDOW_SEC = 60


@dataclass(frozen=True)
class RateLimitPolicy:
    name: str
    limit: int
    window_sec: int


DEFAULT_POLICY = RateLimitPolicy("api", DEFAULT_LIMIT, DEFAULT_WINDOW_SEC)
READ_POLICY = RateLimitPolicy("read", 240, 60)
PUBLIC_POST_POLICY = RateLimitPolicy("public_post", 30, 60)
AUTH_POLICY = RateLimitPolicy("auth", 10, 60)
PASSWORD_RESET_POLICY = RateLimitPolicy("password_reset", 5, 300)
ACCOUNT_CREATE_POLICY = RateLimitPolicy("account_create", 10, 3600)
UPLOAD_POLICY = RateLimitPolicy("upload", 20, 3600)
AI_GENERATION_POLICY = RateLimitPolicy("ai_generation", 10, 300)

_AUTH_PATHS = {"/api/auth/login", "/api/auth/refresh"}
_PASSWORD_RESET_PATHS = {"/api/auth/forgot-password", "/api/auth/reset-password", "/api/auth/verify-email", "/api/auth/resend-verification"}
_ACCOUNT_CREATE_PATHS = {"/api/admin/owners", "/api/admin/staff"}
_PUBLIC_POST_PATHS = {"/api/leads", "/api/contacts", "/api/applications", "/api/consultations"}


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def get_rate_limit_policy(request: Request) -> Optional[RateLimitPolicy]:
    path = request.url.path
    method = request.method.upper()

    if method == "OPTIONS":
        return None
    if not path.startswith("/api/"):
        return READ_POLICY if method == "GET" else DEFAULT_POLICY
    if path in _PASSWORD_RESET_PATHS:
        return PASSWORD_RESET_POLICY
    if path in _AUTH_PATHS:
        return AUTH_POLICY
    if path in _ACCOUNT_CREATE_PATHS and method == "POST":
        return ACCOUNT_CREATE_POLICY
    if path == "/api/upload":
        return UPLOAD_POLICY
    if "/ai" in path or "generate" in path or "generation" in path:
        return AI_GENERATION_POLICY
    if method == "GET":
        return READ_POLICY
    if method == "POST" and path in _PUBLIC_POST_PATHS:
        return PUBLIC_POST_POLICY
    return DEFAULT_POLICY


def check_rate_limit_key(key: Tuple[str, str], limit: int, window_sec: int) -> None:
    """Raise HTTP 429 if *key* has exceeded *limit* hits in the sliding window."""
    now = time.time()
    window_start = now - window_sec

    hits = _buckets[key]
    while hits and hits[0] <= window_start:
        hits.popleft()

    if len(hits) >= limit:
        retry_after = int(hits[0] + window_sec - now) + 1
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later.",
            headers={"Retry-After": str(max(1, retry_after))},
        )
    hits.append(now)


def check_rate_limit(
    request: Request,
    limit: int = DEFAULT_LIMIT,
    window_sec: int = DEFAULT_WINDOW_SEC,
    bucket: Optional[str] = None,
) -> None:
    """Raise HTTP 429 if the caller has exceeded *limit* requests in the window."""
    ip = client_ip(request)
    key = (ip, bucket or request.url.path)
    check_rate_limit_key(key, limit, window_sec)


def check_request_rate_limit(request: Request) -> Optional[RateLimitPolicy]:
    policy = get_rate_limit_policy(request)
    if policy is None:
        return None
    ip = client_ip(request)
    key = (ip, policy.name if policy.name == "ai_generation" else request.url.path)
    check_rate_limit_key(key, policy.limit, policy.window_sec)
    return policy


# ---------------------------------------------------------------------------
# Per-account login lockout
# ---------------------------------------------------------------------------
# email (lower) -> deque of failed-attempt timestamps
_failed_logins: DefaultDict[str, Deque[float]] = defaultdict(deque)

LOCKOUT_MAX_ATTEMPTS = 5       # max failures before lockout
LOCKOUT_WINDOW_SEC  = 15 * 60  # sliding window: 15 minutes
LOCKOUT_DURATION_SEC = 15 * 60  # how long the account is locked


def record_failed_login(email: str) -> None:
    """Record one failed login attempt for *email*."""
    key = email.strip().lower()
    _failed_logins[key].append(time.time())


def check_account_lockout(email: str) -> None:
    """Raise HTTP 429 if *email* has too many recent failed login attempts.

    Uses the same sliding-window logic as :func:`check_rate_limit`.
    """
    key = email.strip().lower()
    now = time.time()
    window_start = now - LOCKOUT_WINDOW_SEC

    hits = _failed_logins[key]
    # Expire old entries
    while hits and hits[0] <= window_start:
        hits.popleft()

    if len(hits) >= LOCKOUT_MAX_ATTEMPTS:
        # How many seconds until the oldest failure drops out of the window
        retry_after = int(hits[0] + LOCKOUT_DURATION_SEC - now) + 1
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                f"Account temporarily locked after {LOCKOUT_MAX_ATTEMPTS} failed attempts. "
                f"Try again in {retry_after // 60} minute(s)."
            ),
            headers={"Retry-After": str(retry_after)},
        )


def clear_failed_logins(email: str) -> None:
    """Clear the failed-login counter for *email* (called on successful login)."""
    key = email.strip().lower()
    _failed_logins[key].clear()
