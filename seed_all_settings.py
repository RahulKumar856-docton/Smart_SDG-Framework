import sqlite3
import os
import json

DB_PATH = 'database.db'

def seed_complete_settings():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    defaults = [
        # GENERAL
        ('General', 'app_name', 'Municipal Monitor', 'string', 'Application Name'),
        ('General', 'app_description', 'Smart SDG Management Framework', 'string', 'Application Description'),
        ('General', 'timezone', 'UTC', 'string', 'Timezone'),
        ('General', 'date_format', 'YYYY-MM-DD', 'string', 'Date Format'),
        ('General', 'time_format', '24h', 'string', 'Time Format'),
        ('General', 'default_page_size', '20', 'number', 'Default Page Size'),
        ('General', 'default_language', 'en', 'string', 'Default Language'),
        
        # MUNICIPAL INFORMATION
        ('Municipal Information', 'municipality_name', 'Metropolis City', 'string', 'Municipality Name'),
        ('Municipal Information', 'municipality_code', 'MET-001', 'string', 'Municipality Code'),
        ('Municipal Information', 'office_address', '100 Main St, City Hall', 'string', 'Office Address'),
        ('Municipal Information', 'contact_email', 'admin@metropolis.gov', 'string', 'Contact Email'),
        ('Municipal Information', 'contact_phone', '+1-555-0100', 'string', 'Contact Phone'),
        ('Municipal Information', 'website', 'https://metropolis.gov', 'string', 'Website'),

        # PROJECTS
        ('Projects', 'default_project_status', 'PLANNED', 'string', 'Default Project Status'),
        ('Projects', 'project_progress_minimum', '0', 'number', 'Project Progress Minimum'),
        ('Projects', 'project_progress_maximum', '100', 'number', 'Project Progress Maximum'),
        ('Projects', 'project_approval_required', 'true', 'boolean', 'Project Approval Required'),
        
        # CITIZEN REQUESTS
        ('Citizen Requests', 'default_request_priority', 'Medium', 'string', 'Default Priority'),
        ('Citizen Requests', 'request_assignment_rules', 'Auto', 'string', 'Assignment Rules'),
        ('Citizen Requests', 'escalation_rules_hours', '48', 'number', 'Escalation Rules (Hours)'),

        # FIELD INSPECTIONS
        ('Field Inspections', 'verification_required', 'true', 'boolean', 'Verification Required'),
        ('Field Inspections', 'reinspection_required', 'false', 'boolean', 'Reinspection Required'),
        ('Field Inspections', 'reminder_period_days', '7', 'number', 'Reminder Period (Days)'),

        # EVIDENCE
        ('Evidence', 'evidence_max_file_size_mb', '25', 'number', 'Maximum File Size (MB)'),
        ('Evidence', 'evidence_allowed_types', 'jpg,png,pdf,mp4', 'string', 'Allowed File Types'),
        ('Evidence', 'evidence_verification_required', 'true', 'boolean', 'Verification Required'),
        ('Evidence', 'evidence_replacement_allowed', 'false', 'boolean', 'Replacement Allowed'),

        # NOTIFICATIONS
        ('Notifications', 'notify_project_alerts', 'true', 'boolean', 'Project Alerts'),
        ('Notifications', 'notify_citizen_request_alerts', 'true', 'boolean', 'Citizen Request Alerts'),
        ('Notifications', 'notify_inspection_alerts', 'true', 'boolean', 'Inspection Alerts'),
        ('Notifications', 'notify_evidence_alerts', 'true', 'boolean', 'Evidence Alerts'),
        ('Notifications', 'notify_data_quality_alerts', 'true', 'boolean', 'Data Quality Alerts'),
        ('Notifications', 'notify_impact_alerts', 'true', 'boolean', 'Impact Alerts'),
        ('Notifications', 'notify_risk_alerts', 'true', 'boolean', 'Risk Alerts'),
        ('Notifications', 'notify_gis_alerts', 'true', 'boolean', 'GIS Alerts'),
        ('Notifications', 'notify_report_alerts', 'true', 'boolean', 'Report Alerts'),
        ('Notifications', 'notify_security_alerts', 'true', 'boolean', 'Security Alerts'),

        # PERFORMANCE & KPIs
        ('Performance & KPIs', 'kpi_target_threshold', '90', 'number', 'Target Threshold (%)'),
        ('Performance & KPIs', 'kpi_achievement_threshold', '100', 'number', 'Achievement Threshold (%)'),
        ('Performance & KPIs', 'kpi_measurement_frequency', 'Monthly', 'string', 'Measurement Frequency'),

        # DATA QUALITY
        ('Data Quality', 'dq_excellent_threshold', '90', 'number', 'Excellent Threshold'),
        ('Data Quality', 'dq_good_threshold', '75', 'number', 'Good Threshold'),
        ('Data Quality', 'dq_needs_attention_threshold', '60', 'number', 'Needs Attention Threshold'),
        ('Data Quality', 'dq_critical_threshold', '40', 'number', 'Critical Threshold'),

        # IMPACT ANALYSIS
        ('Impact Analysis', 'impact_min_data_requirement', '3', 'number', 'Minimum Data Requirement (Months)'),
        ('Impact Analysis', 'impact_confidence_threshold', '85', 'number', 'Confidence Threshold (%)'),

        # RISK & AI
        ('Risk & AI', 'ai_analysis_enabled', 'false', 'boolean', 'AI Analysis Enabled'),
        ('Risk & AI', 'risk_detection_enabled', 'false', 'boolean', 'Risk Detection Enabled'),
        ('Risk & AI', 'recommendation_generation_enabled', 'false', 'boolean', 'Recommendation Generation Enabled'),
        ('Risk & AI', 'ai_min_confidence_threshold', '80', 'number', 'Minimum Confidence Threshold (%)'),

        # GIS & MAPS
        ('GIS & Maps', 'map_default_zoom', '12', 'number', 'Default Map Zoom'),
        ('GIS & Maps', 'map_default_layer', 'Streets', 'string', 'Default Map Layer'),
        ('GIS & Maps', 'map_auto_refresh', 'true', 'boolean', 'Auto Refresh'),
        ('GIS & Maps', 'map_refresh_interval_sec', '60', 'number', 'Refresh Interval (Seconds)'),
        ('GIS & Maps', 'map_default_travel_mode', 'Driving', 'string', 'Default Travel Mode'),

        # REPORTS
        ('Reports', 'report_default_format', 'PDF', 'string', 'Default Report Format'),
        ('Reports', 'report_include_charts', 'true', 'boolean', 'Include Charts'),
        ('Reports', 'report_include_methodology', 'true', 'boolean', 'Include Methodology'),
        ('Reports', 'report_include_data_quality', 'true', 'boolean', 'Include Data Quality'),
        ('Reports', 'report_include_recommendations', 'true', 'boolean', 'Include Recommendations'),
        ('Reports', 'report_retention_days', '90', 'number', 'Report Retention (Days)'),

        # SECURITY
        ('Security', 'sec_min_password_length', '8', 'number', 'Minimum Password Length'),
        ('Security', 'sec_max_failed_logins', '5', 'number', 'Maximum Failed Login Attempts'),
        ('Security', 'sec_lockout_duration_mins', '15', 'number', 'Lockout Duration (Minutes)'),
        ('Security', 'session_timeout_minutes', '30', 'number', 'Session Timeout (Minutes)'),

        # AUDIT & RETENTION
        ('Audit & Retention', 'audit_logging_enabled', 'true', 'boolean', 'Audit Logging Enabled'),
        ('Audit & Retention', 'audit_retention_days', '365', 'number', 'Retention Period (Days)'),
        ('Audit & Retention', 'audit_security_events', 'true', 'boolean', 'Security Event Logging')
    ]

    for cat, key, val, stype, desc in defaults:
        cursor.execute("""
            INSERT OR IGNORE INTO system_settings (category, setting_key, setting_value, setting_type, description)
            VALUES (?, ?, ?, ?, ?)
        """, (cat, key, val, stype, desc))

    conn.commit()
    print("Seeded all settings.")
    conn.close()

if __name__ == '__main__':
    seed_complete_settings()
