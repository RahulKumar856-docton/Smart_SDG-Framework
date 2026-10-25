import sqlite3

def create_dq_tables():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    # 1. Create data_quality_scans table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS data_quality_scans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'RUNNING',
            completed_at DATETIME,
            records_checked INTEGER DEFAULT 0,
            issues_found INTEGER DEFAULT 0,
            critical_issues INTEGER DEFAULT 0,
            duration REAL DEFAULT 0.0,
            overall_score REAL DEFAULT 0.0,
            completeness_score REAL DEFAULT 0.0,
            validity_score REAL DEFAULT 0.0,
            consistency_score REAL DEFAULT 0.0,
            recency_score REAL DEFAULT 0.0,
            verification_score REAL DEFAULT 0.0
        )
    """)
    
    # 2. Create data_quality_issues table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS data_quality_issues (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            scan_id INTEGER NOT NULL,
            module TEXT NOT NULL,
            record_id INTEGER,
            issue_type TEXT,
            severity TEXT,
            field TEXT,
            current_value TEXT,
            description TEXT,
            status TEXT DEFAULT 'OPEN',
            detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            resolved_at DATETIME,
            resolved_by INTEGER,
            ignored_at DATETIME,
            ignored_by INTEGER,
            ignore_reason TEXT,
            FOREIGN KEY (scan_id) REFERENCES data_quality_scans(id) ON DELETE CASCADE
        )
    """)
    
    conn.commit()
    conn.close()
    print("Data quality tables created successfully.")

if __name__ == '__main__':
    create_dq_tables()
