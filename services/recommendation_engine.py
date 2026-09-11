from config import get_db_connection

def generate_recommendations(project_id):
    """
    Generates recommendations based on project progress, budget, and SDG scores.
    """
    conn = get_db_connection()
    if not conn: return
    cursor = conn.cursor(dictionary=True)
    
    # Clean up old recommendations for this project
    cursor.execute("DELETE FROM recommendations WHERE project_id = %s", (project_id,))
    
    cursor.execute("SELECT * FROM projects WHERE id = %s", (project_id,))
    project = cursor.fetchone()
    
    cursor.execute("SELECT * FROM sdg_scores WHERE project_id = %s", (project_id,))
    sdg_scores = cursor.fetchall()
    
    recs = []
    
    if project:
        progress = float(project['progress_percentage'])
        budget_alloc = float(project['allocated_budget'])
        budget_spent = float(project['amount_spent'])
        budget_util = (budget_spent / budget_alloc * 100) if budget_alloc > 0 else 0
        
        if project['status'] == 'Delayed':
            recs.append({
                'problem': 'Project is delayed.',
                'cause': 'Schedule overrun.',
                'recommended_action': 'Increase project monitoring and review the remaining activities.',
                'priority': 'High'
            })
            
        if budget_util > progress + 20:
            recs.append({
                'problem': 'High budget utilization compared with project progress.',
                'cause': 'Possible overspending or delayed physical progress.',
                'recommended_action': 'Review expenditure and remaining project requirements immediately.',
                'priority': 'Critical'
            })
            
        for score in sdg_scores:
            val = float(score['score'])
            sdg = score['sdg_id']
            if val < 50:
                action = 'Improve related activities.'
                if sdg == 6: action = 'Prioritize water supply and sanitation activities.'
                elif sdg == 11: action = 'Focus on sustainable infrastructure and waste management.'
                elif sdg == 13: action = 'Improve climate-resilience and emission reduction activities.'
                elif sdg == 15: action = 'Increase green-cover and land-restoration activities.'
                
                recs.append({
                    'problem': f'SDG {sdg} performance is low ({val}%).',
                    'cause': 'KPI targets are not being met.',
                    'recommended_action': action,
                    'priority': 'High'
                })
                
    for rec in recs:
        cursor.execute("""
            INSERT INTO recommendations (project_id, problem, cause, recommended_action, priority)
            VALUES (%s, %s, %s, %s, %s)
        """, (project_id, rec['problem'], rec['cause'], rec['recommended_action'], rec['priority']))
        
    conn.commit()
    cursor.close()
    conn.close()
    
    return recs
