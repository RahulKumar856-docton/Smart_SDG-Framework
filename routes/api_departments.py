from flask import Blueprint, jsonify, request, session
from config import get_db_connection

api_departments_bp = Blueprint('api_departments', __name__)

@api_departments_bp.route('', methods=['GET'])
def get_departments():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT d.id, d.name, d.description,
               COUNT(DISTINCT p.id) as total_projects, 
               COUNT(DISTINCT u.id) as total_officers
        FROM departments d
        LEFT JOIN projects p ON d.id = p.department_id
        LEFT JOIN users u ON d.id = u.department_id
        GROUP BY d.id
    """)
    departments = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return jsonify({
        'success': True,
        'data': departments
    })

@api_departments_bp.route('', methods=['POST'])
def create_department():
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO departments (name, description) VALUES (?, ?)", 
                       (data.get('name'), data.get('description')))
        dept_id = cursor.lastrowid
        
        user_id = session.get('user_id')
        if user_id:
            cursor.execute("INSERT INTO audit_logs (user_id, action, entity, entity_id, new_value) VALUES (?, 'CREATE', 'Department', ?, ?)", 
                           (user_id, dept_id, f"Created department: {data.get('name')}"))
                           
        conn.commit()
        return jsonify({'success': True, 'data': {'id': dept_id}, 'message': 'Department created'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
