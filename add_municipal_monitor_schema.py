import sqlite3

def apply_municipal_monitor_schema():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    queries = [
        """
        CREATE TABLE IF NOT EXISTS sla_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            severity TEXT NOT NULL,
            max_resolution_days INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS report_escalations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            report_id INTEGER NOT NULL,
            level INTEGER NOT NULL,
            escalated_by INTEGER,
            escalated_to INTEGER,
            reason TEXT,
            action_taken TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (report_id) REFERENCES citizen_reports(id),
            FOREIGN KEY (escalated_by) REFERENCES users(id),
            FOREIGN KEY (escalated_to) REFERENCES users(id)
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS department_responses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            report_id INTEGER NOT NULL,
            department_id INTEGER NOT NULL,
            root_cause TEXT,
            delay_reason TEXT,
            action_plan TEXT,
            expected_completion DATE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (report_id) REFERENCES citizen_reports(id),
            FOREIGN KEY (department_id) REFERENCES departments(id)
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS work_progress_updates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            report_id INTEGER NOT NULL,
            officer_id INTEGER NOT NULL,
            progress_percentage REAL DEFAULT 0.0,
            remarks TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (report_id) REFERENCES citizen_reports(id),
            FOREIGN KEY (officer_id) REFERENCES users(id)
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS completion_verifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            report_id INTEGER NOT NULL,
            authority_id INTEGER NOT NULL,
            status TEXT DEFAULT 'PENDING',
            remarks TEXT,
            verified_at DATETIME,
            FOREIGN KEY (report_id) REFERENCES citizen_reports(id),
            FOREIGN KEY (authority_id) REFERENCES users(id)
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS ai_predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            report_id INTEGER NOT NULL,
            prediction_type TEXT NOT NULL,
            prediction_value TEXT NOT NULL,
            confidence REAL,
            factors TEXT,
            actual_outcome TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (report_id) REFERENCES citizen_reports(id)
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS report_timeline (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            report_id INTEGER NOT NULL,
            event_type TEXT NOT NULL,
            description TEXT,
            user_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (report_id) REFERENCES citizen_reports(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        """
    ]
    
    for q in queries:
        cursor.execute(q)
        
    try:
        cursor.execute("ALTER TABLE citizen_reports ADD COLUMN ai_classification TEXT")
        cursor.execute("ALTER TABLE citizen_reports ADD COLUMN expected_completion_date DATE")
        cursor.execute("ALTER TABLE citizen_reports ADD COLUMN progress_percentage REAL DEFAULT 0.0")
        cursor.execute("ALTER TABLE citizen_reports ADD COLUMN delay_status TEXT DEFAULT 'ON_TRACK'")
    except Exception as e:
        print("Columns might already exist:", e)

    conn.commit()
    conn.close()
    print("Municipal Monitor schema updated successfully.")

if __name__ == '__main__':
    apply_municipal_monitor_schema()
