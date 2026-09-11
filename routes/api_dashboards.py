from flask import Blueprint, jsonify, session
from config import get_db_connection
from routes.utils import login_required, role_required

api_dashboards_bp = Blueprint('api_dashboards', __name__)

@api_dashboards_bp.route('/admin', methods=['GET'])
@role_required('ADMIN')
def admin_dashboard():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # KPIs
    cursor.execute("SELECT COUNT(*) as total FROM projects")
    total_projects = cursor.fetchone()['total']
    
    cursor.execute("SELECT COUNT(*) as active FROM projects WHERE status = 'Active'")
    active_projects = cursor.fetchone()['active']
    
    cursor.execute("SELECT COUNT(*) as completed FROM projects WHERE status = 'Completed'")
    completed_projects = cursor.fetchone()['completed']
    
    cursor.execute("SELECT COUNT(*) as at_risk FROM projects WHERE risk_level IN ('High', 'Critical')")
    at_risk_projects = cursor.fetchone()['at_risk']
    
    cursor.execute("SELECT COUNT(*) as total FROM citizen_requests")
    total_requests = cursor.fetchone()['total']

    # Priority Actions (High risk projects)
    cursor.execute("""
        SELECT p.id, p.project_name, d.name as department, p.reported_progress, p.risk_level
        FROM projects p
        LEFT JOIN departments d ON p.department_id = d.id
        WHERE p.risk_level IN ('High', 'Critical') OR p.status = 'Delayed'
        LIMIT 5
    """)
    priority_actions = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return jsonify({
        'success': True,
        'data': {
            'kpis': {
                'total_projects': total_projects,
                'active_projects': active_projects,
                'completed_projects': completed_projects,
                'at_risk_projects': at_risk_projects,
                'total_requests': total_requests,
                'data_confidence': 88 # placeholder calculation
            },
            'priority_actions': priority_actions
        }
    })

@api_dashboards_bp.route('/officer', methods=['GET'])
@role_required('OFFICER')
def officer_dashboard():
    officer_id = session.get('user_id')
    department_id = session.get('department_id')
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        department_name = "Department"
        if department_id:
            cursor.execute("SELECT name FROM departments WHERE id = ?", (department_id,))
            dept = cursor.fetchone()
            if dept: department_name = dept['name']

        cursor.execute("SELECT COUNT(*) as count FROM project_assignments WHERE officer_id = ?", (officer_id,))
        assigned_projects = cursor.fetchone()['count'] or 0

        cursor.execute("SELECT COUNT(*) as count FROM request_assignments ra JOIN citizen_requests cr ON ra.request_id = cr.id WHERE ra.officer_id = ? AND cr.status != 'RESOLVED'", (officer_id,))
        citizen_requests = cursor.fetchone()['count'] or 0

        cursor.execute("SELECT COUNT(*) as count FROM inspections WHERE officer_id = ? AND status = 'PENDING_VERIFICATION'", (officer_id,))
        pending_inspections = cursor.fetchone()['count'] or 0
        
        cursor.execute("SELECT COUNT(*) as count FROM kpi_measurements WHERE officer_id = ? AND status = 'PENDING_VERIFICATION'", (officer_id,))
        kpi_updates = cursor.fetchone()['count'] or 0
        
        cursor.execute("SELECT COUNT(*) as count FROM inspections i LEFT JOIN inspection_evidence ie ON i.id = ie.inspection_id WHERE i.officer_id = ? AND ie.id IS NULL", (officer_id,))
        evidence_required = cursor.fetchone()['count'] or 0
        
        cursor.execute("SELECT COUNT(*) as count FROM risks r JOIN project_assignments pa ON r.project_id = pa.project_id WHERE pa.officer_id = ? AND r.level IN ('High', 'Critical')", (officer_id,))
        risk_alerts = cursor.fetchone()['count'] or 0

        cursor.execute("""
            SELECT p.id, p.project_name, p.location, p.reported_progress as progress_percentage, p.risk_level, p.expected_completion as expected_end_date 
            FROM projects p 
            JOIN project_assignments pa ON p.id = pa.project_id 
            WHERE pa.officer_id = ?
            LIMIT 5
        """, (officer_id,))
        projects = cursor.fetchall()
        
        cursor.execute("""
            SELECT cr.id, cr.request_id_code, cr.category, cr.priority, cr.status 
            FROM citizen_requests cr 
            JOIN request_assignments ra ON cr.id = ra.request_id 
            WHERE ra.officer_id = ? AND cr.status != 'RESOLVED'
            LIMIT 5
        """, (officer_id,))
        requests = cursor.fetchall()

        return jsonify({
            'success': True,
            'data': {
                'department_name': department_name,
                'kpis': {
                    'assigned_projects': assigned_projects,
                    'pending_inspections': pending_inspections,
                    'kpi_updates': kpi_updates,
                    'evidence_required': evidence_required,
                    'citizen_requests': citizen_requests,
                    'risk_alerts': risk_alerts
                },
                'projects': projects,
                'requests': requests
            }
        })
    except Exception as e:
        print(f"Error loading officer dashboard: {e}")
        return jsonify({'success': False, 'message': 'Database error occurred'}), 500
    finally:
        cursor.close()
        conn.close()

@api_dashboards_bp.route('/citizen', methods=['GET'])
@role_required('CITIZEN')
def citizen_dashboard():
    user_id = session.get('user_id')
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("SELECT * FROM citizen_requests WHERE citizen_id = ? ORDER BY created_at DESC", (user_id,))
    my_requests = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return jsonify({
        'success': True,
        'data': {
            'my_requests': my_requests
        }
    })
