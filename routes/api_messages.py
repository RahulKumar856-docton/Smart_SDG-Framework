from flask import Blueprint, jsonify, request, session, current_app
from config import get_db_connection
from services.notification_service import create_notification
from werkzeug.utils import secure_filename
import os
import uuid
import datetime

api_messages_bp = Blueprint('api_messages', __name__, url_prefix='/api/messages')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf', 'doc', 'docx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_current_user():
    if 'user_id' not in session:
        return None
    return {
        'id': session['user_id'],
        'username': session.get('username'),
        'role': str(session.get('role', '')).upper(),
        'department_id': session.get('department_id')
    }

def verify_conversation_access(conn, user, entity_type, entity_id):
    """
    Checks if the current user has authorization to view/participate in this conversation.
    Returns (authorized: bool, case_info: dict or None)
    """
    cursor = conn.cursor(dictionary=True)
    entity_type = entity_type.upper()
    
    if entity_type in ('SERVICE_REQUEST', 'REQUEST'):
        query = """
            SELECT cr.id, cr.request_id_code as reference_id, cr.title, cr.category, cr.status, 
                   cr.citizen_id, cr.department_id, d.name as department_name,
                   u_cit.full_name as citizen_name, u_cit.email as citizen_email,
                   a.officer_id, off.full_name as officer_name
            FROM citizen_requests cr
            LEFT JOIN departments d ON cr.department_id = d.id
            LEFT JOIN users u_cit ON cr.citizen_id = u_cit.id
            LEFT JOIN request_assignments a ON cr.id = a.request_id
            LEFT JOIN users off ON a.officer_id = off.id
            WHERE cr.id = %s
        """
        cursor.execute(query, (entity_id,))
        record = cursor.fetchone()
        cursor.close()
        
        if not record:
            return False, None
            
        record['entity_type'] = 'SERVICE_REQUEST'
        record['is_closed'] = record['status'] in ('RESOLVED', 'CLOSED', 'REJECTED')
        
        if user['role'] == 'ADMIN':
            return True, record
        elif user['role'] == 'OFFICER':
            if record['officer_id'] == user['id'] or (record['department_id'] and record['department_id'] == user['department_id']):
                return True, record
            return False, record
        elif user['role'] == 'CITIZEN':
            if record['citizen_id'] == user['id']:
                return True, record
            return False, record
            
        return False, None

    elif entity_type == 'REPORT':
        query = """
            SELECT cr.id, cr.report_id_code as reference_id, cr.title, cr.category, cr.status, 
                   cr.severity, cr.citizen_id, cr.department_id, cr.officer_id,
                   d.name as department_name,
                   u_cit.full_name as citizen_name, u_cit.email as citizen_email,
                   off.full_name as officer_name
            FROM citizen_reports cr
            LEFT JOIN departments d ON cr.department_id = d.id
            LEFT JOIN users u_cit ON cr.citizen_id = u_cit.id
            LEFT JOIN users off ON cr.officer_id = off.id
            WHERE cr.id = %s
        """
        cursor.execute(query, (entity_id,))
        record = cursor.fetchone()
        cursor.close()
        
        if not record:
            return False, None
            
        record['entity_type'] = 'REPORT'
        record['is_closed'] = record['status'] in ('RESOLVED', 'CLOSED', 'REJECTED')
        
        if user['role'] == 'ADMIN':
            return True, record
        elif user['role'] == 'OFFICER':
            if record['officer_id'] == user['id'] or (record['department_id'] and record['department_id'] == user['department_id']):
                return True, record
            return False, record
        elif user['role'] == 'CITIZEN':
            if record['citizen_id'] == user['id']:
                return True, record
            return False, record
            
        return False, None
        
    cursor.close()
    return False, None

def parse_conversation_identifier(conv_id):
    """
    Parses 'SR-123' or 'SERVICE_REQUEST-123' or 'REPORT-456' or 'REP-456'
    Returns (entity_type, entity_id)
    """
    if isinstance(conv_id, str) and '-' in conv_id:
        prefix, id_part = conv_id.split('-', 1)
        if prefix.upper() in ('SR', 'SERVICE_REQUEST', 'REQUEST'):
            return 'SERVICE_REQUEST', int(id_part)
        elif prefix.upper() in ('REP', 'REPORT'):
            return 'REPORT', int(id_part)
    return None, None

@api_messages_bp.route('/conversations', methods=['GET'])
@api_messages_bp.route('/citizen', methods=['GET'])
def get_conversations():
    user = get_current_user()
    if not user:
        return jsonify({'success': False, 'message': 'Authentication required'}), 401
        
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    conversations = []
    
    try:
        if user['role'] == 'CITIZEN':
            # 1. Fetch Citizen's Service Requests
            cursor.execute("""
                SELECT cr.id, cr.request_id_code as reference_id, cr.title, cr.category, cr.status, 
                       cr.created_at, d.name as department_name, off.full_name as officer_name
                FROM citizen_requests cr
                LEFT JOIN departments d ON cr.department_id = d.id
                LEFT JOIN request_assignments a ON cr.id = a.request_id
                LEFT JOIN users off ON a.officer_id = off.id
                WHERE cr.citizen_id = %s
                ORDER BY cr.created_at DESC
            """, (user['id'],))
            reqs = cursor.fetchall()
            
            for r in reqs:
                # Get last message and unread count
                cursor.execute("""
                    SELECT m.message, m.created_at, u.full_name as sender_name, r.name as sender_role
                    FROM messages m
                    JOIN users u ON m.sender_id = u.id
                    JOIN roles r ON u.role_id = r.id
                    WHERE m.entity_type = 'SERVICE_REQUEST' AND m.entity_id = %s
                    ORDER BY m.created_at DESC LIMIT 1
                """, (r['id'],))
                last_msg = cursor.fetchone()
                
                cursor.execute("""
                    SELECT COUNT(*) as unread FROM messages
                    WHERE entity_type = 'SERVICE_REQUEST' AND entity_id = %s 
                      AND sender_id != %s AND is_read = 0
                """, (r['id'], user['id']))
                unread_res = cursor.fetchone()
                
                conversations.append({
                    'id': f"SR-{r['id']}",
                    'entity_type': 'SERVICE_REQUEST',
                    'entity_id': r['id'],
                    'reference_id': r['reference_id'],
                    'title': r['title'],
                    'category': r['category'],
                    'status': r['status'],
                    'department_name': r['department_name'] or 'Municipal Office',
                    'officer_name': r['officer_name'],
                    'is_closed': r['status'] in ('RESOLVED', 'CLOSED', 'REJECTED'),
                    'last_message': last_msg['message'] if last_msg else 'Conversation ready.',
                    'last_message_sender': last_msg['sender_name'] if last_msg else None,
                    'last_message_role': last_msg['sender_role'] if last_msg else None,
                    'last_message_at': last_msg['created_at'] if last_msg else r['created_at'],
                    'unread_count': unread_res['unread'] if unread_res else 0
                })
                
            # 2. Fetch Citizen's Reports
            cursor.execute("""
                SELECT cr.id, cr.report_id_code as reference_id, cr.title, cr.category, cr.status, 
                       cr.severity, cr.created_at, d.name as department_name, off.full_name as officer_name
                FROM citizen_reports cr
                LEFT JOIN departments d ON cr.department_id = d.id
                LEFT JOIN users off ON cr.officer_id = off.id
                WHERE cr.citizen_id = %s
                ORDER BY cr.created_at DESC
            """, (user['id'],))
            reps = cursor.fetchall()
            
            for r in reps:
                cursor.execute("""
                    SELECT m.message, m.created_at, u.full_name as sender_name, r.name as sender_role
                    FROM messages m
                    JOIN users u ON m.sender_id = u.id
                    JOIN roles r ON u.role_id = r.id
                    WHERE m.entity_type = 'REPORT' AND m.entity_id = %s
                    ORDER BY m.created_at DESC LIMIT 1
                """, (r['id'],))
                last_msg = cursor.fetchone()
                
                cursor.execute("""
                    SELECT COUNT(*) as unread FROM messages
                    WHERE entity_type = 'REPORT' AND entity_id = %s 
                      AND sender_id != %s AND is_read = 0
                """, (r['id'], user['id']))
                unread_res = cursor.fetchone()
                
                conversations.append({
                    'id': f"REP-{r['id']}",
                    'entity_type': 'REPORT',
                    'entity_id': r['id'],
                    'reference_id': r['reference_id'],
                    'title': r['title'],
                    'category': r['category'],
                    'status': r['status'],
                    'severity': r.get('severity', 'MEDIUM'),
                    'department_name': r['department_name'] or 'Municipal Office',
                    'officer_name': r['officer_name'],
                    'is_closed': r['status'] in ('RESOLVED', 'CLOSED', 'REJECTED'),
                    'last_message': last_msg['message'] if last_msg else 'Conversation ready.',
                    'last_message_sender': last_msg['sender_name'] if last_msg else None,
                    'last_message_role': last_msg['sender_role'] if last_msg else None,
                    'last_message_at': last_msg['created_at'] if last_msg else r['created_at'],
                    'unread_count': unread_res['unread'] if unread_res else 0
                })
                
        elif user['role'] in ('OFFICER', 'ADMIN'):
            # Officer or Admin conversations
            where_req = "" if user['role'] == 'ADMIN' else "WHERE a.officer_id = %s OR cr.department_id = %s"
            params_req = () if user['role'] == 'ADMIN' else (user['id'], user.get('department_id'))
            
            cursor.execute(f"""
                SELECT cr.id, cr.request_id_code as reference_id, cr.title, cr.category, cr.status, 
                       cr.created_at, d.name as department_name, off.full_name as officer_name,
                       u_cit.full_name as citizen_name
                FROM citizen_requests cr
                LEFT JOIN departments d ON cr.department_id = d.id
                LEFT JOIN request_assignments a ON cr.id = a.request_id
                LEFT JOIN users off ON a.officer_id = off.id
                LEFT JOIN users u_cit ON cr.citizen_id = u_cit.id
                {where_req}
                ORDER BY cr.created_at DESC
            """, params_req)
            reqs = cursor.fetchall()
            
            for r in reqs:
                cursor.execute("""
                    SELECT m.message, m.created_at, u.full_name as sender_name, r.name as sender_role
                    FROM messages m
                    JOIN users u ON m.sender_id = u.id
                    JOIN roles r ON u.role_id = r.id
                    WHERE m.entity_type = 'SERVICE_REQUEST' AND m.entity_id = %s
                    ORDER BY m.created_at DESC LIMIT 1
                """, (r['id'],))
                last_msg = cursor.fetchone()
                
                cursor.execute("""
                    SELECT COUNT(*) as unread FROM messages
                    WHERE entity_type = 'SERVICE_REQUEST' AND entity_id = %s 
                      AND sender_id != %s AND is_read = 0
                """, (r['id'], user['id']))
                unread_res = cursor.fetchone()
                
                conversations.append({
                    'id': f"SR-{r['id']}",
                    'entity_type': 'SERVICE_REQUEST',
                    'entity_id': r['id'],
                    'reference_id': r['reference_id'],
                    'title': r['title'],
                    'category': r['category'],
                    'status': r['status'],
                    'citizen_name': r['citizen_name'],
                    'department_name': r['department_name'] or 'Municipal Office',
                    'officer_name': r['officer_name'],
                    'is_closed': r['status'] in ('RESOLVED', 'CLOSED', 'REJECTED'),
                    'last_message': last_msg['message'] if last_msg else 'No messages yet.',
                    'last_message_sender': last_msg['sender_name'] if last_msg else None,
                    'last_message_role': last_msg['sender_role'] if last_msg else None,
                    'last_message_at': last_msg['created_at'] if last_msg else r['created_at'],
                    'unread_count': unread_res['unread'] if unread_res else 0
                })
                
            where_rep = "" if user['role'] == 'ADMIN' else "WHERE cr.officer_id = %s OR cr.department_id = %s"
            params_rep = () if user['role'] == 'ADMIN' else (user['id'], user.get('department_id'))
            
            cursor.execute(f"""
                SELECT cr.id, cr.report_id_code as reference_id, cr.title, cr.category, cr.status, 
                       cr.severity, cr.created_at, d.name as department_name, off.full_name as officer_name,
                       u_cit.full_name as citizen_name
                FROM citizen_reports cr
                LEFT JOIN departments d ON cr.department_id = d.id
                LEFT JOIN users off ON cr.officer_id = off.id
                LEFT JOIN users u_cit ON cr.citizen_id = u_cit.id
                {where_rep}
                ORDER BY cr.created_at DESC
            """, params_rep)
            reps = cursor.fetchall()
            
            for r in reps:
                cursor.execute("""
                    SELECT m.message, m.created_at, u.full_name as sender_name, r.name as sender_role
                    FROM messages m
                    JOIN users u ON m.sender_id = u.id
                    JOIN roles r ON u.role_id = r.id
                    WHERE m.entity_type = 'REPORT' AND m.entity_id = %s
                    ORDER BY m.created_at DESC LIMIT 1
                """, (r['id'],))
                last_msg = cursor.fetchone()
                
                cursor.execute("""
                    SELECT COUNT(*) as unread FROM messages
                    WHERE entity_type = 'REPORT' AND entity_id = %s 
                      AND sender_id != %s AND is_read = 0
                """, (r['id'], user['id']))
                unread_res = cursor.fetchone()
                
                conversations.append({
                    'id': f"REP-{r['id']}",
                    'entity_type': 'REPORT',
                    'entity_id': r['id'],
                    'reference_id': r['reference_id'],
                    'title': r['title'],
                    'category': r['category'],
                    'status': r['status'],
                    'severity': r.get('severity', 'MEDIUM'),
                    'citizen_name': r['citizen_name'],
                    'department_name': r['department_name'] or 'Municipal Office',
                    'officer_name': r['officer_name'],
                    'is_closed': r['status'] in ('RESOLVED', 'CLOSED', 'REJECTED'),
                    'last_message': last_msg['message'] if last_msg else 'No messages yet.',
                    'last_message_sender': last_msg['sender_name'] if last_msg else None,
                    'last_message_role': last_msg['sender_role'] if last_msg else None,
                    'last_message_at': last_msg['created_at'] if last_msg else r['created_at'],
                    'unread_count': unread_res['unread'] if unread_res else 0
                })

        # Sort conversations by last_message_at descending
        conversations.sort(key=lambda x: str(x['last_message_at'] or ''), reverse=True)

        return jsonify({
            'success': True,
            'data': conversations,
            'total_unread': sum(c['unread_count'] for c in conversations)
        })

    except Exception as e:
        print(f"Error fetching conversations: {e}")
        return jsonify({'success': False, 'message': 'Unable to load conversations.'}), 500
    finally:
        cursor.close()
        conn.close()

@api_messages_bp.route('/<string:entity_type>/<int:entity_id>', methods=['GET'])
def get_conversation_messages(entity_type, entity_id):
    user = get_current_user()
    if not user:
        return jsonify({'success': False, 'message': 'Authentication required'}), 401
        
    conn = get_db_connection()
    authorized, case_info = verify_conversation_access(conn, user, entity_type, entity_id)
    
    if not authorized or not case_info:
        conn.close()
        return jsonify({'success': False, 'message': 'Forbidden: You do not have access to this conversation.'}), 403
        
    cursor = conn.cursor(dictionary=True)
    try:
        norm_type = case_info['entity_type']
        
        # Fetch messages
        cursor.execute("""
            SELECT m.id, m.entity_type, m.entity_id, m.sender_id, m.message, 
                   m.attachment_url, m.is_read, m.created_at,
                   u.full_name as sender_name, r.name as sender_role
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            JOIN roles r ON u.role_id = r.id
            WHERE m.entity_type = %s AND m.entity_id = %s
            ORDER BY m.created_at ASC
        """, (norm_type, entity_id))
        messages = cursor.fetchall()
        
        # Add is_self flag
        for msg in messages:
            msg['is_self'] = (msg['sender_id'] == user['id'])
            
        # Automatically mark incoming unread messages as read
        cursor.execute("""
            UPDATE messages 
            SET is_read = 1 
            WHERE entity_type = %s AND entity_id = %s AND sender_id != %s AND is_read = 0
        """, (norm_type, entity_id, user['id']))
        conn.commit()
        
        return jsonify({
            'success': True,
            'case_info': case_info,
            'data': messages
        })
    except Exception as e:
        print(f"Error fetching conversation messages: {e}")
        return jsonify({'success': False, 'message': 'Unable to load message history.'}), 500
    finally:
        cursor.close()
        conn.close()

# Also support single-id route e.g. /api/messages/conv/SR-123 or /api/citizen/messages/SR-123
@api_messages_bp.route('/conv/<string:conv_id>', methods=['GET'])
def get_conversation_by_conv_id(conv_id):
    entity_type, entity_id = parse_conversation_identifier(conv_id)
    if not entity_type or not entity_id:
        return jsonify({'success': False, 'message': 'Invalid conversation identifier'}), 400
    return get_conversation_messages(entity_type, entity_id)

@api_messages_bp.route('/<string:entity_type>/<int:entity_id>', methods=['POST'])
def send_message(entity_type, entity_id):
    user = get_current_user()
    if not user:
        return jsonify({'success': False, 'message': 'Authentication required'}), 401
        
    conn = get_db_connection()
    authorized, case_info = verify_conversation_access(conn, user, entity_type, entity_id)
    
    if not authorized or not case_info:
        conn.close()
        return jsonify({'success': False, 'message': 'Forbidden: You cannot send messages in this conversation.'}), 403
        
    if case_info.get('is_closed'):
        conn.close()
        return jsonify({'success': False, 'message': 'This municipal case has been closed and cannot receive new messages.'}), 400
        
    data = request.get_json() or {}
    message_text = (data.get('message') or '').strip()
    attachment_url = data.get('attachment_url')
    
    if not message_text and not attachment_url:
        conn.close()
        return jsonify({'success': False, 'message': 'Message cannot be empty.'}), 400
        
    if len(message_text) > 2000:
        conn.close()
        return jsonify({'success': False, 'message': 'Message exceeds the maximum limit of 2000 characters.'}), 400
        
    cursor = conn.cursor(dictionary=True)
    try:
        norm_type = case_info['entity_type']
        
        cursor.execute("""
            INSERT INTO messages (entity_type, entity_id, sender_id, message, attachment_url, is_read)
            VALUES (%s, %s, %s, %s, %s, 0)
        """, (norm_type, entity_id, user['id'], message_text, attachment_url))
        conn.commit()
        
        msg_id = cursor.lastrowid
        
        # Fetch the newly created message
        cursor.execute("""
            SELECT m.id, m.entity_type, m.entity_id, m.sender_id, m.message, 
                   m.attachment_url, m.is_read, m.created_at,
                   u.full_name as sender_name, r.name as sender_role
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            JOIN roles r ON u.role_id = r.id
            WHERE m.id = %s
        """, (msg_id,))
        saved_message = cursor.fetchone()
        saved_message['is_self'] = True
        
        # Send Notification to the counter-party
        ref_id = case_info.get('reference_id')
        case_title = case_info.get('title')
        
        if user['role'] == 'CITIZEN':
            # Notify Assigned Officer or Admins
            recipient_id = case_info.get('officer_id')
            if recipient_id:
                create_notification(
                    user_id=recipient_id,
                    title=f"New Message on {ref_id}",
                    message=f"Citizen {user.get('username')} sent a message regarding '{case_title}': {message_text[:100]}",
                    notif_type='SYSTEM',
                    priority='MEDIUM',
                    module='COMMUNICATION',
                    entity_type=norm_type,
                    entity_id=entity_id,
                    action_url=f"/officer/messages?conv={norm_type}-{entity_id}"
                )
        else:
            # Officer or Admin sent message -> Notify Citizen
            citizen_id = case_info.get('citizen_id')
            if citizen_id:
                create_notification(
                    user_id=citizen_id,
                    title=f"Municipal Update on {ref_id}",
                    message=f"Staff sent a message regarding '{case_title}': {message_text[:100]}",
                    notif_type='SYSTEM',
                    priority='MEDIUM',
                    module='COMMUNICATION',
                    entity_type=norm_type,
                    entity_id=entity_id,
                    action_url=f"/citizen/messages?conv={norm_type}-{entity_id}"
                )
                
        return jsonify({
            'success': True,
            'message': 'Message sent successfully.',
            'data': saved_message
        })
        
    except Exception as e:
        print(f"Error sending message: {e}")
        return jsonify({'success': False, 'message': 'Unable to send message.'}), 500
    finally:
        cursor.close()
        conn.close()

@api_messages_bp.route('/conv/<string:conv_id>', methods=['POST'])
def send_message_by_conv_id(conv_id):
    entity_type, entity_id = parse_conversation_identifier(conv_id)
    if not entity_type or not entity_id:
        return jsonify({'success': False, 'message': 'Invalid conversation identifier'}), 400
    return send_message(entity_type, entity_id)

@api_messages_bp.route('/<string:entity_type>/<int:entity_id>/read', methods=['PATCH'])
def mark_conversation_as_read(entity_type, entity_id):
    user = get_current_user()
    if not user:
        return jsonify({'success': False, 'message': 'Authentication required'}), 401
        
    conn = get_db_connection()
    authorized, case_info = verify_conversation_access(conn, user, entity_type, entity_id)
    
    if not authorized or not case_info:
        conn.close()
        return jsonify({'success': False, 'message': 'Forbidden'}), 403
        
    cursor = conn.cursor()
    try:
        norm_type = case_info['entity_type']
        cursor.execute("""
            UPDATE messages
            SET is_read = 1
            WHERE entity_type = %s AND entity_id = %s AND sender_id != %s AND is_read = 0
        """, (norm_type, entity_id, user['id']))
        conn.commit()
        return jsonify({'success': True, 'message': 'Messages marked as read.'})
    except Exception as e:
        print(f"Error marking messages as read: {e}")
        return jsonify({'success': False, 'message': 'Database error'}), 500
    finally:
        cursor.close()
        conn.close()

@api_messages_bp.route('/unread-count', methods=['GET'])
def get_unread_count():
    user = get_current_user()
    if not user:
        return jsonify({'success': False, 'unread_count': 0}), 401
        
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        if user['role'] == 'CITIZEN':
            cursor.execute("""
                SELECT COUNT(*) as unread
                FROM messages m
                WHERE m.sender_id != %s AND m.is_read = 0
                  AND (
                    (m.entity_type = 'SERVICE_REQUEST' AND m.entity_id IN (SELECT id FROM citizen_requests WHERE citizen_id = %s))
                    OR
                    (m.entity_type = 'REPORT' AND m.entity_id IN (SELECT id FROM citizen_reports WHERE citizen_id = %s))
                  )
            """, (user['id'], user['id'], user['id']))
            res = cursor.fetchone()
            return jsonify({'success': True, 'unread_count': res['unread'] if res else 0})
        elif user['role'] == 'ADMIN':
            cursor.execute("SELECT COUNT(*) as unread FROM messages WHERE sender_id != %s AND is_read = 0", (user['id'],))
            res = cursor.fetchone()
            return jsonify({'success': True, 'unread_count': res['unread'] if res else 0})
        elif user['role'] == 'OFFICER':
            cursor.execute("""
                SELECT COUNT(*) as unread
                FROM messages m
                WHERE m.sender_id != %s AND m.is_read = 0
                  AND (
                    (m.entity_type = 'SERVICE_REQUEST' AND m.entity_id IN (SELECT request_id FROM request_assignments WHERE officer_id = %s))
                    OR
                    (m.entity_type = 'REPORT' AND m.entity_id IN (SELECT id FROM citizen_reports WHERE officer_id = %s))
                  )
            """, (user['id'], user['id'], user['id']))
            res = cursor.fetchone()
            return jsonify({'success': True, 'unread_count': res['unread'] if res else 0})
            
        return jsonify({'success': True, 'unread_count': 0})
    except Exception as e:
        print(f"Error getting unread count: {e}")
        return jsonify({'success': False, 'unread_count': 0}), 500
    finally:
        cursor.close()
        conn.close()

@api_messages_bp.route('/upload', methods=['POST'])
def upload_attachment():
    user = get_current_user()
    if not user:
        return jsonify({'success': False, 'message': 'Authentication required'}), 401
        
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file uploaded'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No selected file'}), 400
        
    if not allowed_file(file.filename):
        return jsonify({'success': False, 'message': 'Invalid file type. Allowed: png, jpg, jpeg, pdf, doc, docx'}), 400
        
    upload_dir = os.path.join(current_app.root_path, 'static', 'uploads', 'messages')
    os.makedirs(upload_dir, exist_ok=True)
    
    ext = file.filename.rsplit('.', 1)[1].lower()
    unique_filename = f"msg_{uuid.uuid4().hex[:12]}_{int(datetime.datetime.now().timestamp())}.{ext}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    try:
        file.save(file_path)
        attachment_url = f"/static/uploads/messages/{unique_filename}"
        return jsonify({
            'success': True, 
            'attachment_url': attachment_url, 
            'filename': secure_filename(file.filename)
        })
    except Exception as e:
        print(f"File upload failed: {e}")
        return jsonify({'success': False, 'message': 'Failed to save uploaded file.'}), 500
