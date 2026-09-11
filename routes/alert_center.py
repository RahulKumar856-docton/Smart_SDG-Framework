from flask import Blueprint, render_template
from config import get_db_connection
from routes.dashboard import login_required

alerts_bp = Blueprint('alerts', __name__)

@alerts_bp.route('/alerts')
@login_required
def center():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    from flask import session
    is_officer = session.get('role') == 'Officer'
    user_id = session.get('user_id')
    
    if is_officer:
        cursor.execute("""
            SELECT a.*, p.project_name 
            FROM alerts a
            JOIN projects p ON a.project_id = p.id
            WHERE p.manager_id = %s
            ORDER BY a.created_at DESC
        """, (user_id,))
    else:
        cursor.execute("""
            SELECT a.*, p.project_name 
            FROM alerts a
            JOIN projects p ON a.project_id = p.id
            ORDER BY a.created_at DESC
        """)
    alerts = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return render_template('alerts/center.html', alerts=alerts)
