import sqlite3
import os

DB_PATH = 'database.db'

def setup_settings_table():
    if not os.path.exists(DB_PATH):
        print(f"Error: {DB_PATH} not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Create table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS system_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT NOT NULL,
                setting_key TEXT UNIQUE NOT NULL,
                setting_value TEXT,
                setting_type TEXT NOT NULL,
                description TEXT,
                updated_by INTEGER,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (updated_by) REFERENCES users(id)
            )
        """)
        
        # Seed Defaults
        defaults = [
            ('General', 'app_name', 'Municipal Monitor', 'string', 'Application Name'),
            ('General', 'default_language', 'en', 'string', 'Default Language'),
            ('General', 'date_format', 'YYYY-MM-DD', 'string', 'Date Format'),
            ('General', 'time_zone', 'UTC', 'string', 'System Timezone'),
            
            ('Projects', 'default_project_status', 'PLANNED', 'string', 'Default Status for New Projects'),
            ('Projects', 'progress_validation_enabled', 'true', 'boolean', 'Validate progress against milestones'),
            
            ('Evidence', 'evidence_max_file_size_mb', '10', 'number', 'Max upload size in MB'),
            ('Evidence', 'evidence_allowed_types', 'jpg,png,pdf', 'string', 'Comma-separated allowed extensions'),
            
            ('Data Quality', 'dq_critical_threshold', '50', 'number', 'Score below this is Critical'),
            ('Data Quality', 'dq_needs_attention_threshold', '75', 'number', 'Score below this Needs Attention'),
            
            ('GIS', 'map_default_zoom', '12', 'number', 'Default map zoom level'),
            ('GIS', 'map_default_lat', '40.7128', 'number', 'Default Map Center Latitude'),
            ('GIS', 'map_default_lng', '-74.0060', 'number', 'Default Map Center Longitude'),
            
            ('Reports', 'report_include_methodology', 'true', 'boolean', 'Include methodology by default'),
            ('Reports', 'report_retention_days', '90', 'number', 'Days to keep generated reports'),
            
            ('Security', 'session_timeout_minutes', '30', 'number', 'Admin session timeout'),
            ('Security', 'audit_logging_enabled', 'true', 'boolean', 'Enable audit logging (Critical)'),
            ('Security', 'max_failed_logins', '5', 'number', 'Max attempts before lockout'),
            
            ('AI', 'ai_analysis_enabled', 'true', 'boolean', 'Enable AI risk predictions')
        ]
        
        for cat, key, val, stype, desc in defaults:
            cursor.execute("""
                INSERT OR IGNORE INTO system_settings (category, setting_key, setting_value, setting_type, description)
                VALUES (?, ?, ?, ?, ?)
            """, (cat, key, val, stype, desc))

        conn.commit()
        print("System settings table created and seeded.")
    except Exception as e:
        print("Error updating schema:", e)
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    setup_settings_table()
