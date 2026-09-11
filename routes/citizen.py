from flask import Blueprint, render_template, session, redirect, url_for
from config import get_db_connection
from functools import wraps

citizen_bp = Blueprint('citizen', __name__, url_prefix='/citizen')

def citizen_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('role') != 'Citizen':
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

@citizen_bp.route('/')
@citizen_bp.route('/dashboard')
@citizen_required
def dashboard():
    return render_template('citizen/citizen_dashboard.html')

@citizen_bp.route('/explore')
@citizen_required
def explore():
    return render_template('citizen/citizen_explore.html')

@citizen_bp.route('/projects/<int:project_id>')
@citizen_required
def project_detail(project_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT p.*, d.name as dept_name 
        FROM projects p 
        LEFT JOIN departments d ON p.department_id = d.id 
        WHERE p.id = %s
    """, (project_id,))
    project = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    if not project:
        return render_template('404.html'), 404
        
    return render_template('citizen/citizen_project_detail.html', project=project)

@citizen_bp.route('/feedback')
@citizen_required
def feedback():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, project_name FROM projects")
    projects = cursor.fetchall()
    cursor.close()
    conn.close()
    return render_template('citizen/citizen_feedback.html', projects=projects)

@citizen_bp.route('/announcements')
@citizen_required
def announcements():
    return render_template('citizen/citizen_announcements.html')

@citizen_bp.route('/public-reports')
@citizen_required
def public_reports():
    return render_template('citizen/citizen_public_reports.html')

@citizen_bp.route('/municipal-data')
@citizen_required
def municipal_data():
    return render_template('citizen/citizen_municipal_data.html')

@citizen_bp.route('/how-it-works')
@citizen_required
def how_it_works():
    return render_template('citizen/citizen_how_it_works.html')

@citizen_bp.route('/about-sdgs')
@citizen_required
def about_sdgs():
    return render_template('citizen/citizen_about_sdgs.html')
