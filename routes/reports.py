from flask import Blueprint, render_template, request, send_file, jsonify, redirect, url_for, flash, session
import os
from config import get_db_connection
from functools import wraps

reports_bp = Blueprint('reports', __name__)

def officer_or_admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('role') not in ['Admin', 'Officer']:
            flash('Admin or Officer access required.', 'danger')
            return redirect(url_for('dashboard.index'))
        return f(*args, **kwargs)
    return decorated_function

@reports_bp.route('/reports')
@officer_or_admin_required
def index():
    conn = get_db_connection()
    if not conn:
        flash("Database error", "danger")
        return redirect(url_for('dashboard.index'))
    cursor = conn.cursor(dictionary=True)
    
    is_officer = session.get('role') == 'Officer'
    user_id = session.get('user_id')
    
    # Fetch options for filters
    if is_officer:
        cursor.execute("""
            SELECT DISTINCT d.id, d.name 
            FROM departments d
            JOIN projects p ON p.department_id = d.id
            WHERE p.manager_id = %s
        """, (user_id,))
    else:
        cursor.execute("SELECT id, name FROM departments")
    departments = cursor.fetchall()
    
    if is_officer:
        cursor.execute("SELECT id, project_name FROM projects WHERE manager_id = %s", (user_id,))
    else:
        cursor.execute("SELECT id, project_name FROM projects")
    projects = cursor.fetchall()
    
    cursor.execute("SELECT id, name FROM sdgs")
    sdgs = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return render_template('reports/index.html', departments=departments, projects=projects, sdgs=sdgs)

@reports_bp.route('/api/admin/reports/preview/<report_type>')
@officer_or_admin_required
def preview_report(report_type):
    from services.report_engine import get_report_data
    
    # Extract filters from request args
    filters = {
        'department_id': request.args.get('department_id'),
        'project_id': request.args.get('project_id'),
        'sdg_id': request.args.get('sdg_id'),
        'status': request.args.get('status'),
        'risk_level': request.args.get('risk_level')
    }
    
    data = get_report_data(report_type, filters)
    
    if data is None or (isinstance(data, dict) and not data.get('records') and not data.get('summary')):
        return jsonify({'success': False, 'message': 'Insufficient data to generate this report.'})
        
    return jsonify({
        'success': True,
        'data': data
    })

@reports_bp.route('/reports/download/<report_type>')
@officer_or_admin_required
def download_report(report_type):
    from services.report_engine import get_report_data, generate_pdf_report, generate_csv_report
    
    format_type = request.args.get('format', 'pdf')
    
    filters = {
        'department_id': request.args.get('department_id'),
        'project_id': request.args.get('project_id'),
        'sdg_id': request.args.get('sdg_id'),
        'status': request.args.get('status'),
        'risk_level': request.args.get('risk_level')
    }
    
    data = get_report_data(report_type, filters)
    if data is None or (isinstance(data, dict) and not data.get('records') and not data.get('summary')):
        flash("Insufficient data to generate this report.", "warning")
        return redirect(url_for('reports.index'))
        
    export_dir = os.path.join(os.path.abspath(os.path.dirname(__file__)), '../exports')
    os.makedirs(export_dir, exist_ok=True)
    
    filename = f"{report_type}_report_{session.get('user_id')}.{format_type}"
    filepath = os.path.join(export_dir, filename)
    
    if format_type == 'pdf':
        success = generate_pdf_report(data, report_type, filters, filepath)
        if success and os.path.exists(filepath):
            return send_file(filepath, as_attachment=True, download_name=f"{report_type}_report.pdf", mimetype='application/pdf')
    elif format_type == 'csv':
        csv_data = generate_csv_report(data, report_type)
        if csv_data:
            from io import BytesIO
            return send_file(
                BytesIO(csv_data.encode('utf-8')),
                mimetype='text/csv',
                as_attachment=True,
                download_name=f"{report_type}_report.csv"
            )
            
    flash("Failed to generate report.", "danger")
    return redirect(url_for('reports.index'))

# Keep existing project report route for backwards compatibility if needed
@reports_bp.route('/projects/<int:project_id>/report')
@officer_or_admin_required
def project_report(project_id):
    export_dir = os.path.join(os.path.abspath(os.path.dirname(__file__)), '../exports')
    os.makedirs(export_dir, exist_ok=True)
    
    filename = f"report_project_{project_id}.pdf"
    filepath = os.path.join(export_dir, filename)
    
    # Use the new engine methods for a single project report
    from services.report_engine import get_report_data, generate_pdf_report
    data = get_report_data('project_performance', {'project_id': project_id})
    if data:
        success = generate_pdf_report(data, 'project_performance', {'project_id': project_id}, filepath)
        if success and os.path.exists(filepath):
            return send_file(filepath, as_attachment=True, download_name=filename, mimetype='application/pdf')
            
    flash("Failed to generate report.", "danger")
    return redirect(url_for('projects.details', project_id=project_id))
