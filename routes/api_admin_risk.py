from flask import Blueprint, jsonify, session, request
from config import get_db_connection
from services.risk_engine import evaluate_project_risk
from ml.delay_prediction import DelayPredictor
from datetime import datetime

api_admin_risk_bp = Blueprint('api_admin_risk', __name__)

predictor = DelayPredictor(db_path='database.db')

def admin_required(f):
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('role', '').upper() not in ['ADMIN', 'SUPER_ADMIN']:
            return jsonify({'success': False, 'message': 'Unauthorized'}), 403
        return f(*args, **kwargs)
    return decorated_function

@api_admin_risk_bp.route('/summary', methods=['GET'])
@admin_required
def get_summary():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id FROM projects")
    projects = cursor.fetchall()
    
    total_analyzed = len(projects)
    high_risk = 0
    medium_risk = 0
    low_risk = 0
    
    for p in projects:
        risk = evaluate_project_risk(p['id'])
        if not risk: continue
        if risk['overall'] == 'HIGH': high_risk += 1
        elif risk['overall'] == 'MEDIUM': medium_risk += 1
        else: low_risk += 1
        
    cursor.close()
    conn.close()
    
    return jsonify({
        'success': True, 
        'summary': {
            'total_analyzed': total_analyzed,
            'high_risk': high_risk,
            'medium_risk': medium_risk,
            'low_risk': low_risk
        }
    })

@api_admin_risk_bp.route('/projects', methods=['GET'])
@admin_required
def get_projects():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Needs some join for department
    cursor.execute("""
        SELECT p.id, p.project_name, d.name as dept_name, p.status, p.reported_progress as progress_percentage,
        p.budget, p.start_date, p.expected_completion, p.priority
        FROM projects p
        LEFT JOIN departments d ON p.department_id = d.id
    """)
    projects = cursor.fetchall()
    cursor.close()
    conn.close()
    
    # Make sure ML model is trained
    if not predictor.is_trained:
        predictor.train()
        
    results = []
    for p in projects:
        risk_profile = evaluate_project_risk(p['id'])
        
        # Prepare data for ML model if applicable
        delay_prediction = None
        if p.get('start_date') and p.get('expected_completion'):
            ml_data = {
                'id': p['id'],
                'status': p['status'],
                'allocated_budget': p['budget'] or 0,
                'amount_spent': (p['budget'] or 0) * ((p['progress_percentage'] or 0) / 100),
                'progress_percentage': p['progress_percentage'] or 0,
                'priority': p['priority'] or 'Medium',
                'start_date': p['start_date'],
                'expected_end_date': p['expected_completion']
            }
            try:
                start_dt = datetime.strptime(str(p['start_date'])[:10], "%Y-%m-%d")
                end_dt = datetime.strptime(str(p['expected_completion'])[:10], "%Y-%m-%d")
                now = datetime.now()
                ml_data['days_elapsed'] = (now - start_dt).days
                ml_data['days_remaining'] = (end_dt - now).days
                delay_prediction = predictor.predict_risk(ml_data)
            except Exception as e:
                print("Error calculating dates for ml", e)
                
        p['risk_profile'] = risk_profile
        p['delay_prediction'] = delay_prediction
        results.append(p)
        
    return jsonify({'success': True, 'data': results})

@api_admin_risk_bp.route('/projects/<int:id>', methods=['GET'])
@admin_required
def get_project_risk(id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT p.*, d.name as dept_name
        FROM projects p
        LEFT JOIN departments d ON p.department_id = d.id
        WHERE p.id = ?
    """, (id,))
    project = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not project:
        return jsonify({'success': False, 'message': 'Project not found'}), 404
        
    risk_profile = evaluate_project_risk(id)
    
    delay_prediction = None
    if project.get('start_date') and project.get('expected_completion'):
        if not predictor.is_trained:
            predictor.train()
            
        ml_data = {
            'id': project['id'],
            'status': project['status'],
            'allocated_budget': project['budget'] or 0,
            'amount_spent': (project['budget'] or 0) * ((project.get('reported_progress') or 0) / 100),
            'progress_percentage': project.get('reported_progress') or 0,
            'priority': project.get('priority') or 'Medium',
            'start_date': project['start_date'],
            'expected_end_date': project['expected_completion']
        }
        try:
            start_dt = datetime.strptime(str(project['start_date'])[:10], "%Y-%m-%d")
            end_dt = datetime.strptime(str(project['expected_completion'])[:10], "%Y-%m-%d")
            now = datetime.now()
            ml_data['days_elapsed'] = (now - start_dt).days
            ml_data['days_remaining'] = (end_dt - now).days
            delay_prediction = predictor.predict_risk(ml_data)
        except Exception as e:
            print("Error calculating dates for ml", e)
            
    return jsonify({
        'success': True,
        'data': {
            'project': project,
            'risk_profile': risk_profile,
            'delay_prediction': delay_prediction
        }
    })
