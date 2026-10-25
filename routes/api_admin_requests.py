from flask import Blueprint, jsonify, request, session
from config import get_db_connection
from routes.utils import role_required
import datetime

api_admin_requests_bp = Blueprint('api_admin_requests', __name__)

@api_admin_requests_bp.route('', methods=['GET'])
@role_required('ADMIN')
def get_all_requests():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    query = """
        SELECT cr.*, u.full_name as citizen_name, u.email as citizen_email,
               a.officer_id, off.full_name as officer_name
        FROM citizen_requests cr
        LEFT JOIN users u ON cr.citizen_id = u.id
        LEFT JOIN request_assignments a ON cr.id = a.request_id
        LEFT JOIN users off ON a.officer_id = off.id
        ORDER BY cr.created_at DESC
    """
    cursor.execute(query)
    requests = cursor.fetchall()
    
    # Calculate overview stats
    total = len(requests)
    new_req = sum(1 for r in requests if r['status'] == 'SUBMITTED')
    assigned = sum(1 for r in requests if r['status'] == 'ASSIGNED')
    in_progress = sum(1 for r in requests if r['status'] == 'IN_PROGRESS')
    resolved = sum(1 for r in requests if r['status'] == 'RESOLVED')
    overdue = sum(1 for r in requests if r['status'] not in ('RESOLVED', 'CLOSED') and r['priority'] == 'Urgent') # simplified overdue calculation for demo
    
    stats = {
        'total': total,
        'new': new_req,
        'assigned': assigned,
        'in_progress': in_progress,
        'resolved': resolved,
        'overdue': overdue
    }
    
    cursor.close()
    conn.close()
    
    return jsonify({
        'success': True, 
        'data': requests,
        'stats': stats
    })

@api_admin_requests_bp.route('/<int:req_id>', methods=['GET'])
@role_required('ADMIN')
def get_request_details(req_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT cr.*, u.full_name as citizen_name, u.email as citizen_email, u.phone as citizen_phone,
               a.officer_id, off.full_name as officer_name, d.name as department_name
        FROM citizen_requests cr
        LEFT JOIN users u ON cr.citizen_id = u.id
        LEFT JOIN request_assignments a ON cr.id = a.request_id
        LEFT JOIN users off ON a.officer_id = off.id
        LEFT JOIN departments d ON cr.department_id = d.id
        WHERE cr.id = ?
    """, (req_id,))
    req = cursor.fetchone()
    
    if not req:
        return jsonify({'success': False, 'message': 'Request not found'}), 404
        
    # Get timeline updates
    cursor.execute("""
        SELECT ru.*, u.full_name as author_name, r.name as author_role
        FROM request_updates ru
        LEFT JOIN users u ON ru.user_id = u.id
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE ru.request_id = ?
        ORDER BY ru.created_at DESC
    """, (req_id,))
    timeline = cursor.fetchall()
    
    req['timeline'] = timeline
    
    cursor.close()
    conn.close()
    
    return jsonify({'success': True, 'data': req})

@api_admin_requests_bp.route('/<int:req_id>/assign', methods=['POST'])
@role_required('ADMIN')
def assign_officer(req_id):
    data = request.get_json()
    officer_id = data.get('officer_id')
    
    if not officer_id:
        return jsonify({'success': False, 'message': 'Officer ID is required'}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Check if already assigned
        cursor.execute("SELECT id FROM request_assignments WHERE request_id = ?", (req_id,))
        existing = cursor.fetchone()
        
        if existing:
            cursor.execute("UPDATE request_assignments SET officer_id = ?, assigned_at = CURRENT_TIMESTAMP WHERE request_id = ?", (officer_id, req_id))
        else:
            cursor.execute("INSERT INTO request_assignments (request_id, officer_id) VALUES (?, ?)", (req_id, officer_id))
            
        # Update status and department
        cursor.execute("SELECT department_id FROM users WHERE id = ?", (officer_id,))
        officer_data = cursor.fetchone()
        if officer_data and officer_data['department_id']:
            cursor.execute("UPDATE citizen_requests SET status = 'ASSIGNED', department_id = ? WHERE id = ?", (officer_data['department_id'], req_id))
        else:
            cursor.execute("UPDATE citizen_requests SET status = 'ASSIGNED' WHERE id = ?", (req_id,))
        
        # Log to timeline
        admin_id = session.get('user_id')
        cursor.execute("""
            INSERT INTO request_updates (request_id, user_id, status_change, remarks) 
            VALUES (?, ?, 'ASSIGNED', 'Assigned to officer')
        """, (req_id, admin_id))
        
        # Audit log
        cursor.execute("""
            INSERT INTO audit_logs (user_id, action, entity, entity_id, new_value)
            VALUES (?, 'ASSIGN_OFFICER', 'CitizenRequests', ?, ?)
        """, (admin_id, req_id, f"Officer ID: {officer_id}"))
        
        conn.commit()
        return jsonify({'success': True, 'message': 'Officer assigned successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@api_admin_requests_bp.route('/<int:req_id>/status', methods=['PATCH'])
@role_required('ADMIN') # Note: Realistically, officers should also have an endpoint. We will relax this or use a different endpoint for officers.
def update_status(req_id):
    data = request.get_json()
    new_status = data.get('status')
    remarks = data.get('remarks', '')
    evidence_path = data.get('evidence_path', None)
    
    if not new_status:
        return jsonify({'success': False, 'message': 'Status is required'}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("UPDATE citizen_requests SET status = ? WHERE id = ?", (new_status, req_id))
        
        user_id = session.get('user_id')
        cursor.execute("""
            INSERT INTO request_updates (request_id, user_id, status_change, remarks, evidence_path) 
            VALUES (?, ?, ?, ?, ?)
        """, (req_id, user_id, new_status, remarks, evidence_path))
        
        conn.commit()
        return jsonify({'success': True, 'message': 'Status updated successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@api_admin_requests_bp.route('/<int:req_id>/notes', methods=['POST'])
@role_required('ADMIN')
def add_note(req_id):
    data = request.get_json()
    note = data.get('note')
    
    if not note:
        return jsonify({'success': False, 'message': 'Note is required'}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        admin_id = session.get('user_id')
        cursor.execute("""
            INSERT INTO request_updates (request_id, user_id, remarks) 
            VALUES (?, ?, ?)
        """, (req_id, admin_id, f"[INTERNAL NOTE] {note}"))
        
        conn.commit()
        return jsonify({'success': True, 'message': 'Note added successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@api_admin_requests_bp.route('/<int:req_id>/verify', methods=['POST'])
@role_required('ADMIN')
def verify_request(req_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE citizen_requests SET status = 'VERIFIED' WHERE id = ?", (req_id,))
        user_id = session.get('user_id')
        cursor.execute("INSERT INTO request_updates (request_id, user_id, status_change, remarks) VALUES (?, ?, 'VERIFIED', 'Authority verified report')", (req_id, user_id))
        conn.commit()
        return jsonify({'success': True, 'message': 'Request verified successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@api_admin_requests_bp.route('/<int:req_id>/reject', methods=['POST'])
@role_required('ADMIN')
def reject_request(req_id):
    data = request.get_json()
    reason = data.get('reason')
    if not reason:
        return jsonify({'success': False, 'message': 'Rejection reason is required.'}), 400
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE citizen_requests SET status = 'REJECTED' WHERE id = ?", (req_id,))
        user_id = session.get('user_id')
        cursor.execute("INSERT INTO request_updates (request_id, user_id, status_change, remarks) VALUES (?, ?, 'REJECTED', ?)", (req_id, user_id, reason))
        conn.commit()
        return jsonify({'success': True, 'message': 'Request rejected successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@api_admin_requests_bp.route('/<int:req_id>/assign-department', methods=['POST'])
@role_required('ADMIN')
def assign_department(req_id):
    data = request.get_json()
    dept_id = data.get('department_id')
    sla = data.get('sla_days', 7)
    if not dept_id:
        return jsonify({'success': False, 'message': 'Department ID is required'}), 400
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Calculate expected completion date
        import datetime
        expected_comp = datetime.datetime.now() + datetime.timedelta(days=int(sla))
        
        cursor.execute("UPDATE citizen_requests SET status = 'DEPARTMENT_ASSIGNED', department_id = ?, sla_days = ?, expected_completion_date = ? WHERE id = ?", 
                      (dept_id, sla, expected_comp.strftime('%Y-%m-%d %H:%M:%S'), req_id))
        user_id = session.get('user_id')
        cursor.execute("INSERT INTO request_updates (request_id, user_id, status_change, remarks) VALUES (?, ?, 'DEPARTMENT_ASSIGNED', 'Assigned to department')", (req_id, user_id))
        conn.commit()
        return jsonify({'success': True, 'message': 'Department assigned successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@api_admin_requests_bp.route('/<int:req_id>/escalate', methods=['POST'])
@role_required('ADMIN')
def escalate_request(req_id):
    data = request.get_json()
    level = data.get('level', 1)
    reason = data.get('reason', 'Manual escalation')
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        user_id = session.get('user_id')
        cursor.execute("UPDATE citizen_requests SET status = 'ESCALATED' WHERE id = ?", (req_id,))
        cursor.execute("INSERT INTO request_updates (request_id, user_id, status_change, remarks) VALUES (?, ?, 'ESCALATED', ?)", (req_id, user_id, reason))
        
        # log to escalations table
        cursor.execute("INSERT INTO report_escalations (request_id, escalation_level, trigger_reason, escalated_by) VALUES (?, ?, ?, ?)", 
                       (req_id, level, reason, user_id))
        
        conn.commit()
        return jsonify({'success': True, 'message': 'Request escalated successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@api_admin_requests_bp.route('/<int:req_id>/verify-completion', methods=['POST'])
@role_required('ADMIN')
def verify_completion(req_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE citizen_requests SET status = 'RESOLVED', progress_percentage = 100, actual_completion_date = CURRENT_TIMESTAMP WHERE id = ?", (req_id,))
        user_id = session.get('user_id')
        cursor.execute("INSERT INTO request_updates (request_id, user_id, status_change, remarks) VALUES (?, ?, 'RESOLVED', 'Completion verified by authority')", (req_id, user_id))
        
        # also update completion_verifications
        cursor.execute("UPDATE completion_verifications SET verification_status = 'APPROVED', verified_by_admin_id = ?, verified_at = CURRENT_TIMESTAMP WHERE request_id = ? AND verification_status = 'PENDING'", (user_id, req_id))
        
        conn.commit()
        return jsonify({'success': True, 'message': 'Completion verified successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@api_admin_requests_bp.route('/<int:req_id>/reject-completion', methods=['POST'])
@role_required('ADMIN')
def reject_completion(req_id):
    data = request.get_json()
    reason = data.get('reason')
    if not reason:
        return jsonify({'success': False, 'message': 'Rejection reason is required.'}), 400
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE citizen_requests SET status = 'IN_PROGRESS' WHERE id = ?", (req_id,))
        user_id = session.get('user_id')
        cursor.execute("INSERT INTO request_updates (request_id, user_id, status_change, remarks) VALUES (?, ?, 'IN_PROGRESS', ?)", (req_id, user_id, f"Completion rejected: {reason}"))
        
        # update verification record
        cursor.execute("UPDATE completion_verifications SET verification_status = 'REJECTED', admin_remarks = ?, verified_by_admin_id = ?, verified_at = CURRENT_TIMESTAMP WHERE request_id = ? AND verification_status = 'PENDING'", (reason, user_id, req_id))
        
        conn.commit()
        return jsonify({'success': True, 'message': 'Completion rejected successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
