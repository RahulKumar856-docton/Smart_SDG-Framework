import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import get_db_connection

def migrate():
    print("Running advanced schema migration...")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Add Ward to projects for Geographic Equity
        try:
            cursor.execute("ALTER TABLE projects ADD COLUMN ward TEXT")
            print("Added 'ward' column to projects.")
        except Exception as e:
            if "duplicate column name" not in str(e).lower(): raise e
            
        # Add Provenance and Confidence fields to project_kpis
        try:
            cursor.execute("ALTER TABLE project_kpis ADD COLUMN source TEXT")
            cursor.execute("ALTER TABLE project_kpis ADD COLUMN verification_status TEXT DEFAULT 'Reported'")
            cursor.execute("ALTER TABLE project_kpis ADD COLUMN verified_by INTEGER")
            cursor.execute("ALTER TABLE project_kpis ADD COLUMN verified_at DATETIME")
            cursor.execute("ALTER TABLE project_kpis ADD COLUMN evidence_path TEXT")
            print("Added provenance fields to project_kpis.")
        except Exception as e:
            if "duplicate column name" not in str(e).lower(): raise e

        # Create Field Inspections Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS field_inspections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            inspector_id INTEGER NOT NULL,
            inspection_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            reported_progress REAL,
            verified_progress REAL,
            issues TEXT,
            remarks TEXT,
            evidence_path TEXT,
            status TEXT DEFAULT 'Completed',
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (inspector_id) REFERENCES users(id)
        )
        """)
        print("Created field_inspections table.")
        
        # Add Impact Index scores to projects
        try:
            cursor.execute("ALTER TABLE projects ADD COLUMN impact_index REAL DEFAULT 0.0")
            cursor.execute("ALTER TABLE projects ADD COLUMN data_confidence REAL DEFAULT 0.0")
            print("Added impact_index and data_confidence to projects.")
        except Exception as e:
            if "duplicate column name" not in str(e).lower(): raise e

        conn.commit()
        print("Advanced migration completed successfully.")
        
    except Exception as err:
        print(f"Migration failed: {err}")
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    migrate()
