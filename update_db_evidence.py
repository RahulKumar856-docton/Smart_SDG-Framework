import sqlite3

def update_db():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS evidence (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_type TEXT,
        mime_type TEXT,
        file_size INTEGER,
        file_hash TEXT,
        uploaded_by INTEGER,
        project_id INTEGER,
        inspection_id INTEGER,
        request_id INTEGER,
        kpi_measurement_id INTEGER,
        status TEXT DEFAULT 'PENDING',
        verification_note TEXT,
        rejection_reason TEXT,
        verified_by INTEGER,
        verified_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uploaded_by) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (verified_by) REFERENCES users(id)
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS evidence_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        evidence_id INTEGER NOT NULL,
        file_path TEXT,
        version INTEGER,
        uploaded_by INTEGER,
        status TEXT,
        reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (evidence_id) REFERENCES evidence(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
    )
    """)
    
    cursor.execute("SELECT COUNT(*) FROM evidence")
    if cursor.fetchone()[0] == 0:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='documents'")
        if cursor.fetchone():
            cursor.execute("""
            INSERT INTO evidence (
                file_name, file_path, file_type, uploaded_by, project_id, status, created_at
            )
            SELECT 
                title, file_path, 'Document', uploaded_by, project_id, 
                CASE WHEN stage = 'VERIFIED' THEN 'VERIFIED' ELSE 'PENDING' END,
                uploaded_at
            FROM documents
            """)
            print(f"Migrated {cursor.rowcount} records from documents to evidence.")

    conn.commit()
    conn.close()

if __name__ == '__main__':
    update_db()
