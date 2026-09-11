import sqlite3

def update_db():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    # 1. Create inspection_reports
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS inspection_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        inspection_id INTEGER,
        project_id INTEGER,
        request_id INTEGER,
        officer_id INTEGER NOT NULL,
        summary TEXT,
        overall_result TEXT,
        status TEXT DEFAULT 'DRAFT',
        admin_comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        submitted_at DATETIME,
        reviewed_at DATETIME,
        FOREIGN KEY (inspection_id) REFERENCES field_inspections(id),
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (request_id) REFERENCES citizen_requests(id),
        FOREIGN KEY (officer_id) REFERENCES users(id)
    )
    """)
    
    # 2. Create report_observations
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS report_observations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_id INTEGER NOT NULL,
        title TEXT,
        description TEXT,
        condition TEXT,
        severity TEXT,
        FOREIGN KEY (report_id) REFERENCES inspection_reports(id) ON DELETE CASCADE
    )
    """)
    
    # 3. Create report_findings
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS report_findings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_id INTEGER NOT NULL,
        title TEXT,
        description TEXT,
        severity TEXT,
        recommended_action TEXT,
        responsible_department TEXT,
        FOREIGN KEY (report_id) REFERENCES inspection_reports(id) ON DELETE CASCADE
    )
    """)
    
    # 4. Alter evidence table
    try:
        cursor.execute("ALTER TABLE evidence ADD COLUMN report_id INTEGER REFERENCES inspection_reports(id)")
    except sqlite3.OperationalError as e:
        # Ignore if column already exists
        if "duplicate column name" not in str(e):
            print(f"Warning on altering evidence: {e}")
            
    conn.commit()
    conn.close()
    print("Database updated successfully for Officer Inspection Reports.")

if __name__ == '__main__':
    update_db()
