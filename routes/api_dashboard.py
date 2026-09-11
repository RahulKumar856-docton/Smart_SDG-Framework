from flask import Blueprint, jsonify, session, request
from config import get_db_connection

api_dashboard_bp = Blueprint('api_dashboard', __name__, url_prefix='/api/dashboard')

def _build_project_filter():
    """Helper to build WHERE clause based on query params"""
    department = request.args.get('department')
    status = request.args.get('status')
    
    where_clauses = ["1=1"]
    params = []
    
    if department and department != 'All':
        where_clauses.append("department_id = ?")
        params.append(department)
        
    if status and status != 'All':
        where_clauses.append("status = ?")
        params.append(status)
        
    return " AND ".join(where_clauses), params

@api_dashboard_bp.route('/summary')
def get_summary():
    if 'user_id' not in session: return jsonify({'error': 'Unauthorized'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    where, params = _build_project_filter()
    
    # KPIs
    cursor.execute(f"SELECT COUNT(*) as total FROM projects WHERE {where}", params)
    total = cursor.fetchone()['total'] or 0
    
    cursor.execute(f"SELECT COUNT(*) as active FROM projects WHERE status = 'In Progress' AND {where}", params)
    active = cursor.fetchone()['active'] or 0
    
    cursor.execute(f"SELECT COUNT(*) as completed FROM projects WHERE status = 'Completed' AND {where}", params)
    completed = cursor.fetchone()['completed'] or 0
    
    cursor.execute(f"SELECT COUNT(*) as delayed FROM projects WHERE status = 'Delayed' AND {where}", params)
    delayed = cursor.fetchone()['delayed'] or 0
    
    cursor.execute(f"SELECT COUNT(*) as high_risk FROM projects WHERE priority = 'High' AND {where}", params)
    high_risk = cursor.fetchone()['high_risk'] or 0
    
    # Financials
    cursor.execute(f"SELECT SUM(allocated_budget) as budget, SUM(amount_spent) as spent, AVG(progress_percentage) as progress FROM projects WHERE {where}", params)
    fin_res = cursor.fetchone()
    budget = fin_res['budget'] or 0
    spent = fin_res['spent'] or 0
    progress = fin_res['progress'] or 0
    utilization = (spent / budget * 100) if budget > 0 else 0
    
    # SDG Score (Global average for now, ignoring project filters for simplicity unless joined)
    cursor.execute("SELECT AVG(score) as avg_sdg FROM sdg_scores")
    sdg_res = cursor.fetchone()
    avg_sdg = sdg_res['avg_sdg'] or 0
    
    # Data Quality / Confidence
    cursor.execute(f"SELECT AVG(data_confidence) as avg_confidence FROM projects WHERE {where}", params)
    conf_res = cursor.fetchone()
    data_quality = conf_res['avg_confidence'] or 0
    
    cursor.close()
    conn.close()
    
    return jsonify({
        'total_projects': total,
        'active_projects': active,
        'completed_projects': completed,
        'delayed_projects': delayed,
        'high_risk_projects': high_risk,
        'avg_sdg': round(avg_sdg, 1),
        'budget_utilization': round(utilization, 1),
        'total_budget': budget,
        'total_spent': spent,
        'avg_progress': round(progress, 1),
        'data_quality': round(data_quality, 1)
    })

@api_dashboard_bp.route('/sdg')
def get_sdg_performance():
    if 'user_id' not in session: return jsonify({'error': 'Unauthorized'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Only fetch SDGs that have actual score data
    cursor.execute("""
        SELECT s.id, s.name, AVG(ss.score) as current_score, COUNT(DISTINCT ss.project_id) as project_count
        FROM sdgs s
        LEFT JOIN sdg_scores ss ON s.id = ss.sdg_id
        GROUP BY s.id, s.name
        HAVING current_score IS NOT NULL
        ORDER BY s.id ASC
    """)
    sdgs = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    for s in sdgs:
        s['target'] = 100
        s['gap'] = max(0, 100 - (s['current_score'] or 0))
        s['current_score'] = round(s['current_score'] or 0, 1)
        s['gap'] = round(s['gap'], 1)
        
        if s['current_score'] >= 80: s['status'] = 'Excellent'
        elif s['current_score'] >= 60: s['status'] = 'Good'
        elif s['current_score'] >= 40: s['status'] = 'Moderate'
        else: s['status'] = 'Needs Improvement'
        
    return jsonify(sdgs)

@api_dashboard_bp.route('/projects/status')
def get_project_status():
    if 'user_id' not in session: return jsonify({'error': 'Unauthorized'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    where, params = _build_project_filter()
    
    cursor.execute(f"SELECT status, COUNT(*) as count FROM projects WHERE {where} GROUP BY status", params)
    status_data = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return jsonify(status_data)

@api_dashboard_bp.route('/projects/recent')
def get_recent_projects():
    if 'user_id' not in session: return jsonify({'error': 'Unauthorized'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    where, params = _build_project_filter()
    
    cursor.execute(f"""
        SELECT p.id, p.project_name, p.status, p.progress_percentage, p.priority, p.updated_at, d.name as dept_name,
        (SELECT AVG(score) FROM sdg_scores WHERE project_id = p.id) as sdg_score
        FROM projects p
        LEFT JOIN departments d ON p.department_id = d.id
        WHERE {where}
        ORDER BY p.updated_at DESC LIMIT 5
    """, params)
    projects = cursor.fetchall()
    
    for p in projects:
        p['sdg_score'] = round(p['sdg_score'] or 0, 1)
        
    cursor.close()
    conn.close()
    
    return jsonify(projects)

@api_dashboard_bp.route('/alerts')
def get_alerts():
    if 'user_id' not in session: return jsonify({'error': 'Unauthorized'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT a.*, p.project_name 
        FROM alerts a
        JOIN projects p ON a.project_id = p.id
        WHERE a.is_resolved = 0
        ORDER BY a.created_at DESC LIMIT 5
    """)
    alerts = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return jsonify(alerts)

@api_dashboard_bp.route('/departments')
def get_department_performance():
    if 'user_id' not in session: return jsonify({'error': 'Unauthorized'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT d.id, d.name, COUNT(p.id) as total_projects, 
               SUM(CASE WHEN p.status = 'Completed' THEN 1 ELSE 0 END) as completed_projects,
               AVG(p.progress_percentage) as avg_progress,
               SUM(p.allocated_budget) as total_budget,
               SUM(p.amount_spent) as total_spent
        FROM departments d
        JOIN projects p ON d.id = p.department_id
        GROUP BY d.id
        ORDER BY total_projects DESC
    """)
    departments = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    for d in departments:
        d['avg_progress'] = round(d['avg_progress'] or 0, 1)
        d['utilization'] = round((d['total_spent'] / d['total_budget'] * 100) if d['total_budget'] and d['total_budget'] > 0 else 0, 1)
        
    return jsonify(departments)

@api_dashboard_bp.route('/map')
def get_map_data():
    if 'user_id' not in session: return jsonify({'error': 'Unauthorized'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    where, params = _build_project_filter()
    
    cursor.execute(f"""
        SELECT p.id, p.project_name, p.status, p.progress_percentage, p.priority, p.latitude, p.longitude, d.name as dept_name
        FROM projects p
        LEFT JOIN departments d ON p.department_id = d.id
        WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL AND {where}
    """, params)
    locations = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return jsonify(locations)

@api_dashboard_bp.route('/departments/list')
def list_departments():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, name FROM departments ORDER BY name")
    deps = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(deps)

@api_dashboard_bp.route('/verification')
def get_verification_status():
    if 'user_id' not in session: return jsonify({'error': 'Unauthorized'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    where, params = _build_project_filter()
    
    cursor.execute(f"""
        SELECT id, project_name, progress_percentage as reported, 
               verified_progress_percentage as verified, 
               (progress_percentage - verified_progress_percentage) as difference,
               verification_status
        FROM projects
        WHERE {where}
    """, params)
    projects = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return jsonify(projects)

@api_dashboard_bp.route('/impact-index')
def get_impact_index():
    if 'user_id' not in session: return jsonify({'error': 'Unauthorized'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    where, params = _build_project_filter()
    
    cursor.execute(f"""
        SELECT p.id, p.project_name, 
               (SELECT AVG(score) FROM sdg_scores WHERE project_id = p.id) as sdg_impact,
               p.progress_percentage as completion,
               CASE WHEN p.allocated_budget > 0 THEN (p.amount_spent / p.allocated_budget) * 100 ELSE 0 END as budget_efficiency,
               p.data_confidence
        FROM projects p
        WHERE {where}
    """, params)
    projects = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    for p in projects:
        sdg = p['sdg_impact'] or 0
        comp = p['completion'] or 0
        budg = p['budget_efficiency'] or 0
        conf = p['data_confidence'] or 0
        
        impact = (sdg * 0.4) + (comp * 0.3) + (max(0, 100 - abs(100 - budg)) * 0.1) + (conf * 0.2)
        p['impact_index'] = round(impact, 1)
        
    # Sort by impact
    projects.sort(key=lambda x: x['impact_index'], reverse=True)
    return jsonify(projects)
