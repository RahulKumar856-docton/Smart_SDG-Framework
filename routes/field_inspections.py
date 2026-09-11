import os
from datetime import datetime
from werkzeug.utils import secure_filename
from flask import Blueprint, render_template, request, jsonify, session, current_app
from config import get_db_connection

field_inspections_bp = Blueprint('field_inspections', __name__, url_prefix='/inspections')

def officer_required(f):
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('role') not in ['Officer', 'Admin']:
            return jsonify({'success': False, 'message': 'Unauthorized access.'}), 403
        return f(*args, **kwargs)
    return decorated_function

# ==========================================
# Frontend Routes
# ==========================================
@field_inspections_bp.route('/')
def index():
    if 'user_id' not in session or session.get('role') not in ['Officer', 'Admin']:
        from flask import redirect, url_for
        return redirect(url_for('auth.login'))
    return render_template('field_inspections/list.html')

@field_inspections_bp.route('/new')
def new():
    if 'user_id' not in session or session.get('role') not in ['Officer', 'Admin']:
        from flask import redirect, url_for
        return redirect(url_for('auth.login'))
    return render_template('field_inspections/new.html')

# ==========================================
# API Routes
# ==========================================
@field_inspections_bp.route('/api/list', methods=['GET'])
@officer_required
def api_list_inspections():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Officers only see their assigned projects or inspections they created
    # Since project assignment might not be fully fleshed out in this schema (no project_assignments table),
    # we filter by manager_id = officer_id or inspector_id = officer_id
    officer_id = session['user_id']
    role = session['role']
    
    if role == 'Admin':
        cursor.execute("""
            SELECT fi.id, p.project_name, fi.inspection_date, fi.reported_progress, fi.observed_progress, 
                   fi.discrepancy, fi.status, u.full_name as inspector_name
            FROM field_inspections fi
            JOIN projects p ON fi.project_id = p.id
            JOIN users u ON fi.inspector_id = u.id
            ORDER BY fi.inspection_date DESC
        """)
    else:
        cursor.execute("""
            SELECT fi.id, p.project_name, fi.inspection_date, fi.reported_progress, fi.observed_progress, 
                   fi.discrepancy, fi.status, u.full_name as inspector_name
            FROM field_inspections fi
            JOIN projects p ON fi.project_id = p.id
            JOIN users u ON fi.inspector_id = u.id
            WHERE fi.inspector_id = ? OR p.manager_id = ?
            ORDER BY fi.inspection_date DESC
        """, (officer_id, officer_id))
        
    inspections = cursor.fetchall()
    
    # Get evidence count
    for ins in inspections:
        cursor.execute("SELECT COUNT(*) as c FROM inspection_evidence WHERE inspection_id = ?", (ins['id'],))
        ins['evidence_count'] = cursor.fetchone()['c']
        
    cursor.close()
    conn.close()
    return jsonify({'success': True, 'data': inspections})

@field_inspections_bp.route('/api/projects', methods=['GET'])
@officer_required
def api_get_projects():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    officer_id = session['user_id']
    role = session['role']
    
    if role == 'Admin':
        cursor.execute("SELECT id, project_name, progress_percentage FROM projects ORDER BY project_name")
    else:
        # Simplistic assignment: projects where this user is the manager
        cursor.execute("SELECT id, project_name, progress_percentage FROM projects WHERE manager_id = ? ORDER BY project_name", (officer_id,))
        
    projects = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify({'success': True, 'data': projects})

@field_inspections_bp.route('/api/create', methods=['POST'])
@officer_required
def api_create_inspection():
    data = request.json
    project_id = data.get('project_id')
    inspection_type = data.get('inspection_type')
    location = data.get('location')
    reported_progress = float(data.get('reported_progress', 0))
    observed_progress = float(data.get('observed_progress', 0))
    issues = data.get('issues')
    remarks = data.get('remarks')
    
    inspector_id = session['user_id']
    
    discrepancy = reported_progress - observed_progress
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Validate project
        cursor.execute("SELECT id FROM projects WHERE id = ?", (project_id,))
        if not cursor.fetchone():
            return jsonify({'success': False, 'message': 'Invalid project'}), 400
            
        cursor.execute("""
            INSERT INTO field_inspections (
                project_id, inspector_id, inspection_type, location, 
                reported_progress, observed_progress, discrepancy, issues, remarks, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
        """, (project_id, inspector_id, inspection_type, location, reported_progress, observed_progress, discrepancy, issues, remarks))
        
        inspection_id = cursor.lastrowid
        
        # Audit Log
        cursor.execute("""
            INSERT INTO audit_logs (user_id, action, module, record_id, new_value)
            VALUES (?, 'Created Inspection', 'Field Inspections', ?, 'Pending')
        """, (inspector_id, inspection_id))
        
        conn.commit()
        return jsonify({'success': True, 'message': 'Inspection created successfully', 'data': {'id': inspection_id}})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@field_inspections_bp.route('/api/<int:inspection_id>/evidence', methods=['POST'])
@officer_required
def api_upload_evidence(inspection_id):
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file part'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No selected file'}), 400
        
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        
        # Ensure upload dir exists
        upload_folder = os.path.join(current_app.root_path, 'static', 'uploads', 'evidence')
        os.makedirs(upload_folder, exist_ok=True)
        
        # Generate unique filename
        unique_filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
        file_path = os.path.join(upload_folder, unique_filename)
        file.save(file_path)
        
        db_path = f"/static/uploads/evidence/{unique_filename}"
        file_type = filename.rsplit('.', 1)[1].lower()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT INTO inspection_evidence (inspection_id, file_name, file_path, file_type, uploaded_by)
                VALUES (?, ?, ?, ?, ?)
            """, (inspection_id, filename, db_path, file_type, session['user_id']))
            
            cursor.execute("""
                INSERT INTO audit_logs (user_id, action, module, record_id, new_value)
                VALUES (?, 'Uploaded Evidence', 'Field Inspections', ?, ?)
            """, (session['user_id'], inspection_id, filename))
            
            conn.commit()
            return jsonify({'success': True, 'message': 'File uploaded successfully', 'data': {'file_path': db_path}})
        except Exception as e:
            conn.rollback()
            return jsonify({'success': False, 'message': str(e)}), 500
        finally:
            cursor.close()
            conn.close()
    else:
        return jsonify({'success': False, 'message': 'Invalid file type. Only JPG, PNG, PDF allowed.'}), 400

@field_inspections_bp.route('/api/<int:inspection_id>/submit', methods=['POST'])
@officer_required
def api_submit_inspection(inspection_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT status FROM field_inspections WHERE id = ?", (inspection_id,))
        row = cursor.fetchone()
        
        if not row:
            return jsonify({'success': False, 'message': 'Inspection not found'}), 404
            
        if row['status'] != 'Pending':
            return jsonify({'success': False, 'message': f'Cannot submit. Current status is {row["status"]}'}), 400
            
        cursor.execute("UPDATE field_inspections SET status = 'Submitted' WHERE id = ?", (inspection_id,))
        
        cursor.execute("""
            INSERT INTO audit_logs (user_id, action, module, record_id, previous_value, new_value)
            VALUES (?, 'Submitted Inspection', 'Field Inspections', ?, 'Pending', 'Submitted')
        """, (session['user_id'], inspection_id))
        
        conn.commit()
        return jsonify({'success': True, 'message': 'Inspection submitted successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
