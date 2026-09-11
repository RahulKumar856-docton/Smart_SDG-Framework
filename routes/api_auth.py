from flask import Blueprint, request, jsonify, session
from werkzeug.security import check_password_hash
from config import get_db_connection

api_auth_bp = Blueprint('api_auth', __name__)

@api_auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'success': False, 'message': 'Username and password required'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT u.*, r.name as role_name 
        FROM users u 
        JOIN roles r ON u.role_id = r.id 
        WHERE u.username = %s OR u.email = %s
    """, (data['username'], data['username']))
    
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if user and check_password_hash(user['password_hash'], data['password']):
        
        # Check expected role if provided
        expected_role = data.get('expected_role')
        if expected_role and user['role_name'] != expected_role:
            return jsonify({'success': False, 'message': f'You do not have {expected_role.lower()} permissions.'}), 403

        # Check approval status
        if user['status'] == 'REJECTED':
            return jsonify({'success': False, 'message': 'Your officer registration was not approved.', 'status': 'REJECTED'}), 403
            
        if user['status'] == 'PENDING_APPROVAL':
            return jsonify({'success': False, 'message': 'Your officer account is awaiting administrator approval.', 'status': 'PENDING_APPROVAL'}), 403
            
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['role'] = user['role_name']
        session['department_id'] = user['department_id']
        session['status'] = user['status']
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'data': {
                'user_id': user['id'],
                'username': user['username'],
                'role': user['role_name'],
                'department_id': user['department_id'],
                'full_name': user['full_name'],
                'status': user['status']
            }
        })
    else:
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401


@api_auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password') or not data.get('role'):
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400

    role_name = data['role'].upper()
    if role_name == 'ADMIN':
        return jsonify({'success': False, 'message': 'Public administrator registration is not allowed.'}), 403

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Check if email/username/employee_id exists
    cursor.execute("SELECT id, username, email, employee_id FROM users WHERE username = %s OR email = %s OR employee_id = %s", 
                   (data['username'], data.get('email'), data.get('employee_id')))
    existing = cursor.fetchone()
    if existing:
        cursor.close()
        conn.close()
        if existing['username'] == data['username']:
            return jsonify({'success': False, 'message': 'This username is already registered.'}), 409
        elif existing['email'] == data.get('email'):
            return jsonify({'success': False, 'message': 'An account with this email already exists.'}), 409
        elif existing['employee_id'] == data.get('employee_id'):
            return jsonify({'success': False, 'message': 'This employee ID is already registered.'}), 409
        return jsonify({'success': False, 'message': 'An account with these details already exists.'}), 409

    # Get role ID
    cursor.execute("SELECT id FROM roles WHERE name = %s", (role_name,))
    role_record = cursor.fetchone()
    if not role_record:
        cursor.close()
        conn.close()
        return jsonify({'success': False, 'message': 'Invalid role specified.'}), 400
    
    role_id = role_record['id']
    status = 'ACTIVE'
    
    from werkzeug.security import generate_password_hash
    pw_hash = generate_password_hash(data['password'])
    
    # Validate department if supplied
    if data.get('department_id'):
        cursor.execute("SELECT id FROM departments WHERE id = %s", (data['department_id'],))
        if not cursor.fetchone():
            return jsonify({
                'success': False,
                'message': 'Selected department does not exist.'
            }), 400

    try:
        cursor.execute("""
            INSERT INTO users (
                username, password_hash, role_id, department_id,
                full_name, email, phone, status, employee_id, designation
            ) VALUES (
                %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s
            )
        """, (
            data['username'], pw_hash, role_id,
            data.get('department_id'), data.get('full_name', data['username']),
            data.get('email'), data.get('phone'), status,
            data.get('employee_id'), data.get('designation')
        ))
        user_id = cursor.lastrowid
        
        # Audit Log
        if role_name == 'OFFICER':
            cursor.execute("""
                INSERT INTO audit_logs (user_id, action, entity, entity_id, new_value)
                VALUES (NULL, 'REGISTER', 'Officer', %s, 'ACTIVE')
            """, (user_id,))
            
            # Notification (admin role hardcoded as 1 or general broadcast)
            cursor.execute("""
                INSERT INTO notifications (user_id, title, message, entity_type, entity_id)
                SELECT id, 'New Officer Registration', %s, 'USER', %s FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'ADMIN')
            """, (f"New officer {data.get('full_name')} has registered and is active.", user_id))
            
        conn.commit()
        
        return jsonify({
            'success': True, 
            'message': 'Registration successful. You can now sign in.',
            'data': {
                'status': status
            }
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
        return jsonify({
            'success': True,
            'data': {
                'user_id': session.get('user_id'),
                'username': session.get('username'),
                'role': session.get('role'),
                'department_id': session.get('department_id')
            }
        })
    return jsonify({'success': False, 'message': 'Not logged in'}), 401
