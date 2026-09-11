from flask import Blueprint, render_template
from config import get_db_connection
from routes.dashboard import login_required

departments_bp = Blueprint('departments', __name__)

@departments_bp.route('/departments')
@login_required
def index():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT d.id, d.name, COUNT(p.id) as total_projects, 
               AVG(p.progress_percentage) as avg_progress,
               SUM(p.allocated_budget) as total_budget,
               SUM(p.amount_spent) as total_spent
        FROM departments d
        LEFT JOIN projects p ON d.id = p.department_id
        GROUP BY d.id
    """)
    departments = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return render_template('departments/performance.html', departments=departments)
