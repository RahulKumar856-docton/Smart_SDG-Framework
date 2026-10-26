from flask import Blueprint, jsonify, request, session
import sqlite3
import datetime

api_authority_bp = Blueprint('api_authority', __name__)

def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

@api_authority_bp.route('/dashboard', methods=['GET'])
def get_dashboard():
    # Only allow authority roles (stub check)
    conn = get_db_connection()
    try:
        # Metrics: Total, Pending Review, Verified, Active Work, Delayed
        metrics = {
            "Total Citizen Reports": conn.execute("SELECT COUNT(*) as c FROM citizen_reports").fetchone()['c'],
            "Pending Review": conn.execute("SELECT COUNT(*) as c FROM citizen_reports WHERE status='SUBMITTED'").fetchone()['c'],
            "Verified Reports": conn.execute("SELECT COUNT(*) as c FROM citizen_reports WHERE status='VERIFIED'").fetchone()['c'],
            "Active Work": conn.execute("SELECT COUNT(*) as c FROM citizen_reports WHERE status='IN_PROGRESS'").fetchone()['c'],
            "Delayed Reports": conn.execute("SELECT COUNT(*) as c FROM citizen_reports WHERE delay_status='DELAYED'").fetchone()['c'],
            "Escalated Reports": conn.execute("SELECT COUNT(*) as c FROM report_escalations").fetchone()['c']
        }
        
        # Requires Immediate Attention
        critical_reports = conn.execute("""
            SELECT id, report_id_code, category, severity, status, delay_status 
            FROM citizen_reports 
            WHERE severity='HIGH' OR delay_status='DELAYED'
            LIMIT 10
        """).fetchall()
        
        return jsonify({
            "success": True, 
            "metrics": metrics, 
            "requires_attention": [dict(r) for r in critical_reports]
        })
    finally:
        conn.close()

@api_authority_bp.route('/reports', methods=['GET'])
def get_reports():
    conn = get_db_connection()
    try:
        reports = conn.execute("SELECT * FROM citizen_reports ORDER BY created_at DESC").fetchall()
        return jsonify({"success": True, "data": [dict(r) for r in reports]})
    finally:
        conn.close()

@api_authority_bp.route('/reports/<int:report_id>', methods=['GET'])
def get_report_detail(report_id):
    conn = get_db_connection()
    try:
        query = """
            SELECT cr.*, 
                   cu.full_name as citizen_name, cu.email as citizen_email, cu.phone as citizen_phone,
                   ou.full_name as officer_name, ou.email as officer_email, ou.phone as officer_phone,
                   d.name as department_name
            FROM citizen_reports cr
            LEFT JOIN users cu ON cr.citizen_id = cu.id
            LEFT JOIN users ou ON cr.officer_id = ou.id
            LEFT JOIN departments d ON cr.department_id = d.id
            WHERE cr.id = ?
        """
        report = conn.execute(query, (report_id,)).fetchone()
        if not report:
            return jsonify({"success": False, "message": "Report not found"}), 404
        
        report_dict = dict(report)
        
        # Parse AI classification if present
        ai_data = None
        if report_dict.get('ai_classification'):
            try:
                import json
                ai_data = json.loads(report_dict['ai_classification'])
            except Exception:
                pass
                
        report_dict['ai_analyzed'] = bool(ai_data)
        report_dict['ai_data'] = ai_data
        if ai_data:
            report_dict['ai_category'] = ai_data.get('predicted_category')
            report_dict['ai_priority'] = ai_data.get('predicted_priority')
            report_dict['ai_confidence'] = ai_data.get('category_confidence')
            report_dict['ai_department_name'] = ai_data.get('recommended_department_name')
            report_dict['ai_department_id'] = ai_data.get('recommended_department_id')
            report_dict['ai_resolution_hours'] = ai_data.get('predicted_resolution_hours')
            report_dict['ai_sdg_goal'] = ai_data.get('sdg_goal')
            report_dict['ai_sdg_title'] = ai_data.get('sdg_title')
            report_dict['ai_reasons'] = ai_data.get('reasons', [])
            
        # Fetch timeline events
        timeline_rows = conn.execute("""
            SELECT * FROM report_timeline 
            WHERE report_id = ? 
            ORDER BY created_at ASC
        """, (report_id,)).fetchall()
        report_dict['timeline'] = [dict(t) for t in timeline_rows]

        return jsonify({"success": True, "data": report_dict})
    finally:
        conn.close()


@api_authority_bp.route('/gis', methods=['GET'])
def get_gis_data():
    conn = get_db_connection()
    try:
        # Fetch all reports
        all_reports = conn.execute("SELECT * FROM citizen_reports").fetchall()
        reports_list = [dict(r) for r in all_reports]
        
        valid_reports = []
        unmapped_reports = []
        
        for r in reports_list:
            lat = r.get('latitude')
            lon = r.get('longitude')
            
            if lat is not None and lon is not None and -90 <= lat <= 90 and -180 <= lon <= 180:
                valid_reports.append(r)
            else:
                unmapped_reports.append(r)
                
        # Basic summary metrics
        summary = {
            "totalReports": len(reports_list),
            "mappedReports": len(valid_reports),
            "unmappedReports": len(unmapped_reports),
            "activeIssues": len([r for r in reports_list if r['status'] not in ('VERIFIED', 'RESOLVED')]),
            "hotspots": 0
        }
        
        hotspots = []
        
        return jsonify({
            "success": True,
            "data": {
                "summary": summary,
                "reports": valid_reports,
                "unmapped": unmapped_reports,
                "hotspots": hotspots
            }
        })
    finally:
        conn.close()

@api_authority_bp.route('/reports/<int:report_id>/verify', methods=['POST'])
def verify_report(report_id):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE citizen_reports SET status='VERIFIED' WHERE id=?", (report_id,))
        cursor.execute("INSERT INTO report_timeline (report_id, event_type, description) VALUES (?, ?, ?)", 
                       (report_id, 'VERIFIED', 'Report verified by Higher Official'))
        conn.commit()
        return jsonify({"success": True, "message": "Report verified successfully"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()

@api_authority_bp.route('/reports/<int:report_id>/assign-department', methods=['POST'])
def assign_department(report_id):
    data = request.json
    dept_id = data.get('department_id')
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE citizen_reports SET department_id=?, status='ASSIGNED' WHERE id=?", (dept_id, report_id))
        cursor.execute("INSERT INTO report_timeline (report_id, event_type, description) VALUES (?, ?, ?)", 
                       (report_id, 'ASSIGNED', f'Report assigned to department {dept_id}'))
        conn.commit()
        return jsonify({"success": True, "message": "Department assigned successfully"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()

@api_authority_bp.route('/reports/<int:report_id>/request-explanation', methods=['POST'])
def request_explanation(report_id):
    data = request.json
    question = data.get('question', 'Why is this work delayed?')
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO report_timeline (report_id, event_type, description) VALUES (?, ?, ?)", 
                       (report_id, 'EXPLANATION_REQUESTED', f'Authority requested explanation: {question}'))
        conn.commit()
        return jsonify({"success": True, "message": "Explanation requested"})
    finally:
        conn.close()

@api_authority_bp.route('/operations', methods=['GET'])
def get_operations():
    conn = get_db_connection()
    try:
        active = conn.execute("SELECT COUNT(*) as c FROM citizen_reports WHERE status IN ('IN_PROGRESS', 'ASSIGNED')").fetchone()['c']
        officers = conn.execute("SELECT COUNT(*) as c FROM users u JOIN roles r ON u.role_id = r.id WHERE UPPER(r.name) = 'OFFICER' AND u.status = 'ACTIVE'").fetchone()['c']
        delayed = conn.execute("SELECT COUNT(*) as c FROM citizen_reports WHERE delay_status = 'DELAYED'").fetchone()['c']
        escalated = conn.execute("SELECT COUNT(*) as c FROM report_escalations").fetchone()['c']
        completed = conn.execute("SELECT COUNT(*) as c FROM citizen_reports WHERE status IN ('RESOLVED', 'VERIFIED') AND DATE(created_at) = DATE('now', 'localtime')").fetchone()['c']
        
        active_tasks = conn.execute("""
            SELECT id, report_id_code, title, category, status, severity, created_at
            FROM citizen_reports
            WHERE status IN ('IN_PROGRESS', 'ASSIGNED')
            ORDER BY created_at DESC LIMIT 10
        """).fetchall()
        
        return jsonify({
            "success": True,
            "data": {
                "active": active,
                "officers": officers,
                "delayed": delayed,
                "escalated": escalated,
                "completed": completed,
                "active_tasks": [dict(r) for r in active_tasks]
            }
        })
    finally:
        conn.close()

@api_authority_bp.route('/ai-insights', methods=['GET'])
def get_ai_insights():
    conn = get_db_connection()
    try:
        total = conn.execute("SELECT COUNT(*) as c FROM citizen_reports").fetchone()['c']
        delayed = conn.execute("SELECT COUNT(*) as c FROM citizen_reports WHERE delay_status = 'DELAYED'").fetchone()['c']
        high_risk = conn.execute("SELECT COUNT(*) as c FROM citizen_reports WHERE severity = 'HIGH'").fetchone()['c']
        
        delay_preds = conn.execute("""
            SELECT id, report_id_code, title, category, severity, delay_days, 'High' as predicted_delay_risk
            FROM citizen_reports
            WHERE delay_status = 'DELAYED' OR severity = 'HIGH'
            LIMIT 5
        """).fetchall()

        return jsonify({
            "success": True,
            "data": {
                "analyzed": total,
                "predicted_delays": delayed,
                "high_risk": high_risk,
                "duplicates": 1,
                "delay_predictions": [dict(r) for r in delay_preds],
                "root_causes": [
                    {"category": "Water Supply", "cause": "Aging mainline pipes in Ward 3 & 4", "impact": "High"},
                    {"category": "Sanitation", "cause": "Monsoon drain blockages", "impact": "Medium"}
                ]
            }
        })
    finally:
        conn.close()

@api_authority_bp.route('/departments', methods=['GET'])
def get_departments():
    conn = get_db_connection()
    try:
        departments = conn.execute("SELECT id, name, description FROM departments ORDER BY name ASC").fetchall()
        return jsonify({"success": True, "data": [dict(d) for d in departments]})
    finally:
        conn.close()

@api_authority_bp.route('/officers', methods=['GET'])
def get_officers():
    conn = get_db_connection()
    try:
        dept_id = request.args.get('department_id')
        query = """
            SELECT u.id, u.username, u.full_name, u.email, u.phone, u.department_id,
                   d.name as department_name,
                   (SELECT COUNT(*) FROM citizen_reports WHERE officer_id = u.id AND status NOT IN ('RESOLVED', 'VERIFIED')) as active_task_count
            FROM users u
            JOIN roles r ON u.role_id = r.id
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE UPPER(r.name) = 'OFFICER' AND u.status = 'ACTIVE'
        """
        params = []
        if dept_id:
            query += " AND u.department_id = ?"
            params.append(dept_id)
        query += " ORDER BY active_task_count ASC, u.full_name ASC"
        
        officers = conn.execute(query, params).fetchall()
        return jsonify({"success": True, "data": [dict(o) for o in officers]})
    finally:
        conn.close()

@api_authority_bp.route('/reports/<int:report_id>/run-ai', methods=['POST'])
def run_ai_analysis(report_id):
    conn = get_db_connection()
    try:
        report = conn.execute("SELECT * FROM citizen_reports WHERE id=?", (report_id,)).fetchone()
        if not report:
            return jsonify({"success": False, "message": "Report not found"}), 404
        
        report_dict = dict(report)
        text_to_analyze = f"{report_dict.get('title', '')} {report_dict.get('description', '')}".strip()
        if not text_to_analyze or text_to_analyze.lower() == 'hii':
            text_to_analyze = f"{report_dict.get('category', '')} {report_dict.get('title', '')} {report_dict.get('description', '')}"
            
        from ml.nlp_engine import NLPEngine
        engine = NLPEngine()
        ai_result = engine.analyze_request(text_to_analyze)
        
        # Build explanation bullet points
        reasons = []
        kw_matched = []
        text_lower = text_to_analyze.lower()
        cat_keywords = engine.category_keywords.get(ai_result['predicted_category'], [])
        for kw in cat_keywords:
            if kw in text_lower:
                kw_matched.append(kw)
        if kw_matched:
            reasons.append(f"Keywords detected in report: {', '.join(kw_matched[:3])}")
        else:
            reasons.append(f"Category matched via civic classification model")
            
        reasons.append(f"Department routed to {ai_result['recommended_department_name']}")
        reasons.append(f"Target SLA: {ai_result['predicted_resolution_hours']} hours based on {ai_result['predicted_priority']} severity")
        reasons.append(f"Aligned with {ai_result['sdg_title']}")
        
        ai_result['reasons'] = reasons
        
        import json
        ai_json = json.dumps(ai_result)
        
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE citizen_reports 
            SET ai_classification = ?, 
                severity = COALESCE(severity, ?),
                sla_days = COALESCE(sla_days, ?)
            WHERE id = ?
        """, (ai_json, ai_result['predicted_priority'], int(ai_result['predicted_resolution_hours'] / 24), report_id))
        
        # Add timeline entry
        cursor.execute("""
            INSERT INTO report_timeline (report_id, event_type, description)
            VALUES (?, 'AI_ANALYSIS', ?)
        """, (report_id, f"AI analysis completed: Category: {ai_result['predicted_category']} ({ai_result['category_confidence']}% confidence), Priority: {ai_result['predicted_priority']}"))
        
        conn.commit()
        
        return jsonify({
            "success": True,
            "message": "AI analysis completed successfully",
            "data": ai_result
        })
    except Exception as e:
        return jsonify({"success": False, "message": f"AI Analysis error: {str(e)}"}), 500
    finally:
        conn.close()

@api_authority_bp.route('/reports/<int:report_id>/assign-officer', methods=['POST'])
def assign_officer(report_id):
    data = request.json or {}
    officer_id = data.get('officer_id')
    dept_id = data.get('department_id')
    notes = data.get('notes', '')
    
    if not officer_id:
        return jsonify({"success": False, "message": "Officer ID is required"}), 400
        
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Verify officer exists
        officer = conn.execute("""
            SELECT u.id, u.full_name, u.email, u.department_id, d.name as dept_name
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE u.id = ?
        """, (officer_id,)).fetchone()
        
        if not officer:
            return jsonify({"success": False, "message": "Officer not found"}), 404
            
        final_dept_id = dept_id or officer['department_id']
        
        cursor.execute("""
            UPDATE citizen_reports 
            SET officer_id = ?, 
                department_id = COALESCE(?, department_id),
                status = CASE WHEN status = 'SUBMITTED' THEN 'ASSIGNED' ELSE status END
            WHERE id = ?
        """, (officer_id, final_dept_id, report_id))
        
        # Insert timeline event
        desc = f"Report assigned to Officer {officer['full_name']} ({officer['dept_name'] or 'Municipal Office'})"
        if notes:
            desc += f" - Instructions: {notes}"
        cursor.execute("INSERT INTO report_timeline (report_id, event_type, description) VALUES (?, 'OFFICER_ASSIGNED', ?)", 
                       (report_id, desc))
        
        # Insert notification for the officer
        cursor.execute("""
            INSERT INTO notifications (user_id, title, message, entity_type, entity_id, type, priority, module)
            VALUES (?, 'New Task Assigned', ?, 'Report', ?, 'TASK', 'HIGH', 'OFFICER')
        """, (officer_id, f"You have been assigned to Citizen Report #{report_id}: {desc}", report_id))
        
        conn.commit()
        return jsonify({
            "success": True, 
            "message": f"Successfully assigned to Officer {officer['full_name']}",
            "data": {
                "officer_id": officer['id'],
                "officer_name": officer['full_name'],
                "department_id": final_dept_id,
                "status": "ASSIGNED"
            }
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()

@api_authority_bp.route('/reports/<int:report_id>/auto-assign', methods=['POST'])
def auto_assign_officer(report_id):
    conn = get_db_connection()
    try:
        report = conn.execute("SELECT * FROM citizen_reports WHERE id=?", (report_id,)).fetchone()
        if not report:
            return jsonify({"success": False, "message": "Report not found"}), 404
            
        dept_id = report['department_id']
        
        # Find best active officer in this department with lowest active tasks
        officer = conn.execute("""
            SELECT u.id, u.full_name, u.email, u.department_id, d.name as dept_name,
                   (SELECT COUNT(*) FROM citizen_reports WHERE officer_id = u.id AND status NOT IN ('RESOLVED', 'VERIFIED')) as active_task_count
            FROM users u
            JOIN roles r ON u.role_id = r.id
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE UPPER(r.name) = 'OFFICER' AND u.status = 'ACTIVE'
            AND (u.department_id = ? OR ? IS NULL)
            ORDER BY active_task_count ASC, u.id ASC
            LIMIT 1
        """, (dept_id, dept_id)).fetchone()
        
        if not officer:
            officer = conn.execute("""
                SELECT u.id, u.full_name, u.email, u.department_id, d.name as dept_name
                FROM users u
                JOIN roles r ON u.role_id = r.id
                LEFT JOIN departments d ON u.department_id = d.id
                WHERE UPPER(r.name) = 'OFFICER' AND u.status = 'ACTIVE'
                ORDER BY u.id ASC LIMIT 1
            """).fetchone()
            
        if not officer:
            return jsonify({"success": False, "message": "No active municipal officers available in the system"}), 404
            
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE citizen_reports 
            SET officer_id = ?, 
                department_id = COALESCE(department_id, ?),
                status = 'ASSIGNED'
            WHERE id = ?
        """, (officer['id'], officer['department_id'], report_id))
        
        cursor.execute("INSERT INTO report_timeline (report_id, event_type, description) VALUES (?, 'AI_AUTO_ASSIGNED', ?)",
                       (report_id, f"AI Auto-Assigned to Officer {officer['full_name']} ({officer['dept_name'] or 'Municipal'}) based on optimal workload"))
        
        cursor.execute("""
            INSERT INTO notifications (user_id, title, message, entity_type, entity_id, type, priority, module)
            VALUES (?, 'New Task Assigned (AI Dispatch)', ?, 'Report', ?, 'TASK', 'HIGH', 'OFFICER')
        """, (officer['id'], f"You were AI-assigned to Citizen Report #{report_id}", report_id))
        
        conn.commit()
        return jsonify({
            "success": True, 
            "message": f"AI Auto-Assigned to {officer['full_name']}",
            "data": {
                "officer_id": officer['id'],
                "officer_name": officer['full_name'],
                "department_id": officer['department_id'],
                "status": "ASSIGNED"
            }
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        conn.close()

