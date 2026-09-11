import os
from werkzeug.utils import secure_filename
from flask import Blueprint, jsonify, session, request, current_app
from config import get_db_connection
from routes.utils import role_required

officer_api_bp = Blueprint('officer_api', __name__, url_prefix='/api/officer')

# Removed custom decorator; using generic role_required for case‑insensitive check

@officer_api_bp.route('/dashboard/summary')
@role_required('OFFICER')
def get_summary():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Base projects
    cursor.execute("SELECT COUNT(*) as total FROM projects WHERE manager_id = %s", (user_id,))
    total = cursor.fetchone()['total'] or 0
    
    cursor.execute("SELECT COUNT(*) as active FROM projects WHERE status = 'In Progress' AND manager_id = %s", (user_id,))
    active = cursor.fetchone()['active'] or 0
    
    cursor.execute("SELECT COUNT(*) as completed FROM projects WHERE status = 'Completed' AND manager_id = %s", (user_id,))
    completed = cursor.fetchone()['completed'] or 0
    
    cursor.execute("SELECT COUNT(*) as delayed FROM projects WHERE (status = 'Delayed' OR priority = 'Critical' OR priority = 'High') AND manager_id = %s", (user_id,))
    delayed = cursor.fetchone()['delayed'] or 0
    
    # Financials
    cursor.execute("SELECT SUM(allocated_budget) as budget, SUM(amount_spent) as spent, AVG(progress_percentage) as progress FROM projects WHERE manager_id = %s", (user_id,))
    fin_res = cursor.fetchone()
    budget = fin_res['budget'] or 0
    spent = fin_res['spent'] or 0
    progress = fin_res['progress'] or 0
    utilization = (spent / budget * 100) if budget > 0 else 0
    
    # Data Confidence
    cursor.execute("SELECT AVG(data_confidence) as avg_confidence FROM projects WHERE manager_id = %s", (user_id,))
    conf_res = cursor.fetchone()
    data_quality = conf_res['avg_confidence'] or 0
    
    # SDG Score
    cursor.execute("""
        SELECT AVG(ss.score) as avg_sdg 
        FROM sdg_scores ss 
        JOIN projects p ON ss.project_id = p.id 
        WHERE p.manager_id = %s
    """, (user_id,))
    sdg_res = cursor.fetchone()
    avg_sdg = sdg_res['avg_sdg'] or 0
    
    cursor.close()
    conn.close()
    
    return jsonify({
        'success': True,
        'data': {
            'total_projects': total,
            'active_projects': active,
            'completed_projects': completed,
            'delayed_projects': delayed,
            'avg_sdg': round(avg_sdg, 1),
            'budget_utilization': round(utilization, 1),
            'total_budget': budget,
            'total_spent': spent,
            'avg_progress': round(progress, 1),
            'data_quality': round(data_quality, 1)
        }
    })

@officer_api_bp.route('/projects')
@role_required('OFFICER')
def get_projects():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT p.id, p.project_name, p.status, p.priority, p.expected_completion as dueDate, p.start_date as startDate,
               p.reported_progress as progress, p.risk_level, p.location, d.name as department
        FROM projects p
        JOIN project_assignments pa ON p.id = pa.project_id
        LEFT JOIN departments d ON p.department_id = d.id
        WHERE pa.officer_id = ?
        ORDER BY p.created_at DESC
    """, (user_id,))
    projects = cursor.fetchall()
    
    for p in projects:
        if p['dueDate']:
            p['dueDate'] = str(p['dueDate'])
        if p['startDate']:
            p['startDate'] = str(p['startDate'])
        
    cursor.close()
    conn.close()
    
    return jsonify({'success': True, 'data': projects})

@officer_api_bp.route('/projects/<int:project_id>')
@role_required('OFFICER')
def get_project_details(project_id):
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Verify assignment
    cursor.execute("SELECT * FROM project_assignments WHERE project_id = ? AND officer_id = ?", (project_id, user_id))
    if not cursor.fetchone():
        cursor.close(); conn.close()
        return jsonify({'success': False, 'message': 'Project not found or not authorized'}), 403

    cursor.execute("""
        SELECT p.id, p.project_name, p.description, p.status, p.priority, p.expected_completion as dueDate, p.start_date as startDate,
               p.reported_progress as progress, p.risk_level, p.location, p.budget, d.name as department
        FROM projects p
        LEFT JOIN departments d ON p.department_id = d.id
        WHERE p.id = ?
    """, (project_id,))
    project = cursor.fetchone()
    
    # fetch related inspections
    cursor.execute("SELECT * FROM inspections WHERE project_id = ?", (project_id,))
    inspections = cursor.fetchall()

    # fetch related requests
    cursor.execute("SELECT * FROM citizen_requests WHERE project_id = ?", (project_id,))
    requests = cursor.fetchall()
    
    # fetch kpis
    cursor.execute("SELECT k.*, pk.id as pk_id FROM kpis k JOIN project_kpis pk ON k.id = pk.kpi_id WHERE pk.project_id = ?", (project_id,))
    kpis = cursor.fetchall()
    
    cursor.close(); conn.close()
    
    if project:
        project['inspections'] = inspections
        project['requests'] = requests
        project['kpis'] = kpis
        return jsonify({'success': True, 'data': project})
    return jsonify({'success': False, 'message': 'Not found'}), 404

@officer_api_bp.route('/projects/<int:project_id>/progress', methods=['PUT'])
@role_required('OFFICER')
def update_project_progress(project_id):
    user_id = session['user_id']
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Verify assignment
        cursor.execute("SELECT * FROM project_assignments WHERE project_id = ? AND officer_id = ?", (project_id, user_id))
        if not cursor.fetchone():
            return jsonify({'success': False, 'message': 'Not authorized'}), 403
            
        new_progress = data.get('progress')
        status = data.get('status')
        comment = data.get('comment')
        
        if new_progress is None or not (0 <= float(new_progress) <= 100):
            return jsonify({'success': False, 'message': 'Invalid progress value'}), 400
            
        # Update progress
        cursor.execute("UPDATE projects SET reported_progress = ?, status = COALESCE(?, status) WHERE id = ?", (float(new_progress), status, project_id))
        
        # Audit
        cursor.execute("INSERT INTO audit_logs (user_id, action, entity, entity_id, new_value) VALUES (?, 'UPDATE_PROGRESS', 'Project', ?, ?)",
            (user_id, project_id, f"Progress updated to {new_progress}%. Comment: {comment}"))
            
        conn.commit()
        return jsonify({'success': True, 'message': 'Progress updated'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close(); conn.close()

@officer_api_bp.route('/pending_actions')
@role_required('OFFICER')
def get_pending_actions():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    actions = []
    
    # 1. KPIs requiring update (e.g., current_value is 0)
    cursor.execute("""
        SELECT COUNT(*) as cnt FROM project_kpis pk 
        JOIN projects p ON pk.project_id = p.id 
        WHERE p.manager_id = %s AND pk.current_value = 0
    """, (user_id,))
    kpi_count = cursor.fetchone()['cnt']
    if kpi_count > 0:
        actions.append({'type': 'KPI', 'count': kpi_count, 'message': f'{kpi_count} KPI Updates Required'})
        
    # 2. Pending Inspections
    cursor.execute("""
        SELECT COUNT(*) as cnt FROM field_inspections fi 
        JOIN projects p ON fi.project_id = p.id 
        WHERE p.manager_id = %s AND fi.status = 'Pending'
    """, (user_id,))
    insp_count = cursor.fetchone()['cnt']
    if insp_count > 0:
        actions.append({'type': 'Inspection', 'count': insp_count, 'message': f'{insp_count} Inspections Pending'})
        
    # 3. Discrepancies (Reported vs Verified)
    cursor.execute("""
        SELECT COUNT(*) as cnt FROM projects 
        WHERE manager_id = %s AND verification_status = 'Review Required'
    """, (user_id,))
    verif_count = cursor.fetchone()['cnt']
    if verif_count > 0:
        actions.append({'type': 'Verification', 'count': verif_count, 'message': f'{verif_count} Evidence Verification/Reviews'})
        
    # 4. Citizen Feedback Pending
    cursor.execute("""
        SELECT COUNT(*) as cnt FROM feedback f 
        JOIN projects p ON f.project_id = p.id 
        WHERE p.manager_id = %s AND f.status = 'Pending'
    """, (user_id,))
    fb_count = cursor.fetchone()['cnt']
    if fb_count > 0:
        actions.append({'type': 'Feedback', 'count': fb_count, 'message': f'{fb_count} Citizen Complaint(s) Pending'})
        
    cursor.close()
    conn.close()
    
    return jsonify({'success': True, 'data': actions})

@officer_api_bp.route('/sdg')
@role_required('OFFICER')
def get_sdg_performance():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT s.id, s.name, AVG(ss.score) as current_score, AVG(ss.gap) as gap
        FROM sdgs s
        LEFT JOIN sdg_scores ss ON s.id = ss.sdg_id
        JOIN projects p ON ss.project_id = p.id
        WHERE p.manager_id = %s
        GROUP BY s.id, s.name
        HAVING current_score IS NOT NULL
        ORDER BY s.id ASC
    """, (user_id,))
    sdgs = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    for s in sdgs:
        s['target'] = 100
        s['current_score'] = round(s['current_score'] or 0, 1)
        s['gap'] = round(s['gap'] or 0, 1)
        
        if s['current_score'] >= 80: s['status'] = 'On Track'
        elif s['current_score'] >= 60: s['status'] = 'Monitor'
        elif s['current_score'] >= 40: s['status'] = 'Moderate'
        else: s['status'] = 'Needs Improvement'
        
    return jsonify({'success': True, 'data': sdgs})

@officer_api_bp.route('/risks')
@role_required('OFFICER')
def get_risks():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT p.id as project_id, p.project_name, p.risk_score as risk_score, p.priority as risk_level, 
               'Progress/Budget Delay' as reason, p.expected_end_date as detected_date
        FROM projects p
        WHERE p.manager_id = %s AND p.risk_score > 30
        ORDER BY p.risk_score DESC LIMIT 5
    """, (user_id,))
    risks = cursor.fetchall()
    
    for r in risks:
        r['risk_score'] = round(r['risk_score'] or 0, 1)
        if r['detected_date']:
            r['detected_date'] = str(r['detected_date'])
        
    cursor.close()
    conn.close()
    return jsonify({'success': True, 'data': risks})

@officer_api_bp.route('/alerts')
@role_required('OFFICER')
def get_alerts():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT a.*, p.project_name 
        FROM alerts a
        JOIN projects p ON a.project_id = p.id
        WHERE a.is_resolved = 0 AND p.manager_id = %s
        ORDER BY a.created_at DESC LIMIT 5
    """, (user_id,))
    alerts = cursor.fetchall()
    
    cursor.close()
    conn.close()
    return jsonify({'success': True, 'data': alerts})

@officer_api_bp.route('/recommendations')
@role_required('OFFICER')
def get_recommendations():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT r.*, p.project_name 
        FROM recommendations r
        JOIN projects p ON r.project_id = p.id
        WHERE p.manager_id = %s
        ORDER BY r.created_at DESC LIMIT 5
    """, (user_id,))
    recs = cursor.fetchall()
    
    cursor.close()
    conn.close()
    return jsonify({'success': True, 'data': recs})

@officer_api_bp.route('/feedback')
@role_required('OFFICER')
def get_feedback():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT f.*, p.project_name, u.full_name as citizen_name
        FROM feedback f
        JOIN projects p ON f.project_id = p.id
        LEFT JOIN users u ON f.user_id = u.id
        WHERE p.manager_id = %s AND f.status = 'Pending'
        ORDER BY f.created_at DESC LIMIT 5
    """, (user_id,))
    feedbacks = cursor.fetchall()
    
    cursor.close()
    conn.close()
    return jsonify({'success': True, 'data': feedbacks})

@officer_api_bp.route('/requests')
@role_required('OFFICER')
def get_requests():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT cr.id, cr.request_id_code, cr.title, cr.category as service, cr.priority, 
               cr.status, cr.location, cr.created_at, cr.description,
               u.full_name as citizen_name
        FROM citizen_requests cr
        JOIN request_assignments ra ON cr.id = ra.request_id
        LEFT JOIN users u ON cr.citizen_id = u.id
        WHERE ra.officer_id = ?
        ORDER BY cr.created_at DESC
    """, (user_id,))
    requests_list = cursor.fetchall()
    
    for r in requests_list:
        if r['created_at']:
            r['created_at'] = str(r['created_at'])
            
    cursor.close()
    conn.close()
    return jsonify({'success': True, 'data': requests_list})

@officer_api_bp.route('/requests/<int:request_id>/status', methods=['PUT'])
@role_required('OFFICER')
def update_request_status(request_id):
    user_id = session['user_id']
    data = request.get_json()
    new_status = data.get('status')
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # verify assignment
        cursor.execute("SELECT * FROM request_assignments WHERE request_id = ? AND officer_id = ?", (request_id, user_id))
        if not cursor.fetchone():
            return jsonify({'success': False, 'message': 'Not authorized'}), 403
            
        cursor.execute("UPDATE citizen_requests SET status = ? WHERE id = ?", (new_status, request_id))
        
        # audit log
        cursor.execute("INSERT INTO audit_logs (user_id, action, entity, entity_id, new_value) VALUES (?, 'UPDATE_STATUS', 'Request', ?, ?)",
            (user_id, request_id, f"Status updated to {new_status}"))
            
        conn.commit()
        return jsonify({'success': True, 'message': 'Status updated'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@officer_api_bp.route('/inspections')
@role_required('OFFICER')
def get_inspections():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT i.id, i.scheduled_date as inspection_date, i.status, i.priority, i.location,
               p.project_name, cr.request_id_code, cr.title as request_title
        FROM inspections i
        LEFT JOIN projects p ON i.project_id = p.id
        LEFT JOIN citizen_requests cr ON i.request_id = cr.id
        WHERE i.officer_id = ?
        ORDER BY i.scheduled_date ASC
    """, (user_id,))
    inspections = cursor.fetchall()
    
    for ins in inspections:
        if ins['inspection_date']:
            ins['inspection_date'] = str(ins['inspection_date'])
            
    cursor.close()
    conn.close()
    return jsonify({'success': True, 'data': inspections})

@officer_api_bp.route('/inspections/<int:inspection_id>')
@role_required('OFFICER')
def get_inspection_details(inspection_id):
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT i.*, p.project_name, cr.request_id_code, cr.title as request_title
        FROM inspections i
        LEFT JOIN projects p ON i.project_id = p.id
        LEFT JOIN citizen_requests cr ON i.request_id = cr.id
        WHERE i.id = ? AND i.officer_id = ?
    """, (inspection_id, user_id))
    inspection = cursor.fetchone()
    
    if inspection:
        if inspection.get('scheduled_date'):
            inspection['scheduled_date'] = str(inspection['scheduled_date'])
        if inspection.get('created_at'):
            inspection['created_at'] = str(inspection['created_at'])
            
    cursor.close()
    conn.close()
    
    if not inspection:
        return jsonify({'success': False, 'message': 'Not found or not authorized'}), 404
        
    return jsonify({'success': True, 'data': inspection})

@officer_api_bp.route('/inspections/<int:inspection_id>/status', methods=['PUT'])
@role_required('OFFICER')
def update_inspection_status(inspection_id):
    user_id = session['user_id']
    data = request.get_json()
    new_status = data.get('status')
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM inspections WHERE id = ? AND officer_id = ?", (inspection_id, user_id))
        if not cursor.fetchone():
            return jsonify({'success': False, 'message': 'Not authorized'}), 403
            
        cursor.execute("UPDATE inspections SET status = ? WHERE id = ?", (new_status, inspection_id))
        
        cursor.execute("INSERT INTO audit_logs (user_id, action, entity, entity_id, new_value) VALUES (?, 'UPDATE_STATUS', 'Inspection', ?, ?)",
            (user_id, inspection_id, f"Status updated to {new_status}"))
            
        conn.commit()
        return jsonify({'success': True, 'message': 'Status updated'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@officer_api_bp.route('/inspections/<int:inspection_id>/observations', methods=['POST'])
@role_required('OFFICER')
def update_inspection_observations(inspection_id):
    user_id = session['user_id']
    data = request.get_json()
    issues = data.get('issues')
    remarks = data.get('remarks')
    observed_progress = data.get('observed_progress', 0)
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM inspections WHERE id = ? AND officer_id = ?", (inspection_id, user_id))
        if not cursor.fetchone():
            return jsonify({'success': False, 'message': 'Not authorized'}), 403
            
        cursor.execute("""
            UPDATE inspections 
            SET issues = ?, remarks = ?, observed_progress = ? 
            WHERE id = ?
        """, (issues, remarks, observed_progress, inspection_id))
        
        cursor.execute("INSERT INTO audit_logs (user_id, action, entity, entity_id, new_value) VALUES (?, 'ADD_OBSERVATION', 'Inspection', ?, 'Observations saved')",
            (user_id, inspection_id))
            
        conn.commit()
        return jsonify({'success': True, 'message': 'Observations saved'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@officer_api_bp.route('/kpis')
@role_required('OFFICER')
def get_kpis():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT k.id, k.name, k.description, k.unit, k.target_value, k.current_value, k.frequency, k.status, k.updated_at, p.project_name, p.id as project_id
        FROM kpis k
        JOIN projects p ON k.project_id = p.id
        JOIN project_assignments pa ON p.id = pa.project_id
        WHERE pa.officer_id = ?
        ORDER BY k.updated_at DESC
    """, (user_id,))
    kpis = cursor.fetchall()
    
    for k in kpis:
        if k['updated_at']:
            k['updated_at'] = str(k['updated_at'])
            
    cursor.close()
    conn.close()
    return jsonify({'success': True, 'data': kpis})

@officer_api_bp.route('/kpis/<int:kpi_id>/update', methods=['POST'])
@role_required('OFFICER')
def update_kpi_measurement(kpi_id):
    user_id = session['user_id']
    data = request.get_json()
    actual_value = data.get('actual_value')
    remarks = data.get('remarks')
    status = data.get('status', 'Pending')
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Verify assignment
        cursor.execute("""
            SELECT k.id FROM kpis k
            JOIN project_assignments pa ON k.project_id = pa.project_id
            WHERE k.id = ? AND pa.officer_id = ?
        """, (kpi_id, user_id))
        
        if not cursor.fetchone():
            return jsonify({'success': False, 'message': 'Not authorized to update this KPI'}), 403
            
        cursor.execute("""
            INSERT INTO kpi_measurements (kpi_id, officer_id, actual_value, remarks, status) 
            VALUES (?, ?, ?, ?, ?)
        """, (kpi_id, user_id, actual_value, remarks, status))
        
        cursor.execute("UPDATE kpis SET status = 'NEEDS UPDATE' WHERE id = ?", (kpi_id,))
        
        cursor.execute("INSERT INTO audit_logs (user_id, action, entity, entity_id, new_value) VALUES (?, 'UPDATE_KPI', 'KPI', ?, ?)",
            (user_id, kpi_id, f"Measurement submitted with status {status}"))
            
        conn.commit()
        return jsonify({'success': True, 'message': 'KPI updated successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@officer_api_bp.route('/evidence')
@role_required('OFFICER')
def get_evidence():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT e.*, p.project_name, cr.title as request_title, cr.request_id_code,
               i.id as inspection_id_num, k.name as kpi_name
        FROM evidence e
        LEFT JOIN projects p ON e.project_id = p.id
        LEFT JOIN citizen_requests cr ON e.request_id = cr.id
        LEFT JOIN field_inspections i ON e.inspection_id = i.id
        LEFT JOIN kpi_measurements km ON e.kpi_measurement_id = km.id
        LEFT JOIN kpis k ON km.kpi_id = k.id
        WHERE e.uploaded_by = ?
        ORDER BY e.created_at DESC
    """, (user_id,))
    evidence_list = cursor.fetchall()
    
    for e in evidence_list:
        if e['created_at']:
            e['created_at'] = str(e['created_at'])
            
    cursor.close()
    conn.close()
    return jsonify({'success': True, 'data': evidence_list})

@officer_api_bp.route('/evidence/context')
@role_required('OFFICER')
def get_evidence_context():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Authorized Projects
    cursor.execute("""
        SELECT p.id, p.project_name 
        FROM projects p
        JOIN project_assignments pa ON p.id = pa.project_id
        WHERE pa.officer_id = ?
    """, (user_id,))
    projects = cursor.fetchall()
    
    # Authorized Requests
    cursor.execute("""
        SELECT cr.id, cr.title, cr.request_id_code 
        FROM citizen_requests cr
        JOIN request_assignments ra ON cr.id = ra.request_id
        WHERE ra.officer_id = ?
    """, (user_id,))
    requests = cursor.fetchall()
    
    # Authorized Inspections
    cursor.execute("""
        SELECT i.id, p.project_name 
        FROM inspections i
        LEFT JOIN projects p ON i.project_id = p.id
        WHERE i.officer_id = ?
    """, (user_id,))
    inspections = cursor.fetchall()
    
    # Authorized KPIs
    cursor.execute("""
        SELECT k.id, k.name, p.project_name
        FROM kpis k
        JOIN projects p ON k.project_id = p.id
        JOIN project_assignments pa ON p.id = pa.project_id
        WHERE pa.officer_id = ?
    """, (user_id,))
    kpis = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return jsonify({
        'success': True, 
        'data': {
            'projects': projects,
            'requests': requests,
            'inspections': inspections,
            'kpis': kpis
        }
    })

@officer_api_bp.route('/evidence', methods=['POST'])
@role_required('OFFICER')
def upload_evidence():
    user_id = session['user_id']
    context_type = request.form.get('context_type')
    related_id = request.form.get('related_id')
    description = request.form.get('description', '')
    
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file provided'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No selected file'}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Check authorization based on context_type
        if context_type == 'Project':
            cursor.execute("SELECT project_id FROM project_assignments WHERE project_id = ? AND officer_id = ?", (related_id, user_id))
            if not cursor.fetchone():
                return jsonify({'success': False, 'message': 'Not authorized for this project'}), 403
                
        elif context_type == 'Request':
            cursor.execute("SELECT request_id FROM request_assignments WHERE request_id = ? AND officer_id = ?", (related_id, user_id))
            if not cursor.fetchone():
                return jsonify({'success': False, 'message': 'Not authorized for this request'}), 403
                
        elif context_type == 'Inspection':
            cursor.execute("SELECT id FROM inspections WHERE id = ? AND officer_id = ?", (related_id, user_id))
            if not cursor.fetchone():
                return jsonify({'success': False, 'message': 'Not authorized for this inspection'}), 403
                
        elif context_type == 'KPI':
            cursor.execute("""
                SELECT k.id FROM kpis k
                JOIN project_assignments pa ON k.project_id = pa.project_id
                WHERE k.id = ? AND pa.officer_id = ?
            """, (related_id, user_id))
            if not cursor.fetchone():
                return jsonify({'success': False, 'message': 'Not authorized for this KPI'}), 403
        else:
            return jsonify({'success': False, 'message': 'Invalid context type'}), 400

        # Save file
        filename = secure_filename(file.filename)
        upload_folder = current_app.config.get('UPLOAD_FOLDER_EVIDENCE', os.path.join(current_app.root_path, 'static', 'uploads', 'evidence'))
        os.makedirs(upload_folder, exist_ok=True)
        filepath = os.path.join(upload_folder, filename)
        file.save(filepath)
        
        db_filepath = f"/uploads/evidence/{filename}"
        
        # Prepare insert params
        proj_id = related_id if context_type == 'Project' else None
        req_id = related_id if context_type == 'Request' else None
        insp_id = related_id if context_type == 'Inspection' else None
        kpi_id = None
        
        if context_type == 'KPI':
            # Create a pending KPI measurement first
            cursor.execute("""
                INSERT INTO kpi_measurements (kpi_id, officer_id, remarks, status) 
                VALUES (?, ?, ?, 'Pending')
            """, (related_id, user_id, description))
            kpi_id = cursor.lastrowid
            
        file_ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
        file_type = 'IMAGE' if file_ext in ['jpg', 'jpeg', 'png', 'webp', 'gif'] else 'DOCUMENT'

        cursor.execute("""
            INSERT INTO evidence (
                file_name, file_path, file_type, uploaded_by, 
                project_id, request_id, inspection_id, kpi_measurement_id, 
                status, verification_note
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING VERIFICATION', ?)
        """, (filename, db_filepath, file_type, user_id, proj_id, req_id, insp_id, kpi_id, description))
        
        ev_id = cursor.lastrowid
        
        cursor.execute("INSERT INTO audit_logs (user_id, action, entity, entity_id, new_value) VALUES (?, 'UPLOAD_EVIDENCE', 'Evidence', ?, 'Uploaded')",
            (user_id, ev_id))
            
        conn.commit()
        return jsonify({'success': True, 'message': 'Evidence uploaded successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@officer_api_bp.route('/project-performance')
@role_required('OFFICER')
def get_project_performance():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Fetch assigned projects
    cursor.execute("""
        SELECT p.id, p.project_name, p.status, p.priority, p.expected_completion as due_date, 
               p.start_date, p.reported_progress, d.name as department
        FROM projects p
        JOIN project_assignments pa ON p.id = pa.project_id
        LEFT JOIN departments d ON p.department_id = d.id
        WHERE pa.officer_id = ?
    """, (user_id,))
    projects = cursor.fetchall()
    
    for p in projects:
        proj_id = p['id']
        
        # KPIs
        cursor.execute("""
            SELECT COUNT(*) as total,
                   SUM(CASE WHEN status = 'Active' OR status = 'Approved' THEN 1 ELSE 0 END) as approved,
                   SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
                   SUM(CASE WHEN status = 'NEEDS UPDATE' THEN 1 ELSE 0 END) as needs_update
            FROM kpis WHERE project_id = ?
        """, (proj_id,))
        kpi_stats = cursor.fetchone()
        
        # Compute KPI achievement (naive average of actual/target for this project)
        cursor.execute("""
            SELECT AVG(CAST(current_value AS FLOAT) / CAST(target_value AS FLOAT)) as ach
            FROM kpis 
            WHERE project_id = ? AND target_value IS NOT NULL AND target_value > 0
        """, (proj_id,))
        ach_row = cursor.fetchone()
        kpi_achievement = min((ach_row['ach'] or 0) * 100, 100) if ach_row else 0
        
        # Milestones
        cursor.execute("""
            SELECT COUNT(*) as total,
                   SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
                   SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
                   SUM(CASE WHEN expected_date < date('now') AND status != 'Completed' THEN 1 ELSE 0 END) as overdue
            FROM project_milestones WHERE project_id = ?
        """, (proj_id,))
        ms_stats = cursor.fetchone()
        
        # Inspections
        cursor.execute("""
            SELECT COUNT(*) as total,
                   SUM(CASE WHEN status = 'Verified' OR status = 'Completed' THEN 1 ELSE 0 END) as completed,
                   SUM(CASE WHEN status = 'Pending Verification' OR status = 'Scheduled' THEN 1 ELSE 0 END) as pending
            FROM inspections WHERE project_id = ?
        """, (proj_id,))
        ins_stats = cursor.fetchone()
        
        # Evidence
        cursor.execute("""
            SELECT COUNT(*) as total,
                   SUM(CASE WHEN status = 'VERIFIED' OR status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
                   SUM(CASE WHEN status = 'REJECTED' OR status = 'REPLACEMENT_REQUIRED' THEN 1 ELSE 0 END) as rejected,
                   SUM(CASE WHEN status = 'PENDING VERIFICATION' THEN 1 ELSE 0 END) as pending
            FROM evidence WHERE project_id = ?
        """, (proj_id,))
        ev_stats = cursor.fetchone()
        
        # Requests
        cursor.execute("""
            SELECT COUNT(*) as total,
                   SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
                   SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress
            FROM citizen_requests WHERE project_id = ?
        """, (proj_id,))
        req_stats = cursor.fetchone()
        
        p['kpis'] = kpi_stats
        p['kpi_achievement'] = round(kpi_achievement, 1)
        p['milestones'] = ms_stats
        p['inspections'] = ins_stats
        p['evidence'] = ev_stats
        p['requests'] = req_stats
        
        # Calculate overall performance score
        prog = float(p['reported_progress'] or 0)
        if p['kpis'] and p['kpis']['total'] and p['kpis']['total'] > 0:
            p['performance_score'] = round((prog * 0.4) + (kpi_achievement * 0.6), 1)
        else:
            p['performance_score'] = round(prog, 1)
            
        # Determine "Needs Attention" flags
        attention_reasons = []
        if ms_stats and ms_stats['overdue'] and ms_stats['overdue'] > 0:
            attention_reasons.append(f"{ms_stats['overdue']} overdue milestones")
        if ev_stats and ev_stats['rejected'] and ev_stats['rejected'] > 0:
            attention_reasons.append(f"{ev_stats['rejected']} rejected evidence submissions")
        if p['kpis'] and p['kpis']['needs_update'] and p['kpis']['needs_update'] > 0:
            attention_reasons.append(f"{p['kpis']['needs_update']} KPIs need updating")
            
        p['needs_attention'] = len(attention_reasons) > 0
        p['attention_reasons'] = attention_reasons

    cursor.close()
    conn.close()
    
    return jsonify({'success': True, 'data': projects})

@officer_api_bp.route('/risk-alerts')
@role_required('OFFICER')
def get_risk_alerts():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Fetch assigned projects
    cursor.execute("""
        SELECT p.id, p.project_name, p.status, p.expected_completion as due_date, p.reported_progress
        FROM projects p
        JOIN project_assignments pa ON p.id = pa.project_id
        WHERE pa.officer_id = ?
    """, (user_id,))
    projects = cursor.fetchall()
    
    active_signatures = []
    
    # Evaluate risks
    for p in projects:
        proj_id = p['id']
        
        # 1. Project Delay
        if p['due_date'] and p['status'] != 'COMPLETED' and p['status'] != 'Completed':
            # Check if overdue
            cursor.execute("SELECT (date(?) < date('now')) as is_overdue", (p['due_date'],))
            res = cursor.fetchone()
            if res and res['is_overdue']:
                active_signatures.append({
                    'project_id': proj_id,
                    'type': 'PROJECT DELAY',
                    'level': 'HIGH',
                    'message': f"Project deadline ({p['due_date']}) has passed. Progress is at {p['reported_progress']}%."
                })
                
        # 2. KPI Underperformance
        cursor.execute("""
            SELECT name, target_value, current_value 
            FROM kpis 
            WHERE project_id = ? AND target_value IS NOT NULL AND current_value IS NOT NULL
        """, (proj_id,))
        kpis = cursor.fetchall()
        for k in kpis:
            if float(k['current_value']) < float(k['target_value']):
                active_signatures.append({
                    'project_id': proj_id,
                    'type': 'KPI UNDERPERFORMANCE',
                    'level': 'MEDIUM',
                    'message': f"KPI '{k['name']}' is underperforming. Actual: {k['current_value']}, Target: {k['target_value']}."
                })
                
        # 3. Evidence Rejected
        cursor.execute("SELECT file_name FROM evidence WHERE project_id = ? AND status = 'REJECTED'", (proj_id,))
        rejected_ev = cursor.fetchall()
        for ev in rejected_ev:
            active_signatures.append({
                'project_id': proj_id,
                'type': 'REJECTED EVIDENCE',
                'level': 'HIGH',
                'message': f"Evidence '{ev['file_name']}' was rejected and requires replacement."
            })
            
        # 4. Overdue Milestones
        cursor.execute("""
            SELECT milestone_name, expected_date 
            FROM project_milestones 
            WHERE project_id = ? AND expected_date < date('now') AND status != 'Completed'
        """, (proj_id,))
        milestones = cursor.fetchall()
        for m in milestones:
            active_signatures.append({
                'project_id': proj_id,
                'type': 'MILESTONE DELAY',
                'level': 'MEDIUM',
                'message': f"Milestone '{m['milestone_name']}' is overdue (Expected: {m['expected_date']})."
            })
            
    # Sync active signatures to `alerts` table
    if projects:
        project_ids = [p['id'] for p in projects]
        placeholders = ','.join(['?']*len(project_ids))
        cursor.execute(f"SELECT id, project_id, message FROM alerts WHERE is_resolved = 0 AND project_id IN ({placeholders})", project_ids)
        existing_active = cursor.fetchall()
        
        existing_map = {(a['project_id'], a['message']): a['id'] for a in existing_active}
        
        # Insert new active
        for sig in active_signatures:
            key = (sig['project_id'], sig['message'])
            if key not in existing_map:
                cursor.execute("""
                    INSERT INTO alerts (project_id, alert_type, level, message, is_resolved)
                    VALUES (?, ?, ?, ?, 0)
                """, (sig['project_id'], sig['type'], sig['level'], sig['message']))
                
        # Resolve those that are no longer in active_signatures
        active_keys = set((sig['project_id'], sig['message']) for sig in active_signatures)
        for key, alert_id in existing_map.items():
            if key not in active_keys:
                cursor.execute("""
                    UPDATE alerts SET is_resolved = 1, resolved_at = CURRENT_TIMESTAMP WHERE id = ?
                """, (alert_id,))
                
        conn.commit()
    
    # Finally, fetch all alerts (active and resolved) for the officer's projects
    if projects:
        cursor.execute(f"""
            SELECT a.id, a.project_id, p.project_name, a.alert_type as type, a.level as severity, 
                   a.message as description, a.is_resolved, a.created_at as detected_at, a.resolved_at
            FROM alerts a
            JOIN projects p ON a.project_id = p.id
            WHERE p.id IN ({placeholders})
            ORDER BY a.is_resolved ASC, a.created_at DESC
        """, project_ids)
        alerts = cursor.fetchall()
    else:
        alerts = []
        
    cursor.close()
    conn.close()
    return jsonify({'success': True, 'data': alerts})


@officer_api_bp.route('/risk-alerts/<int:alert_id>/acknowledge', methods=['PATCH'])
@role_required('OFFICER')
def acknowledge_risk_alert(alert_id):
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Verify the alert belongs to a project assigned to the officer
    cursor.execute("""
        SELECT a.id, p.id as project_id 
        FROM alerts a
        JOIN projects p ON a.project_id = p.id
        JOIN project_assignments pa ON p.id = pa.project_id
        WHERE a.id = ? AND pa.officer_id = ?
    """, (alert_id, user_id))
    if not cursor.fetchone():
        cursor.close(); conn.close()
        return jsonify({'success': False, 'message': 'Alert not found or not authorized'}), 403
        
    cursor.execute("UPDATE alerts SET level = 'ACKNOWLEDGED' WHERE id = ?", (alert_id,))
    conn.commit()
    cursor.close(); conn.close()
    return jsonify({'success': True, 'message': 'Alert acknowledged'})


@officer_api_bp.route('/reports', methods=['GET'])
@role_required('OFFICER')
def get_reports():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT r.*, p.project_name, c.title as request_title, 
               f.inspection_date, f.inspection_type
        FROM inspection_reports r
        LEFT JOIN projects p ON r.project_id = p.id
        LEFT JOIN citizen_requests c ON r.request_id = c.id
        LEFT JOIN field_inspections f ON r.inspection_id = f.id
        WHERE r.officer_id = ?
        ORDER BY r.created_at DESC
    """, (user_id,))
    reports = cursor.fetchall()
    
    cursor.close()
    conn.close()
    return jsonify({'success': True, 'data': reports})


@officer_api_bp.route('/reports/<int:report_id>', methods=['GET'])
@role_required('OFFICER')
def get_report_details(report_id):
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT r.*, p.project_name, p.id as project_id, c.title as request_title, 
               f.inspection_date, f.inspection_type, f.location
        FROM inspection_reports r
        LEFT JOIN projects p ON r.project_id = p.id
        LEFT JOIN citizen_requests c ON r.request_id = c.id
        LEFT JOIN field_inspections f ON r.inspection_id = f.id
        WHERE r.id = ? AND r.officer_id = ?
    """, (report_id, user_id))
    report = cursor.fetchone()
    
    if not report:
        cursor.close(); conn.close()
        return jsonify({'success': False, 'message': 'Report not found or not authorized'}), 403
        
    cursor.execute("SELECT * FROM report_observations WHERE report_id = ?", (report_id,))
    report['observations'] = cursor.fetchall()
    
    cursor.execute("SELECT * FROM report_findings WHERE report_id = ?", (report_id,))
    report['findings'] = cursor.fetchall()
    
    cursor.execute("SELECT * FROM evidence WHERE report_id = ?", (report_id,))
    report['evidence'] = cursor.fetchall()
    
    cursor.close()
    conn.close()
    return jsonify({'success': True, 'data': report})


@officer_api_bp.route('/reports', methods=['POST'])
@role_required('OFFICER')
def create_report():
    user_id = session['user_id']
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        inspection_id = data.get('inspection_id')
        project_id = data.get('project_id')
        request_id = data.get('request_id')
        summary = data.get('summary')
        overall_result = data.get('overall_result')
        status = data.get('status', 'DRAFT')
        recommendations = data.get('recommendations') # Handle possible recommendations in summary field or dedicated field
        
        # Insert main report
        cursor.execute("""
            INSERT INTO inspection_reports 
            (inspection_id, project_id, request_id, officer_id, summary, overall_result, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (inspection_id, project_id, request_id, user_id, summary, overall_result, status))
        report_id = cursor.lastrowid
        
        # Insert observations
        observations = data.get('observations', [])
        for obs in observations:
            cursor.execute("""
                INSERT INTO report_observations (report_id, title, description, condition, severity)
                VALUES (?, ?, ?, ?, ?)
            """, (report_id, obs.get('title'), obs.get('description'), obs.get('condition'), obs.get('severity')))
            
        # Insert findings
        findings = data.get('findings', [])
        for f in findings:
            cursor.execute("""
                INSERT INTO report_findings (report_id, title, description, severity, recommended_action, responsible_department)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (report_id, f.get('title'), f.get('description'), f.get('severity'), f.get('recommended_action'), f.get('responsible_department')))
            
        conn.commit()
        return jsonify({'success': True, 'message': 'Report created successfully', 'data': {'id': report_id}})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@officer_api_bp.route('/reports/<int:report_id>', methods=['PUT'])
@role_required('OFFICER')
def update_report(report_id):
    user_id = session['user_id']
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Verify ownership
        cursor.execute("SELECT id FROM inspection_reports WHERE id = ? AND officer_id = ?", (report_id, user_id))
        if not cursor.fetchone():
            return jsonify({'success': False, 'message': 'Not authorized'}), 403
            
        summary = data.get('summary')
        overall_result = data.get('overall_result')
        status = data.get('status', 'DRAFT')
        
        cursor.execute("""
            UPDATE inspection_reports 
            SET summary = ?, overall_result = ?, status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (summary, overall_result, status, report_id))
        
        # Replace observations
        cursor.execute("DELETE FROM report_observations WHERE report_id = ?", (report_id,))
        for obs in data.get('observations', []):
            cursor.execute("""
                INSERT INTO report_observations (report_id, title, description, condition, severity)
                VALUES (?, ?, ?, ?, ?)
            """, (report_id, obs.get('title'), obs.get('description'), obs.get('condition'), obs.get('severity')))
            
        # Replace findings
        cursor.execute("DELETE FROM report_findings WHERE report_id = ?", (report_id,))
        for f in data.get('findings', []):
            cursor.execute("""
                INSERT INTO report_findings (report_id, title, description, severity, recommended_action, responsible_department)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (report_id, f.get('title'), f.get('description'), f.get('severity'), f.get('recommended_action'), f.get('responsible_department')))
            
        conn.commit()
        return jsonify({'success': True, 'message': 'Report updated successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@officer_api_bp.route('/reports/context', methods=['GET'])
@role_required('OFFICER')
def get_reports_context():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Fetch inspections assigned to officer that don't already have a report, or just all of them
    cursor.execute("""
        SELECT f.id, f.inspection_type, f.inspection_date, f.location,
               f.project_id, p.project_name
        FROM field_inspections f
        LEFT JOIN projects p ON f.project_id = p.id
        WHERE f.officer_id = ?
        ORDER BY f.inspection_date DESC
    """, (user_id,))
    inspections = cursor.fetchall()
    
    cursor.close()
    conn.close()
    return jsonify({'success': True, 'data': {'inspections': inspections}})


@officer_api_bp.route('/notifications', methods=['GET'])
@role_required('OFFICER')
def get_notifications():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT *
        FROM notifications
        WHERE user_id = ? AND archived_at IS NULL
        ORDER BY created_at DESC
    """, (user_id,))
    notifications = cursor.fetchall()
    
    cursor.close()
    conn.close()
    return jsonify({'success': True, 'data': notifications})


@officer_api_bp.route('/notifications/unread-count', methods=['GET'])
@role_required('OFFICER')
def get_unread_count():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT COUNT(*) as count
        FROM notifications
        WHERE user_id = ? AND is_read = 0 AND archived_at IS NULL
    """, (user_id,))
    result = cursor.fetchone()
    
    cursor.close()
    conn.close()
    return jsonify({'success': True, 'data': {'count': result['count']}})


@officer_api_bp.route('/notifications/<int:notification_id>/read', methods=['PATCH'])
@role_required('OFFICER')
def mark_notification_read(notification_id):
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE notifications 
        SET is_read = 1, read_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
    """, (notification_id, user_id))
    
    if cursor.rowcount == 0:
        cursor.close(); conn.close()
        return jsonify({'success': False, 'message': 'Notification not found or unauthorized'}), 404
        
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'success': True, 'message': 'Notification marked as read'})


@officer_api_bp.route('/notifications/mark-all-read', methods=['POST'])
@role_required('OFFICER')
def mark_all_read():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE notifications 
        SET is_read = 1, read_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND is_read = 0
    """, (user_id,))
    
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'success': True, 'message': 'All notifications marked as read'})


@officer_api_bp.route('/notifications/<int:notification_id>', methods=['DELETE'])
@role_required('OFFICER')
def delete_notification(notification_id):
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE notifications 
        SET archived_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
    """, (notification_id, user_id))
    
    if cursor.rowcount == 0:
        cursor.close(); conn.close()
        return jsonify({'success': False, 'message': 'Notification not found or unauthorized'}), 404
        
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'success': True, 'message': 'Notification archived'})


@officer_api_bp.route('/profile', methods=['GET'])
@role_required('OFFICER')
def get_profile():
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Fetch core profile
    cursor.execute("""
        SELECT u.id, u.username, u.full_name, u.email, u.phone, 
               u.employee_id, u.designation, u.status, u.created_at,
               d.name as department_name, d.id as department_id
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE u.id = ?
    """, (user_id,))
    profile = cursor.fetchone()
    
    if not profile:
        cursor.close(); conn.close()
        return jsonify({'success': False, 'message': 'Profile not found'}), 404
        
    # Fetch work summary
    stats = {}
    
    # 1. Projects
    cursor.execute("SELECT COUNT(*) as cnt FROM project_assignments WHERE officer_id = ?", (user_id,))
    stats['assigned_projects'] = cursor.fetchone()['cnt']
    
    # 2. Citizen Requests
    cursor.execute("SELECT COUNT(*) as cnt FROM request_assignments WHERE officer_id = ?", (user_id,))
    stats['citizen_requests'] = cursor.fetchone()['cnt']
    
    # 3. Inspections
    cursor.execute("SELECT COUNT(*) as cnt FROM inspections WHERE officer_id = ?", (user_id,))
    stats['inspections'] = cursor.fetchone()['cnt']
    
    # 4. KPIs
    cursor.execute("SELECT COUNT(*) as cnt FROM kpi_measurements WHERE officer_id = ?", (user_id,))
    stats['kpi_updates'] = cursor.fetchone()['cnt']
    
    # 5. Evidence
    cursor.execute("SELECT COUNT(*) as cnt FROM evidence WHERE uploaded_by = ?", (user_id,))
    stats['evidence'] = cursor.fetchone()['cnt']
    
    # 6. Reports (assuming the table exists, otherwise handle gracefully)
    try:
        cursor.execute("SELECT COUNT(*) as cnt FROM inspection_reports WHERE officer_id = ?", (user_id,))
        stats['reports'] = cursor.fetchone()['cnt']
    except Exception:
        stats['reports'] = 0
        
    # 7. Risk Alerts (Joined through projects)
    cursor.execute("""
        SELECT COUNT(a.id) as cnt 
        FROM alerts a
        JOIN project_assignments pa ON a.project_id = pa.project_id
        WHERE pa.officer_id = ? AND a.is_resolved = 0
    """, (user_id,))
    stats['risks'] = cursor.fetchone()['cnt']
    
    profile['stats'] = stats
    
    cursor.close()
    conn.close()
    return jsonify({'success': True, 'data': profile})


@officer_api_bp.route('/profile', methods=['PUT'])
@role_required('OFFICER')
def update_profile():
    user_id = session['user_id']
    data = request.json
    
    full_name = data.get('full_name')
    phone = data.get('phone')
    email = data.get('email')
    
    if not full_name:
        return jsonify({'success': False, 'message': 'Full name is required'}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check email uniqueness if email changed
        cursor.execute("SELECT id FROM users WHERE email = ? AND id != ?", (email, user_id))
        if cursor.fetchone():
            return jsonify({'success': False, 'message': 'Email is already in use by another account'}), 400
            
        cursor.execute("""
            UPDATE users 
            SET full_name = ?, phone = ?, email = ?
            WHERE id = ?
        """, (full_name, phone, email, user_id))
        
        conn.commit()
        
        # Update session
        session['full_name'] = full_name
        
        return jsonify({'success': True, 'message': 'Profile updated successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@officer_api_bp.route('/profile/password', methods=['POST'])
@role_required('OFFICER')
def update_password():
    from werkzeug.security import check_password_hash, generate_password_hash
    
    user_id = session['user_id']
    data = request.json
    
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    if not current_password or not new_password:
        return jsonify({'success': False, 'message': 'Current and new passwords are required'}), 400
        
    if len(new_password) < 6:
        return jsonify({'success': False, 'message': 'New password must be at least 6 characters long'}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT password_hash FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        
        if not user or not check_password_hash(user['password_hash'], current_password):
            return jsonify({'success': False, 'message': 'Incorrect current password'}), 400
            
        hashed_pwd = generate_password_hash(new_password)
        cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", (hashed_pwd, user_id))
        conn.commit()
        
        return jsonify({'success': True, 'message': 'Password updated successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


