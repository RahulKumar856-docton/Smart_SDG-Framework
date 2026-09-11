from flask import Blueprint, jsonify, request, session, current_app
from config import get_db_connection
from functools import wraps
from services.notification_service import create_notification
from werkzeug.utils import secure_filename
from werkzeug.security import check_password_hash, generate_password_hash
import datetime
import uuid
import os

citizen_api_bp = Blueprint('citizen_api', __name__, url_prefix='/api/citizen')

def citizen_api_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('role', '').upper() != 'CITIZEN':
            return jsonify({'error': 'Unauthorized', 'message': 'Citizen authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

@citizen_api_bp.route('/dashboard/summary', methods=['GET'])
@citizen_api_required
def get_dashboard_summary():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    citizen_id = session['user_id']
    
    try:
        # Request Statistics (Services)
        cursor.execute("SELECT status, COUNT(*) as count FROM citizen_requests WHERE citizen_id = ? GROUP BY status", (citizen_id,))
        req_status_counts = cursor.fetchall()
        
        service_stats = {
            'Total': 0, 'Submitted': 0, 'Under Review': 0, 'In Progress': 0, 
            'Awaiting Verification': 0, 'Resolved': 0, 'Rejected': 0, 'Reopened': 0
        }
        
        for row in req_status_counts:
            service_stats['Total'] += row['count']
            if row['status'] == 'SUBMITTED': service_stats['Submitted'] = row['count']
            elif row['status'] == 'UNDER_REVIEW': service_stats['Under Review'] = row['count']
            elif row['status'] == 'IN_PROGRESS': service_stats['In Progress'] = row['count']
            elif row['status'] == 'PENDING_VERIFICATION': service_stats['Awaiting Verification'] = row['count']
            elif row['status'] == 'RESOLVED': service_stats['Resolved'] = row['count']
            elif row['status'] == 'REJECTED': service_stats['Rejected'] = row['count']
            elif row['status'] == 'REOPENED': service_stats['Reopened'] = row['count']
            
        # Report Statistics
        cursor.execute("SELECT status, COUNT(*) as count FROM citizen_reports WHERE citizen_id = ? GROUP BY status", (citizen_id,))
        rep_status_counts = cursor.fetchall()
        
        report_stats = {
            'Total': 0, 'Submitted': 0, 'Under Investigation': 0, 
            'Action in Progress': 0, 'Resolved': 0, 'Reopened': 0
        }
        
        for row in rep_status_counts:
            report_stats['Total'] += row['count']
            if row['status'] == 'SUBMITTED': report_stats['Submitted'] = row['count']
            elif row['status'] == 'INVESTIGATION': report_stats['Under Investigation'] = row['count']
            elif row['status'] == 'ACTION_IN_PROGRESS': report_stats['Action in Progress'] = row['count']
            elif row['status'] == 'RESOLVED': report_stats['Resolved'] = row['count']
            elif row['status'] == 'REOPENED': report_stats['Reopened'] = row['count']
            
        # Recent Services
        cursor.execute("""
            SELECT id, request_id_code as request_id, title, category, location, status, created_at
            FROM citizen_requests 
            WHERE citizen_id = ? 
            ORDER BY created_at DESC LIMIT 5
        """, (citizen_id,))
        recent_requests = cursor.fetchall()
        for r in recent_requests:
            if r['created_at']: r['created_at'] = str(r['created_at'])

        # Recent Reports
        cursor.execute("""
            SELECT id, report_id_code as report_id, title, category, location, status, created_at
            FROM citizen_reports 
            WHERE citizen_id = ? 
            ORDER BY created_at DESC LIMIT 5
        """, (citizen_id,))
        recent_reports = cursor.fetchall()
        for r in recent_reports:
            if r['created_at']: r['created_at'] = str(r['created_at'])
            
        # Unread Notifications
        cursor.execute("SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND is_read = 0", (citizen_id,))
        unread_notifications = cursor.fetchone()['unread']
        
        # User Info
        cursor.execute("SELECT full_name, email FROM users WHERE id = ?", (citizen_id,))
        user_info = cursor.fetchone()
        
        return jsonify({
            'success': True, 
            'data': {
                'user': user_info,
                'stats': {
                    'services': service_stats,
                    'reports': report_stats
                },
                'recent_requests': recent_requests,
                'recent_reports': recent_reports,
                'unread_notifications': unread_notifications
            }
        })
    except Exception as e:
        print("Dashboard error:", e)
        return jsonify({'success': False, 'message': 'Failed to load dashboard summary'}), 500
    finally:
        cursor.close()
        conn.close()

@citizen_api_bp.route('/requests', methods=['GET'])
@citizen_api_required
def get_requests():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    citizen_id = session['user_id']
    
    try:
        search = request.args.get('search', '').lower()
        status = request.args.get('status', 'All')
        date_range = request.args.get('date_range', 'All Time')
        category = request.args.get('category', 'All')
        
        query = "SELECT * FROM citizen_requests WHERE citizen_id = ?"
        params = [citizen_id]
        
        if status != 'All':
            query += " AND status = ?"
            params.append(status.upper().replace(' ', '_'))
            
        if category != 'All':
            query += " AND category = ?"
            params.append(category)
            
        if search:
            query += " AND (LOWER(title) LIKE ? OR LOWER(request_id_code) LIKE ? OR LOWER(location) LIKE ?)"
            like_val = f"%{search}%"
            params.extend([like_val, like_val, like_val])
            
        if date_range != 'All Time':
            if date_range == 'Today':
                query += " AND DATE(created_at) = DATE('now', 'localtime')"
            elif date_range == 'Last 7 Days':
                query += " AND created_at >= DATE('now', '-7 days', 'localtime')"
            elif date_range == 'This Month':
                query += " AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'localtime')"
                
        query += " ORDER BY created_at DESC"
        
        cursor.execute(query, params)
        requests = cursor.fetchall()
        
        for r in requests:
            if r['created_at']: r['created_at'] = str(r['created_at'])
            
        return jsonify({'success': True, 'data': requests})
    except Exception as e:
        print("Requests Error:", e)
        return jsonify({'success': False, 'message': 'Failed to load requests'}), 500
    finally:
        cursor.close()
        conn.close()

@citizen_api_bp.route('/requests', methods=['POST'])
@citizen_api_required
def submit_request():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    citizen_id = session['user_id']
    
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
            
        title = data.get('title')
        category = data.get('category')
        description = data.get('description')
        location = data.get('location')
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        
        if not title or not category or not description:
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400
            
        request_id_code = f"SR-{datetime.datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
        
        cursor.execute("""
            INSERT INTO citizen_requests 
            (request_id_code, citizen_id, request_type, category, title, description, location, latitude, longitude, status)
            VALUES (?, ?, 'ISSUE', ?, ?, ?, ?, ?, ?, 'SUBMITTED')
        """, (request_id_code, citizen_id, category, title, description, location, latitude, longitude))
        
        request_id = cursor.lastrowid
        
        # Timeline update
        cursor.execute("INSERT INTO request_updates (request_id, user_id, status_change, remarks) VALUES (?, ?, 'SUBMITTED', 'Request submitted by citizen')", (request_id, citizen_id))
        
        # Audit Log
        cursor.execute("INSERT INTO audit_logs (user_id, action, entity, entity_id, description) VALUES (?, 'REQUEST_CREATED', 'Citizen Request', ?, 'Citizen submitted a new request')", (citizen_id, request_id))
        
        conn.commit()
        
        create_notification(
            user_id=citizen_id,
            title="Request Submitted Successfully",
            message=f"Your request {request_id_code} has been received and is currently under review.",
            notif_type="CITIZEN_REQUEST",
            priority="INFO",
            module="Requests"
        )
        
        return jsonify({'success': True, 'message': 'Request submitted successfully.', 'request_id_code': request_id_code})
    except Exception as e:
        conn.rollback()
        print("Submit error:", e)
        return jsonify({'success': False, 'message': 'Failed to submit request.'}), 500
    finally:
        cursor.close()
        conn.close()

@citizen_api_bp.route('/requests/<int:id>', methods=['GET'])
@citizen_api_required
def get_request_details(id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    citizen_id = session['user_id']
    
    try:
        cursor.execute("""
            SELECT cr.*, d.name as department_name, u.full_name as assigned_officer_name, u.phone as assigned_officer_phone
            FROM citizen_requests cr 
            LEFT JOIN departments d ON cr.department_id = d.id 
            LEFT JOIN request_assignments ra ON cr.id = ra.request_id
            LEFT JOIN users u ON ra.officer_id = u.id
            WHERE cr.id = ? AND cr.citizen_id = ?
        """, (id, citizen_id))
        req = cursor.fetchone()
        
        if not req:
            return jsonify({'success': False, 'message': 'Request not found.'}), 404
            
        if req['created_at']: req['created_at'] = str(req['created_at'])
        
        # 'evidence_path' is included in the SELECT ru.* since we added it to the table schema!
        cursor.execute("SELECT ru.*, u.full_name as author_name, r.name as role FROM request_updates ru JOIN users u ON ru.user_id = u.id JOIN roles r ON u.role_id = r.id WHERE ru.request_id = ? ORDER BY ru.created_at ASC", (id,))
        timeline = cursor.fetchall()
        for t in timeline:
            if t['created_at']: t['created_at'] = str(t['created_at'])
            
        return jsonify({'success': True, 'data': {'request': req, 'timeline': timeline}})
    except Exception as e:
        print("Get details error:", e)
        return jsonify({'success': False, 'message': 'Failed to retrieve details.'}), 500
    finally:
        cursor.close()
        conn.close()

@citizen_api_bp.route('/requests/<int:id>/verify', methods=['POST'])
@citizen_api_required
def verify_request(id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    citizen_id = session['user_id']
    
    try:
        data = request.json
        verification_status = data.get('verification_status') # 'RESOLVED', 'REWORK', 'REOPENED'
        feedback = data.get('feedback', '')
        
        if verification_status not in ['RESOLVED', 'REWORK', 'REOPENED']:
            return jsonify({'success': False, 'message': 'Invalid verification status.'}), 400
            
        cursor.execute("SELECT status FROM citizen_requests WHERE id = ? AND citizen_id = ?", (id, citizen_id))
        req = cursor.fetchone()
        
        if not req:
            return jsonify({'success': False, 'message': 'Request not found.'}), 404
            
        if req['status'] != 'PENDING_VERIFICATION':
            return jsonify({'success': False, 'message': 'Request is not pending verification.'}), 422
            
        cursor.execute("UPDATE citizen_requests SET status = ? WHERE id = ?", (verification_status, id))
        
        cursor.execute("INSERT INTO request_updates (request_id, user_id, status_change, remarks) VALUES (?, ?, ?, ?)", (id, citizen_id, verification_status, feedback))
        
        cursor.execute("INSERT INTO audit_logs (user_id, action, entity, entity_id, description) VALUES (?, 'REQUEST_VERIFIED', 'Citizen Request', ?, ?)", (citizen_id, id, f"Citizen verified request as {verification_status}"))
        
        conn.commit()
        return jsonify({'success': True, 'message': f'Request marked as {verification_status}.'})
    except Exception as e:
        conn.rollback()
        print("Verification error:", e)
        return jsonify({'success': False, 'message': 'Failed to submit verification.'}), 500
    finally:
        cursor.close()
        conn.close()

@citizen_api_bp.route('/requests/<int:id>/reopen', methods=['PATCH'])
@citizen_api_required
def reopen_request(id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    citizen_id = session['user_id']
    
    try:
        data = request.json
        reason = data.get('reason', 'Problem still exists.')
        
        cursor.execute("SELECT status FROM citizen_requests WHERE id = ? AND citizen_id = ?", (id, citizen_id))
        req = cursor.fetchone()
        
        if not req:
            return jsonify({'success': False, 'message': 'Request not found.'}), 404
            
        if req['status'] != 'RESOLVED':
            return jsonify({'success': False, 'message': 'Only resolved requests can be reopened.'}), 422
            
        cursor.execute("UPDATE citizen_requests SET status = 'REOPENED' WHERE id = ?", (id,))
        
        cursor.execute("INSERT INTO request_updates (request_id, user_id, status_change, remarks) VALUES (?, ?, 'REOPENED', ?)", (id, citizen_id, reason))
        
        cursor.execute("INSERT INTO audit_logs (user_id, action, entity, entity_id, description) VALUES (?, 'REQUEST_REOPENED', 'Citizen Request', ?, 'Citizen reopened the request')", (citizen_id, id))
        
        conn.commit()
        
        create_notification(
            user_id=citizen_id,
            title="Request Reopened",
            message=f"You have reopened your request. Our team will review the issue again.",
            notif_type="CITIZEN_REQUEST",
            priority="MEDIUM",
            module="Requests"
        )
        
        return jsonify({'success': True, 'message': 'Request has been reopened.'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': 'Failed to reopen request.'}), 500
    finally:
        cursor.close()
        conn.close()

@citizen_api_bp.route('/requests/<int:id>/feedback', methods=['POST'])
@citizen_api_required
def submit_feedback(id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    citizen_id = session['user_id']
    
    try:
        data = request.json
        rating = data.get('rating')
        feedback = data.get('feedback', '')
        
        cursor.execute("SELECT status FROM citizen_requests WHERE id = ? AND citizen_id = ?", (id, citizen_id))
        req = cursor.fetchone()
        
        if not req:
            return jsonify({'success': False, 'message': 'Request not found.'}), 404
            
        cursor.execute("INSERT INTO citizen_feedback (request_id, rating, feedback) VALUES (?, ?, ?)", (id, rating, feedback))
        
        cursor.execute("INSERT INTO audit_logs (user_id, action, entity, entity_id, description) VALUES (?, 'FEEDBACK_SUBMITTED', 'Citizen Request', ?, 'Citizen submitted feedback')", (citizen_id, id))
        
        conn.commit()
        return jsonify({'success': True, 'message': 'Feedback submitted successfully.'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': 'Failed to submit feedback.'}), 500
    finally:
        cursor.close()
        conn.close()

# ----------------- CITIZEN REPORTS -----------------

@citizen_api_bp.route('/reports', methods=['GET'])
@citizen_api_required
def get_reports():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    citizen_id = session['user_id']
    
    try:
        query = "SELECT * FROM citizen_reports WHERE citizen_id = ? ORDER BY created_at DESC"
        cursor.execute(query, (citizen_id,))
        reports = cursor.fetchall()
        for r in reports:
            if r['created_at']: r['created_at'] = str(r['created_at'])
            
        return jsonify({'success': True, 'data': reports})
    except Exception as e:
        print("Reports Error:", e)
        return jsonify({'success': False, 'message': 'Failed to load reports'}), 500
    finally:
        cursor.close()
        conn.close()

@citizen_api_bp.route('/reports', methods=['POST'])
@citizen_api_required
def submit_report():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    citizen_id = session['user_id']
    
    try:
        # Check if request has files
        if 'multipart/form-data' in request.content_type:
            data = request.form
            files = request.files.getlist('evidence')
        else:
            data = request.json
            files = []
            
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
            
        title = data.get('title')
        category = data.get('category')
        description = data.get('description')
        location = data.get('location')
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        severity = data.get('severity', 'MEDIUM')
        
        if not title or not category or not description:
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400
            
        # File Validation
        allowed_mimes = ['image/jpeg', 'image/png', 'image/webp']
        if len(files) > 5:
            return jsonify({'success': False, 'message': 'Maximum 5 images allowed'}), 400
            
        for file in files:
            if file.filename == '':
                continue
            if file.mimetype not in allowed_mimes:
                return jsonify({'success': False, 'message': f'Invalid file type: {file.mimetype}. Only JPG, PNG, WEBP allowed.'}), 400
            
            # Note: We rely on flask's MAX_CONTENT_LENGTH or we could check here. Let's assume frontend check + flask config is enough.
            
        report_id_code = f"REP-{datetime.datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}"
        
        cursor.execute("""
            INSERT INTO citizen_reports 
            (report_id_code, citizen_id, category, title, description, location, latitude, longitude, severity, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED')
        """, (report_id_code, citizen_id, category, title, description, location, latitude, longitude, severity))
        
        report_id = cursor.lastrowid
        
        # Handle file uploads
        upload_folder = current_app.config['UPLOAD_FOLDER_EVIDENCE']
        os.makedirs(upload_folder, exist_ok=True)
        
        for file in files:
            if file.filename == '':
                continue
            
            # Secure rename
            ext = os.path.splitext(file.filename)[1]
            secure_name = f"report_{report_id}_{str(uuid.uuid4())[:8]}{ext}"
            file_path = os.path.join(upload_folder, secure_name)
            
            file.save(file_path)
            
            file.seek(0, os.SEEK_END)
            file_size = file.tell()
            
            db_path = f"/uploads/evidence/{secure_name}"
            
            cursor.execute("""
                INSERT INTO report_evidence 
                (report_id, file_path, original_filename, mime_type, file_size, uploaded_by)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (report_id, db_path, file.filename, file.mimetype, file_size, citizen_id))
        
        # Timeline update
        cursor.execute("INSERT INTO report_updates (report_id, user_id, status_change, remarks) VALUES (?, ?, 'SUBMITTED', 'Report submitted by citizen')", (report_id, citizen_id))
        
        # Audit Log
        cursor.execute("INSERT INTO audit_logs (user_id, action, entity, entity_id, description) VALUES (?, 'REPORT_CREATED', 'Citizen Report', ?, 'Citizen submitted a new report')", (citizen_id, report_id))
        
        conn.commit()
        
        create_notification(
            user_id=citizen_id,
            title="Report Submitted Successfully",
            message=f"Your report {report_id_code} has been received and is currently under review.",
            notif_type="CITIZEN_REPORT",
            priority="INFO",
            module="Reports"
        )
        
        return jsonify({'success': True, 'message': 'Report submitted successfully.', 'report_id_code': report_id_code})
    except Exception as e:
        conn.rollback()
        print("Submit error:", e)
        return jsonify({'success': False, 'message': 'Failed to submit report.'}), 500
    finally:
        cursor.close()
        conn.close()

@citizen_api_bp.route('/reports/<int:id>', methods=['GET'])
@citizen_api_required
def get_report_details(id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    citizen_id = session['user_id']
    
    try:
        cursor.execute("""
            SELECT cr.*, d.name as department_name, u.full_name as officer_name
            FROM citizen_reports cr 
            LEFT JOIN departments d ON cr.department_id = d.id 
            LEFT JOIN users u ON cr.officer_id = u.id
            WHERE cr.id = ? AND cr.citizen_id = ?
        """, (id, citizen_id))
        req = cursor.fetchone()
        
        if not req:
            return jsonify({'success': False, 'message': 'Report not found.'}), 404
            
        if req['created_at']: req['created_at'] = str(req['created_at'])
        
        cursor.execute("SELECT ru.*, u.full_name as author_name, r.name as role FROM report_updates ru JOIN users u ON ru.user_id = u.id JOIN roles r ON u.role_id = r.id WHERE ru.report_id = ? ORDER BY ru.created_at ASC", (id,))
        timeline = cursor.fetchall()
        for t in timeline:
            if t['created_at']: t['created_at'] = str(t['created_at'])
            
        cursor.execute("SELECT id, file_path, original_filename, mime_type, file_size FROM report_evidence WHERE report_id = ?", (id,))
        evidence = cursor.fetchall()
            
        return jsonify({'success': True, 'data': {'report': req, 'timeline': timeline, 'evidence': evidence}})
    except Exception as e:
        print("Get details error:", e)
        return jsonify({'success': False, 'message': 'Failed to retrieve details.'}), 500
    finally:
        cursor.close()
        conn.close()

@citizen_api_bp.route('/notifications', methods=['GET'])
@citizen_api_required
def get_notifications():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    citizen_id = session['user_id']
    
    try:
        cursor.execute("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC", (citizen_id,))
        notifications = cursor.fetchall()
        for n in notifications:
            if n['created_at']: n['created_at'] = str(n['created_at'])
            if n.get('read_at'): n['read_at'] = str(n['read_at'])
            
        return jsonify({'success': True, 'data': notifications})
    except Exception as e:
        print("Notifications Error:", e)
        return jsonify({'success': False, 'message': 'Failed to load notifications'}), 500
    finally:
        cursor.close()
        conn.close()

@citizen_api_bp.route('/notifications/<int:id>/read', methods=['PATCH'])
@citizen_api_required
def mark_notification_read(id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    citizen_id = session['user_id']
    
    try:
        cursor.execute("SELECT id FROM notifications WHERE id = ? AND user_id = ?", (id, citizen_id))
        notif = cursor.fetchone()
        
        if not notif:
            return jsonify({'success': False, 'message': 'Notification not found or access denied.'}), 404
            
        cursor.execute("UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE id = ?", (id,))
        conn.commit()
        
        return jsonify({'success': True, 'message': 'Notification marked as read.'})
    except Exception as e:
        conn.rollback()
        print("Mark Read Error:", e)
        return jsonify({'success': False, 'message': 'Failed to mark notification as read.'}), 500
    finally:
        cursor.close()
        conn.close()

@citizen_api_bp.route('/notifications/read-all', methods=['PATCH'])
@citizen_api_required
def mark_all_notifications_read():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    citizen_id = session['user_id']
    
    try:
        cursor.execute("UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND is_read = 0", (citizen_id,))
        conn.commit()
        
        return jsonify({'success': True, 'message': 'All notifications marked as read.'})
    except Exception as e:
        conn.rollback()
        print("Mark All Read Error:", e)
        return jsonify({'success': False, 'message': 'Failed to mark notifications as read.'}), 500
    finally:
        cursor.close()
        conn.close()

@citizen_api_bp.route('/profile', methods=['GET', 'PUT'])
@citizen_api_required
def manage_profile():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    citizen_id = session['user_id']
    
    try:
        if request.method == 'GET':
            cursor.execute("SELECT id, username, full_name, email, phone, created_at FROM users WHERE id = ?", (citizen_id,))
            user = cursor.fetchone()
            if user and user['created_at']: user['created_at'] = str(user['created_at'])
            return jsonify({'success': True, 'data': user})
            
        if request.method == 'PUT':
            data = request.json
            full_name = data.get('full_name')
            phone = data.get('phone')
            
            cursor.execute("UPDATE users SET full_name = ?, phone = ? WHERE id = ?", (full_name, phone, citizen_id))
            conn.commit()
            return jsonify({'success': True, 'message': 'Profile updated successfully'})
            
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': 'Failed to process profile request'}), 500
    finally:
        cursor.close()
        conn.close()

# Citizen Settings Endpoints
@citizen_api_bp.route('/settings', methods=['GET'])
@citizen_api_required
def get_settings():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    citizen_id = session['user_id']
    
    try:
        cursor.execute("SELECT id, username, full_name, email, phone, status, created_at FROM users WHERE id = ?", (citizen_id,))
        user = cursor.fetchone()
        if user and user.get('created_at'):
            user['created_at'] = str(user['created_at'])
            
        cursor.execute("SELECT * FROM citizen_preferences WHERE user_id = ?", (citizen_id,))
        prefs = cursor.fetchone()
        
        if not prefs:
            cursor.execute("INSERT INTO citizen_preferences (user_id) VALUES (?)", (citizen_id,))
            conn.commit()
            cursor.execute("SELECT * FROM citizen_preferences WHERE user_id = ?", (citizen_id,))
            prefs = cursor.fetchone()
            
        if prefs and prefs.get('updated_at'):
            prefs['updated_at'] = str(prefs['updated_at'])
            
        user_agent = request.headers.get('User-Agent', 'Desktop Browser')
        remote_ip = request.remote_addr or '127.0.0.1'
        current_session = {
            'id': 'sess_current',
            'browser': 'Chrome on Windows' if 'Windows' in user_agent else 'Current Browser',
            'ip_address': remote_ip,
            'is_current': True,
            'last_active': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        return jsonify({
            'success': True,
            'data': {
                'account': user,
                'preferences': prefs,
                'sessions': [current_session]
            }
        })
    except Exception as e:
        print("Error fetching citizen settings:", e)
        return jsonify({'success': False, 'message': 'Unable to load your settings.'}), 500
    finally:
        cursor.close()
        conn.close()

@citizen_api_bp.route('/settings', methods=['PUT', 'PATCH'])
@citizen_api_required
def update_settings():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    citizen_id = session['user_id']
    data = request.json or {}
    
    try:
        if 'full_name' in data or 'phone' in data:
            full_name = data.get('full_name')
            phone = data.get('phone')
            if full_name:
                cursor.execute("UPDATE users SET full_name = ?, phone = ? WHERE id = ?", (full_name, phone, citizen_id))
                
        cursor.execute("SELECT id FROM citizen_preferences WHERE user_id = ?", (citizen_id,))
        row = cursor.fetchone()
        if not row:
            cursor.execute("INSERT INTO citizen_preferences (user_id) VALUES (?)", (citizen_id,))
            conn.commit()
            
        cursor.execute("""
            UPDATE citizen_preferences SET
                notif_service_updates = COALESCE(?, notif_service_updates),
                notif_report_updates = COALESCE(?, notif_report_updates),
                notif_work_updates = COALESCE(?, notif_work_updates),
                notif_verification_requests = COALESCE(?, notif_verification_requests),
                notif_messages = COALESCE(?, notif_messages),
                notif_announcements = COALESCE(?, notif_announcements),
                channel_email = COALESCE(?, channel_email),
                channel_push = COALESCE(?, channel_push),
                profile_visibility = COALESCE(?, profile_visibility),
                location_sharing = COALESCE(?, location_sharing),
                report_visibility = COALESCE(?, report_visibility),
                theme = COALESCE(?, theme),
                reduce_motion = COALESCE(?, reduce_motion),
                text_size = COALESCE(?, text_size),
                high_contrast = COALESCE(?, high_contrast),
                language = COALESCE(?, language),
                time_format = COALESCE(?, time_format),
                date_format = COALESCE(?, date_format),
                timezone = COALESCE(?, timezone),
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
        """, (
            data.get('notif_service_updates'),
            data.get('notif_report_updates'),
            data.get('notif_work_updates'),
            data.get('notif_verification_requests'),
            data.get('notif_messages'),
            data.get('notif_announcements'),
            data.get('channel_email'),
            data.get('channel_push'),
            data.get('profile_visibility'),
            data.get('location_sharing'),
            data.get('report_visibility'),
            data.get('theme'),
            data.get('reduce_motion'),
            data.get('text_size'),
            data.get('high_contrast'),
            data.get('language'),
            data.get('time_format'),
            data.get('date_format'),
            data.get('timezone'),
            citizen_id
        ))
        conn.commit()
        
        cursor.execute("SELECT * FROM citizen_preferences WHERE user_id = ?", (citizen_id,))
        updated_prefs = cursor.fetchone()
        if updated_prefs and updated_prefs.get('updated_at'):
            updated_prefs['updated_at'] = str(updated_prefs['updated_at'])
            
        return jsonify({
            'success': True,
            'message': 'Settings saved successfully.',
            'data': updated_prefs
        })
    except Exception as e:
        print("Error saving settings:", e)
        conn.rollback()
        return jsonify({'success': False, 'message': 'Unable to save your settings.'}), 500
    finally:
        cursor.close()
        conn.close()

@citizen_api_bp.route('/change-password', methods=['POST'])
@citizen_api_required
def change_password():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    citizen_id = session['user_id']
    data = request.json or {}
    
    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')
    confirm_password = data.get('confirm_password', '')
    
    if not current_password or not new_password:
        return jsonify({'success': False, 'message': 'Current and new password are required.'}), 400
        
    if new_password != confirm_password:
        return jsonify({'success': False, 'message': 'New password and confirmation do not match.'}), 400
        
    if len(new_password) < 6:
        return jsonify({'success': False, 'message': 'New password must be at least 6 characters long.'}), 400
        
    try:
        cursor.execute("SELECT password_hash FROM users WHERE id = ?", (citizen_id,))
        user = cursor.fetchone()
        
        if not user or not check_password_hash(user['password_hash'], current_password):
            return jsonify({'success': False, 'message': 'Current password is incorrect.'}), 400
            
        if check_password_hash(user['password_hash'], new_password):
            return jsonify({'success': False, 'message': 'New password cannot be the same as current password.'}), 400
            
        new_hash = generate_password_hash(new_password)
        cursor.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, citizen_id))
        conn.commit()
        
        return jsonify({'success': True, 'message': 'Password changed successfully.'})
    except Exception as e:
        print("Error changing password:", e)
        conn.rollback()
        return jsonify({'success': False, 'message': 'Failed to change password.'}), 500
    finally:
        cursor.close()
        conn.close()

@citizen_api_bp.route('/delete-account', methods=['POST'])
@citizen_api_required
def delete_account():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    citizen_id = session['user_id']
    data = request.json or {}
    password = data.get('password', '')
    confirmation = data.get('confirmation', '')
    
    if not password:
        return jsonify({'success': False, 'message': 'Password is required to confirm account deletion.'}), 400
        
    if confirmation.upper() != 'DELETE':
        return jsonify({'success': False, 'message': 'Please type DELETE to confirm.'}), 400
        
    try:
        cursor.execute("SELECT password_hash FROM users WHERE id = ?", (citizen_id,))
        user = cursor.fetchone()
        
        if not user or not check_password_hash(user['password_hash'], password):
            return jsonify({'success': False, 'message': 'Incorrect password.'}), 400
            
        cursor.execute("""
            UPDATE users 
            SET status = 'DEACTIVATED', full_name = 'Deactivated Citizen', email = NULL, phone = NULL 
            WHERE id = ?
        """, (citizen_id,))
        conn.commit()
        session.clear()
        
        return jsonify({'success': True, 'message': 'Your account has been deactivated.'})
    except Exception as e:
        print("Error deactivating account:", e)
        conn.rollback()
        return jsonify({'success': False, 'message': 'Failed to process account deletion.'}), 500
    finally:
        cursor.close()
        conn.close()

@citizen_api_bp.route('/map/data', methods=['GET'])
@citizen_api_required
def get_map_data():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    citizen_id = session['user_id']
    
    try:
        # Fetch citizen's requests
        cursor.execute("""
            SELECT id, request_id_code as ref_id, title, category, status, latitude, longitude, location, 'SERVICE_REQUEST' as type
            FROM citizen_requests 
            WHERE citizen_id = ? AND latitude IS NOT NULL AND longitude IS NOT NULL
        """, (citizen_id,))
        requests_data = cursor.fetchall()
        
        # Fetch citizen's reports
        cursor.execute("""
            SELECT id, report_id_code as ref_id, title, category, status, latitude, longitude, location, severity, 'REPORT' as type
            FROM citizen_reports 
            WHERE citizen_id = ? AND latitude IS NOT NULL AND longitude IS NOT NULL
        """, (citizen_id,))
        reports_data = cursor.fetchall()
        
        # Fetch public projects
        cursor.execute("""
            SELECT id, project_name as title, description, status, latitude, longitude, location, 'PROJECT' as type
            FROM projects 
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
            -- Assuming all projects here are public for now, or add a visibility check
        """)
        projects_data = cursor.fetchall()
        
        # Fetch public facilities
        cursor.execute("""
            SELECT id, name as title, type as category, status, latitude, longitude, 'FACILITY' as type
            FROM facilities 
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        """)
        facilities_data = cursor.fetchall()
        
        all_markers = requests_data + reports_data + projects_data + facilities_data
        
        return jsonify({'success': True, 'data': all_markers})
    except Exception as e:
        print("Map Data Error:", e)
        return jsonify({'success': False, 'message': 'Failed to load map data'}), 500
    finally:
        cursor.close()
        conn.close()

# Messaging Endpoints under /api/citizen
@citizen_api_bp.route('/messages', methods=['GET'])
@citizen_api_required
def citizen_get_messages():
    from routes.api_messages import get_conversations
    return get_conversations()

@citizen_api_bp.route('/messages/<string:conv_id>', methods=['GET'])
@citizen_api_required
def citizen_get_conversation(conv_id):
    from routes.api_messages import get_conversation_by_conv_id
    return get_conversation_by_conv_id(conv_id)

@citizen_api_bp.route('/messages/<string:conv_id>', methods=['POST'])
@citizen_api_required
def citizen_send_message(conv_id):
    from routes.api_messages import send_message_by_conv_id
    return send_message_by_conv_id(conv_id)

@citizen_api_bp.route('/messages/<string:conv_id>/read', methods=['PATCH'])
@citizen_api_required
def citizen_mark_read(conv_id):
    from routes.api_messages import parse_conversation_identifier, mark_conversation_as_read
    entity_type, entity_id = parse_conversation_identifier(conv_id)
    if not entity_type or not entity_id:
        return jsonify({'success': False, 'message': 'Invalid conversation ID'}), 400
    return mark_conversation_as_read(entity_type, entity_id)

@citizen_api_bp.route('/messages/unread-count', methods=['GET'])
@citizen_api_required
def citizen_unread_count():
    from routes.api_messages import get_unread_count
    return get_unread_count()

