import sqlite3

def update_schema():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    # 1. Update field_inspections and users
    try:
        cursor.execute("ALTER TABLE field_inspections ADD COLUMN inspection_type TEXT DEFAULT 'Routine'")
        cursor.execute("ALTER TABLE field_inspections ADD COLUMN discrepancy REAL DEFAULT 0.00")
        cursor.execute("ALTER TABLE field_inspections ADD COLUMN observed_progress REAL DEFAULT 0.00")
    except sqlite3.OperationalError as e:
        print("Columns might already exist in field_inspections:", e)

    try:
        cursor.execute("ALTER TABLE users ADD COLUMN employee_id TEXT")
        cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_id ON users(employee_id)")
        cursor.execute("ALTER TABLE users ADD COLUMN designation TEXT")
    except sqlite3.OperationalError as e:
        print("Columns might already exist in users:", e)

    # 2. Create inspection_evidence table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS inspection_evidence (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            inspection_id INTEGER NOT NULL,
            file_name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_type TEXT NOT NULL,
            uploaded_by INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (inspection_id) REFERENCES field_inspections(id) ON DELETE CASCADE,
            FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    conn.commit()
    conn.close()
    print("Schema updated successfully.")

if __name__ == '__main__':
    update_schema()
