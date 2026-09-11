from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from config import get_db_connection
from routes.dashboard import login_required
from models.user import User

users_bp = Blueprint('users', __name__)
audit_bp = Blueprint('audit', __name__)
settings_bp = Blueprint('settings', __name__)

@users_bp.route('/admin/users')
@login_required
def list_users():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT u.id, u.full_name, u.username, u.role, u.created_at, u.status, u.employee_id, d.name as dept_name
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        ORDER BY u.role, u.full_name
    """)
    users = cursor.fetchall()
    cursor.close()
    conn.close()
    return render_template('admin/users.html', users=users)

@users_bp.route('/admin/users/status/<int:user_id>/<action>', methods=['POST'])
@login_required
def change_status(user_id, action):
    if session.get('role', '').upper() != 'ADMIN':
        return "Unauthorized", 403
        
    status_map = {
        'approve': 'Active',
        'reject': 'Rejected',
        'deactivate': 'Deactivated',
        'activate': 'Active'
    }
    
    new_status = status_map.get(action)
    if new_status:
        User.update_status(user_id, new_status)
        flash(f"User status updated to {new_status}.", "success")
    else:
        flash("Invalid action.", "danger")
        
    return redirect(url_for('users.list_users'))

@audit_bp.route('/admin/audit')
@login_required
def logs():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT a.*, u.full_name 
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
        ORDER BY a.timestamp DESC LIMIT 50
    """)
    logs = cursor.fetchall()
    cursor.close()
    conn.close()
    return render_template('admin/audit_logs.html', logs=logs)

@settings_bp.route('/admin/settings')
@login_required
def index():
    return render_template('admin/settings.html')

