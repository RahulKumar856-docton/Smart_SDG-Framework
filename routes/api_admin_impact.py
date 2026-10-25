from flask import Blueprint, jsonify, session, request
from config import get_db_connection
from services.impact_engine import calculate_impact_index

api_admin_impact_bp = Blueprint('api_admin_impact', __name__)

def admin_required(f):
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('role', '').upper() not in ['ADMIN', 'SUPER_ADMIN']:
            return jsonify({'success': False, 'message': 'Unauthorized'}), 403
        return f(*args, **kwargs)
    return decorated_function

@api_admin_impact_bp.route('/summary', methods=['GET'])
@admin_required
def get_summary():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("SELECT id FROM projects")
    projects = cursor.fetchall()
    
    if not projects:
        cursor.close()
        conn.close()
        return jsonify({'success': True, 'summary': None})
        
    total_analyzed = len(projects)
    completed = 0
    on_track = 0
    at_risk = 0
    total_impact = 0
    total_cit_res = 0
    total_ins_ver = 0
    
    analyzed_cit = 0
    analyzed_ins = 0
    
    for p in projects:
        impact = calculate_impact_index(p['id'])
        if not impact: continue
        
        status = impact['impact']['status']
        if status == 'Positive': completed += 1 # simplifying for summary
        if status == 'Stable': on_track += 1
        if status in ['Needs Attention', 'Negative']: at_risk += 1
        
        total_impact += impact['impact']['score']
        
        if impact['outcome']['available']:
            total_cit_res += impact['outcome']['resolution_rate']
            analyzed_cit += 1
            
        if impact['verification']['available']:
            total_ins_ver += impact['verification']['verification_rate']
            analyzed_ins += 1
            
    avg_impact = (total_impact / total_analyzed) if total_analyzed else 0
    avg_cit = (total_cit_res / analyzed_cit) if analyzed_cit else 0
    avg_ins = (total_ins_ver / analyzed_ins) if analyzed_ins else 0
    
    cursor.close()
    conn.close()
    
    return jsonify({
        'success': True,
        'summary': {
            'total_analyzed': total_analyzed,
            'completed': completed,
            'on_track': on_track,
            'at_risk': at_risk,
            'avg_impact': round(avg_impact, 1),
            'cit_resolution_rate': round(avg_cit, 1),
            'ins_verification_rate': round(avg_ins, 1),
            'ev_verification_rate': 100 # Default/Placeholder since we don't have global evidence logic yet
        }
    })

@api_admin_impact_bp.route('/projects', methods=['GET'])
@admin_required
def get_projects():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT p.id, p.project_name, d.name as dept_name, p.status, p.reported_progress as progress_percentage
        FROM projects p
        LEFT JOIN departments d ON p.department_id = d.id
    """)
    projects = cursor.fetchall()
    
    results = []
    for p in projects:
        impact = calculate_impact_index(p['id'])
        if impact:
            p['kpi_achievement'] = impact['kpis']['overall_achievement']
            p['citizen_requests'] = impact['outcome']['total_requests'] if impact['outcome']['available'] else 0
            p['inspections'] = impact['verification']['total_inspections'] if impact['verification']['available'] else 0
            p['budget_util'] = impact['output']['budget_utilization']
            p['impact_score'] = impact['impact']['score']
            p['impact_status'] = impact['impact']['status']
            p['confidence'] = impact['impact']['confidence']['level']
            results.append(p)
            
    cursor.close()
    conn.close()
    
    return jsonify({'success': True, 'data': results})

@api_admin_impact_bp.route('/projects/<int:id>', methods=['GET'])
@admin_required
def get_project_details(id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT p.*, d.name as dept_name
        FROM projects p
        LEFT JOIN departments d ON p.department_id = d.id
        WHERE p.id = ?
    """, (id,))
    project = cursor.fetchone()
    
    if not project:
        cursor.close()
        conn.close()
        return jsonify({'success': False, 'message': 'Not found'}), 404
        
    impact = calculate_impact_index(id)
    
    cursor.close()
    conn.close()
    
    return jsonify({
        'success': True,
        'data': {
            'project': project,
            'analysis': impact
        }
    })

@api_admin_impact_bp.route('/departments', methods=['GET'])
@admin_required
def get_departments():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("SELECT id, name FROM departments")
    depts = cursor.fetchall()
    
    res = []
    for d in depts:
        cursor.execute("SELECT id FROM projects WHERE department_id = ?", (d['id'],))
        projects = cursor.fetchall()
        if not projects: continue
        
        t_proj = len(projects)
        completed = 0
        at_risk = 0
        t_kpi = 0
        t_cit = 0
        cit_cnt = 0
        
        for p in projects:
            imp = calculate_impact_index(p['id'])
            if not imp: continue
            
            if imp['impact']['status'] == 'Positive': completed += 1
            if imp['impact']['status'] in ['Needs Attention', 'Negative']: at_risk += 1
            t_kpi += imp['kpis']['overall_achievement']
            if imp['outcome']['available']:
                t_cit += imp['outcome']['resolution_rate']
                cit_cnt += 1
                
        res.append({
            'department': d['name'],
            'projects': t_proj,
            'completed': completed,
            'at_risk': at_risk,
            'avg_kpi': round(t_kpi / t_proj, 1),
            'cit_res': round(t_cit / cit_cnt, 1) if cit_cnt else 0,
            'overall': round((t_kpi/t_proj * 0.5) + ((t_cit/cit_cnt)*0.5 if cit_cnt else 50), 1)
        })
        
    cursor.close()
    conn.close()
    
    return jsonify({'success': True, 'data': res})
