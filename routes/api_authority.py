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
        report = conn.execute("SELECT * FROM citizen_reports WHERE id=?", (report_id,)).fetchone()
        if not report:
            return jsonify({"success": False, "message": "Report not found"}), 404
        
        # In a real app we'd fetch actual relationships. We'll return the base report data.
        # This allows the frontend to have the core structure.
        return jsonify({"success": True, "data": dict(report)})
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
