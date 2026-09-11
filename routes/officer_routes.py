from flask import Blueprint, render_template, session, redirect, url_for
from config import get_db_connection
from functools import wraps

officer_bp = Blueprint('officer', __name__, url_prefix='/officer')

def officer_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('role') != 'Officer':
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

@officer_bp.route('/dashboard')
@officer_required
def dashboard():
    return render_template('officer/officer_dashboard.html')

@officer_bp.route('/projects/<int:project_id>')
@officer_required
def project_detail(project_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Ensure project belongs to the officer
    cursor.execute("""
        SELECT p.*, d.name as dept_name 
        FROM projects p 
        LEFT JOIN departments d ON p.department_id = d.id 
        WHERE p.id = %s AND p.manager_id = %s
    """, (project_id, session['user_id']))
    project = cursor.fetchone()
    
    if not project:
        cursor.close()
        conn.close()
        return render_template('404.html'), 404
        
    cursor.close()
    conn.close()
    return render_template('officer/officer_project_detail.html', project=project)
