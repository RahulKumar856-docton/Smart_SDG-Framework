from flask import Blueprint, request, jsonify, session
from config import get_db_connection
from functools import wraps

api_admin_notifications_bp = Blueprint('api_admin_notifications', __name__)

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('role', '').upper() != 'ADMIN':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

@api_admin_notifications_bp.route('/', methods=['GET'])
@admin_required
def get_notifications():
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database error'}), 500
        
    try:
        # We only want notifications meant for THIS admin user, or general admin broadcasts
        # Assuming admin's user_id is in session
        user_id = session.get('user_id')
        
        # Filters
        module = request.args.get('module')
        priority = request.args.get('priority')
        status = request.args.get('status')
        date_range = request.args.get('date_range', 'Last 30 Days')
        search = request.args.get('search')
        
        query = """
            SELECT n.id, n.title, n.message, n.type, n.priority, n.module, 
                   n.action_url, n.is_read, n.read_at, n.created_at, n.entity_type, n.entity_id
            FROM notifications n
            WHERE n.user_id = %s AND n.archived_at IS NULL
        """
        params = [user_id]
        
        if module:
            query += " AND n.module = %s"
            params.append(module)
        if priority:
            query += " AND n.priority = %s"
            params.append(priority)
        if status == 'UNREAD':
            query += " AND n.is_read = 0"
        elif status == 'READ':
            query += " AND n.is_read = 1"
            
        if search:
            query += " AND (n.title LIKE %s OR n.message LIKE %s OR n.module LIKE %s)"
            params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])
            
        # Date filtering
        if date_range != 'All Time':
            if date_range == 'Today':
                query += " AND DATE(n.created_at) = DATE('now', 'localtime')"
            elif date_range == 'Yesterday':
                query += " AND DATE(n.created_at) = DATE('now', '-1 day', 'localtime')"
            elif date_range == 'Last 7 Days':
                query += " AND n.created_at >= DATE('now', '-7 days', 'localtime')"
            elif date_range == 'Last 30 Days':
                query += " AND n.created_at >= DATE('now', '-30 days', 'localtime')"
            elif date_range == 'This Month':
                query += " AND strftime('%Y-%m', n.created_at) = strftime('%Y-%m', 'now', 'localtime')"
                
        query += " ORDER BY n.created_at DESC"
        
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query, params)
        notifications = cursor.fetchall()
        
        # Format timestamps
        for n in notifications:
            n['created_at'] = str(n['created_at'])
            if n['read_at']:
                n['read_at'] = str(n['read_at'])
            
        return jsonify({'success': True, 'data': notifications})
    except Exception as e:
        print("Error fetching notifications:", e)
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@api_admin_notifications_bp.route('/statistics', methods=['GET'])
@admin_required
def get_statistics():
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database error'}), 500
        
    try:
        user_id = session.get('user_id')
        cursor = conn.cursor(dictionary=True)
        
        stats = {
            'total': 0,
            'unread': 0,
            'critical': 0,
            'action_required': 0
        }
        
        cursor.execute("SELECT COUNT(*) as c FROM notifications WHERE user_id = %s AND archived_at IS NULL", (user_id,))
        stats['total'] = cursor.fetchone()['c']
        
        cursor.execute("SELECT COUNT(*) as c FROM notifications WHERE user_id = %s AND is_read = 0 AND archived_at IS NULL", (user_id,))
        stats['unread'] = cursor.fetchone()['c']
        
        cursor.execute("SELECT COUNT(*) as c FROM notifications WHERE user_id = %s AND priority = 'CRITICAL' AND archived_at IS NULL", (user_id,))
        stats['critical'] = cursor.fetchone()['c']
        
        cursor.execute("SELECT COUNT(*) as c FROM notifications WHERE user_id = %s AND priority IN ('HIGH', 'CRITICAL') AND is_read = 0 AND archived_at IS NULL", (user_id,))
        stats['action_required'] = cursor.fetchone()['c']
        
        return jsonify({'success': True, 'data': stats})
    except Exception as e:
        print("Error fetching notification stats:", e)
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@api_admin_notifications_bp.route('/<int:notif_id>/read', methods=['PATCH'])
@admin_required
def mark_as_read(notif_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database error'}), 500
        
    try:
        user_id = session.get('user_id')
        cursor = conn.cursor()
        
        # Ensure the notification belongs to the user
        cursor.execute("UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE id = %s AND user_id = %s", (notif_id, user_id))
        conn.commit()
        
        if cursor.rowcount == 0:
            return jsonify({'success': False, 'message': 'Notification not found or unauthorized'}), 404
            
        return jsonify({'success': True})
    except Exception as e:
        print("Error marking notification read:", e)
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@api_admin_notifications_bp.route('/mark-all-read', methods=['POST'])
@admin_required
def mark_all_as_read():
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database error'}), 500
        
    try:
        user_id = session.get('user_id')
        cursor = conn.cursor()
        
        cursor.execute("UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE user_id = %s AND is_read = 0", (user_id,))
        conn.commit()
        
        return jsonify({'success': True, 'updated': cursor.rowcount})
    except Exception as e:
        print("Error marking all read:", e)
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@api_admin_notifications_bp.route('/<int:notif_id>/archive', methods=['PATCH'])
@admin_required
def archive_notification(notif_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database error'}), 500
        
    try:
        user_id = session.get('user_id')
        cursor = conn.cursor()
        
        cursor.execute("UPDATE notifications SET archived_at = CURRENT_TIMESTAMP WHERE id = %s AND user_id = %s", (notif_id, user_id))
        conn.commit()
        
        if cursor.rowcount == 0:
            return jsonify({'success': False, 'message': 'Notification not found or unauthorized'}), 404
            
        return jsonify({'success': True})
    except Exception as e:
        print("Error archiving notification:", e)
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
