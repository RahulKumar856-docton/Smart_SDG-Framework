import sqlite3
import os

DB_PATH = 'database.db'

def update_notifications_schema():
    if not os.path.exists(DB_PATH):
        print(f"Error: {DB_PATH} not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    columns_to_add = [
        ("type", "TEXT DEFAULT 'SYSTEM'"),
        ("priority", "TEXT DEFAULT 'INFO'"),
        ("module", "TEXT"),
        ("action_url", "TEXT"),
        ("read_at", "DATETIME"),
        ("archived_at", "DATETIME")
    ]

    for col_name, col_def in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE notifications ADD COLUMN {col_name} {col_def}")
            print(f"Added {col_name} to notifications")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print(f"Column {col_name} already exists.")
            else:
                print(f"Error adding {col_name}: {e}")
                
    conn.commit()
    conn.close()
    print("Schema updated successfully.")

if __name__ == '__main__':
    update_notifications_schema()
