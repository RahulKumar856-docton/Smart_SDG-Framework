from flask import Blueprint, render_template, session
from config import get_db_connection
from routes.dashboard import login_required

sdg_bp = Blueprint('sdg', __name__)

@sdg_bp.route('/sdg')
@login_required
def center():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    is_officer = session.get('role') == 'Officer'
    user_id = session.get('user_id')
    
    if is_officer:
        cursor.execute("""
            SELECT AVG(ss.score) as avg_score 
            FROM sdg_scores ss
            JOIN projects p ON ss.project_id = p.id
            WHERE p.manager_id = %s
        """, (user_id,))
    else:
        cursor.execute("SELECT AVG(score) as avg_score FROM sdg_scores")
        
    res = cursor.fetchone()
    overall = res['avg_score'] if res and res['avg_score'] else 0
    
    if is_officer:
        cursor.execute("""
            SELECT ss.sdg_id, AVG(ss.score) as avg_score, AVG(ss.gap) as avg_gap 
            FROM sdg_scores ss
            JOIN projects p ON ss.project_id = p.id
            WHERE p.manager_id = %s
            GROUP BY ss.sdg_id
        """, (user_id,))
    else:
        cursor.execute("""
            SELECT sdg_id, AVG(score) as avg_score, AVG(gap) as avg_gap 
            FROM sdg_scores GROUP BY sdg_id
        """)
        
    sdg_stats = {row['sdg_id']: row for row in cursor.fetchall()}
    
    cursor.close()
    conn.close()
    
    return render_template('sdg/center.html', overall=overall, stats=sdg_stats)

@sdg_bp.route('/sdg/<int:sdg_id>')
@login_required
def detail(sdg_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    is_officer = session.get('role') == 'Officer'
    user_id = session.get('user_id')
    
    # Get SDG info
    cursor.execute("SELECT * FROM sdgs WHERE id = %s", (sdg_id,))
    sdg_info = cursor.fetchone()
    
    if not sdg_info:
        cursor.close()
        conn.close()
        return "Goal not found", 404
        
    # Get average score & gap for this SDG
    if is_officer:
        cursor.execute("""
            SELECT AVG(ss.score) as avg_score, AVG(ss.gap) as avg_gap 
            FROM sdg_scores ss
            JOIN projects p ON ss.project_id = p.id
            WHERE ss.sdg_id = %s AND p.manager_id = %s
        """, (sdg_id, user_id))
    else:
        cursor.execute("SELECT AVG(score) as avg_score, AVG(gap) as avg_gap FROM sdg_scores WHERE sdg_id = %s", (sdg_id,))
    agg = cursor.fetchone()
    
    score = round(agg['avg_score'] or 0, 1) if agg else 0
    gap = round(agg['avg_gap'] or 0, 1) if agg else 0
    
    # Calculate confidence for projects linked to this SDG
    if is_officer:
        cursor.execute("""
            SELECT AVG(p.data_confidence) as conf 
            FROM projects p 
            JOIN project_sdgs ps ON p.id = ps.project_id 
            WHERE ps.sdg_id = %s AND p.manager_id = %s
        """, (sdg_id, user_id))
    else:
        cursor.execute("""
            SELECT AVG(p.data_confidence) as conf 
            FROM projects p 
            JOIN project_sdgs ps ON p.id = ps.project_id 
            WHERE ps.sdg_id = %s
        """, (sdg_id,))
    conf = cursor.fetchone()
    confidence = round(conf['conf'] or 0, 1) if conf else 0
    
    status = 'On Track'
    status_color = 'success'
    if score < 50:
        status = 'Needs Improvement'
        status_color = 'danger'
    elif score < 80:
        status = 'Moderate'
        status_color = 'warning'
        
    sdg_data = {
        'id': sdg_info['id'],
        'name': sdg_info['name'],
        'color': sdg_info['color'],
        'score': score,
        'gap': gap,
        'confidence': confidence,
        'status': status,
        'status_color': status_color
    }
    
    # Get KPIs
    if is_officer:
        cursor.execute("""
            SELECT k.*, pk.current_value, pk.achievement_percentage, pk.updated_at 
            FROM kpis k 
            LEFT JOIN project_kpis pk ON k.id = pk.kpi_id 
            LEFT JOIN projects p ON pk.project_id = p.id
            WHERE k.sdg_id = %s AND (p.manager_id = %s OR p.manager_id IS NULL)
            GROUP BY k.id
        """, (sdg_id, user_id))
    else:
        cursor.execute("""
            SELECT k.*, pk.current_value, pk.achievement_percentage, pk.updated_at 
            FROM kpis k 
            LEFT JOIN project_kpis pk ON k.id = pk.kpi_id 
            WHERE k.sdg_id = %s
            GROUP BY k.id
        """, (sdg_id,))
    kpis = cursor.fetchall()
    
    # Get Contributing Projects
    if is_officer:
        cursor.execute("""
            SELECT p.id, p.project_name, p.status, p.progress_percentage, ss.score
            FROM projects p
            JOIN sdg_scores ss ON p.id = ss.project_id
            WHERE ss.sdg_id = %s AND p.manager_id = %s
        """, (sdg_id, user_id))
    else:
        cursor.execute("""
            SELECT p.id, p.project_name, p.status, p.progress_percentage, ss.score
            FROM projects p
            JOIN sdg_scores ss ON p.id = ss.project_id
            WHERE ss.sdg_id = %s
        """, (sdg_id,))
    projects = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return render_template('sdg/detail.html', sdg=sdg_data, kpis=kpis, projects=projects)
