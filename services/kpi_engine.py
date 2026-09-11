from config import get_db_connection

def calculate_kpi_score(kpi_id, current_value):
    """
    Calculates achievement percentage and weighted score for a KPI
    """
    conn = get_db_connection()
    if not conn: return 0, 0
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT target_value, weight FROM kpis WHERE id = %s", (kpi_id,))
    kpi = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not kpi: return 0, 0
    
    target = float(kpi['target_value'])
    weight = float(kpi['weight'])
    val = float(current_value)
    
    achievement_pct = min((val / target) * 100 if target > 0 else 0, 100.0)
    score = achievement_pct * weight
    
    return achievement_pct, score

def update_project_sdg_score(project_id, sdg_id):
    """
    Recalculates the SDG score based on KPI weights and achievements
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Calculate weighted sum
    cursor.execute("""
        SELECT SUM(pk.score) as total_weighted_score, SUM(k.weight) as total_weight
        FROM project_kpis pk
        JOIN kpis k ON pk.kpi_id = k.id
        WHERE pk.project_id = %s AND k.sdg_id = %s
    """, (project_id, sdg_id))
    
    res = cursor.fetchone()
    
    if res and res['total_weight'] and res['total_weight'] > 0:
        final_sdg_score = res['total_weighted_score'] / res['total_weight']
    else:
        final_sdg_score = 0
        
    gap = max(0, 100 - final_sdg_score)
    
    # Update or insert sdg_scores
    cursor.execute("SELECT id FROM sdg_scores WHERE project_id = %s AND sdg_id = %s", (project_id, sdg_id))
    existing = cursor.fetchone()
    
    if existing:
        cursor.execute("UPDATE sdg_scores SET score = %s, gap = %s, calculated_at = CURRENT_TIMESTAMP WHERE id = %s",
                      (final_sdg_score, gap, existing['id']))
    else:
        cursor.execute("INSERT INTO sdg_scores (project_id, sdg_id, score, gap) VALUES (%s, %s, %s, %s)",
                      (project_id, sdg_id, final_sdg_score, gap))
                      
    conn.commit()
    cursor.close()
    conn.close()
    return final_sdg_score

def save_project_kpi(project_id, kpi_id, current_value, user_id, source="Self-Reported", evidence_path=None):
    achievement_pct, score = calculate_kpi_score(kpi_id, current_value)
    
    conn = get_db_connection()
    if not conn: return False
    cursor = conn.cursor(dictionary=True)
    
    # Get SDG ID for this KPI
    cursor.execute("SELECT sdg_id FROM kpis WHERE id = %s", (kpi_id,))
    kpi_meta = cursor.fetchone()
    sdg_id = kpi_meta['sdg_id'] if kpi_meta else None
    
    cursor.execute("SELECT id FROM project_kpis WHERE project_id = %s AND kpi_id = %s", (project_id, kpi_id))
    existing = cursor.fetchone()
    
    if existing:
        cursor.execute("""
            UPDATE project_kpis 
            SET current_value = %s, achievement_percentage = %s, score = %s, updated_by = %s, 
                source = %s, evidence_path = %s, verification_status = 'Reported'
            WHERE id = %s
        """, (current_value, achievement_pct, score, user_id, source, evidence_path, existing['id']))
    else:
        cursor.execute("""
            INSERT INTO project_kpis (project_id, kpi_id, current_value, achievement_percentage, score, updated_by, source, evidence_path, verification_status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'Reported')
        """, (project_id, kpi_id, current_value, achievement_pct, score, user_id, source, evidence_path))
        
    conn.commit()
    cursor.close()
    conn.close()
    
    # Recalculate SDG
    if sdg_id:
        update_project_sdg_score(project_id, sdg_id)
        
    return True

