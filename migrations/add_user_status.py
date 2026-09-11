import os
import sys

# Add parent directory to path to allow importing config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import get_db_connection

def migrate():
    print("Running migration: add_user_status")
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # In SQLite, we can't easily check if a column exists without parsing PRAGMA table_info
        # We will wrap it in a try-except to ignore errors if it already exists
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'Active'")
            print("Successfully added 'status' column.")
        except Exception as e:
            if "duplicate column name" in str(e).lower():
                print("Column 'status' already exists.")
            else:
                raise e
                
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN employee_id TEXT")
            print("Successfully added 'employee_id' column.")
        except Exception as e:
            if "duplicate column name" in str(e).lower():
                print("Column 'employee_id' already exists.")
            else:
                raise e
                
        # Set all existing officers to 'Active' to prevent locking out the demo officer
        cursor.execute("UPDATE users SET status = 'Active'")
        conn.commit()
        
        cursor.close()
        conn.close()
        print("Migration complete.")
    except Exception as err:
        print(f"Migration failed: {err}")

if __name__ == '__main__':
    migrate()
