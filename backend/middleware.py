"""Security headers middleware."""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
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
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com data:; "
            "img-src 'self' data: blob: https:; "
            "connect-src 'self'; "
            "frame-ancestors 'none';"
        )
        return response
