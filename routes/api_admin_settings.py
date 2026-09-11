from flask import Blueprint, jsonify, request, session
from services.settings_service import SettingsService
from functools import wraps

api_admin_settings_bp = Blueprint('api_admin_settings', __name__)

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('role', '').upper() != 'ADMIN':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

@api_admin_settings_bp.route('/', methods=['GET'])
@admin_required
def get_settings():
    try:
        settings = SettingsService.get_all_settings(mask_secrets=True)
        return jsonify({'success': True, 'data': settings})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@api_admin_settings_bp.route('/', methods=['PUT'])
@admin_required
def update_settings():
    updates = request.get_json()
    if not updates or not isinstance(updates, dict):
        return jsonify({'success': False, 'message': 'Invalid payload'}), 400
        
    try:
        user_id = session.get('user_id')
        success, result = SettingsService.update_settings(updates, user_id=user_id)
        if success:
            return jsonify({'success': True, 'message': 'Settings saved successfully', 'changes': result})
        else:
            return jsonify({'success': False, 'message': result}), 500
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@api_admin_settings_bp.route('/health', methods=['GET'])
@admin_required
def check_health():
    from config import get_db_connection
    import time
    
    start_time = time.time()
    health = {
        'backend': {'status': 'Operational', 'latency_ms': 0},
        'database': {'status': 'Unavailable'},
        'storage': {'status': 'Operational'},
        'map': {'status': 'Configured' if SettingsService.get_setting('map_default_zoom') else 'Not Configured'},
        'notifications': {'status': 'Operational'},
        'ai': {'status': 'Configured' if SettingsService.get_setting('ai_analysis_enabled') else 'Not Configured'}
    }
    
    # DB Check
    try:
        conn = get_db_connection()
        if conn:
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            cursor.close()
            conn.close()
            health['database']['status'] = 'Operational'
    except Exception:
        pass
        
    health['backend']['latency_ms'] = int((time.time() - start_time) * 1000)
        
    return jsonify({'success': True, 'data': health})
