from flask import Blueprint, jsonify, request, session
from services.data_quality import calculate_data_quality, run_data_quality_scan
from config import get_db_connection
from datetime import datetime

api_data_quality_bp = Blueprint('api_data_quality', __name__)

def admin_required(f):
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('role', '').upper() != 'ADMIN':
            return jsonify({'success': False, 'message': 'Unauthorized'}), 403
        return f(*args, **kwargs)
    return decorated_function

@api_data_quality_bp.route('/summary', methods=['GET'])
@admin_required
def get_summary():
    try:
        data = calculate_data_quality()
        
        # Add module breakdown
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT module, COUNT(*) as issues_count, 
            SUM(CASE WHEN severity IN ('CRITICAL', 'HIGH') THEN 1 ELSE 0 END) as critical_count
            FROM data_quality_issues 
            WHERE status = 'OPEN' 
            GROUP BY module
        """)
        modules = cursor.fetchall()
        
        # Format modules
        mod_dict = {
            'Project': {'records': 0, 'issues': 0, 'critical': 0, 'score': 0},
            'Citizen Request': {'records': 0, 'issues': 0, 'critical': 0, 'score': 0},
            'Inspection': {'records': 0, 'issues': 0, 'critical': 0, 'score': 0},
            'Evidence': {'records': 0, 'issues': 0, 'critical': 0, 'score': 0},
            'Officer': {'records': 0, 'issues': 0, 'critical': 0, 'score': 0}
        }
        
        for m in modules:
            if m['module'] in mod_dict:
                mod_dict[m['module']]['issues'] = m['issues_count']
                mod_dict[m['module']]['critical'] = m['critical_count']
                
        # Get record counts
        cursor.execute("SELECT count(*) as c FROM projects")
        mod_dict['Project']['records'] = cursor.fetchone()['c']
        
        cursor.execute("SELECT count(*) as c FROM feedback")
        mod_dict['Citizen Request']['records'] = cursor.fetchone()['c']
        
        cursor.execute("SELECT count(*) as c FROM field_inspections")
        mod_dict['Inspection']['records'] = cursor.fetchone()['c']
        
        try:
            cursor.execute("SELECT count(*) as c FROM evidence")
            mod_dict['Evidence']['records'] = cursor.fetchone()['c']
        except:
            pass
            
        cursor.execute("SELECT count(*) as c FROM users WHERE role = 'Officer'")
        mod_dict['Officer']['records'] = cursor.fetchone()['c']
        
        # Calculate crude module scores
        for k, v in mod_dict.items():
            if v['records'] > 0:
                v['score'] = max(0, 100 - ((v['issues'] / v['records']) * 20))
            else:
                v['score'] = 100
                
        data['modules'] = [{'module': k, **v} for k, v in mod_dict.items()]
        
        cursor.close()
        conn.close()
        return jsonify(data)
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@api_data_quality_bp.route('/scan', methods=['POST'])
@admin_required
def run_scan():
    try:
        run_data_quality_scan()
        return jsonify({'success': True, 'message': 'Scan completed successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@api_data_quality_bp.route('/issues', methods=['GET'])
@admin_required
def get_issues():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    status_filter = request.args.get('status', 'OPEN')
    module_filter = request.args.get('module')
    
    query = "SELECT * FROM data_quality_issues WHERE 1=1"
    params = []
    
    if status_filter:
        query += " AND status = ?"
        params.append(status_filter)
        
    if module_filter:
        query += " AND module = ?"
        params.append(module_filter)
        
    query += " ORDER BY CASE severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END, detected_at DESC"
    
    cursor.execute(query, params)
    issues = cursor.fetchall()
    
    cursor.close()
    conn.close()
    return jsonify({'success': True, 'data': issues})

@api_data_quality_bp.route('/issues/<int:id>', methods=['GET'])
@admin_required
def get_issue(id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM data_quality_issues WHERE id = ?", (id,))
    issue = cursor.fetchone()
    cursor.close()
    conn.close()
    if issue:
        return jsonify({'success': True, 'data': issue})
    return jsonify({'success': False, 'message': 'Not found'}), 404

@api_data_quality_bp.route('/issues/<int:id>/resolve', methods=['PATCH'])
@admin_required
def resolve_issue(id):
    user_id = session.get('user_id')
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE data_quality_issues SET status = 'RESOLVED', resolved_at = ?, resolved_by = ? WHERE id = ?", (datetime.now(), user_id, id))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@api_data_quality_bp.route('/issues/<int:id>/ignore', methods=['PATCH'])
@admin_required
def ignore_issue(id):
    data = request.get_json()
    reason = data.get('reason')
    if not reason:
        return jsonify({'success': False, 'message': 'Reason is required'}), 400
        
    user_id = session.get('user_id')
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE data_quality_issues SET status = 'IGNORED', ignored_at = ?, ignored_by = ?, ignore_reason = ? WHERE id = ?", (datetime.now(), user_id, reason, id))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@api_data_quality_bp.route('/history', methods=['GET'])
@admin_required
def get_history():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM data_quality_scans ORDER BY started_at DESC LIMIT 20")
    scans = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify({'success': True, 'data': scans})
