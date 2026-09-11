from config import get_db_connection

def calculate_project_sdg_scores(project_id):
    """
    Recalculates all SDG scores for a project based on its KPIs
    and updates the sdg_scores table.
    """
    conn = get_db_connection()
    if not conn: return False
    cursor = conn.cursor(dictionary=True)
    
    # Get all KPIs for the project
    cursor.execute("""
        SELECT pk.*, k.sdg_id, k.weight 
        FROM project_kpis pk
        JOIN kpis k ON pk.kpi_id = k.id
        WHERE pk.project_id = %s
    """, (project_id,))
    kpis = cursor.fetchall()
    
    # Group by SDG
    sdg_data = {}
    for k in kpis:
        sdg = k['sdg_id']
        if sdg not in sdg_data:
            sdg_data[sdg] = {'total_score': 0, 'total_weight': 0}
        sdg_data[sdg]['total_score'] += float(k['score'])
        sdg_data[sdg]['total_weight'] += float(k['weight'])
        
    for sdg_id, data in sdg_data.items():
        if data['total_weight'] > 0:
            final_score = data['total_score'] / data['total_weight']
        else:
            final_score = 0
            
        gap = 100.0 - final_score
        
        # Check if existing
        cursor.execute("SELECT id FROM sdg_scores WHERE project_id = %s AND sdg_id = %s", (project_id, sdg_id))
        existing = cursor.fetchone()
        
        if existing:
            cursor.execute("""
                UPDATE sdg_scores 
                SET score = %s, gap = %s
                WHERE id = %s
            """, (final_score, gap, existing['id']))
        else:
            cursor.execute("""
                INSERT INTO sdg_scores (project_id, sdg_id, score, target_score, gap)
                VALUES (%s, %s, %s, %s, %s)
            """, (project_id, sdg_id, final_score, 100.0, gap))
            
    conn.commit()
    cursor.close()
    conn.close()
    return True

def get_overall_sustainability_score(project_id):
    conn = get_db_connection()
    if not conn: return 0.0
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT AVG(score) as avg_score FROM sdg_scores WHERE project_id = %s", (project_id,))
    res = cursor.fetchone()
    cursor.close()
    conn.close()
    if res and res['avg_score']:
        return float(res['avg_score'])
    return 0.0
