import secrets
from flask import session, request, jsonify

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
        # Exempt initial auth endpoints (no session/CSRF yet)
        if request.path in ('/api/login', '/api/register'):
            return
        token = request.headers.get('X-CSRF-Token')
        if not token or token != session.get(CSRF_KEY):
            # Return JSON instead of HTML error page so frontend can show a message
            return jsonify({'error': 'Bad CSRF token'}), 400
    # GET/HEAD/OPTIONS are safe
    return