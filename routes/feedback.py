from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from config import get_db_connection

feedback_bp = Blueprint('feedback', __name__)

@feedback_bp.route('/feedback/submit', methods=['GET', 'POST'])
def submit():
    # Allow any logged-in user to submit for now (Citizens usually)
    if 'user_id' not in session:
        return redirect(url_for('auth.login'))
        
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    if request.method == 'POST':
        project_id = request.form['project_id']
        category = request.form['category']
        description = request.form['description']
        
        cursor.execute("""
            INSERT INTO feedback (project_id, user_id, category, description)
            VALUES (%s, %s, %s, %s)
        """, (project_id, session['user_id'], category, description))
        
        conn.commit()
        flash('Feedback submitted successfully.', 'success')
        return redirect(url_for('dashboard.index'))
        
    cursor.execute("SELECT id, project_name FROM projects")
    projects = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return render_template('feedback/submit.html', projects=projects)

@feedback_bp.route('/admin')
def admin_view():
    if 'user_id' not in session or session.get('role') not in ['Admin', 'Officer']:
        return redirect(url_for('auth.login'))
        
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    is_officer = session.get('role') == 'Officer'
    user_id = session.get('user_id')
    
    if is_officer:
        cursor.execute("""
            SELECT f.*, p.project_name, u.full_name as citizen_name
            FROM feedback f
            LEFT JOIN projects p ON f.project_id = p.id
            LEFT JOIN users u ON f.user_id = u.id
            WHERE p.manager_id = %s
            ORDER BY f.created_at DESC
        """, (user_id,))
    else:
        cursor.execute("""
            SELECT f.*, p.project_name, u.full_name as citizen_name
            FROM feedback f
            LEFT JOIN projects p ON f.project_id = p.id
            LEFT JOIN users u ON f.user_id = u.id
            ORDER BY f.created_at DESC
        """)
    feedbacks = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return render_template('feedback/admin_view.html', feedbacks=feedbacks)
