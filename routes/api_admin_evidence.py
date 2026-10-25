from flask import Blueprint, jsonify, request, session
from config import get_db_connection

api_admin_evidence_bp = Blueprint('api_admin_evidence', __name__)

@api_admin_evidence_bp.route('/statistics', methods=['GET'])
def get_statistics():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT status, COUNT(*) as count
        FROM evidence
        GROUP BY status
    """)
    rows = cursor.fetchall()
    
    # Also get recently submitted count
    cursor.execute("SELECT COUNT(*) as count FROM evidence WHERE created_at >= date('now', '-7 days')")
    recent = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    stats = {
        'total': 0,
        'pending': 0,
        'verified': 0,
        'rejected': 0,
        'replacement_required': 0,
        'recently_submitted': recent['count'] if recent else 0
    }
    for row in rows:
        status = row['status'].lower()
        stats['total'] += row['count']
        if status in stats:
            stats[status] = row['count']
            
    return jsonify({'success': True, 'data': stats})

@api_admin_evidence_bp.route('', methods=['GET'])
def get_evidence():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    status_filter = request.args.get('status')
    
    query = """
        SELECT e.*, 
               u.full_name as submitter_name, r.name as submitter_role, u.department_id as submitter_dept,
               p.project_name, 
               p.priority as project_priority,
               i.id as inspection_id,
               cr.id as citizen_request_id
        FROM evidence e
        LEFT JOIN users u ON e.uploaded_by = u.id
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN projects p ON e.project_id = p.id
        LEFT JOIN field_inspections i ON e.inspection_id = i.id
        LEFT JOIN feedback cr ON e.request_id = cr.id
    """
    params = []
    
    if status_filter:
        query += " WHERE e.status = ?"
        params.append(status_filter)
        
    query += " ORDER BY e.created_at DESC"
    
    cursor.execute(query, params)
    evidence_list = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return jsonify({'success': True, 'data': evidence_list})

@api_admin_evidence_bp.route('/<int:id>', methods=['GET'])
def get_evidence_detail(id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT e.*, 
               u.full_name as submitter_name, r.name as submitter_role, u.department_id as submitter_dept,
               v.full_name as verified_by_name,
               p.project_name, d.name as project_department, p.status as project_status,
               i.id as inspection_id, i.status as inspection_status,
               cr.category as request_category, cr.status as request_status
        FROM evidence e
        LEFT JOIN users u ON e.uploaded_by = u.id
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN users v ON e.verified_by = v.id
        LEFT JOIN projects p ON e.project_id = p.id
        LEFT JOIN departments d ON p.department_id = d.id
        LEFT JOIN field_inspections i ON e.inspection_id = i.id
        LEFT JOIN feedback cr ON e.request_id = cr.id
        WHERE e.id = ?
    """, (id,))
    evidence = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if evidence:
        return jsonify({'success': True, 'data': evidence})
    return jsonify({'success': False, 'message': 'Evidence not found'}), 404

@api_admin_evidence_bp.route('/<int:id>/history', methods=['GET'])
def get_evidence_history(id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT h.*, u.full_name as submitter_name
        FROM evidence_history h
        LEFT JOIN users u ON h.uploaded_by = u.id
        WHERE h.evidence_id = ?
        ORDER BY h.version DESC, h.created_at DESC
    """, (id,))
    history = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return jsonify({'success': True, 'data': history})

@api_admin_evidence_bp.route('/<int:id>/verify', methods=['POST'])
def verify_evidence(id):
    data = request.get_json() or {}
    note = data.get('verification_note', '')
    user_id = session.get('user_id')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Check current status
        cursor.execute("SELECT status FROM evidence WHERE id = ?", (id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({'success': False, 'message': 'Evidence not found'}), 404
            
        previous_status = row[0]
        
        # Update status
        cursor.execute("""
            UPDATE evidence 
            SET status = 'VERIFIED', verification_note = ?, verified_by = ?, verified_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        """, (note, user_id, id))
        
        # Add to audit log
        if user_id:
            cursor.execute("""
                INSERT INTO audit_logs (user_id, action, module, record_id, previous_value, new_value)
                VALUES (?, 'VERIFY_EVIDENCE', 'EvidenceVerification', ?, ?, 'VERIFIED')
            """, (user_id, id, previous_status))
            
        # Update inspection if applicable
        cursor.execute("SELECT inspection_id FROM evidence WHERE id = ?", (id,))
        inspection_row = cursor.fetchone()
        if inspection_row and inspection_row[0]:
            cursor.execute("UPDATE field_inspections SET status = 'Verified' WHERE id = ?", (inspection_row[0],))
            
        conn.commit()
        return jsonify({'success': True, 'message': 'Evidence verified successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@api_admin_evidence_bp.route('/<int:id>/reject', methods=['POST'])
def reject_evidence(id):
    data = request.get_json()
    if not data or not data.get('reason'):
        return jsonify({'success': False, 'message': 'Rejection reason is required'}), 400
        
    reason = data.get('reason')
    user_id = session.get('user_id')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT status FROM evidence WHERE id = ?", (id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({'success': False, 'message': 'Evidence not found'}), 404
            
        previous_status = row[0]
        
        cursor.execute("""
            UPDATE evidence 
            SET status = 'REJECTED', rejection_reason = ?, verified_by = ?, verified_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        """, (reason, user_id, id))
        
        if user_id:
            cursor.execute("""
                INSERT INTO audit_logs (user_id, action, module, record_id, previous_value, new_value)
                VALUES (?, 'REJECT_EVIDENCE', 'EvidenceVerification', ?, ?, 'REJECTED')
            """, (user_id, id, previous_status))
            
        conn.commit()
        return jsonify({'success': True, 'message': 'Evidence rejected successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@api_admin_evidence_bp.route('/<int:id>/request-replacement', methods=['POST'])
def request_replacement(id):
    data = request.get_json()
    if not data or not data.get('reason'):
        return jsonify({'success': False, 'message': 'Reason is required'}), 400
        
    reason = data.get('reason')
    user_id = session.get('user_id')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT status, file_path, uploaded_by FROM evidence WHERE id = ?", (id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({'success': False, 'message': 'Evidence not found'}), 404
            
        previous_status = row[0]
        file_path = row[1]
        uploaded_by = row[2]
        
        # Save current version to history
        cursor.execute("SELECT MAX(version) FROM evidence_history WHERE evidence_id = ?", (id,))
        max_ver = cursor.fetchone()[0] or 0
        new_ver = max_ver + 1
        
        cursor.execute("""
            INSERT INTO evidence_history (evidence_id, file_path, version, uploaded_by, status, reason)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (id, file_path, new_ver, uploaded_by, previous_status, reason))
        
        # Update main record
        cursor.execute("""
            UPDATE evidence 
            SET status = 'REPLACEMENT_REQUIRED', rejection_reason = ?, verified_by = ?, verified_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        """, (reason, user_id, id))
        
        if user_id:
            cursor.execute("""
                INSERT INTO audit_logs (user_id, action, module, record_id, previous_value, new_value)
                VALUES (?, 'REQUEST_REPLACEMENT', 'EvidenceVerification', ?, ?, 'REPLACEMENT_REQUIRED')
            """, (user_id, id, previous_status))
            
        conn.commit()
        return jsonify({'success': True, 'message': 'Replacement requested successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
