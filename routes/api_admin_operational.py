from datetime import datetime
from flask import Blueprint, jsonify, request, session
from werkzeug.security import generate_password_hash
from config import get_db_connection
from routes.utils import admin_required, log_security_event, log_audit_event

api_admin_operational_bp = Blueprint('api_admin_operational', __name__)

# ----------------------------------------------------
# 1. OPERATIONAL OVERVIEW / DASHBOARD
# ----------------------------------------------------
@api_admin_operational_bp.route('/overview', methods=['GET'])
@admin_required
def get_operational_overview():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # 1. Total authorized operational users (CITIZEN, OFFICER, FIELD_OFFICER, etc.)
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE UPPER(r.name) NOT IN ('SUPER_ADMIN', 'ADMIN')
        """)
        authorized_users_count = cursor.fetchone()['count']

        # 2. Reports requiring attention / pending
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM citizen_reports 
            WHERE UPPER(status) IN ('PENDING', 'SUBMITTED', 'IN_PROGRESS', 'OPEN')
        """)
        pending_reports_count = cursor.fetchone()['count']

        # 3. Total citizen reports
        cursor.execute("SELECT COUNT(*) as count FROM citizen_reports")
        total_reports_count = cursor.fetchone()['count']

        # 4. SLA Delayed reports
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM citizen_reports 
            WHERE UPPER(delay_status) = 'DELAYED' 
               OR UPPER(status) = 'DELAYED'
        """)
        sla_delayed_count = cursor.fetchone()['count']

        # 5. Departments count
        cursor.execute("SELECT COUNT(*) as count FROM departments")
        departments_count = cursor.fetchone()['count']

        # 6. Recent announcements
        cursor.execute("""
            SELECT id, title, content, priority, audience as target_role, created_at 
            FROM announcements 
            ORDER BY created_at DESC 
            LIMIT 5
        """)
        recent_announcements = cursor.fetchall()

        # 7. Operational Activity (recent updates)
        cursor.execute("""
            SELECT id, title, category, status, severity as priority, created_at, location as location_text 
            FROM citizen_reports 
            ORDER BY created_at DESC 
            LIMIT 8
        """)
        recent_activity = cursor.fetchall()

        # 8. Department workload breakdown
        cursor.execute("""
            SELECT d.name as department_name, COUNT(cr.id) as report_count
            FROM departments d
            LEFT JOIN citizen_reports cr ON cr.department_id = d.id
            GROUP BY d.id, d.name
            ORDER BY report_count DESC
            LIMIT 6
        """)
        department_workload = cursor.fetchall()

        # 9. SLA Compliance Rate
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN UPPER(status) = 'RESOLVED' THEN 1 ELSE 0 END) as resolved,
                SUM(CASE WHEN UPPER(delay_status) != 'DELAYED' OR delay_status IS NULL THEN 1 ELSE 0 END) as on_time
            FROM citizen_reports
        """)
        sla_stats = cursor.fetchone()
        total_rep = sla_stats['total'] or 1
        compliance_pct = round(((sla_stats['on_time'] or 0) / total_rep) * 100, 1)

        cursor.close()
        conn.close()

        return jsonify({
            "success": True,
            "metrics": {
                "total_authorized_users": authorized_users_count,
                "pending_reports": pending_reports_count,
                "total_reports": total_reports_count,
                "sla_delayed_count": sla_delayed_count,
                "active_departments": departments_count,
                "sla_compliance_rate": f"{compliance_pct}%"
            },
            "recent_announcements": recent_announcements,
            "recent_activity": recent_activity,
            "department_workload": department_workload
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to fetch operational overview: {str(e)}"}), 500


# ----------------------------------------------------
# 2. OPERATIONAL USER MANAGEMENT (STRICT RESTRICTIONS)
# ----------------------------------------------------
@api_admin_operational_bp.route('/users', methods=['GET'])
@admin_required
def list_operational_users():
    """
    List authorized operational users.
    Restricted: Does NOT expose SUPER_ADMIN or sensitive admin secrets.
    """
    try:
        search = request.args.get('search', '').strip()
        role_filter = request.args.get('role', '').strip()

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT 
                u.id, 
                u.username, 
                u.email, 
                u.full_name, 
                u.phone, 
                u.status, 
                u.created_at, 
                u.department_id,
                r.name as role_name,
                d.name as department_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE UPPER(r.name) != 'SUPER_ADMIN'
        """
        params = []

        if search:
            query += " AND (u.username LIKE %s OR u.email LIKE %s OR u.full_name LIKE %s)"
            like_term = f"%{search}%"
            params.extend([like_term, like_term, like_term])

        if role_filter:
            query += " AND UPPER(r.name) = %s"
            params.append(role_filter.upper())

        query += " ORDER BY u.created_at DESC LIMIT 100"

        cursor.execute(query, tuple(params))
        users = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify({"success": True, "users": users, "total": len(users)}), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Error loading operational users: {str(e)}"}), 500


@api_admin_operational_bp.route('/users', methods=['POST'])
@admin_required
def create_operational_user():
    """
    Admin can create operational users (OFFICER, CITIZEN, etc.).
    Admin CANNOT create or promote ADMIN or SUPER_ADMIN accounts.
    """
    try:
        data = request.get_json() or {}
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        full_name = data.get('full_name', '').strip()
        phone = data.get('phone', '').strip()
        role_name = (data.get('role') or 'OFFICER').upper()
        department_id = data.get('department_id')

        if not username or not email or not password:
            return jsonify({"success": False, "message": "Username, email, and password are required"}), 400

        # CRITICAL SECURITY RULE: Admin cannot create Admin or Super Admin
        if role_name in ['SUPER_ADMIN', 'ADMIN']:
            log_security_event(
                'PRIVILEGE_ESCALATION_ATTEMPT',
                f"Admin {session.get('username')} attempted to create high-privilege account: {role_name}",
                severity='HIGH',
                user_id=session.get('user_id')
            )
            return jsonify({
                "success": False, 
                "message": "Forbidden: Operational Administrators cannot create Admin or Super Admin accounts. Contact Platform Super Admin."
            }), 403

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Check existing
        cursor.execute("SELECT id FROM users WHERE username = %s OR email = %s", (username, email))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"success": False, "message": "Username or email already exists"}), 400

        # Resolve role_id
        cursor.execute("SELECT id FROM roles WHERE UPPER(name) = %s", (role_name,))
        role_row = cursor.fetchone()
        if not role_row:
            cursor.close()
            conn.close()
            return jsonify({"success": False, "message": f"Role '{role_name}' is not recognized"}), 400
        role_id = role_row['id']

        # Insert user
        password_hash = generate_password_hash(password)
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, full_name, phone, role_id, department_id, status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'ACTIVE', %s)
        """, (username, email, password_hash, full_name, phone, role_id, department_id, datetime.now()))
        conn.commit()
        new_id = cursor.lastrowid

        cursor.close()
        conn.close()

        log_audit_event(
            user_id=session.get('user_id'),
            action='CREATE_USER',
            entity='users',
            entity_id=new_id,
            new_val=f"Created {role_name} user '{username}'",
            module='Admin'
        )

        return jsonify({"success": True, "message": f"Operational user '{username}' created successfully", "user_id": new_id}), 201

    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to create user: {str(e)}"}), 500


@api_admin_operational_bp.route('/users/<int:target_id>/status', methods=['PUT'])
@admin_required
def toggle_operational_user_status(target_id):
    """
    Admin can activate or deactivate operational accounts.
    Admin CANNOT alter status of ADMIN or SUPER_ADMIN accounts.
    """
    try:
        data = request.get_json() or {}
        new_status = data.get('status', 'ACTIVE').upper()
        if new_status not in ['ACTIVE', 'INACTIVE', 'SUSPENDED']:
            return jsonify({"success": False, "message": "Invalid status value"}), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Check target user's role
        cursor.execute("""
            SELECT u.id, u.username, u.status, r.name as role_name
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = %s
        """, (target_id,))
        target = cursor.fetchone()

        if not target:
            cursor.close()
            conn.close()
            return jsonify({"success": False, "message": "User not found"}), 404

        target_role = (target['role_name'] or '').upper()

        # CRITICAL SECURITY RULE: Cannot alter Admin or Super Admin status
        if target_role in ['SUPER_ADMIN', 'ADMIN']:
            log_security_event(
                'UNAUTHORIZED_STATUS_MUTATION',
                f"Admin {session.get('username')} attempted to alter status of {target_role} user id {target_id}",
                severity='HIGH',
                user_id=session.get('user_id')
            )
            cursor.close()
            conn.close()
            return jsonify({
                "success": False,
                "message": "Forbidden: Operational Administrators cannot alter Admin or Super Admin account states."
            }), 403

        cursor.execute("UPDATE users SET status = %s WHERE id = %s", (new_status, target_id))
        conn.commit()

        cursor.close()
        conn.close()

        log_audit_event(
            user_id=session.get('user_id'),
            action='UPDATE_USER_STATUS',
            entity='users',
            entity_id=target_id,
            old_val=target['status'],
            new_val=new_status,
            module='Admin'
        )

        return jsonify({"success": True, "message": f"User status updated to {new_status}"}), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to update user status: {str(e)}"}), 500


# ----------------------------------------------------
# 3. COMMUNICATIONS & ANNOUNCEMENTS
# ----------------------------------------------------
@api_admin_operational_bp.route('/communications', methods=['GET'])
@admin_required
def get_communications():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT id, title, content, priority, audience as target_role, created_at 
            FROM announcements 
            ORDER BY created_at DESC
        """)
        announcements = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify({"success": True, "announcements": announcements}), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to load communications: {str(e)}"}), 500


@api_admin_operational_bp.route('/communications', methods=['POST'])
@admin_required
def create_communication():
    try:
        data = request.get_json() or {}
        title = data.get('title', '').strip()
        content = data.get('content', '').strip()
        priority = data.get('priority', 'NORMAL').upper()
        target_role = data.get('target_role', 'ALL').upper()

        if not title or not content:
            return jsonify({"success": False, "message": "Title and content are required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            INSERT INTO announcements (title, content, priority, audience, author_id, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (title, content, priority, target_role, session.get('user_id'), datetime.now()))
        conn.commit()
        ann_id = cursor.lastrowid

        cursor.close()
        conn.close()

        log_audit_event(
            user_id=session.get('user_id'),
            action='CREATE_ANNOUNCEMENT',
            entity='announcements',
            entity_id=ann_id,
            new_val=title,
            module='Admin'
        )

        return jsonify({"success": True, "message": "Announcement broadcast successfully", "id": ann_id}), 201

    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to create communication: {str(e)}"}), 500


@api_admin_operational_bp.route('/communications/<int:ann_id>', methods=['DELETE'])
@admin_required
def delete_communication(ann_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("DELETE FROM announcements WHERE id = %s", (ann_id,))
        conn.commit()

        cursor.close()
        conn.close()

        log_audit_event(
            user_id=session.get('user_id'),
            action='DELETE_ANNOUNCEMENT',
            entity='announcements',
            entity_id=ann_id,
            module='Admin'
        )

        return jsonify({"success": True, "message": "Announcement removed"}), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to delete announcement: {str(e)}"}), 500


# ----------------------------------------------------
# 4. OPERATIONAL ANALYTICS
# ----------------------------------------------------
@api_admin_operational_bp.route('/analytics', methods=['GET'])
@admin_required
def get_operational_analytics():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # 1. By Status
        cursor.execute("""
            SELECT status, COUNT(*) as count 
            FROM citizen_reports 
            GROUP BY status
        """)
        by_status = cursor.fetchall()

        # 2. By Priority
        cursor.execute("""
            SELECT severity as priority, COUNT(*) as count 
            FROM citizen_reports 
            GROUP BY severity
        """)
        by_priority = cursor.fetchall()

        # 3. By Category / Department
        cursor.execute("""
            SELECT COALESCE(category, 'General') as category, COUNT(*) as count 
            FROM citizen_reports 
            GROUP BY category
            ORDER BY count DESC
            LIMIT 7
        """)
        by_category = cursor.fetchall()

        # 4. Weekly volume
        cursor.execute("""
            SELECT 
                SUBSTR(created_at, 1, 10) as date_day, 
                COUNT(*) as count 
            FROM citizen_reports 
            GROUP BY date_day 
            ORDER BY date_day DESC 
            LIMIT 14
        """)
        timeline = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify({
            "success": True,
            "status_distribution": by_status,
            "priority_distribution": by_priority,
            "category_distribution": by_category,
            "timeline": timeline
        }), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to load analytics: {str(e)}"}), 500
