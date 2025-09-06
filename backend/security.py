import secrets
from flask import session, request, abort

CSRF_KEY = "_csrf"

def issue_csrf():
    """
    Ensure a CSRF token exists in the session and return it.
    """
    token = session.get(CSRF_KEY)
    if not token:
        token = secrets.token_urlsafe(24)
        session[CSRF_KEY] = token
    return token

def ensure_csrf():
    """
    For mutating requests to /api/* endpoints, require X-CSRF-Token header
    to match the session token.
    """
    if request.method in ('POST', 'PATCH', 'DELETE'):
        # allow non-API routes (static, index) to pass without header
        if not request.path.startswith('/api/'):
            return
        token = request.headers.get('X-CSRF-Token')
        if not token or token != session.get(CSRF_KEY):
            abort(400, description='Bad CSRF token')
    # GET/HEAD/OPTIONS are safe
    return