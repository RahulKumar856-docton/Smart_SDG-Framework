from functools import wraps
from flask import session, jsonify

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function

def role_required(required_role):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_id' not in session:
                return jsonify({'success': False, 'message': 'Unauthorized'}), 401
            # Compare role case‑insensitively to avoid mismatches like "Officer" vs "OFFICER"
            if (session.get('role') or '').upper() != required_role.upper():
                return jsonify({'success': False, 'message': 'Forbidden'}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator
