import sqlite3

def update_db():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS data_quality_scans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        started_at DATETIME NOT NULL,
        completed_at DATETIME,
        records_checked INTEGER DEFAULT 0,
        issues_found INTEGER DEFAULT 0,
        critical_issues INTEGER DEFAULT 0,
        status TEXT DEFAULT 'RUNNING',
        duration REAL DEFAULT 0,
        overall_score REAL DEFAULT 0,
        completeness_score REAL DEFAULT 0,
        validity_score REAL DEFAULT 0,
        consistency_score REAL DEFAULT 0,
        recency_score REAL DEFAULT 0,
        verification_score REAL DEFAULT 0
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS data_quality_issues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scan_id INTEGER NOT NULL,
        module TEXT NOT NULL,
        record_id INTEGER,
        issue_type TEXT NOT NULL,
        severity TEXT NOT NULL,
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
        FOREIGN KEY (scan_id) REFERENCES data_quality_scans(id),
        FOREIGN KEY (resolved_by) REFERENCES users(id),
        FOREIGN KEY (ignored_by) REFERENCES users(id)
    )
    """)

    conn.commit()
    conn.close()

if __name__ == '__main__':
    update_db()
