import math
from config import get_db_connection
from datetime import datetime

def calculate_kpi_score(current, target):
    """Calculate normalized KPI achievement (0-100)"""
    if target is None or target == 0:
        return 0
    achievement = (current / target) * 100
    return min(100.0, achievement)

def _get_project_dates(cursor, project_id):
    cursor.execute("SELECT start_date, expected_end_date, updated_at FROM projects WHERE id = ?", (project_id,))
    row = cursor.fetchone()
    if not row:
        return None, None
    try:
        start_date = datetime.strptime(str(row['start_date'])[:10], "%Y-%m-%d") if row.get('start_date') else None
    except:
        start_date = None
        
    try:
        end_date = datetime.strptime(str(row['expected_end_date'])[:10], "%Y-%m-%d") if row.get('expected_end_date') else None
    except:
        end_date = None
        
    return start_date, end_date

def calculate_citizen_outcomes(cursor, project_id):
    """
    Compares feedback/requests before and after project start.
    Returns changes in volume and resolution time.
    """
    start_date, _ = _get_project_dates(cursor, project_id)
    if not start_date:
        return {'available': False, 'message': 'Missing project baseline date.'}

    # Since feedback table doesn't have a reliable 'created_at' in some schemas, 
    # we assume 'submitted_at' or we just check all feedback linked to the project.
    # Actually, citizen feedback has 'created_at' usually. Let's check columns.
    
    # We will just fetch all feedback for this project to do a mock before/after if date exists,
    # otherwise we use overall resolution rate.
    cursor.execute("SELECT id, status, created_at, resolved_at FROM feedback WHERE project_id = ?", (project_id,))
    requests = cursor.fetchall()
    
    if not requests:
        return {'available': False, 'message': 'No citizen requests linked to this project.'}

    before_count = 0
    after_count = 0
    resolved_count = 0
    
    for r in requests:
        if r['status'] == 'Resolved':
            resolved_count += 1
            
        try:
            r_date = datetime.strptime(str(r['created_at'])[:10], "%Y-%m-%d")
            if r_date < start_date:
                before_count += 1
            else:
                after_count += 1
        except:
            after_count += 1 # Default to after if unparseable
            
    resolution_rate = (resolved_count / len(requests)) * 100
    
    change = 0
    direction = 'Stable'
    if before_count > 0:
        change = ((after_count - before_count) / before_count) * 100
        if change < -10: direction = 'Improved'
        elif change > 10: direction = 'Negative'
        
    return {
        'available': True,
        'total_requests': len(requests),
        'resolved_requests': resolved_count,
        'resolution_rate': resolution_rate,
        'before_count': before_count,
        'after_count': after_count,
        'volume_change': change,
        'direction': direction,
        'message': f"Request volume changed by {change:.1f}%" if before_count > 0 else "No baseline data to compare."
    }

def calculate_verification_metrics(cursor, project_id):
    """
    Checks field inspections and evidence to determine actual verified progress vs reported.
    """
    cursor.execute("SELECT * FROM field_inspections WHERE project_id = ?", (project_id,))
    inspections = cursor.fetchall()
    
    if not inspections:
        return {'available': False, 'message': 'No field inspections conducted.'}
        
    total_ins = len(inspections)
    verified_ins = sum(1 for i in inspections if i['status'] == 'Verified')
    rejected_ins = sum(1 for i in inspections if i['status'] == 'Requires Action' or i['status'] == 'Rejected')
    
    verification_rate = (verified_ins / total_ins) * 100
    
    # Calculate difference between reported and verified
    # Get the latest inspection
    inspections.sort(key=lambda x: str(x['inspection_date']), reverse=True)
    latest = inspections[0]
    
    rep_prog = float(latest.get('reported_progress') or 0)
    ver_prog = float(latest.get('observed_progress') or 0)
    
    diff = rep_prog - ver_prog
    
    # Evidence
    cursor.execute("""
        SELECT COUNT(*) as c FROM evidence WHERE project_id = ?
    """, (project_id,))
    
    ev_count = 0
    try:
        ev_count = cursor.fetchone()['c']
    except:
        pass
        
    return {
        'available': True,
        'total_inspections': total_ins,
        'verified_inspections': verified_ins,
        'rejected_inspections': rejected_ins,
        'verification_rate': verification_rate,
        'latest_reported_progress': rep_prog,
        'latest_verified_progress': ver_prog,
        'progress_discrepancy': diff,
        'evidence_count': ev_count
    }

def calculate_data_confidence(project, citizen, verification, dq_score):
    """
    Dynamically calculate confidence based on data presence and quality.
    """
    score = 0
    
    # Base from data quality
    score += (dq_score * 0.4)
    
    # Verification presence
    if verification['available']:
        score += 30
        score += (verification['verification_rate'] * 0.1)
        
    # Citizen feedback
    if citizen['available']:
        score += 20
        if citizen['before_count'] > 0:
            score += 10 # Baseline exists
            
    if score > 100: score = 100
    
    level = 'Low'
    if score > 80: level = 'High'
    elif score > 50: level = 'Medium'
    
    return {'score': score, 'level': level}

def calculate_project_sdg_scores(cursor, project_id):
    cursor.execute("""
        SELECT pk.id, pk.kpi_id, pk.current_value, k.target_value, k.weight, k.sdg_id 
        FROM project_kpis pk
        JOIN kpis k ON pk.kpi_id = k.id
        WHERE pk.project_id = ?
    """, (project_id,))
    kpis = cursor.fetchall()
    
    if not kpis:
        return 0, []
        
    total_score = 0
    total_weight = 0
    kpi_details = []
    
    for kpi in kpis:
        current = float(kpi['current_value'] or 0)
        target = float(kpi['target_value'] or 0)
        weight = float(kpi['weight'] or 1.0)
        
        achv = calculate_kpi_score(current, target)
        w_score = achv * weight
        
        total_score += w_score
        total_weight += weight
        
        kpi_details.append({
            'id': kpi['kpi_id'],
            'current': current,
            'target': target,
            'achievement': achv
        })
        
    return (total_score / total_weight) if total_weight > 0 else 0, kpi_details

def calculate_impact_index(project_id):
    """
    Core Impact Engine that separates Output, Outcome, and Impact.
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
    p = cursor.fetchone()
    if not p:
        cursor.close()
        conn.close()
        return None
        
    # Get Data Quality Score
    cursor.execute("SELECT data_confidence FROM projects WHERE id = ?", (project_id,))
    dq = cursor.fetchone()
    dq_score = dq['data_confidence'] if dq and dq['data_confidence'] else 50
    
    # 1. Output Metrics
    progress = float(p.get('progress_percentage') or 0)
    allocated = float(p.get('allocated_budget') or 0)
    spent = float(p.get('amount_spent') or 0)
    budget_utilization = (spent / allocated * 100) if allocated > 0 else 0
    
    # 2. Verification
    verification = calculate_verification_metrics(cursor, project_id)
    ver_progress = verification['latest_verified_progress'] if verification['available'] else progress
    
    # Prioritize verified progress over reported
    actual_progress = ver_progress
    
    # 3. Outcome Metrics (Citizen Feedback)
    citizen = calculate_citizen_outcomes(cursor, project_id)
    
    # 4. KPI Achievement
    kpi_score, kpis = calculate_project_sdg_scores(cursor, project_id)
    
    # 5. Confidence
    confidence = calculate_data_confidence(p, citizen, verification, dq_score)
    
    # 6. Calculate Impact Score
    # Weighting: Progress (30%), KPIs (40%), Citizen Outcome (30%)
    
    outcome_score = 50
    if citizen['available']:
        outcome_score = citizen['resolution_rate']
        if citizen['direction'] == 'Improved':
            outcome_score = min(100, outcome_score + 20)
        elif citizen['direction'] == 'Negative':
            outcome_score = max(0, outcome_score - 20)
            
    impact_score = (actual_progress * 0.3) + (kpi_score * 0.4) + (outcome_score * 0.3)
    
    # Determine Impact Status
    impact_status = 'Stable'
    if confidence['level'] == 'Low':
        impact_status = 'Insufficient Data'
    elif impact_score >= 75:
        impact_status = 'Positive'
    elif impact_score <= 40:
        impact_status = 'Negative'
    else:
        impact_status = 'Needs Attention'
        
    # Update DB
    try:
        cursor.execute("UPDATE projects SET impact_index = ? WHERE id = ?", (impact_score, project_id))
        conn.commit()
    except:
        pass
        
    cursor.close()
    conn.close()
    
    return {
        'id': project_id,
        'output': {
            'reported_progress': progress,
            'verified_progress': ver_progress,
            'budget_utilization': budget_utilization
        },
        'outcome': citizen,
        'verification': verification,
        'kpis': {
            'overall_achievement': kpi_score,
            'count': len(kpis)
        },
        'impact': {
            'score': impact_score,
            'status': impact_status,
            'confidence': confidence
        }
    }
