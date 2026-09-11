from flask import Blueprint, render_template, request, jsonify
from config import get_db_connection
from routes.dashboard import login_required

simulator_bp = Blueprint('simulator', __name__, url_prefix='/simulator')

@simulator_bp.route('/')
@login_required
def index():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT p.id, p.project_name, p.status, p.progress_percentage, p.allocated_budget, 
               p.amount_spent, p.expected_end_date, d.name as dept_name,
               (SELECT AVG(score) FROM sdg_scores WHERE project_id = p.id) as avg_sdg
        FROM projects p
        LEFT JOIN departments d ON p.department_id = d.id
        WHERE p.status != 'Completed'
    """)
    projects = cursor.fetchall()
    cursor.close()
    conn.close()
    return render_template('simulator/index.html', projects=projects)

@simulator_bp.route('/api/simulate', methods=['POST'])
@login_required
def simulate():
    data = request.json
    project_id = data.get('project_id')
    added_funds = float(data.get('added_funds', 0)) # in absolute values
    added_months = int(data.get('added_months', 0))
    
    conn = get_db_connection()
    if not conn: return jsonify({'error': 'Database error'})
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT progress_percentage, allocated_budget, amount_spent, 
        (SELECT AVG(score) FROM sdg_scores WHERE project_id = projects.id) as avg_sdg
        FROM projects WHERE id = %s
    """, (project_id,))
    project = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not project:
        return jsonify({'error': 'Project not found'})
        
    current_progress = float(project['progress_percentage'])
    current_sdg = float(project['avg_sdg']) if project['avg_sdg'] else 0
    alloc = float(project['allocated_budget'])
    spent = float(project['amount_spent'])
    
    # Simple Heuristic Simulation Logic:
    # 1. Added funds: If budget is unblocked, progress can increase.
    #    Assumption: Every 5% increase in total budget allows for a 3% increase in progress.
    pct_increase_funds = (added_funds / alloc * 100) if alloc > 0 else 0
    sim_progress = current_progress + (pct_increase_funds * 0.6)
    
    # 2. Added time: Removes time pressure, allowing focus on quality -> increases SDG score.
    #    Assumption: Every month added increases SDG score by 1.5 points, but only if they have funds.
    sim_sdg = current_sdg + (added_months * 1.5)
    
    # Cap values
    sim_progress = min(100.0, sim_progress)
    sim_sdg = min(100.0, sim_sdg)
    
    return jsonify({
        'current_progress': current_progress,
        'simulated_progress': round(sim_progress, 1),
        'progress_delta': round(sim_progress - current_progress, 1),
        
        'current_sdg': round(current_sdg, 1),
        'simulated_sdg': round(sim_sdg, 1),
        'sdg_delta': round(sim_sdg - current_sdg, 1)
    })
