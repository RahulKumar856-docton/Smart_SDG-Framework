from flask import Blueprint, request, jsonify, session
from config import get_db_connection
from functools import wraps
import json

api_admin_audit_bp = Blueprint('api_admin_audit', __name__)

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('role', '').upper() != 'ADMIN':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

@api_admin_audit_bp.route('/', methods=['GET'])
@admin_required
def get_audit_logs():
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database error'}), 500
        
    try:
        # Extract filters
        module = request.args.get('module')
        action = request.args.get('action')
        result = request.args.get('result')
        user_role = request.args.get('role')
        date_range = request.args.get('date_range', 'Last 30 Days')
        
        query = """
            SELECT a.id, a.user_id, u.full_name as user_name, u.role as user_role,
                   a.action, a.module, a.entity, a.entity_id, 
                   a.old_value, a.new_value, a.result, a.timestamp
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE 1=1
        """
        params = []
        
        if module:
            query += " AND a.module = %s"
            params.append(module)
        if action:
            query += " AND a.action = %s"
            params.append(action)
        if result:
            query += " AND a.result = %s"
            params.append(result)
        if user_role:
            query += " AND u.role = %s"
            params.append(user_role)
            
        # Date filtering
        if date_range != 'All Time':
            if date_range == 'Today':
                query += " AND DATE(a.timestamp) = DATE('now', 'localtime')"
            elif date_range == 'Yesterday':
                query += " AND DATE(a.timestamp) = DATE('now', '-1 day', 'localtime')"
            elif date_range == 'Last 7 Days':
                query += " AND a.timestamp >= DATE('now', '-7 days', 'localtime')"
            elif date_range == 'Last 30 Days':
                query += " AND a.timestamp >= DATE('now', '-30 days', 'localtime')"
            elif date_range == 'This Month':
                query += " AND strftime('%Y-%m', a.timestamp) = strftime('%Y-%m', 'now', 'localtime')"
            elif date_range == 'This Year':
                query += " AND strftime('%Y', a.timestamp) = strftime('%Y', 'now', 'localtime')"
                
        query += " ORDER BY a.timestamp DESC"
        
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query, params)
        logs = cursor.fetchall()
        
        # Parse JSON if needed and format timestamp
        for log in logs:
            log['timestamp'] = str(log['timestamp'])
            
            # Helper to parse json strings safely
            def parse_safe(val):
                if val and isinstance(val, str):
                    try:
                        return json.loads(val)
                    except:
                        pass
                return val
                
            log['old_value'] = parse_safe(log['old_value'])
            log['new_value'] = parse_safe(log['new_value'])
            
            # Provide fallbacks
            log['module'] = log['module'] or log['entity'] or 'System'
            log['result'] = log['result'] or 'SUCCESS'
            log['user_name'] = log['user_name'] or 'System'
            
        return jsonify({'success': True, 'data': logs})
    except Exception as e:
        print("Error fetching audit logs:", e)
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@api_admin_audit_bp.route('/statistics', methods=['GET'])
@admin_required
def get_audit_statistics():
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database error'}), 500
        
    try:
        cursor = conn.cursor(dictionary=True)
        
        stats = {
            'total': 0,
            'today': 0,
            'admin': 0,
            'officer': 0,
            'failed': 0,
            'system': 0
        }
        
        # SQLite uses date('now')
        cursor.execute("SELECT COUNT(*) as c FROM audit_logs")
        stats['total'] = cursor.fetchone()['c']
        
        cursor.execute("SELECT COUNT(*) as c FROM audit_logs WHERE DATE(timestamp) = DATE('now', 'localtime')")
        stats['today'] = cursor.fetchone()['c']
        
        cursor.execute("""
            SELECT COUNT(*) as c FROM audit_logs a
            JOIN users u ON a.user_id = u.id
            WHERE u.role = 'Admin'
        """)
        stats['admin'] = cursor.fetchone()['c']
        
        cursor.execute("""
            SELECT COUNT(*) as c FROM audit_logs a
            JOIN users u ON a.user_id = u.id
            WHERE u.role = 'Officer'
        """)
        stats['officer'] = cursor.fetchone()['c']
        
        cursor.execute("SELECT COUNT(*) as c FROM audit_logs WHERE result = 'FAILED' OR result = 'DENIED'")
        stats['failed'] = cursor.fetchone()['c']
        
        # Calculate system events (where user is null or not admin/officer)
        stats['system'] = stats['total'] - (stats['admin'] + stats['officer'])
        if stats['system'] < 0: stats['system'] = 0
        
        return jsonify({'success': True, 'data': stats})
    except Exception as e:
        print("Error fetching audit stats:", e)
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
