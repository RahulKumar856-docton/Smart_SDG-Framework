from flask import Blueprint, jsonify, request, session
from config import get_db_connection
from routes.utils import role_required
import datetime

api_admin_citizen_reports_bp = Blueprint('api_admin_citizen_reports', __name__)

@api_admin_citizen_reports_bp.route('', methods=['GET'])
@role_required('ADMIN')
def get_all_reports():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    query = """
        SELECT cr.*, u.full_name as citizen_name, u.email as citizen_email,
               off.full_name as officer_name, d.name as department_name
        FROM citizen_reports cr
        LEFT JOIN users u ON cr.citizen_id = u.id
        LEFT JOIN users off ON cr.officer_id = off.id
        LEFT JOIN departments d ON cr.department_id = d.id
        ORDER BY cr.created_at DESC
    """
    cursor.execute(query)
    reports = cursor.fetchall()
    
    stats = {
        'total': len(reports),
        'new': sum(1 for r in reports if r['status'] == 'SUBMITTED'),
        'investigation': sum(1 for r in reports if r['status'] == 'INVESTIGATION'),
        'resolved': sum(1 for r in reports if r['status'] == 'RESOLVED')
    }
    
    cursor.close()
    conn.close()
    
    return jsonify({
        'success': True, 
        'data': reports,
        'stats': stats
    })

@api_admin_citizen_reports_bp.route('/<int:report_id>', methods=['GET'])
@role_required('ADMIN')
def get_report_details(report_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT cr.*, u.full_name as citizen_name, u.email as citizen_email, u.phone as citizen_phone,
               off.full_name as officer_name, d.name as department_name
        FROM citizen_reports cr
        LEFT JOIN users u ON cr.citizen_id = u.id
        LEFT JOIN users off ON cr.officer_id = off.id
        LEFT JOIN departments d ON cr.department_id = d.id
        WHERE cr.id = ?
    """, (report_id,))
    report = cursor.fetchone()
    
    if not report:
        return jsonify({'success': False, 'message': 'Report not found'}), 404
        
    cursor.execute("""
        SELECT ru.*, u.full_name as author_name, u.role as author_role
        FROM report_updates ru
        LEFT JOIN users u ON ru.user_id = u.id
        WHERE ru.report_id = ?
        ORDER BY ru.created_at DESC
    """, (report_id,))
    timeline = cursor.fetchall()
    
    report['timeline'] = timeline
    
    cursor.close()
    conn.close()
    
    return jsonify({'success': True, 'data': report})

@api_admin_citizen_reports_bp.route('/<int:report_id>/status', methods=['PATCH'])
@role_required('ADMIN')
def update_status(report_id):
    data = request.get_json()
    new_status = data.get('status')
    remarks = data.get('remarks', '')
    evidence_path = data.get('evidence_path', None)
    
    if not new_status:
        return jsonify({'success': False, 'message': 'Status is required'}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("UPDATE citizen_reports SET status = ? WHERE id = ?", (new_status, report_id))
        
        user_id = session.get('user_id')
        cursor.execute("""
            INSERT INTO report_updates (report_id, user_id, status_change, remarks, evidence_path) 
            VALUES (?, ?, ?, ?, ?)
        """, (report_id, user_id, new_status, remarks, evidence_path))
        
        conn.commit()
        return jsonify({'success': True, 'message': 'Status updated successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@api_admin_citizen_reports_bp.route('/<int:report_id>/assign', methods=['POST'])
@role_required('ADMIN')
def assign_officer(report_id):
    data = request.get_json()
    officer_id = data.get('officer_id')
    department_id = data.get('department_id')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        if officer_id:
            cursor.execute("UPDATE citizen_reports SET officer_id = ?, status = 'INVESTIGATION' WHERE id = ?", (officer_id, report_id))
        elif department_id:
            cursor.execute("UPDATE citizen_reports SET department_id = ? WHERE id = ?", (department_id, report_id))
            
        user_id = session.get('user_id')
        cursor.execute("""
            INSERT INTO report_updates (report_id, user_id, status_change, remarks) 
            VALUES (?, ?, 'ASSIGNED', 'Report assigned')
        """, (report_id, user_id))
        
        conn.commit()
        return jsonify({'success': True, 'message': 'Report assigned successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
