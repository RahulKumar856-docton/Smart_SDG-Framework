from functools import wraps
from flask import session, jsonify, request
from config import get_db_connection

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Authentication required. Please log in.'}), 401
        return f(*args, **kwargs)
    return decorated_function

def is_super_admin():
    return (session.get('role') or '').upper() == 'SUPER_ADMIN'

def is_admin():
    return (session.get('role') or '').upper() in ['ADMIN', 'SUPER_ADMIN']

def super_admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Unauthorized'}), 401
        if not is_super_admin():
            log_security_event('UNAUTHORIZED_ACCESS', f"User {session.get('username')} attempted to access Super Admin endpoint", severity='WARNING')
            return jsonify({'success': False, 'message': 'Super Administrator privilege required'}), 403
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Unauthorized'}), 401
        if not is_admin():
            return jsonify({'success': False, 'message': 'Administrative privileges required'}), 403
        return f(*args, **kwargs)
    return decorated_function

def role_required(*roles):
    """
    Accepts one or more roles.
    Matches case-insensitively.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_id' not in session:
                return jsonify({'success': False, 'message': 'Unauthorized'}), 401
            
            user_role = (session.get('role') or '').upper()
            allowed = [r.upper() for r in roles]
            
            # Super Admin has access if SUPER_ADMIN or ADMIN is in allowed
            if is_super_admin():
                return f(*args, **kwargs)
                
            if user_role not in allowed:
                return jsonify({'success': False, 'message': 'Forbidden: Insufficient privileges'}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def permission_required(*permissions):
    """
    Requires the user's role to possess the given permission codes.
    Super Admin bypasses all permission checks automatically.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_id' not in session:
                return jsonify({'success': False, 'message': 'Unauthorized'}), 401

            if is_super_admin():
                return f(*args, **kwargs)

            user_role = (session.get('role') or '').upper()
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            try:
                cursor.execute("""
                    SELECT p.code
                    FROM role_permissions rp
                    JOIN roles r ON rp.role_id = r.id
                    JOIN permissions p ON rp.permission_id = p.id
                    WHERE UPPER(r.name) = %s
                """, (user_role,))
                assigned = {row['code'] for row in cursor.fetchall()}
                
                missing = [p for p in permissions if p not in assigned]
                if missing:
                    return jsonify({
                        'success': False, 
                        'message': f'Forbidden: Missing permission(s): {", ".join(missing)}'
                    }), 403
            finally:
                cursor.close()
                conn.close()

            return f(*args, **kwargs)
        return decorated_function
    return decorator

def log_security_event(event_type, description, severity='INFO', user_id=None, ip_address=None, metadata=None):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        uid = user_id or session.get('user_id')
        ip = ip_address or request.remote_addr if request else '127.0.0.1'
        cursor.execute("""
            INSERT INTO security_events (severity, event_type, description, user_id, ip_address, metadata)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (severity, event_type, description, uid, ip, metadata))
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Failed to log security event: {e}")

def log_audit_event(user_id, action, entity, entity_id, old_val=None, new_val=None, module='System', result='SUCCESS'):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO audit_logs (user_id, action, entity, entity_id, old_value, new_value, module, result)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (user_id, action, entity, entity_id, str(old_val) if old_val else None, str(new_val) if new_val else None, module, result))
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Failed to record audit log: {e}")
