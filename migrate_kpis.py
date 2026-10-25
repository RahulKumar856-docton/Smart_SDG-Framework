import sqlite3
import traceback

def migrate_kpis():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    # 1. Update kpis table
    columns_to_add = [
        ("code", "TEXT"),
        ("category", "TEXT"),
        ("department_id", "INTEGER"),
        ("project_id", "INTEGER"),
        ("baseline_value", "REAL DEFAULT 0.00"),
        ("current_value", "REAL DEFAULT 0.00"),
        ("direction", "TEXT DEFAULT 'Higher is Better'"),
        ("frequency", "TEXT DEFAULT 'Monthly'"),
        ("start_date", "DATE"),
        ("target_date", "DATE"),
        ("status", "TEXT DEFAULT 'On Target'"),
        ("created_by", "INTEGER"),
        ("created_at", "DATETIME DEFAULT CURRENT_TIMESTAMP")
    ]
    
    for col_name, col_type in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE kpis ADD COLUMN {col_name} {col_type}")
            print(f"Added column {col_name} to kpis.")
        except sqlite3.OperationalError as e:
            if 'duplicate column name' in str(e).lower():
                print(f"Column {col_name} already exists. Skipping.")
            else:
                print(f"OperationalError adding column {col_name}: {e}")
                
    # 2. Create kpi_measurements table
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS kpi_measurements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                kpi_id INTEGER NOT NULL,
                value REAL NOT NULL,
                achievement_percentage REAL DEFAULT 0.00,
                measurement_date DATE NOT NULL,
                notes TEXT,
                created_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (kpi_id) REFERENCES kpis(id) ON DELETE CASCADE,
                FOREIGN KEY (created_by) REFERENCES users(id)
            )
        """)
        print("Created kpi_measurements table.")
    except Exception as e:
        print(f"Error creating kpi_measurements table: {e}")
        traceback.print_exc()
        
    conn.commit()
    conn.close()
    print("Migration completed.")

if __name__ == '__main__':
    migrate_kpis()
