from flask import Blueprint, jsonify, request
from config import get_db_connection
from routes.utils import role_required

api_admin_gis_bp = Blueprint('api_admin_gis', __name__)

@api_admin_gis_bp.route('/data', methods=['GET'])
@role_required('ADMIN')
def get_gis_data():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # 1. Projects
    cursor.execute("""
        SELECT p.id, p.project_name as title, p.department_id, p.status, p.ward, p.latitude, p.longitude, 
               p.reported_progress as progress, d.name as department
        FROM projects p
        LEFT JOIN departments d ON p.department_id = d.id
    """)
    all_projects = cursor.fetchall()
    
    # 2. Citizen Requests
    cursor.execute("""
        SELECT r.id, r.request_id_code, r.category as title, r.priority, r.status, r.ward, r.latitude, r.longitude
        FROM citizen_requests r
    """)
    all_requests = cursor.fetchall()
    
    # 3. Inspections
    cursor.execute("""
        SELECT i.id, i.inspection_date, i.status, i.latitude, i.longitude, i.project_id, p.project_name as title, u.full_name as officer
        FROM inspections i
        LEFT JOIN projects p ON i.project_id = p.id
        LEFT JOIN users u ON i.officer_id = u.id
    """)
    all_inspections = cursor.fetchall()
    
    # 4. Facilities
    cursor.execute("SELECT id, name as title, type, status, latitude, longitude FROM facilities")
    all_facilities = cursor.fetchall()
    
    # Coverage Stats
    projects_mapped = [p for p in all_projects if p['latitude'] is not None and p['longitude'] is not None]
    requests_mapped = [r for r in all_requests if r['latitude'] is not None and r['longitude'] is not None]
    inspections_mapped = [i for i in all_inspections if i['latitude'] is not None and i['longitude'] is not None]
    facilities_mapped = [f for f in all_facilities if f['latitude'] is not None and f['longitude'] is not None]
    
    coverage = {
        'projects': {'mapped': len(projects_mapped), 'total': len(all_projects)},
        'requests': {'mapped': len(requests_mapped), 'total': len(all_requests)},
        'inspections': {'mapped': len(inspections_mapped), 'total': len(all_inspections)},
        'facilities': {'mapped': len(facilities_mapped), 'total': len(all_facilities)}
    }
    
    cursor.close()
    conn.close()
    
    return jsonify({
        'success': True,
        'data': {
            'projects': projects_mapped,
            'requests': requests_mapped,
            'inspections': inspections_mapped,
            'facilities': facilities_mapped
        },
        'coverage': coverage
    })

@api_admin_gis_bp.route('/filters', methods=['GET'])
@role_required('ADMIN')
def get_filters():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("SELECT id, name FROM departments ORDER BY name")
    departments = cursor.fetchall()
    
    cursor.execute("SELECT DISTINCT ward FROM projects WHERE ward IS NOT NULL UNION SELECT DISTINCT ward FROM citizen_requests WHERE ward IS NOT NULL")
    wards = [{'id': row['ward'], 'name': row['ward']} for row in cursor.fetchall() if row['ward']]
    
    cursor.close()
    conn.close()
    
    return jsonify({
        'success': True,
        'data': {
            'departments': departments,
            'wards': wards
        }
    })
