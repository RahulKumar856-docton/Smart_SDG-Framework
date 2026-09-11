from flask import Blueprint, render_template
from config import get_db_connection
from routes.dashboard import login_required

recommendations_bp = Blueprint('recommendations', __name__)

@recommendations_bp.route('/recommendations')
@login_required
def center():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    from flask import session
    is_officer = session.get('role') == 'Officer'
    user_id = session.get('user_id')
    
    if is_officer:
        cursor.execute("""
            SELECT r.*, p.project_name 
            FROM recommendations r
            JOIN projects p ON r.project_id = p.id
            WHERE p.manager_id = %s
            ORDER BY r.created_at DESC
        """, (user_id,))
    else:
        cursor.execute("""
            SELECT r.*, p.project_name 
            FROM recommendations r
            JOIN projects p ON r.project_id = p.id
            ORDER BY r.created_at DESC
        """)
    recs = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return render_template('recommendations/center.html', recommendations=recs)
