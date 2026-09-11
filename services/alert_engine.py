from config import get_db_connection

def generate_alerts(project_id):
    """
    Checks conditions and generates warnings/alerts.
    """
    conn = get_db_connection()
    if not conn: return
    cursor = conn.cursor(dictionary=True)
    
    # Mark existing active alerts as resolved to re-evaluate
    cursor.execute("UPDATE alerts SET is_resolved = 1, resolved_at = CURRENT_TIMESTAMP WHERE project_id = %s AND is_resolved = 0", (project_id,))
    
    cursor.execute("SELECT * FROM projects WHERE id = %s", (project_id,))
    project = cursor.fetchone()
    
    cursor.execute("SELECT * FROM sdg_scores WHERE project_id = %s", (project_id,))
    sdg_scores = cursor.fetchall()
    
    alerts = []
    
    if project:
        progress = float(project['progress_percentage'])
        # Simplified expected progress (just assuming 100% at expected_end_date for now)
        # Ideally, this would be a time-based calculation.
        
        budget_alloc = float(project['allocated_budget'])
        budget_spent = float(project['amount_spent'])
        budget_util = (budget_spent / budget_alloc * 100) if budget_alloc > 0 else 0
        
        # Budget Warning
        if budget_util > progress + 20:
            alerts.append(('Budget Warning', 'WARNING', f'Budget utilization ({budget_util:.1f}%) exceeds progress ({progress:.1f}%).'))
            
        # SDG Warning
        for score in sdg_scores:
            if float(score['score']) < 50:
                alerts.append(('SDG Critical Alert', 'CRITICAL', f"SDG {score['sdg_id']} score is below 50%."))
                
        # Status Warning
        if project['status'] == 'Delayed':
            alerts.append(('Progress Warning', 'WARNING', 'Project is officially marked as Delayed.'))

    for alert in alerts:
        cursor.execute("""
            INSERT INTO alerts (project_id, alert_type, level, message)
            VALUES (%s, %s, %s, %s)
        """, (project_id, alert[0], alert[1], alert[2]))
        
    conn.commit()
    cursor.close()
    conn.close()
