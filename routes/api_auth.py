from flask import Blueprint, request, jsonify, session
from werkzeug.security import check_password_hash, generate_password_hash
from config import get_db_connection
from routes.utils import log_security_event

api_auth_bp = Blueprint('api_auth', __name__)

def record_login_attempt(username, success, failure_reason=None):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        ip = request.remote_addr if request else '127.0.0.1'
        ua = request.headers.get('User-Agent', '')[:250] if request else ''
        cursor.execute("""
            INSERT INTO login_attempts (username, ip_address, user_agent, success, failure_reason)
            VALUES (%s, %s, %s, %s, %s)
        """, (username, ip, ua, 1 if success else 0, failure_reason))
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error logging login attempt: {e}")

def get_user_permissions(role_name):
    if role_name.upper() == 'SUPER_ADMIN':
        # Super admin has all permissions
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT code FROM permissions")
        perms = [r['code'] for r in cursor.fetchall()]
        cursor.close()
        conn.close()
        return perms

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT p.code
        FROM role_permissions rp
        JOIN roles r ON rp.role_id = r.id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE UPPER(r.name) = %s
    """, (role_name.upper(),))
    perms = [r['code'] for r in cursor.fetchall()]
    cursor.close()
    conn.close()
    return perms

@api_auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = (data.get('username') or '').strip()
    password = (data.get('password') or '').strip()

    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and password required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT u.*, r.name as role
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.username = %s OR u.email = %s
    """, (username, username))
    
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if not user:
        record_login_attempt(username, False, 'User not found')
        return jsonify({'success': False, 'message': 'Invalid username or password.'}), 401

    if not check_password_hash(user['password_hash'], password):
        record_login_attempt(username, False, 'Invalid password')
        log_security_event('FAILED_LOGIN', f"Failed login attempt for user: {username}", severity='WARNING')
        return jsonify({'success': False, 'message': 'Invalid username or password.'}), 401

    if (user.get('status') or 'ACTIVE').upper() != 'ACTIVE':
        record_login_attempt(username, False, 'Account suspended or inactive')
        log_security_event('SUSPENDED_LOGIN_ATTEMPT', f"Suspended account attempted login: {username}", severity='WARNING', user_id=user['id'])
        return jsonify({'success': False, 'message': 'This account has been deactivated or suspended. Please contact platform administration.'}), 403

    # Successful authentication
    record_login_attempt(username, True)
    actual_role = (user['role'] or '').upper()

    session['user_id'] = user['id']
    session['username'] = user['username']
    session['role'] = actual_role
    session['department_id'] = user['department_id']

    permissions = get_user_permissions(actual_role)
    log_security_event('AUTH_SUCCESS', f"User {username} ({actual_role}) logged in successfully", severity='INFO', user_id=user['id'])

    return jsonify({
        'success': True,
        'message': 'Login successful',
        'data': {
            'user_id': user['id'],
            'username': user['username'],
            'full_name': user.get('full_name', user['username']),
            'email': user.get('email', ''),
            'role': actual_role,
            'department_id': user.get('department_id'),
            'permissions': permissions,
            'is_super_admin': actual_role == 'SUPER_ADMIN'
        }
    })

@api_auth_bp.route('/system-login', methods=['POST'])
def system_login():
    """
    Dedicated Super Admin / System Access Login Endpoint.
    Strictly verifies that user is an authorized SUPER_ADMIN.
    """
    data = request.get_json() or {}
    username = (data.get('username') or '').strip()
    password = (data.get('password') or '').strip()

    if not username or not password:
        return jsonify({'success': False, 'message': 'System credentials required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT u.*, r.name as role
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.username = %s OR u.email = %s
    """, (username, username))
    
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if not user:
        record_login_attempt(username, False, 'System login: user not found')
        return jsonify({'success': False, 'message': 'Invalid system credentials.'}), 401

    if not check_password_hash(user['password_hash'], password):
        record_login_attempt(username, False, 'System login: invalid password')
        log_security_event('SYSTEM_AUTH_FAILED', f"Failed system console attempt for user: {username}", severity='WARNING')
        return jsonify({'success': False, 'message': 'Invalid system credentials.'}), 401

    actual_role = (user['role'] or '').upper()

    # Strict Super Admin Role Enforcement
    if actual_role != 'SUPER_ADMIN':
        record_login_attempt(username, False, 'System login: non-superadmin role')
        log_security_event('SECURITY_BREACH_ATTEMPT', f"Non-SuperAdmin ({actual_role}) attempted root system login: {username}", severity='CRITICAL', user_id=user['id'])
        return jsonify({
            'success': False,
            'message': 'Access Denied: Root system console requires SUPER_ADMIN authorization.'
        }), 403

    if (user.get('status') or 'ACTIVE').upper() != 'ACTIVE':
        record_login_attempt(username, False, 'System login: suspended account')
        return jsonify({'success': False, 'message': 'Account is suspended.'}), 403

    record_login_attempt(username, True)
    session['user_id'] = user['id']
    session['username'] = user['username']
    session['role'] = 'SUPER_ADMIN'
    session['department_id'] = user['department_id']

    permissions = get_user_permissions('SUPER_ADMIN')
    log_security_event('SYSTEM_AUTH_SUCCESS', f"Super Admin {username} authenticated to root system console", severity='INFO', user_id=user['id'])

    return jsonify({
        'success': True,
        'message': 'System Administrator authorized',
        'data': {
            'user_id': user['id'],
            'username': user['username'],
            'full_name': user.get('full_name', 'Super Administrator'),
            'email': user.get('email', ''),
            'role': 'SUPER_ADMIN',
            'department_id': user.get('department_id'),
            'permissions': permissions,
            'is_super_admin': True
        }
    })

@api_auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    if not data or not data.get('username') or not data.get('password') or not data.get('role'):
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400

    role_name = data['role'].upper()
    if role_name in ['ADMIN', 'SUPER_ADMIN']:
        return jsonify({'success': False, 'message': 'Public administrator registration is prohibited.'}), 403

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("SELECT id, username, email FROM users WHERE username = %s OR (email = %s AND email != '')", 
                   (data['username'], data.get('email', '')))
    existing = cursor.fetchone()
    if existing:
        cursor.close()
        conn.close()
        return jsonify({'success': False, 'message': 'Username or Email is already registered.'}), 400

    pw_hash = generate_password_hash(data['password'])

    cursor.execute("SELECT id FROM roles WHERE UPPER(name) = %s", (role_name,))
    role_row = cursor.fetchone()
    if not role_row:
        cursor.close()
        conn.close()
        return jsonify({'success': False, 'message': f'Role {role_name} does not exist.'}), 400
    role_id = role_row['id']

    try:
        cursor.execute("""
            INSERT INTO users (
                username, password_hash, role_id, department_id,
                full_name, email, phone, employee_id, designation, status
            ) VALUES (
                %s, %s, %s, %s,
                %s, %s, %s, %s, %s, 'ACTIVE'
            )
        """, (
            data['username'], pw_hash, role_id,
            data.get('department_id'), data.get('full_name', data['username']),
            data.get('email'), data.get('phone'),
            data.get('employee_id'), data.get('designation')
        ))
        user_id = cursor.lastrowid
        conn.commit()
        
        return jsonify({
            'success': True, 
            'message': 'Registration successful. You can now sign in.',
            'data': {'id': user_id, 'status': 'ACTIVE'}
        })
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@api_auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@api_auth_bp.route('/me', methods=['GET'])
def current_user():
    if 'user_id' in session:
        user_role = (session.get('role') or '').upper()
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT full_name, email, status FROM users WHERE id = %s", (session.get('user_id'),))
        u = cursor.fetchone() or {}
        cursor.close()
        conn.close()

        perms = get_user_permissions(user_role)

        return jsonify({
            'success': True,
            'data': {
                'user_id': session.get('user_id'),
                'username': session.get('username'),
                'full_name': u.get('full_name', session.get('username')),
                'email': u.get('email', ''),
                'status': u.get('status', 'ACTIVE'),
                'role': user_role,
                'department_id': session.get('department_id'),
                'permissions': perms,
                'is_super_admin': user_role == 'SUPER_ADMIN'
            }
        })
    return jsonify({'success': False, 'message': 'Not authenticated'}), 401
