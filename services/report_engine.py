import csv
import os
import json
import pandas as pd
from io import StringIO, BytesIO
from reportlab.lib.pagesizes import letter, landscape
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from config import get_db_connection
from datetime import datetime, timedelta

# Import engines for advanced metrics
from services.risk_engine import evaluate_project_risk
from services.impact_engine import calculate_impact_index
from services.sdg_engine import get_sdg_scores, get_sdg_performance
from services.data_quality import calculate_quality_score

def apply_date_filters(query, params, date_column, date_range):
    """Helper to append date range SQL filters based on standard options"""
    if not date_range or date_range == 'All Time':
        return query, params
        
    now = datetime.now()
    if date_range == 'Today':
        query += f" AND {date_column} >= %s"
        params.append(now.replace(hour=0, minute=0, second=0).strftime('%Y-%m-%d %H:%M:%S'))
    elif date_range == 'Last 7 Days':
        query += f" AND {date_column} >= %s"
        params.append((now - timedelta(days=7)).strftime('%Y-%m-%d %H:%M:%S'))
    elif date_range == 'Last 30 Days':
        query += f" AND {date_column} >= %s"
        params.append((now - timedelta(days=30)).strftime('%Y-%m-%d %H:%M:%S'))
    elif date_range == 'Last 3 Months':
        query += f" AND {date_column} >= %s"
        params.append((now - timedelta(days=90)).strftime('%Y-%m-%d %H:%M:%S'))
    elif date_range == 'Last 6 Months':
        query += f" AND {date_column} >= %s"
        params.append((now - timedelta(days=180)).strftime('%Y-%m-%d %H:%M:%S'))
    elif date_range == 'This Year':
        query += f" AND {date_column} >= %s"
        params.append(now.replace(month=1, day=1, hour=0, minute=0, second=0).strftime('%Y-%m-%d %H:%M:%S'))
        
    return query, params

def get_report_data(report_type, filters=None):
    if not filters:
        filters = {}
        
    conn = get_db_connection()
    if not conn: return None
    cursor = conn.cursor(dictionary=True)
    
    data = {
        'summary': {},
        'records': [],
        'filters': filters,
        'methodology': ''
    }
    
    try:
        # Date filter extractor
        date_range = filters.get('date_range')
        
        if report_type == 'comprehensive' or report_type == 'executive':
            # Executive Summary Report
            cursor.execute("SELECT COUNT(*) as total, SUM(CASE WHEN status='Active' THEN 1 ELSE 0 END) as active, SUM(CASE WHEN status='Completed' THEN 1 ELSE 0 END) as completed FROM projects")
            proj_stats = cursor.fetchone()
            
            data['summary'] = {
                'Total Projects': proj_stats['total'],
                'Active Projects': proj_stats['active'] or 0,
                'Completed Projects': proj_stats['completed'] or 0
            }
            
            cursor.execute("SELECT name, (SELECT AVG(score) FROM sdg_scores WHERE sdg_id=sdgs.id) as avg_score FROM sdgs")
            sdg_stats = cursor.fetchall()
            for s in sdg_stats:
                if s['avg_score']:
                    data['summary'][f"SDG {s['name']} Avg Score"] = f"{round(s['avg_score'], 1)}%"
                    
            data['methodology'] = "Aggregates key metrics across all projects, SDGs, and risk assessments. Built using realtime verified records."
            
            # Records: top 10 projects by progress
            cursor.execute("SELECT project_name, department_id, status, progress_percentage FROM projects ORDER BY progress_percentage DESC LIMIT 10")
            data['records'] = cursor.fetchall()
            
        elif report_type == 'sdg_performance':
            # SDG Performance Report
            query = """
                SELECT s.id, s.name, AVG(ss.score) as avg_score, AVG(ss.target) as avg_target, AVG(ss.gap) as avg_gap
                FROM sdgs s
                LEFT JOIN sdg_scores ss ON s.id = ss.sdg_id
                GROUP BY s.id
            """
            cursor.execute(query)
            sdg_records = cursor.fetchall()
            for r in sdg_records:
                if r['avg_score'] is not None:
                    data['records'].append({
                        'SDG': f"SDG {r['id']}: {r['name']}",
                        'Average Score': f"{round(r['avg_score'], 2)}%",
                        'Average Target': f"{round(r['avg_target'], 2)}%",
                        'Average Gap': f"{round(r['avg_gap'], 2)}%"
                    })
            data['summary']['Analyzed SDGs'] = len(data['records'])
            data['methodology'] = "SDG scores are aggregated from individual project KPI mapping and measurements."
            
        elif report_type == 'project_performance':
            # Project Performance
            query = "SELECT id, project_name, status, progress_percentage, allocated_budget FROM projects WHERE 1=1"
            params = []
            if filters.get('department_id'):
                query += " AND department_id = %s"
                params.append(filters['department_id'])
            if filters.get('status'):
                query += " AND status = %s"
                params.append(filters['status'])
            
            query, params = apply_date_filters(query, params, "created_at", date_range)
                
            cursor.execute(query, params)
            projects = cursor.fetchall()
            
            for p in projects:
                risk = evaluate_project_risk(p['id'])
                impact = calculate_impact_index(p['id'])
                data['records'].append({
                    'Project ID': p['id'],
                    'Project Name': p['project_name'],
                    'Status': p['status'],
                    'Progress': f"{p['progress_percentage']}%",
                    'Budget': f"INR {p['allocated_budget']}",
                    'Risk Level': risk['overall'] if risk else 'Unknown',
                    'Impact Index': impact['index'] if impact else 'Unknown'
                })
            data['summary']['Total Projects'] = len(projects)
            data['methodology'] = "Risk levels and impact indices are calculated dynamically using the Risk Engine and Impact Engine."
            
        elif report_type == 'citizen_requests':
            query = """
                SELECT cr.id, cr.request_id_code, cr.title, cr.category, cr.status, cr.priority, 
                       cr.created_at, cr.resolved_at, d.name as department
                FROM citizen_requests cr
                LEFT JOIN departments d ON cr.department_id = d.id
                WHERE 1=1
            """
            params = []
            if filters.get('department_id'):
                query += " AND cr.department_id = %s"
                params.append(filters['department_id'])
            if filters.get('status'):
                query += " AND cr.status = %s"
                params.append(filters['status'])
                
            query, params = apply_date_filters(query, params, "cr.created_at", date_range)
            cursor.execute(query, params)
            requests = cursor.fetchall()
            
            resolved_count = 0
            for req in requests:
                if req['status'] == 'Resolved':
                    resolved_count += 1
                data['records'].append({
                    'Request Code': req['request_id_code'],
                    'Title': req['title'],
                    'Department': req['department'] or 'Unassigned',
                    'Category': req['category'],
                    'Status': req['status'],
                    'Priority': req['priority'],
                    'Created At': str(req['created_at'])
                })
            data['summary']['Total Requests'] = len(requests)
            data['summary']['Resolved Requests'] = resolved_count
            if len(requests) > 0:
                data['summary']['Resolution Rate'] = f"{round((resolved_count/len(requests))*100, 1)}%"
            data['methodology'] = "Calculates response efficiency from citizen request lifecycle records."
            
        elif report_type == 'field_inspections':
            query = """
                SELECT fi.id, p.project_name, u.full_name as officer, fi.inspection_date, 
                       fi.reported_progress, fi.observed_progress, fi.verification_status
                FROM field_inspections fi
                JOIN projects p ON fi.project_id = p.id
                JOIN users u ON fi.officer_id = u.id
                WHERE 1=1
            """
            params = []
            if filters.get('department_id'):
                query += " AND p.department_id = %s"
                params.append(filters['department_id'])
                
            query, params = apply_date_filters(query, params, "fi.inspection_date", date_range)
            cursor.execute(query, params)
            inspections = cursor.fetchall()
            
            verified_count = 0
            for ins in inspections:
                if ins['verification_status'] == 'Verified': verified_count += 1
                diff = abs((ins['reported_progress'] or 0) - (ins['observed_progress'] or 0))
                data['records'].append({
                    'Inspection ID': ins['id'],
                    'Project': ins['project_name'],
                    'Officer': ins['officer'],
                    'Date': str(ins['inspection_date']),
                    'Reported Progress': f"{ins['reported_progress']}%",
                    'Observed Progress': f"{ins['observed_progress']}%",
                    'Difference': f"{diff}%",
                    'Status': ins['verification_status']
                })
            data['summary']['Total Inspections'] = len(inspections)
            data['summary']['Verified Inspections'] = verified_count
            data['methodology'] = "Difference between reported and observed progress determines the verification status."

        elif report_type == 'evidence':
            query = """
                SELECT e.id, p.project_name, e.evidence_type, e.verification_status, e.uploaded_at
                FROM project_evidence e
                JOIN projects p ON e.project_id = p.id
                WHERE 1=1
            """
            params = []
            if filters.get('department_id'):
                query += " AND p.department_id = %s"
                params.append(filters['department_id'])
                
            query, params = apply_date_filters(query, params, "e.uploaded_at", date_range)
            cursor.execute(query, params)
            evidences = cursor.fetchall()
            
            verified = 0
            rejected = 0
            for e in evidences:
                if e['verification_status'] == 'Verified': verified += 1
                elif e['verification_status'] == 'Rejected': rejected += 1
                data['records'].append({
                    'ID': e['id'],
                    'Project': e['project_name'],
                    'Type': e['evidence_type'],
                    'Status': e['verification_status'],
                    'Date': str(e['uploaded_at'])
                })
            data['summary']['Total Evidence'] = len(evidences)
            data['summary']['Verified'] = verified
            data['summary']['Rejected'] = rejected
            data['methodology'] = "Analyzes the verification pipeline for project-uploaded media and documents."

        elif report_type == 'data_quality':
            cursor.execute("SELECT id, project_name FROM projects")
            projects = cursor.fetchall()
            total_score = 0
            for p in projects:
                score = calculate_quality_score(p['id'])
                total_score += score
                data['records'].append({
                    'Project Name': p['project_name'],
                    'Data Quality Score': f"{score}%"
                })
            if projects:
                data['summary']['Average Data Quality'] = f"{round(total_score/len(projects), 1)}%"
            data['summary']['Projects Evaluated'] = len(projects)
            data['methodology'] = "Data quality score is derived from completeness, validity, recency, and verification coverage of project KPIs."

        elif report_type == 'impact_analysis' or report_type == 'risk_analysis':
            # Combine both logic generally
            cursor.execute("SELECT id, project_name FROM projects")
            projects = cursor.fetchall()
            high_risk = 0
            avg_impact = 0
            for p in projects:
                risk = evaluate_project_risk(p['id'])
                impact = calculate_impact_index(p['id'])
                
                if risk and risk['overall'] in ['High', 'Critical']:
                    high_risk += 1
                if impact:
                    avg_impact += impact['index']
                    
                data['records'].append({
                    'Project Name': p['project_name'],
                    'Risk Level': risk['overall'] if risk else 'Unknown',
                    'Progress Risk': risk.get('progress_risk', 0) if risk else 0,
                    'Impact Index': impact['index'] if impact else 0,
                    'Confidence': impact['confidence'] if impact else 'Low'
                })
            data['summary']['Projects Analyzed'] = len(projects)
            data['summary']['High/Critical Risk'] = high_risk
            if projects:
                data['summary']['Avg Impact Index'] = f"{round(avg_impact/len(projects), 1)}"
            data['methodology'] = "Risk score calculated from delays/deviations. Impact calculated from KPI achievements vs baselines."
            
        elif report_type == 'gis':
            cursor.execute("SELECT COUNT(*) as c FROM projects WHERE latitude IS NOT NULL")
            mp = cursor.fetchone()['c']
            cursor.execute("SELECT COUNT(*) as c FROM projects")
            tp = cursor.fetchone()['c']
            
            cursor.execute("SELECT COUNT(*) as c FROM citizen_requests WHERE latitude IS NOT NULL")
            mr = cursor.fetchone()['c']
            cursor.execute("SELECT COUNT(*) as c FROM citizen_requests")
            tr = cursor.fetchone()['c']
            
            data['summary']['Mapped Projects'] = f"{mp} / {tp}"
            data['summary']['Mapped Requests'] = f"{mr} / {tr}"
            
            # Hotspots
            cursor.execute("SELECT category, COUNT(*) as count FROM citizen_requests WHERE latitude IS NOT NULL GROUP BY category")
            for cat in cursor.fetchall():
                data['records'].append({
                    'Category': cat['category'],
                    'Mapped Points': cat['count']
                })
            data['methodology'] = "Analyzes geospatial coverage across the database, preventing blank unmapped areas."

        elif report_type == 'officers':
            cursor.execute("""
                SELECT u.id, u.full_name, u.role,
                (SELECT COUNT(*) FROM citizen_requests WHERE assigned_officer_id = u.id) as assigned,
                (SELECT COUNT(*) FROM citizen_requests WHERE assigned_officer_id = u.id AND status='Resolved') as resolved
                FROM users u WHERE role = 'Officer'
            """)
            officers = cursor.fetchall()
            for o in officers:
                data['records'].append({
                    'Officer Name': o['full_name'],
                    'Assigned Requests': o['assigned'],
                    'Resolved Requests': o['resolved'],
                    'Resolution Rate': f"{round((o['resolved']/o['assigned'])*100, 1)}%" if o['assigned'] > 0 else 'N/A'
                })
            data['summary']['Total Officers'] = len(officers)
            data['methodology'] = "Analyzes individual officer workload and completion rates without exposing authentication data."

        elif report_type == 'departments':
            query = """
                SELECT d.name, COUNT(p.id) as proj_count, AVG(p.progress_percentage) as avg_prog
                FROM departments d
                LEFT JOIN projects p ON d.id = p.department_id
                GROUP BY d.id
            """
            cursor.execute(query)
            depts = cursor.fetchall()
            for d in depts:
                data['records'].append({
                    'Department': d['name'],
                    'Total Projects': d['proj_count'],
                    'Average Progress': f"{round(d['avg_prog'] or 0, 1)}%"
                })
            data['summary']['Total Departments'] = len(depts)
            
        elif report_type == 'feedback':
            cursor.execute("SELECT feedback_category, COUNT(*) as count, AVG(satisfaction_rating) as avg_rating FROM citizen_feedback GROUP BY feedback_category")
            feedbacks = cursor.fetchall()
            total_feedback = 0
            for f in feedbacks:
                total_feedback += f['count']
                data['records'].append({
                    'Category': f['feedback_category'],
                    'Total Feedback': f['count'],
                    'Average Rating': f"{round(f['avg_rating'] or 0, 1)} / 5.0"
                })
            data['summary']['Total Citizen Feedback'] = total_feedback

        # Fallback if no matching
        else:
            data['summary']['Message'] = 'No records available for this report type.'
            data['records'] = []

    except Exception as e:
        print(f"Error generating report data: {str(e)}")
        data = None
    finally:
        cursor.close()
        conn.close()
        
    return data

def generate_csv_report(data, report_type):
    if not data or not data.get('records'):
        # Fallback to empty string if no data
        return ""
        
    si = StringIO()
    cw = csv.writer(si)
    
    # Metadata headers
    cw.writerow(["Report Type", report_type.replace('_', ' ').title()])
    cw.writerow(["Generated Date", datetime.now().strftime("%Y-%m-%d %H:%M:%S")])
    if data.get('filters'):
        cw.writerow(["Filters", json.dumps(data['filters'])])
    cw.writerow([])
    
    # Summary
    if data.get('summary'):
        cw.writerow(["--- Executive Summary ---"])
        for k, v in data['summary'].items():
            cw.writerow([k, v])
        cw.writerow([])
        
    # Records
    cw.writerow(["--- Detailed Data ---"])
    records = data['records']
    if records:
        cw.writerow(records[0].keys())
        for r in records:
            cw.writerow(r.values())
            
    return si.getvalue()

def generate_excel_report(data, report_type, filepath):
    if not data:
        return False
    
    try:
        # Create Excel writer
        with pd.ExcelWriter(filepath, engine='openpyxl') as writer:
            # Metadata Sheet
            metadata = {
                'Report Type': [report_type.replace('_', ' ').title()],
                'Generated Date': [datetime.now().strftime("%Y-%m-%d %H:%M:%S")],
                'Filters': [json.dumps(data.get('filters', {}))]
            }
            pd.DataFrame(metadata).to_excel(writer, sheet_name='Metadata', index=False)
            
            # Summary Sheet
            if data.get('summary'):
                summary_df = pd.DataFrame(list(data['summary'].items()), columns=['Metric', 'Value'])
                summary_df.to_excel(writer, sheet_name='Summary', index=False)
                
            # Data Sheet
            if data.get('records'):
                records_df = pd.DataFrame(data['records'])
                records_df.to_excel(writer, sheet_name='Data', index=False)
                
        return True
    except Exception as e:
        print(f"Error generating excel: {str(e)}")
        # Fallback to CSV if openpyxl fails for some reason
        try:
            csv_data = generate_csv_report(data, report_type)
            with open(filepath.replace('.xlsx', '.csv'), 'w', newline='', encoding='utf-8') as f:
                f.write(csv_data)
            return True
        except:
            return False

def generate_pdf_report(data, report_type, filters, filepath):
    if not data:
        return False
        
    try:
        doc = SimpleDocTemplate(filepath, pagesize=landscape(letter))
        elements = []
        
        styles = getSampleStyleSheet()
        title_style = styles['Heading1']
        subtitle_style = styles['Heading3']
        normal_style = styles['Normal']
        
        # Header
        elements.append(Paragraph(f"Municipal SDG Report: {report_type.replace('_', ' ').title()}", title_style))
        elements.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", normal_style))
        if filters:
            elements.append(Paragraph(f"Filters: {json.dumps(filters)}", normal_style))
        elements.append(Spacer(1, 12))
        
        # Summary
        if data.get('summary'):
            elements.append(Paragraph("Executive Summary", subtitle_style))
            summary_data = []
            for k, v in data['summary'].items():
                summary_data.append([k, str(v)])
                
            if summary_data:
                t = Table(summary_data, colWidths=[200, 200])
                t.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,-1), colors.whitesmoke),
                    ('GRID', (0,0), (-1,-1), 1, colors.lightgrey),
                    ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
                    ('PADDING', (0,0), (-1,-1), 6),
                ]))
                elements.append(t)
                elements.append(Spacer(1, 20))
            
        # Records Table
        if data.get('records') and len(data['records']) > 0:
            elements.append(Paragraph("Detailed Data", subtitle_style))
            
            headers = list(data['records'][0].keys())
            table_data = [headers]
            
            for r in data['records']:
                row = [str(val) if val is not None else '' for val in r.values()]
                table_data.append(row)
                
            t = Table(table_data)
            t.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e40af')), # Professional Blue
                ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
                ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,0), 10),
                ('BOTTOMPADDING', (0,0), (-1,0), 12),
                ('BACKGROUND', (0,1), (-1,-1), colors.white),
                ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ]))
            elements.append(t)
            
        # Methodology
        if data.get('methodology'):
            elements.append(Spacer(1, 20))
            elements.append(Paragraph("Methodology", subtitle_style))
            elements.append(Paragraph(data['methodology'], normal_style))
            
        doc.build(elements)
        return True
    except Exception as e:
        print(f"Error generating PDF: {str(e)}")
        return False
