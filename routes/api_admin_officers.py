from flask import Blueprint, jsonify, request, session
from config import get_db_connection
from routes.utils import role_required
from services.notification_service import create_notification

api_admin_officers_bp = Blueprint('api_admin_officers', __name__)

@api_admin_officers_bp.route('/', methods=['GET'])
@role_required('ADMIN')
def list_officers():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        search = request.args.get('search', '').lower()
        status = request.args.get('status', 'All')
        dept_id = request.args.get('department_id', '')
        date_range = request.args.get('date_range', 'All Time')
        
        query = """
            SELECT u.id, u.username, u.full_name, u.email, u.phone, u.status, u.created_at, 
                   d.name as department_name, d.id as department_id
            FROM users u
            JOIN roles r ON u.role_id = r.id
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE r.name = 'OFFICER'
        """
        params = []
        
        if status != 'All':
            query += " AND u.status = ?"
            params.append(status.upper().replace(' ', '_'))
            
        if dept_id:
            query += " AND u.department_id = ?"
            params.append(dept_id)
            
        if search:
            query += " AND (LOWER(u.full_name) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(u.phone) LIKE ? OR CAST(u.id AS TEXT) LIKE ?)"
            like_val = f"%{search}%"
            params.extend([like_val, like_val, like_val, like_val])
            
        if date_range != 'All Time':
            if date_range == 'Today':
                query += " AND DATE(u.created_at) = DATE('now', 'localtime')"
            elif date_range == 'Last 7 Days':
                query += " AND u.created_at >= DATE('now', '-7 days', 'localtime')"
            elif date_range == 'This Month':
                query += " AND strftime('%Y-%m', u.created_at) = strftime('%Y-%m', 'now', 'localtime')"
        
        query += " ORDER BY CASE WHEN u.status = 'PENDING_APPROVAL' THEN 1 ELSE 2 END, u.created_at DESC"
        
        cursor.execute(query, params)
        officers = cursor.fetchall()
        
        for o in officers:
            if o['created_at']:
                o['created_at'] = str(o['created_at'])
                
        return jsonify({'success': True, 'data': officers})
    except Exception as e:
        print("Error fetching officers:", e)
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@api_admin_officers_bp.route('/statistics', methods=['GET'])
@role_required('ADMIN')
def get_officers_statistics():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT status, COUNT(*) as count FROM users JOIN roles r ON users.role_id = r.id WHERE r.name = 'OFFICER' GROUP BY status")
        counts = cursor.fetchall()
        
        stats = {
            'Total': 0,
            'Pending Approval': 0,
            'Active': 0,
            'Rejected': 0
        }
        
        for row in counts:
            stats['Total'] += row['count']
            if row['status'] == 'PENDING_APPROVAL':
                stats['Pending Approval'] = row['count']
            elif row['status'] == 'ACTIVE':
                stats['Active'] = row['count']
            elif row['status'] == 'REJECTED':
                stats['Rejected'] = row['count']
                
        return jsonify({'success': True, 'data': stats})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@api_admin_officers_bp.route('/<int:officer_id>/approve', methods=['PATCH'])
@role_required('ADMIN')
def approve_officer(officer_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT status, full_name, email FROM users WHERE id = ? AND role_id = (SELECT id FROM roles WHERE name = 'OFFICER')", (officer_id,))
        officer = cursor.fetchone()
        
        if not officer:
            return jsonify({'success': False, 'message': 'Officer not found or invalid.'}), 404
            
        if officer['status'] == 'ACTIVE':
            return jsonify({'success': False, 'message': 'Officer is already active.'}), 409
            
        if officer['status'] == 'REJECTED':
            return jsonify({'success': False, 'message': 'Rejected officers cannot be approved directly.'}), 422
            
        # Perform Update
        cursor.execute("UPDATE users SET status = 'ACTIVE' WHERE id = ?", (officer_id,))
        
        # Create Audit Log
        admin_id = session.get('user_id')
        cursor.execute("""
            INSERT INTO audit_logs (user_id, action, entity, entity_id, new_value)
            VALUES (?, 'APPROVE', 'Officer', ?, 'ACTIVE')
        """, (admin_id, officer_id))
        
        conn.commit()
        
        # Send Notification (after commit so we don't rollback if notification fails, or we can assume it succeeds)
        create_notification(
            user_id=officer_id,
            title="Officer Registration Approved",
            message="Your officer account has been approved. You can now access the authorized officer portal.",
            notif_type="SYSTEM",
            priority="HIGH",
            module="Account"
        )
        
        return jsonify({'success': True, 'message': f"{officer['full_name']} has been approved and activated."})
    except Exception as e:
        conn.rollback()
        print("Approval failed:", e)
        return jsonify({'success': False, 'message': 'Failed to approve officer.'}), 500
    finally:
        cursor.close()
        conn.close()

@api_admin_officers_bp.route('/<int:officer_id>/reject', methods=['PATCH'])
@role_required('ADMIN')
def reject_officer(officer_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        data = request.get_json() or {}
        reason = data.get('reason', 'No reason provided')
        
        cursor.execute("SELECT status, full_name, email FROM users WHERE id = ? AND role_id = (SELECT id FROM roles WHERE name = 'OFFICER')", (officer_id,))
        officer = cursor.fetchone()
        
        if not officer:
            return jsonify({'success': False, 'message': 'Officer not found or invalid.'}), 404
            
        if officer['status'] == 'REJECTED':
            return jsonify({'success': False, 'message': 'Officer is already rejected.'}), 409
            
        # Perform Update
        cursor.execute("UPDATE users SET status = 'REJECTED' WHERE id = ?", (officer_id,))
        
        # Create Audit Log
        admin_id = session.get('user_id')
        cursor.execute("""
            INSERT INTO audit_logs (user_id, action, entity, entity_id, new_value)
            VALUES (?, 'REJECT', 'Officer', ?, 'REJECTED')
        """, (admin_id, officer_id))
        
        conn.commit()
        
        # Send Notification
        create_notification(
            user_id=officer_id,
            title="Officer Registration Rejected",
            message=f"Your officer registration has been rejected. Reason: {reason}",
            notif_type="SYSTEM",
            priority="HIGH",
            module="Account"
        )
        
        return jsonify({'success': True, 'message': f"{officer['full_name']}'s registration has been rejected."})
    except Exception as e:
        conn.rollback()
        print("Rejection failed:", e)
        return jsonify({'success': False, 'message': 'Failed to reject officer.'}), 500
    finally:
        cursor.close()
        conn.close()

@api_admin_officers_bp.route('/<int:officer_id>', methods=['PATCH'])
@role_required('ADMIN')
def edit_officer(officer_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
            
        cursor.execute("SELECT id FROM users WHERE id = ? AND role_id = (SELECT id FROM roles WHERE name = 'OFFICER')", (officer_id,))
        if not cursor.fetchone():
            return jsonify({'success': False, 'message': 'Officer not found.'}), 404
            
        updates = []
        params = []
        if 'full_name' in data:
            updates.append("full_name = ?")
            params.append(data['full_name'])
        if 'phone' in data:
            updates.append("phone = ?")
            params.append(data['phone'])
        if 'department_id' in data:
            updates.append("department_id = ?")
            params.append(data['department_id'])
            
        if not updates:
            return jsonify({'success': False, 'message': 'No valid fields provided to update'}), 400
            
        query = "UPDATE users SET " + ", ".join(updates) + " WHERE id = ?"
        params.append(officer_id)
        
        cursor.execute(query, params)
        
        # Audit
        admin_id = session.get('user_id')
        cursor.execute("""
            INSERT INTO audit_logs (user_id, action, entity, entity_id, new_value)
            VALUES (?, 'EDIT', 'Officer', ?, 'Admin updated officer profile')
        """, (admin_id, officer_id))
        
        conn.commit()
        return jsonify({'success': True, 'message': 'Officer profile updated successfully.'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': 'Database error occurred.'}), 500
    finally:
        cursor.close()
        conn.close()
