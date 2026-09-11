from flask import Flask, jsonify, send_from_directory, session
from flask_cors import CORS
from config import Config
import os

from routes.api_auth import api_auth_bp
from routes.api_dashboards import api_dashboards_bp
from routes.api_projects import api_projects_bp
from routes.api_requests import api_requests_bp
from routes.api_admin_officers import api_admin_officers_bp
from routes.api_departments import api_departments_bp
from routes.api_kpis import api_kpis_bp
from routes.api_admin_requests import api_admin_requests_bp
from routes.api_admin_inspections import api_admin_inspections_bp
from routes.api_admin_evidence import api_admin_evidence_bp
from routes.api_data_quality import api_data_quality_bp
from routes.api_admin_gis import api_admin_gis_bp
from routes.api_admin_reports import api_admin_reports_bp
from routes.api_admin_audit import api_admin_audit_bp
from routes.api_admin_notifications import api_admin_notifications_bp
from routes.api_admin_settings import api_admin_settings_bp
from routes.citizen_api import citizen_api_bp
from routes.officer_api import officer_api_bp
from routes.api_messages import api_messages_bp
from services.settings_service import SettingsService

def create_app():
    app = Flask(__name__)
    app.url_map.strict_slashes = False
    app.config.from_object(Config)
    
    # Enable CORS
    CORS(app, supports_credentials=True)

    # Register blueprints
    app.register_blueprint(api_auth_bp, url_prefix='/api/auth')
    app.register_blueprint(api_dashboards_bp, url_prefix='/api/dashboards')
    app.register_blueprint(api_projects_bp, url_prefix='/api/projects')
    app.register_blueprint(api_requests_bp, url_prefix='/api/requests')
    app.register_blueprint(api_admin_officers_bp, url_prefix='/api/admin/officers')
    app.register_blueprint(api_departments_bp, url_prefix='/api/departments')
    app.register_blueprint(api_kpis_bp, url_prefix='/api/kpis')
    app.register_blueprint(api_admin_requests_bp, url_prefix='/api/admin/citizen-requests')
    app.register_blueprint(api_admin_inspections_bp, url_prefix='/api/admin/inspections')
    app.register_blueprint(api_admin_evidence_bp, url_prefix='/api/admin/evidence')
    app.register_blueprint(api_data_quality_bp, url_prefix='/api/admin/data-quality')
    app.register_blueprint(api_admin_gis_bp, url_prefix='/api/admin/gis')
    app.register_blueprint(api_admin_reports_bp, url_prefix='/api/admin/reports')
    app.register_blueprint(api_admin_audit_bp, url_prefix='/api/admin/audit-logs')
    app.register_blueprint(api_admin_notifications_bp, url_prefix='/api/admin/notifications')
    app.register_blueprint(api_admin_settings_bp, url_prefix='/api/admin/settings')
    from routes.api_admin_citizen_reports import api_admin_citizen_reports_bp
    app.register_blueprint(api_admin_citizen_reports_bp, url_prefix='/api/admin/citizen-reports')
    app.register_blueprint(citizen_api_bp, url_prefix='/api/citizen')
    app.register_blueprint(officer_api_bp, url_prefix='/api/officer')
    app.register_blueprint(api_messages_bp, url_prefix='/api/messages')

    @app.route('/uploads/evidence/<path:filename>')
    def serve_evidence(filename):
        if 'user_id' not in session:
            return jsonify({"success": False, "message": "Unauthorized"}), 401
        return send_from_directory(app.config['UPLOAD_FOLDER_EVIDENCE'], filename)

    @app.before_request
    def enforce_session_settings():
        from flask import session
        from datetime import timedelta
        if 'user_id' in session:
            # Enforce session timeout
            timeout_mins = SettingsService.get_setting('session_timeout_minutes', 30)
            app.permanent_session_lifetime = timedelta(minutes=timeout_mins)
            session.permanent = True

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"success": False, "message": "Endpoint not found"}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"success": False, "message": "Internal server error"}), 500

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
