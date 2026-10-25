from flask import Blueprint, jsonify, request, session
from config import get_db_connection
from datetime import datetime

api_kpis_bp = Blueprint('api_kpis', __name__)

def calculate_achievement(current, target, baseline, direction):
    if target == baseline:
        return 0
    try:
        current = float(current)
        target = float(target)
        baseline = float(baseline)
        if direction == 'Higher is Better':
            if target == 0:
                return 100 if current > 0 else 0
            return min(max((current / target) * 100, 0), 200) # cap at 200%
        else: # Lower is Better
            if baseline == 0:
                return 0
            # E.g. baseline 100, target 50, current 75 -> 50% achieved.
            progress = baseline - current
            total_needed = baseline - target
            if total_needed == 0:
                return 0
            return min(max((progress / total_needed) * 100, 0), 200)
    except:
        return 0

def determine_status(achievement):
    if achievement >= 90:
        return 'On Target'
    elif achievement >= 70:
        return 'Needs Attention'
    else:
        return 'At Risk'

@api_kpis_bp.route('', methods=['GET'])
def get_all_kpis():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT k.*, d.name as department_name, p.project_name
        FROM kpis k
        LEFT JOIN departments d ON k.department_id = d.id
        LEFT JOIN projects p ON k.project_id = p.id
        ORDER BY k.id DESC
    """)
    kpis = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify({'success': True, 'data': kpis})

@api_kpis_bp.route('/overview', methods=['GET'])
def get_kpi_overview():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("SELECT * FROM kpis")
    kpis = cursor.fetchall()
    
    total = len(kpis)
    active = sum(1 for k in kpis if k['status'] != 'ARCHIVED')
    on_target = sum(1 for k in kpis if k['status'] == 'On Target')
    needs_attention = sum(1 for k in kpis if k['status'] == 'Needs Attention')
    at_risk = sum(1 for k in kpis if k['status'] == 'At Risk')
    
    # Calculate avg achievement for active KPIs
    active_kpis = [k for k in kpis if k['status'] != 'ARCHIVED']
    avg_achievement = sum(calculate_achievement(k['current_value'], k['target_value'], k['baseline_value'], k['direction']) for k in active_kpis) / len(active_kpis) if active_kpis else 0

    cursor.close()
    conn.close()
    
    return jsonify({
        'success': True,
        'data': {
            'total_kpis': total,
            'active_kpis': active,
            'on_target': on_target,
            'needs_attention': needs_attention,
            'at_risk': at_risk,
            'avg_achievement': round(avg_achievement, 1)
        }
    })

@api_kpis_bp.route('/<int:kpi_id>', methods=['GET'])
def get_kpi(kpi_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT k.*, d.name as department_name, p.project_name
        FROM kpis k
        LEFT JOIN departments d ON k.department_id = d.id
        LEFT JOIN projects p ON k.project_id = p.id
        WHERE k.id = ?
    """, (kpi_id,))
    kpi = cursor.fetchone()
    
    if not kpi:
        cursor.close()
        conn.close()
        return jsonify({'success': False, 'message': 'KPI not found'}), 404
        
    cursor.execute("""
        SELECT * FROM kpi_measurements 
        WHERE kpi_id = ? 
        ORDER BY measurement_date ASC
    """, (kpi_id,))
    measurements = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    kpi['measurements'] = measurements
    kpi['achievement_percentage'] = round(calculate_achievement(kpi['current_value'], kpi['target_value'], kpi['baseline_value'], kpi['direction']), 1)
    
    return jsonify({'success': True, 'data': kpi})

@api_kpis_bp.route('', methods=['POST'])
def create_kpi():
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # We need an sdg_id since the schema requires it. We'll default to 1 if not provided.
        sdg_id = data.get('sdg_id', 1) 
        
        cursor.execute("""
            INSERT INTO kpis (sdg_id, name, code, description, category, department_id, project_id, 
                             unit, baseline_value, target_value, current_value, direction, 
                             frequency, start_date, target_date, status, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            sdg_id, data.get('name'), data.get('code'), data.get('description'), data.get('category'),
            data.get('department_id') or None, data.get('project_id') or None, data.get('unit'),
            data.get('baseline_value', 0), data.get('target_value', 0), data.get('baseline_value', 0),
            data.get('direction', 'Higher is Better'), data.get('frequency', 'Monthly'),
            data.get('start_date'), data.get('target_date'), 'On Target', session.get('user_id')
        ))
        
        kpi_id = cursor.lastrowid
        
        # Insert initial measurement
        cursor.execute("""
            INSERT INTO kpi_measurements (kpi_id, value, achievement_percentage, measurement_date, notes, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            kpi_id, data.get('baseline_value', 0), 0, data.get('start_date') or datetime.now().strftime('%Y-%m-%d'),
            "Initial baseline measurement", session.get('user_id')
        ))
        
        conn.commit()
        return jsonify({'success': True, 'data': {'id': kpi_id}, 'message': 'KPI created successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@api_kpis_bp.route('/<int:kpi_id>/measurements', methods=['POST'])
def add_measurement(kpi_id):
    data = request.get_json()
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Fetch existing KPI to calculate achievement
        cursor.execute("SELECT * FROM kpis WHERE id = ?", (kpi_id,))
        kpi = cursor.fetchone()
        if not kpi:
            return jsonify({'success': False, 'message': 'KPI not found'}), 404
            
        new_value = data.get('value')
        achievement = calculate_achievement(new_value, kpi['target_value'], kpi['baseline_value'], kpi['direction'])
        new_status = determine_status(achievement)
        
        # Insert measurement
        cursor.execute("""
            INSERT INTO kpi_measurements (kpi_id, value, achievement_percentage, measurement_date, notes, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            kpi_id, new_value, achievement, data.get('measurement_date'), data.get('notes'), session.get('user_id')
        ))
        
        # Update KPI
        cursor.execute("""
            UPDATE kpis 
            SET current_value = ?, status = ?
            WHERE id = ?
        """, (new_value, new_status, kpi_id))
        
        conn.commit()
        return jsonify({'success': True, 'message': 'Measurement added successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@api_kpis_bp.route('/<int:kpi_id>', methods=['DELETE'])
def archive_kpi(kpi_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE kpis SET status = 'ARCHIVED' WHERE id = ?", (kpi_id,))
        conn.commit()
        return jsonify({'success': True, 'message': 'KPI archived successfully'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
