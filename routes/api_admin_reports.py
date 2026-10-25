from flask import Blueprint, request, jsonify, send_file, session
import os
import json
from config import get_db_connection
from functools import wraps
from datetime import datetime

api_admin_reports_bp = Blueprint('api_admin_reports', __name__)

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('role', '').upper() not in ['ADMIN', 'SUPER_ADMIN']:
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

# Record Audit Log
def log_audit(action, report_type, filters, user_id):
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            new_value = json.dumps({'report_type': report_type, 'filters': filters})
            cursor.execute(
                "INSERT INTO audit_logs (user_id, action, module, entity, entity_id, new_value, result) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (user_id, action, 'Reports', 'Report', 0, new_value, 'SUCCESS')
            )
            conn.commit()
            cursor.close()
        except Exception as e:
            print("Audit log failed:", e)
        finally:
            conn.close()

@api_admin_reports_bp.route('/history', methods=['GET'])
@admin_required
def get_report_history():
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database error'}), 500
        
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT r.*, u.full_name as generated_by_name 
            FROM reports r
            LEFT JOIN users u ON r.generated_by = u.id
            ORDER BY r.created_at DESC
        """)
        reports = cursor.fetchall()
        
        # Format dates and filters
        for r in reports:
            r['created_at'] = str(r['created_at'])
            if r['filters']:
                try:
                    r['filters'] = json.loads(r['filters'])
                except:
                    pass
        
        return jsonify({'success': True, 'data': reports})
    except Exception as e:
        print("Error fetching history:", e)
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@api_admin_reports_bp.route('/preview/<report_type>', methods=['POST'])
@admin_required
def preview_report(report_type):
    from services.report_engine import get_report_data
    filters = request.json or {}
    
    data = get_report_data(report_type, filters)
    if data is None:
        return jsonify({'success': False, 'message': 'Unable to generate preview. Check data quality or inputs.'}), 400
        
    return jsonify({'success': True, 'data': data})

@api_admin_reports_bp.route('/generate', methods=['POST'])
@admin_required
def generate_report():
    from services.report_engine import get_report_data, generate_pdf_report, generate_excel_report, generate_csv_report
    req = request.json
    
    if not req or 'report_type' not in req:
        return jsonify({'success': False, 'message': 'Missing report type'}), 400
        
    report_type = req['report_type']
    export_format = req.get('format', 'pdf')
    filters = req.get('filters', {})
    title = req.get('title', f"{report_type.replace('_', ' ').title()} Report")
    
    data = get_report_data(report_type, filters)
    if not data or (not data.get('records') and not data.get('summary')):
        return jsonify({'success': False, 'message': 'No data available for the selected filters.'}), 400
        
    export_dir = os.path.join(os.path.abspath(os.path.dirname(__file__)), '../exports')
    os.makedirs(export_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"{report_type}_{timestamp}.{export_format}"
    filepath = os.path.join(export_dir, filename)
    
    success = False
    if export_format == 'pdf':
        success = generate_pdf_report(data, report_type, filters, filepath)
    elif export_format == 'xlsx':
        success = generate_excel_report(data, report_type, filepath)
    elif export_format == 'csv':
        csv_data = generate_csv_report(data, report_type)
        if csv_data:
            with open(filepath, 'w', newline='', encoding='utf-8') as f:
                f.write(csv_data)
            success = True
            
    if not success or not os.path.exists(filepath):
        return jsonify({'success': False, 'message': 'Failed to build report file.'}), 500
        
    # Save to history
    conn = get_db_connection()
    report_id = None
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute(
                """INSERT INTO reports (title, report_type, file_path, generated_by, filters, status, period) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (title, report_type, filepath, session.get('user_id'), json.dumps(filters), 'COMPLETED', filters.get('date_range', 'All Time'))
            )
            conn.commit()
            report_id = cursor.lastrowid
            cursor.close()
        except Exception as e:
            print("Failed to save report history", e)
        finally:
            conn.close()
            
    # Audit log
    log_audit('Generated Report', report_type, filters, session.get('user_id'))
    
    from services.notification_service import broadcast_notification_to_role
    broadcast_notification_to_role(
        'ADMIN',
        'Report Generated',
        f"A new {report_type.replace('_', ' ').title()} report has been generated successfully.",
        notif_type='REPORT',
        priority='INFO',
        module='Reports',
        entity_type='Report',
        entity_id=report_id,
        action_url='/admin/reports'
    )
    
    return jsonify({
        'success': True, 
        'message': 'Report generated successfully.',
        'data': {
            'report_id': report_id,
            'filename': filename,
            'format': export_format
        }
    })

@api_admin_reports_bp.route('/download/<int:report_id>', methods=['GET'])
@admin_required
def download_report(report_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database error'}), 500
        
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT file_path, title, report_type FROM reports WHERE id = %s", (report_id,))
        report = cursor.fetchone()
        
        if not report or not os.path.exists(report['file_path']):
            return jsonify({'success': False, 'message': 'Report file not found.'}), 404
            
        ext = report['file_path'].split('.')[-1]
        download_name = f"{report['title'].replace(' ', '_')}.{ext}"
        
        # Map mime types
        mimetype = 'application/pdf'
        if ext == 'csv': mimetype = 'text/csv'
        elif ext == 'xlsx': mimetype = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        
        log_audit('Downloaded Report', report['report_type'], {'id': report_id}, session.get('user_id'))
        
        return send_file(report['file_path'], as_attachment=True, download_name=download_name, mimetype=mimetype)
    except Exception as e:
        print("Download error:", e)
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        conn.close()

@api_admin_reports_bp.route('/<int:report_id>', methods=['DELETE'])
@admin_required
def delete_report(report_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'message': 'Database error'}), 500
        
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT file_path, report_type FROM reports WHERE id = %s", (report_id,))
        report = cursor.fetchone()
        
        if report:
            if os.path.exists(report['file_path']):
                os.remove(report['file_path'])
            cursor.execute("DELETE FROM reports WHERE id = %s", (report_id,))
            conn.commit()
            
            log_audit('Deleted Report', report['report_type'], {'id': report_id}, session.get('user_id'))
            
        return jsonify({'success': True, 'message': 'Report deleted.'})
    except Exception as e:
        print("Delete error:", e)
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        conn.close()
