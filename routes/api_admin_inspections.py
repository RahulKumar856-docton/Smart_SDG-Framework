from flask import Blueprint, jsonify, request, session
from config import get_db_connection
from routes.utils import role_required

api_admin_inspections_bp = Blueprint('api_admin_inspections', __name__)

@api_admin_inspections_bp.route('', methods=['GET'])
@role_required('ADMIN')
def get_inspections():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    query = """
        SELECT i.*, 
               p.project_name, p.ward as project_ward,
               u.full_name as officer_name, u.department_id as officer_department,
               d.name as department_name,
               cr.title as request_title
        FROM inspections i
        LEFT JOIN projects p ON i.project_id = p.id
        LEFT JOIN users u ON i.officer_id = u.id
        LEFT JOIN departments d ON u.department_id = d.id OR i.department_id = d.id
        LEFT JOIN citizen_requests cr ON i.request_id = cr.id
        ORDER BY i.created_at DESC
    """
    cursor.execute(query)
    inspections = cursor.fetchall()
    
    total = len(inspections)
    scheduled = sum(1 for i in inspections if i['status'] == 'SCHEDULED')
    in_progress = sum(1 for i in inspections if i['status'] == 'IN_PROGRESS')
    submitted = sum(1 for i in inspections if i['status'] == 'SUBMITTED' or i['status'] == 'PENDING_VERIFICATION')
    verified = sum(1 for i in inspections if i['status'] == 'VERIFIED')
    rejected = sum(1 for i in inspections if i['status'] == 'REJECTED')
    
    # Overdue calculation (Scheduled in the past but not completed)
    import datetime
    now = datetime.datetime.now()
    overdue = 0
    for i in inspections:
        if i['status'] not in ('VERIFIED', 'CANCELLED', 'REJECTED') and i.get('scheduled_date'):
            try:
                # Handle possible date formats in SQLite
                sched_date = datetime.datetime.fromisoformat(str(i['scheduled_date']).replace('Z', ''))
                if sched_date < now:
                    overdue += 1
            except:
                pass

    stats = {
        'total': total,
        'scheduled': scheduled,
        'in_progress': in_progress,
        'submitted': submitted,
        'verified': verified,
        'rejected': rejected,
        'overdue': overdue
    }
    
    cursor.close()
    conn.close()
    
    return jsonify({
        'success': True,
        'data': inspections,
        'stats': stats
    })

@api_admin_inspections_bp.route('/<int:id>', methods=['GET'])
@role_required('ADMIN')
def get_inspection_details(id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT i.*, 
               p.project_name, p.ward as project_ward,
               u.full_name as officer_name, u.email as officer_email,
               cr.title as request_title, cr.request_id_code
        FROM inspections i
        LEFT JOIN projects p ON i.project_id = p.id
        LEFT JOIN users u ON i.officer_id = u.id
        LEFT JOIN citizen_requests cr ON i.request_id = cr.id
        WHERE i.id = ?
    """, (id,))
    
    inspection = cursor.fetchone()
    if not inspection:
        return jsonify({'success': False, 'message': 'Inspection not found'}), 404
        
    # Get Evidence
    cursor.execute("""
        SELECT * FROM inspection_evidence
        WHERE inspection_id = ?
        ORDER BY uploaded_at DESC
    """, (id,))
    evidence = cursor.fetchall()
    inspection['evidence'] = evidence
    
    # Get timeline/audit logs
    cursor.execute("""
        SELECT al.*, u.full_name as user_name
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE record_id = ? AND module = 'FieldInspections'
        ORDER BY al.created_at DESC
    """, (str(id),))
    timeline = cursor.fetchall()
    inspection['timeline'] = timeline
    
    cursor.close()
    conn.close()
    
    return jsonify({'success': True, 'data': inspection})

@api_admin_inspections_bp.route('', methods=['POST'])
@role_required('ADMIN')
def schedule_inspection():
    data = request.get_json()
    
    project_id = data.get('project_id')
    request_id = data.get('request_id')
    officer_id = data.get('officer_id')
    scheduled_date = data.get('scheduled_date')
    location = data.get('location')
    priority = data.get('priority', 'Medium')
    inspection_type = data.get('inspection_type')
    instructions = data.get('instructions')
    
    if not officer_id or not scheduled_date:
        return jsonify({'success': False, 'message': 'Officer and Scheduled Date are required'}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Determine department based on project or officer
        cursor.execute("SELECT department_id FROM users WHERE id = ?", (officer_id,))
        dept_row = cursor.fetchone()
        department_id = dept_row[0] if dept_row else None
        
        cursor.execute("""
            INSERT INTO inspections 
            (project_id, request_id, officer_id, department_id, inspection_type, location, scheduled_date, priority, instructions, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'SCHEDULED')
        """, (project_id, request_id, officer_id, department_id, inspection_type, location, scheduled_date, priority, instructions))
        
        inspection_id = cursor.lastrowid
        
        # Log to audit_logs
        admin_id = session.get('user_id')
        cursor.execute("""
            INSERT INTO audit_logs (user_id, action, module, record_id, new_value)
            VALUES (?, 'SCHEDULE_INSPECTION', 'FieldInspections', ?, 'SCHEDULED')
        """, (admin_id, str(inspection_id)))
        
        conn.commit()
        return jsonify({'success': True, 'message': 'Inspection scheduled successfully', 'id': inspection_id})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@api_admin_inspections_bp.route('/<int:id>/verify', methods=['POST'])
@role_required('ADMIN')
def verify_inspection(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            UPDATE inspections 
            SET status = 'VERIFIED', verified_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        """, (id,))
        
        admin_id = session.get('user_id')
        cursor.execute("""
            INSERT INTO audit_logs (user_id, action, module, record_id, new_value)
            VALUES (?, 'VERIFY_INSPECTION', 'FieldInspections', ?, 'VERIFIED')
        """, (admin_id, str(id)))
        
        conn.commit()
        return jsonify({'success': True, 'message': 'Inspection verified successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@api_admin_inspections_bp.route('/<int:id>/reject', methods=['POST'])
@role_required('ADMIN')
def reject_inspection(id):
    data = request.get_json()
    reason = data.get('reason')
    
    if not reason:
        return jsonify({'success': False, 'message': 'Rejection reason is required'}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            UPDATE inspections 
            SET status = 'REJECTED', rejection_reason = ? 
            WHERE id = ?
        """, (reason, id))
        
        admin_id = session.get('user_id')
        cursor.execute("""
            INSERT INTO audit_logs (user_id, action, module, record_id, new_value)
            VALUES (?, 'REJECT_INSPECTION', 'FieldInspections', ?, ?)
        """, (admin_id, str(id), f'REJECTED: {reason}'))
        
        conn.commit()
        return jsonify({'success': True, 'message': 'Inspection rejected successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
