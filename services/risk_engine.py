from config import get_db_connection
from datetime import datetime

def evaluate_project_risk(project_id):
    """
    Intelligent Risk Engine. Returns a detailed dictionary of risk categories and an explainable reasoning list.
    """
    conn = get_db_connection()
    if not conn: return None
    
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM projects WHERE id = %s", (project_id,))
    project = cursor.fetchone()
    
    if not project:
        cursor.close()
        conn.close()
        return None
        
    cursor.execute("SELECT AVG(score) as avg_score FROM sdg_scores WHERE project_id = %s", (project_id,))
    sdg_res = cursor.fetchone()
    avg_sdg = float(sdg_res['avg_score']) if sdg_res and sdg_res['avg_score'] else 0.0
    
    cursor.close()
    conn.close()
    
    progress = float(project['progress_percentage'])
    budget_alloc = float(project['allocated_budget'])
    budget_spent = float(project['amount_spent'])
    data_confidence = float(project.get('data_confidence', 0))
    
    budget_utilization = (budget_spent / budget_alloc * 100) if budget_alloc > 0 else 0
    
    risk_profile = {
        'overall': 'LOW',
        'progress_risk': 'LOW',
        'budget_risk': 'LOW',
        'kpi_risk': 'LOW',
        'data_risk': 'LOW',
        'deadline_risk': 'LOW',
        'reasons': []
    }
    
    high_count = 0
    med_count = 0
    
    # 1. Budget Risk
    if budget_utilization > progress + 25:
        risk_profile['budget_risk'] = 'HIGH'
        risk_profile['reasons'].append(f"Budget utilization ({budget_utilization:.0f}%) significantly exceeds progress ({progress:.0f}%).")
        high_count += 1
    elif budget_utilization > progress + 10:
        risk_profile['budget_risk'] = 'MEDIUM'
        risk_profile['reasons'].append(f"Budget utilization is running ahead of physical progress.")
        med_count += 1
        
    # 2. Progress Risk
    if project['status'] == 'Delayed':
        risk_profile['progress_risk'] = 'HIGH'
        risk_profile['reasons'].append("Project is officially marked as Delayed.")
        high_count += 1
    elif progress < 10 and budget_utilization > 20:
        risk_profile['progress_risk'] = 'HIGH'
        risk_profile['reasons'].append("Initial progress is severely stalled despite budget release.")
        high_count += 1
        
    # 3. KPI / SDG Risk
    if avg_sdg < 40 and progress > 30:
        risk_profile['kpi_risk'] = 'HIGH'
        risk_profile['reasons'].append(f"SDG performance is critically low ({avg_sdg:.1f}%) for this stage of completion.")
        high_count += 1
    elif avg_sdg < 60 and progress > 30:
        risk_profile['kpi_risk'] = 'MEDIUM'
        risk_profile['reasons'].append("SDG performance is below expected targets.")
        med_count += 1
        
    # 4. Data Risk
    if data_confidence < 50:
        risk_profile['data_risk'] = 'HIGH'
        risk_profile['reasons'].append(f"Data confidence is very low ({data_confidence:.1f}%). Missing critical verification or evidence.")
        high_count += 1
    elif data_confidence < 75:
        risk_profile['data_risk'] = 'MEDIUM'
        risk_profile['reasons'].append("Moderate data gaps detected in project KPIs or location.")
        med_count += 1
        
    # 5. Deadline Risk (Simple heuristic)
    if project.get('expected_end_date'):
        try:
            end_date = datetime.strptime(project['expected_end_date'], '%Y-%m-%d')
            days_left = (end_date - datetime.now()).days
            if days_left < 30 and progress < 80:
                risk_profile['deadline_risk'] = 'HIGH'
                risk_profile['reasons'].append(f"Only {days_left} days remaining, but progress is at {progress:.0f}%.")
                high_count += 1
            elif days_left < 90 and progress < 50:
                risk_profile['deadline_risk'] = 'MEDIUM'
                risk_profile['reasons'].append("Deadline approaching with less than half progress completed.")
                med_count += 1
        except Exception:
            pass # Ignore date parsing errors for demo
            
    # Calculate Overall
    if high_count >= 1 or med_count >= 3:
        risk_profile['overall'] = 'HIGH'
    elif med_count >= 1:
        risk_profile['overall'] = 'MEDIUM'
        
    if not risk_profile['reasons']:
        risk_profile['reasons'].append("All metrics are currently within normal operating parameters.")
        
    return risk_profile
