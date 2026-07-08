"""Security headers middleware."""

import logging

from fastapi import HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from rate_limit import check_request_rate_limit, client_ip

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            policy = check_request_rate_limit(request)
            if policy:
                request.state.rate_limit_policy = policy.name
        except HTTPException as exc:
            logger.warning(
                "security.rate_limited",
                extra={
                    "event": "security.rate_limited",
                    "client_ip": client_ip(request),
                    "path": request.url.path,
                    "method": request.method,
                    "policy": getattr(request.state, "rate_limit_policy", None),
                    "status_code": exc.status_code,
                },
            )
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.detail},
                headers=exc.headers,
            )
        return await call_next(request)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
        # Strict Transport Security — only enforced by browsers over HTTPS
        response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
        # Content Security Policy
        # - default-src 'self': only allow resources from the same origin by default
        # - script-src 'self' 'unsafe-inline': React bundles need inline scripts
        # - style-src 'self' 'unsafe-inline' https://fonts.googleapis.com: inline styles + Google Fonts CSS
        # - font-src 'self' https://fonts.gstatic.com data:: Google Fonts glyphs + data URIs
        # - img-src 'self' data: blob: https:: allow all HTTPS images (CDN covers Unsplash, etc.)
        # - connect-src 'self': API calls must go to the same origin
        # - frame-ancestors 'none': equivalent to X-Frame-Options DENY
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://us-assets.i.posthog.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com data:; "
            "img-src 'self' data: blob: https:; "
            "connect-src 'self' https://us.i.posthog.com https://us-assets.i.posthog.com; "
            "media-src 'self' blob: https://res.cloudinary.com; "
            "frame-src https://www.youtube-nocookie.com https://www.youtube.com https://youtube.com https://www.google.com; "
            "worker-src 'self' blob:; "
            "frame-ancestors 'none';"
        )
        # Cache-Control headers policy based on resource type
        path = request.url.path
        if path.startswith("/api/") or path.startswith("/api"):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        elif "/static/" in path or path.endswith((".js", ".css", ".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico", ".woff", ".woff2", ".ttf")):
            response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        else:
            response.headers["Cache-Control"] = "no-cache, must-revalidate"

        return response
