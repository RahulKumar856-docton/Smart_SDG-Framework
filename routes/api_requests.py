import os
import time
import random
from datetime import datetime
from flask import Blueprint, request, jsonify, session, current_app
from werkzeug.utils import secure_filename
from config import get_db_connection
from routes.utils import role_required

api_requests_bp = Blueprint('api_requests', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def generate_request_id():
    year = datetime.now().year
    random_str = str(random.randint(100000, 999999))
    return f"CIT-{year}-{random_str}"

@api_requests_bp.route('/', methods=['POST'])
@role_required('CITIZEN')
def submit_request():
    citizen_id = session.get('user_id')
    
    # Process multipart/form-data
    category = request.form.get('category')
    title = request.form.get('title')
    description = request.form.get('description')
    location = request.form.get('location')
    ward = request.form.get('ward')
    priority = request.form.get('priority', 'Medium')
    project_id = request.form.get('project_id')
    
    if not all([category, title, description]):
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
        
    evidence_path = None
    if 'evidence' in request.files:
        file = request.files['evidence']
        if file and file.filename != '' and allowed_file(file.filename):
            filename = secure_filename(f"{int(time.time())}_{file.filename}")
            # Ensure upload folder exists
            os.makedirs(current_app.config['UPLOAD_FOLDER_EVIDENCE'], exist_ok=True)
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER_EVIDENCE'], filename)
            file.save(filepath)
            evidence_path = f"/uploads/evidence/{filename}"

    request_id_code = generate_request_id()
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Determine department based on category (mock logic or left empty)
        # We can leave department_id NULL initially until AI/Admin assigns it
        
        # Determine request_type (ISSUE or SERVICE)
        request_type = 'ISSUE'
        
        # If project_id is an empty string, set it to None
        project_id_val = project_id if project_id and str(project_id).strip() != '' else None
        
        cursor.execute("""
            INSERT INTO citizen_requests 
            (request_id_code, citizen_id, request_type, category, title, description, location, ward, priority, evidence_path, status, project_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', ?)
        """, (
            request_id_code, citizen_id, request_type, category, title, description, 
            location, ward, priority, evidence_path, project_id_val
        ))
        
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Report submitted successfully.',
            'data': {
                'request_id_code': request_id_code,
                'status': 'SUBMITTED'
            }
        })
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': 'Failed to save request.'}), 500
    finally:
        cursor.close()
        conn.close()

@api_requests_bp.route('/projects', methods=['GET'])
def get_public_projects():
    # Publicly accessible, no auth required, just returns active projects for dropdowns
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT id, project_name 
        FROM projects 
        WHERE status NOT IN ('Cancelled', 'Archived')
        ORDER BY project_name ASC
    """)
    projects = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return jsonify({
        'success': True,
        'data': projects
    })
