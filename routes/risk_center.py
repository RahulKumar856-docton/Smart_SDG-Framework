from flask import Blueprint, render_template
from config import get_db_connection
from routes.dashboard import login_required
from services.risk_engine import evaluate_project_risk

risk_bp = Blueprint('risk', __name__)

@risk_bp.route('/risk')
@login_required
def analysis():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    query = "SELECT id, project_name, status, progress_percentage, allocated_budget, amount_spent FROM projects"
    params = []
    from flask import session
    if session.get('role') == 'Officer':
        query += " WHERE manager_id = %s"
        params.append(session['user_id'])
        
    cursor.execute(query, tuple(params))
    projects = cursor.fetchall()
    cursor.close()
    conn.close()
    
    risk_stats = {'HIGH': 0, 'MEDIUM': 0, 'LOW': 0}
    project_risks = []
    
    for p in projects:
        risk_profile = evaluate_project_risk(p['id'])
        if not risk_profile: continue
        
        overall = risk_profile['overall']
        risk_stats[overall] += 1
        
        project_risks.append({
            'project_id': p['id'],
            'project_name': p['project_name'],
            'status': p['status'],
            'progress': p['progress_percentage'],
            'profile': risk_profile
        })
        
    # Sort by risk severity (HIGH -> MEDIUM -> LOW)
    sort_order = {'HIGH': 0, 'MEDIUM': 1, 'LOW': 2}
    project_risks.sort(key=lambda x: sort_order.get(x['profile']['overall'], 3))
    
    return render_template('risk/analysis.html', stats=risk_stats, risks=project_risks)
