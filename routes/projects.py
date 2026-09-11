from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from models.project import Project
from routes.dashboard import login_required
from services.sdg_engine import calculate_project_sdg_scores, get_overall_sustainability_score
from services.risk_engine import evaluate_project_risk
from services.recommendation_engine import generate_recommendations
from services.alert_engine import generate_alerts
from services.impact_engine import calculate_impact_index
from config import get_db_connection

projects_bp = Blueprint('projects', __name__)

@projects_bp.route('/projects')
@login_required
def list_projects():
    manager_id = session['user_id'] if session.get('role') == 'Officer' else None
    projects = Project.get_all(manager_id=manager_id)
    return render_template('projects/list.html', projects=projects)

@projects_bp.route('/projects/<int:project_id>')
@login_required
def details(project_id):
    project = Project.get_by_id(project_id)
    if not project:
        return "Project not found", 404
        
    if session.get('role') == 'Officer' and project.get('manager_id') != session.get('user_id'):
        return "Unauthorized", 403
        
    sdgs = Project.get_project_sdgs(project_id)
    
    # Trigger calculations dynamically for demo purposes
    calculate_project_sdg_scores(project_id)
    generate_recommendations(project_id)
    generate_alerts(project_id)
    
    overall_score = get_overall_sustainability_score(project_id)
    risk_level = evaluate_project_risk(project_id)
    impact_data = calculate_impact_index(project_id)
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("SELECT * FROM sdg_scores WHERE project_id = %s", (project_id,))
    sdg_scores = cursor.fetchall()
    
    cursor.execute("SELECT * FROM recommendations WHERE project_id = %s", (project_id,))
    recommendations = cursor.fetchall()
    
    cursor.execute("SELECT * FROM alerts WHERE project_id = %s AND is_resolved = 0", (project_id,))
    alerts = cursor.fetchall()
    
    cursor.execute("""
        SELECT pk.*, k.name as kpi_name, k.target_value, k.unit, s.name as sdg_name
        FROM project_kpis pk
        JOIN kpis k ON pk.kpi_id = k.id
        JOIN sdgs s ON k.sdg_id = s.id
        WHERE pk.project_id = %s
    """, (project_id,))
    kpis = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    # Generate Predictions
    from services.prediction_engine import predict_project_delay
    delay_prediction = predict_project_delay(project_id)
    
    return render_template('projects/details.html', 
                           project=project, sdgs=sdgs, sdg_scores=sdg_scores,
                           overall_score=round(overall_score, 2), risk_level=risk_level,
                           recommendations=recommendations, alerts=alerts, kpis=kpis,
                           impact_data=impact_data, delay_prediction=delay_prediction)

@projects_bp.route('/projects/create', methods=['GET', 'POST'])
@login_required
def create():
    if session.get('role') not in ['Admin', 'Officer']:
        return "Unauthorized", 403
        
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    if request.method == 'POST':
        name = request.form['name']
        description = request.form['description']
        department_id = request.form['department_id']
        status = request.form['status']
        end_date = request.form['end_date']
        budget = request.form['budget']
        priority = request.form['priority']
        manager_id = request.form['manager_id']
        location = request.form['location']
        lat = request.form['lat']
        lng = request.form['lng']
        target_sdg = request.form['target_sdg']
        population_benefited = request.form['population_benefited']
        start_date = request.form['start_date']
        
        cursor.execute("""
            INSERT INTO projects (project_name, description, department_id, status, expected_end_date, allocated_budget, priority, manager_id, location, latitude, longitude, target_sdg, population_benefited, start_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (name, description, department_id, status, end_date, budget, priority, manager_id, location, lat, lng, target_sdg, population_benefited, start_date))
        conn.commit()
        
        project_id = cursor.lastrowid
        cursor.close()
        conn.close()
        
        # Audit log
        from services.audit_logger import log_audit
        log_audit(session['user_id'], 'CREATE', 'Project', project_id, f"Created project: {name}")
        
        flash("Project created successfully.", "success")
        return redirect(url_for('projects.list_projects'))
        
    cursor.execute("SELECT * FROM departments")
    departments = cursor.fetchall()
    
    cursor.execute("SELECT * FROM sdgs")
    sdgs = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return render_template('projects/create.html', departments=departments, sdgs=sdgs)
