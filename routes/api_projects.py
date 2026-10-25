from flask import Blueprint, jsonify
from config import get_db_connection
from services.notification_service import broadcast_notification_to_role, create_notification
from services.settings_service import SettingsService
from ml.officer_assignment import predict_best_officer

api_projects_bp = Blueprint('api_projects', __name__)

@api_projects_bp.route('/public', methods=['GET'])
def public_projects():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT p.id, p.project_name, d.name as department_name, p.status, p.risk_level, p.reported_progress
        FROM projects p
        LEFT JOIN departments d ON p.department_id = d.id
        WHERE p.status != 'DRAFT'
        ORDER BY p.created_at DESC
        LIMIT 9
    """)
    projects = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return jsonify({
        'success': True,
        'data': projects
    })

@api_projects_bp.route('', methods=['GET'])
def get_all_projects():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT p.*, d.name as department_name, u.full_name as manager_name
        FROM projects p
        LEFT JOIN departments d ON p.department_id = d.id
        LEFT JOIN users u ON p.manager_id = u.id
        ORDER BY p.created_at DESC
    """)
    projects = cursor.fetchall()
    
    # Fetch SDGs for projects
    cursor.execute("""
        SELECT ps.project_id, s.id as sdg_id, s.name as sdg_name, s.color as sdg_color
        FROM project_sdgs ps
        JOIN sdgs s ON ps.sdg_id = s.id
    """)
    sdgs = cursor.fetchall()
    
    # Map SDGs to projects
    sdgs_map = {}
    for row in sdgs:
        pid = row['project_id']
        if pid not in sdgs_map:
            sdgs_map[pid] = []
        sdgs_map[pid].append({'id': row['sdg_id'], 'name': row['sdg_name'], 'color': row['sdg_color']})
        
    for p in projects:
        p['sdgs'] = sdgs_map.get(p['id'], [])
        
    cursor.close()
    conn.close()
    return jsonify({'success': True, 'data': projects})

@api_projects_bp.route('/<int:project_id>', methods=['GET'])
def get_project(project_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT p.*, d.name as department_name, u.full_name as manager_name
        FROM projects p
        LEFT JOIN departments d ON p.department_id = d.id
        LEFT JOIN users u ON p.manager_id = u.id
        WHERE p.id = ?
    """, (project_id,))
    project = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if project:
        return jsonify({'success': True, 'data': project})
    return jsonify({'success': False, 'message': 'Project not found'}), 404

@api_projects_bp.route('', methods=['POST'])
def create_project():
    from flask import request, session
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        default_status = SettingsService.get_setting('default_project_status', 'PLANNED')
        
        cursor.execute("""
            INSERT INTO projects (project_name, description, department_id, status, expected_completion, budget, priority, location, start_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data.get('project_name'), data.get('description'), data.get('department_id'),
            data.get('status', default_status), data.get('expected_completion'),
            data.get('budget', 0), data.get('priority', 'Medium'),
            data.get('location'), data.get('start_date')
        ))
        project_id = cursor.lastrowid
        
        # Handle SDGs
        sdg_ids = data.get('sdg_ids', [])
        if sdg_ids:
            for sdg_id in sdg_ids:
                cursor.execute("INSERT INTO project_sdgs (project_id, sdg_id) VALUES (?, ?)", (project_id, sdg_id))
                
        # ML-based Officer Assignment
        if data.get('department_id'):
            manager_id = predict_best_officer(data.get('department_id'), sdg_ids)
            if manager_id:
                cursor.execute("UPDATE projects SET manager_id = ? WHERE id = ?", (manager_id, project_id))

        
        # Log audit if session user exists
        user_id = session.get('user_id')
        if user_id:
            cursor.execute("INSERT INTO audit_logs (user_id, action, entity, entity_id, new_value) VALUES (?, 'CREATE', 'Project', ?, ?)", 
                           (user_id, project_id, f"Created project: {data.get('project_name')}"))
        
        # Broadcast notification to Admins
        broadcast_notification_to_role(
            'ADMIN',
            'New Project Created',
            f"Project '{data.get('project_name')}' has been created and requires planning.",
            notif_type='PROJECT',
            priority='INFO',
            module='Projects',
            entity_type='Project',
            entity_id=project_id,
            action_url=f"/admin/projects/{project_id}"
        )
        
        conn.commit()
        return jsonify({'success': True, 'data': {'id': project_id}, 'message': 'Project created'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@api_projects_bp.route('/<int:project_id>', methods=['PUT'])
def update_project(project_id):
    from flask import request, session
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE projects 
            SET project_name=?, description=?, department_id=?, status=?, expected_completion=?, budget=?, priority=?, location=?, start_date=?
            WHERE id=?
        """, (
            data.get('project_name'), data.get('description'), data.get('department_id'),
            data.get('status'), data.get('expected_completion'), data.get('budget'), 
            data.get('priority'), data.get('location'), data.get('start_date'),
            project_id
        ))
        
        user_id = session.get('user_id')
        if user_id:
            cursor.execute("INSERT INTO audit_logs (user_id, action, entity, entity_id, new_value) VALUES (?, 'UPDATE', 'Project', ?, ?)", 
                           (user_id, project_id, "Updated project details"))
                           
        conn.commit()
        return jsonify({'success': True, 'message': 'Project updated'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@api_projects_bp.route('/<int:project_id>/archive', methods=['POST'])
def archive_project(project_id):
    from flask import session
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE projects SET status='ARCHIVED' WHERE id=?", (project_id,))
        
        user_id = session.get('user_id')
        if user_id:
            cursor.execute("INSERT INTO audit_logs (user_id, action, entity, entity_id, new_value) VALUES (?, 'ARCHIVE', 'Project', ?, ?)", 
                           (user_id, project_id, "Archived project"))
                           
        conn.commit()
        return jsonify({'success': True, 'message': 'Project archived'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@api_projects_bp.route('/<int:project_id>/assign', methods=['POST'])
def assign_officer(project_id):
    from flask import request, session
    data = request.get_json()
    officer_id = data.get('officer_id')
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO project_assignments (project_id, officer_id) VALUES (?, ?)", (project_id, officer_id))
        
        user_id = session.get('user_id')
        if user_id:
            cursor.execute("INSERT INTO audit_logs (user_id, action, entity, entity_id, new_value) VALUES (?, 'ASSIGN', 'Project', ?, ?)", 
                           (user_id, project_id, f"Assigned officer {officer_id}"))
                           
        # Send notification to the assigned officer
        create_notification(
            user_id=officer_id,
            title='Assigned to Project',
            message=f'You have been assigned to project ID {project_id}.',
            notif_type='PROJECT',
            priority='HIGH',
            module='Projects',
            entity_type='Project',
            entity_id=project_id,
            action_url=f"/officer/projects/{project_id}"
        )
        
        conn.commit()
        return jsonify({'success': True, 'message': 'Officer assigned'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
