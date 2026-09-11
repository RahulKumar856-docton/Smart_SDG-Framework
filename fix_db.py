import sqlite3
try:
    conn = sqlite3.connect('c:\\Smart-SDG-Framework\\database.db')
    cursor = conn.cursor()
    cursor.execute("DROP TABLE IF EXISTS field_inspections;")
    cursor.execute("""
    CREATE TABLE field_inspections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        inspector_id INTEGER NOT NULL,
        inspection_date DATE NOT NULL DEFAULT (date('now')),
        reported_progress REAL DEFAULT 0.00,
        verified_progress REAL DEFAULT 0.00,
        issues TEXT,
        remarks TEXT,
        location TEXT,
        status TEXT DEFAULT 'Pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (inspector_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)
    conn.commit()
    print("Table recreated successfully.")
except Exception as e:
    print("Error:", e)
finally:
    if conn:
        conn.close()