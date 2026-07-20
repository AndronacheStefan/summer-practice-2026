from flask import jsonify, request  # type: ignore
from flask_jwt_extended import jwt_required, get_jwt_identity  # type: ignore
import bcrypt  # type: ignore

from Application import app
from Application.database.models import User

MIN_PASSWORD_LENGTH = 6


def _current_user():
    """Resolve the logged-in user from the JWT identity set at login.

    Login issues the token via ``create_access_token(identity=username)``,
    so the identity is the username. We never trust a client-supplied id.
    """
    username = get_jwt_identity()
    return User.objects(username=username).first()


def _public_profile(user):
    """Serialise a user WITHOUT ever exposing the password hash."""
    return {
        'name': user.name,
        'username': user.username,
        'role': user.role,
        'site': user.site,
        'group': user.group,
    }


@app.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user = _current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(_public_profile(user)), 200


@app.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user = _current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    body = request.get_json() or {}

    # Only these fields may be changed here. Username, role and password are
    # intentionally not updatable through this endpoint.
    if 'name' in body:
        name = (body.get('name') or '').strip()
        if not name:
            return jsonify({'error': 'Name cannot be empty'}), 400
        user.name = name
    if 'site' in body:
        user.site = (body.get('site') or '').strip()
    if 'group' in body:
        user.group = (body.get('group') or '').strip()

    try:
        user.save()
    except Exception as e:
        print('update_profile error:', e)
        return jsonify({'error': str(e)}), 400

    return jsonify(_public_profile(user)), 200


@app.route('/profile/password', methods=['PUT'])
@jwt_required()
def change_password():
    user = _current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    body = request.get_json() or {}
    current_password = body.get('currentPassword') or ''
    new_password = body.get('newPassword') or ''

    if not current_password or not new_password:
        return jsonify({'error': 'Current and new password are required'}), 400

    if len(new_password) < MIN_PASSWORD_LENGTH:
        return jsonify({
            'error': f'New password must be at least {MIN_PASSWORD_LENGTH} characters',
        }), 400

    # Verify the current password against the stored bcrypt hash using the same
    # library login uses. This is a 403 (the caller IS authenticated, they just
    # supplied the wrong current password) so 401 stays reserved for "not
    # authenticated" and never trips the frontend's session-expired redirect.
    if not bcrypt.checkpw(current_password.encode('utf-8'), user.password.encode('utf-8')):
        return jsonify({'error': 'Current password is incorrect'}), 403

    # Store the new hash as a str so it matches the existing "$2b$12$..." format.
    hashed = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user.password = hashed
    try:
        user.save()
    except Exception as e:
        print('change_password error:', e)
        return jsonify({'error': str(e)}), 400

    return jsonify({'message': 'Password updated successfully'}), 200
