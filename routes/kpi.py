from flask import Blueprint, request, redirect, url_for, session, flash, render_template
from services.kpi_engine import save_project_kpi
from config import get_db_connection
from routes.dashboard import login_required

kpi_bp = Blueprint('kpi', __name__)

@kpi_bp.route('/kpi/management')
@login_required
def management():
    if session.get('role') == 'Officer':
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT pk.*, k.name, k.target_value, k.unit, p.project_name, s.id as sdg_id 
            FROM project_kpis pk
            JOIN kpis k ON pk.kpi_id = k.id
            JOIN projects p ON pk.project_id = p.id
            JOIN sdgs s ON k.sdg_id = s.id
            WHERE p.manager_id = %s
            ORDER BY pk.updated_at ASC
        """, (session['user_id'],))
        kpis = cursor.fetchall()
        cursor.close()
        conn.close()
        return render_template('kpi/officer_updates.html', kpis=kpis)
        
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT k.*, s.name as sdg_name 
        FROM kpis k
        JOIN sdgs s ON k.sdg_id = s.id
        ORDER BY k.sdg_id ASC
    """)
    kpis = cursor.fetchall()
    cursor.close()
    conn.close()
    return render_template('kpi/management.html', kpis=kpis)

@kpi_bp.route('/projects/<int:project_id>/kpi/<int:kpi_id>', methods=['POST'])
@login_required
def update_project_kpi(project_id, kpi_id):
    if session.get('role') not in ['Admin', 'Officer']:
        return "Unauthorized", 403
        
    current_value = request.form.get('current_value')
    source = request.form.get('source', 'Self-Reported')
    
    # Simple evidence handling (in a real app, this would save the file)
    evidence_file = request.files.get('evidence_file')
    evidence_path = None
    if evidence_file and evidence_file.filename:
        # For simplicity, we just save the filename. 
        # In production this uses secure_filename and saves to UPLOAD_FOLDER
        evidence_path = evidence_file.filename
        
    if not current_value:
        flash("Value is required.", "danger")
        return redirect(url_for('projects.details', project_id=project_id))
        
    try:
        val = float(current_value)
        save_project_kpi(project_id, kpi_id, val, session['user_id'], source, evidence_path)
        
        # Trigger Data Quality Engine Recalculation
        from services.data_quality import calculate_data_quality_score
        calculate_data_quality_score(project_id)
        
        flash("KPI updated and SDG Score recalculated successfully.", "success")
    except ValueError:
        flash("Invalid KPI value.", "danger")
        
    return redirect(url_for('projects.details', project_id=project_id))
