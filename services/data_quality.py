import sqlite3
import time
from datetime import datetime, timedelta
from config import get_db_connection

def calculate_data_quality():
    """
    Overhauled scan engine for data quality. 
    Returns the latest scan summary.
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Get latest completed scan
    cursor.execute("SELECT * FROM data_quality_scans WHERE status = 'COMPLETED' ORDER BY id DESC LIMIT 1")
    last_scan = cursor.fetchone()
    
    # If no scan exists, return default zeroed state
    if not last_scan:
        cursor.close()
        conn.close()
        return {
            'success': True,
            'summary': {
                'overall_score': 0, 'completeness_score': 0, 'validity_score': 0, 
                'consistency_score': 0, 'recency_score': 0, 'verification_score': 0,
                'last_scan_date': None, 'status': 'No data available.'
            }
        }
        
    summary = {
        'overall_score': last_scan['overall_score'],
        'completeness_score': last_scan['completeness_score'],
        'validity_score': last_scan['validity_score'],
        'consistency_score': last_scan['consistency_score'],
        'recency_score': last_scan['recency_score'],
        'verification_score': last_scan['verification_score'],
        'last_scan_date': last_scan['completed_at'],
        'status': get_quality_status(last_scan['overall_score'])
    }
    
    cursor.close()
    conn.close()
    return {'success': True, 'summary': summary}

def get_quality_status(score):
    if score >= 90: return 'Excellent'
    if score >= 75: return 'Good'
    if score >= 60: return 'Needs Attention'
    return 'Critical'

def run_data_quality_scan():
    """
    Executes a comprehensive data quality scan and records issues.
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    start_time = time.time()
    now_dt = datetime.now()
    
    # Create scan record
    cursor.execute("INSERT INTO data_quality_scans (started_at, status) VALUES (?, 'RUNNING')", (now_dt,))
    scan_id = cursor.lastrowid
    
    issues_found = []
    
    metrics = {
        'completeness_req': 0, 'completeness_valid': 0,
        'validity_total': 0, 'validity_valid': 0,
        'consistency_total': 0, 'consistency_valid': 0,
        'recency_total': 0, 'recency_valid': 0,
        'verification_req': 0, 'verification_valid': 0,
    }
    
    records_checked = 0
    
    # Helper to log issue
    def add_issue(module, record_id, issue_type, severity, field, current_value, desc):
        issues_found.append((scan_id, module, record_id, issue_type, severity, field, str(current_value), desc))

    try:
        # ==========================================
        # 1. SCAN PROJECTS
        # ==========================================
        cursor.execute("SELECT * FROM projects")
        projects = cursor.fetchall()
        for p in projects:
            records_checked += 1
            pid = p['id']
            
            # Completeness
            req_fields = ['project_name', 'department_id', 'description', 'location', 'start_date', 'status']
            for f in req_fields:
                metrics['completeness_req'] += 1
                if p.get(f) is None or str(p.get(f)).strip() == '':
                    add_issue('Project', pid, 'COMPLETENESS', 'HIGH', f, p.get(f), f"Missing {f}")
                else:
                    metrics['completeness_valid'] += 1

            # Validity
            metrics['validity_total'] += 2
            if p.get('progress_percentage') is not None:
                prog = float(p['progress_percentage'])
                if prog < 0 or prog > 100:
                    add_issue('Project', pid, 'VALIDITY', 'CRITICAL', 'progress_percentage', prog, "Progress must be 0-100")
                else:
                    metrics['validity_valid'] += 1
            else:
                metrics['validity_valid'] += 1
                
            if p.get('allocated_budget') is not None:
                if float(p['allocated_budget']) < 0:
                    add_issue('Project', pid, 'VALIDITY', 'CRITICAL', 'allocated_budget', p['allocated_budget'], "Negative budget")
                else:
                    metrics['validity_valid'] += 1
            else:
                metrics['validity_valid'] += 1

            # Consistency
            metrics['consistency_total'] += 1
            cursor.execute("SELECT id FROM departments WHERE id = ?", (p['department_id'],))
            if not cursor.fetchone():
                add_issue('Project', pid, 'CONSISTENCY', 'CRITICAL', 'department_id', p['department_id'], "Invalid department reference")
            else:
                metrics['consistency_valid'] += 1
                
            # Recency
            metrics['recency_total'] += 1
            p_updated = p.get('updated_at')
            if p_updated:
                try:
                    dt = datetime.strptime(str(p_updated)[:19], '%Y-%m-%d %H:%M:%S')
                    if (now_dt - dt).days <= 90:
                        metrics['recency_valid'] += 1
                    else:
                        add_issue('Project', pid, 'RECENCY', 'MEDIUM', 'updated_at', p_updated, "Project not updated in over 90 days")
                except:
                    metrics['recency_valid'] += 1
            else:
                add_issue('Project', pid, 'RECENCY', 'HIGH', 'updated_at', None, "Never updated")
                
        # ==========================================
        # 2. SCAN CITIZEN REQUESTS (Feedback)
        # ==========================================
        cursor.execute("SELECT * FROM feedback")
        requests = cursor.fetchall()
        for r in requests:
            records_checked += 1
            rid = r['id']
            
            metrics['completeness_req'] += 3
            for f in ['category', 'description', 'user_id']:
                if r.get(f) is None or str(r.get(f)).strip() == '':
                    add_issue('Citizen Request', rid, 'COMPLETENESS', 'HIGH', f, r.get(f), f"Missing {f}")
                else:
                    metrics['completeness_valid'] += 1
            
            metrics['consistency_total'] += 1
            cursor.execute("SELECT id FROM projects WHERE id = ?", (r['project_id'],))
            if not cursor.fetchone():
                add_issue('Citizen Request', rid, 'CONSISTENCY', 'HIGH', 'project_id', r['project_id'], "References invalid project")
            else:
                metrics['consistency_valid'] += 1

        # ==========================================
        # 3. SCAN INSPECTIONS
        # ==========================================
        cursor.execute("SELECT * FROM field_inspections")
        inspections = cursor.fetchall()
        for i in inspections:
            records_checked += 1
            iid = i['id']
            
            metrics['completeness_req'] += 2
            for f in ['project_id', 'inspector_id']:
                if i.get(f) is None:
                    add_issue('Inspection', iid, 'COMPLETENESS', 'CRITICAL', f, None, f"Missing {f}")
                else:
                    metrics['completeness_valid'] += 1
                    
            metrics['consistency_total'] += 1
            cursor.execute("SELECT id FROM projects WHERE id = ?", (i['project_id'],))
            if not cursor.fetchone():
                add_issue('Inspection', iid, 'CONSISTENCY', 'CRITICAL', 'project_id', i['project_id'], "References invalid project")
            else:
                metrics['consistency_valid'] += 1
                
            # Verification
            metrics['verification_req'] += 1
            if i['status'] == 'Verified':
                metrics['verification_valid'] += 1
            else:
                add_issue('Inspection', iid, 'VERIFICATION', 'MEDIUM', 'status', i['status'], "Inspection not verified")

        # ==========================================
        # 4. SCAN EVIDENCE
        # ==========================================
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='evidence'")
        if cursor.fetchone():
            cursor.execute("SELECT * FROM evidence")
            evidence = cursor.fetchall()
            for e in evidence:
                records_checked += 1
                eid = e['id']
                
                metrics['completeness_req'] += 2
                for f in ['file_path', 'uploaded_by']:
                    if e.get(f) is None or str(e.get(f)).strip() == '':
                        add_issue('Evidence', eid, 'COMPLETENESS', 'CRITICAL', f, None, f"Missing {f}")
                    else:
                        metrics['completeness_valid'] += 1
                        
                metrics['verification_req'] += 1
                if e['status'] == 'VERIFIED':
                    metrics['verification_valid'] += 1
                elif e['status'] == 'REJECTED':
                    add_issue('Evidence', eid, 'VERIFICATION', 'HIGH', 'status', e['status'], "Evidence was rejected")
                else:
                    add_issue('Evidence', eid, 'VERIFICATION', 'MEDIUM', 'status', e['status'], "Evidence pending verification")

        # ==========================================
        # 5. SCAN OFFICERS (Users)
        # ==========================================
        cursor.execute("SELECT * FROM users WHERE role_id = 2")
        officers = cursor.fetchall()
        for o in officers:
            records_checked += 1
            oid = o['id']
            
            metrics['completeness_req'] += 2
            for f in ['full_name', 'email']:
                if o.get(f) is None or str(o.get(f)).strip() == '':
                    add_issue('Officer', oid, 'COMPLETENESS', 'HIGH', f, None, f"Missing {f}")
                else:
                    metrics['completeness_valid'] += 1
                    
            metrics['validity_total'] += 1
            if o.get('email') and '@' not in o.get('email'):
                add_issue('Officer', oid, 'VALIDITY', 'MEDIUM', 'email', o.get('email'), "Invalid email format")
            else:
                metrics['validity_valid'] += 1

        # ==========================================
        # CALCULATE SCORES
        # ==========================================
        comp = (metrics['completeness_valid'] / max(metrics['completeness_req'], 1)) * 100
        val = (metrics['validity_valid'] / max(metrics['validity_total'], 1)) * 100
        cons = (metrics['consistency_valid'] / max(metrics['consistency_total'], 1)) * 100
        rec = (metrics['recency_valid'] / max(metrics['recency_total'], 1)) * 100
        ver = (metrics['verification_valid'] / max(metrics['verification_req'], 1)) * 100
        
        # Overall weighted score
        overall = (comp * 0.3) + (val * 0.25) + (cons * 0.2) + (rec * 0.1) + (ver * 0.15)
        
        duration = time.time() - start_time
        
        # Save issues to database
        # First mark all previous OPEN issues as 'RESOLVED' if they weren't found again?
        # Actually, a simpler approach: close all OPEN issues for this module, then insert new.
        # But user requested to keep history. We will mark them RESOLVED if not in the new batch.
        
        # But to be precise, let's just insert new ones and let the UI show latest scan.
        # Let's mark old OPEN issues as RESOLVED if they don't match the new ones.
        cursor.execute("SELECT * FROM data_quality_issues WHERE status = 'OPEN'")
        old_issues = cursor.fetchall()
        
        new_issue_signatures = set()
        for i in issues_found:
            # signature: module, record_id, issue_type, field
            new_issue_signatures.add((i[1], i[2], i[3], i[5]))
            
        for oi in old_issues:
            sig = (oi['module'], oi['record_id'], oi['issue_type'], oi['field'])
            if sig not in new_issue_signatures:
                cursor.execute("UPDATE data_quality_issues SET status = 'RESOLVED', resolved_at = ? WHERE id = ?", (datetime.now(), oi['id']))
        
        critical_count = 0
        for i in issues_found:
            if i[4] in ['CRITICAL', 'HIGH']:
                critical_count += 1
                
            sig = (i[1], i[2], i[3], i[5])
            
            # Check if this issue is already OPEN or IGNORED
            cursor.execute("SELECT id, status FROM data_quality_issues WHERE module=? AND record_id=? AND issue_type=? AND field=? AND status IN ('OPEN', 'IGNORED')", (i[1], i[2], i[3], i[5]))
            existing = cursor.fetchone()
            
            if not existing:
                cursor.execute("""
                    INSERT INTO data_quality_issues (scan_id, module, record_id, issue_type, severity, field, current_value, description)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, i)
            elif existing['status'] == 'OPEN':
                # Just update scan_id and current_value
                cursor.execute("UPDATE data_quality_issues SET scan_id=?, current_value=?, description=? WHERE id=?", (scan_id, i[6], i[7], existing['id']))

        cursor.execute("""
            UPDATE data_quality_scans 
            SET completed_at = ?, records_checked = ?, issues_found = ?, critical_issues = ?,
                status = 'COMPLETED', duration = ?, overall_score = ?, completeness_score = ?,
                validity_score = ?, consistency_score = ?, recency_score = ?, verification_score = ?
            WHERE id = ?
        """, (datetime.now(), records_checked, len(issues_found), critical_count, duration,
              overall, comp, val, cons, rec, ver, scan_id))
              
        conn.commit()
        return {'success': True, 'message': 'Scan completed'}
        
    except Exception as e:
        conn.rollback()
        cursor.execute("UPDATE data_quality_scans SET status = 'FAILED', completed_at = ? WHERE id = ?", (datetime.now(), scan_id))
        conn.commit()
        raise e
    finally:
        cursor.close()
        conn.close()
