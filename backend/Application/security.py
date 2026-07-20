"""Global authentication guard.

Every request must present a valid JWT — the same access tokens issued by
``/login`` through flask_jwt_extended — EXCEPT a small allowlist of public
endpoints. Enforcing this in a single ``before_request`` hook means a protected
route can never be left open by forgetting to add a decorator.

The current user's identity always comes from the verified token
(``get_jwt_identity()`` in the routes), never from a client-supplied value.
"""
from flask import jsonify, request  # type: ignore
from flask_jwt_extended import verify_jwt_in_request  # type: ignore
from flask_jwt_extended.exceptions import JWTExtendedException  # type: ignore
from jwt import PyJWTError  # type: ignore

from Application import app

# Flask endpoint (view-function) names reachable WITHOUT authentication.
PUBLIC_ENDPOINTS = {
    "login",    # POST /login – issues the token
    "static",   # Flask's built-in static file server
}


@app.before_request
def require_authentication():
    # Never gate CORS preflight requests; they carry no Authorization header.
    if request.method == "OPTIONS":
        return None

    endpoint = request.endpoint
    # Unknown route: let Flask return its normal 404 instead of a 401.
    if endpoint is None:
        return None
    if endpoint in PUBLIC_ENDPOINTS:
        return None

    # Reuse the exact mechanism login uses. A missing / invalid / expired token
    # results in 401 and NO data is returned.
    try:
        verify_jwt_in_request()
    except (JWTExtendedException, PyJWTError):
        return jsonify({"error": "Authentication required"}), 401

    return None
