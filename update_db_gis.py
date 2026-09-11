from config import get_db_connection

def run():
    print("Connecting to DB...")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    tables_to_add = ['feedback', 'field_inspections', 'evidence']
    
    for table in tables_to_add:
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN latitude REAL")
            print(f"Added latitude to {table}")
        except Exception as e:
            print(f"Error adding latitude to {table}: {e}")
            
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN longitude REAL")
            print(f"Added longitude to {table}")
        except Exception as e:
            print(f"Error adding longitude to {table}: {e}")

    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS facilities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT,
                latitude REAL,
                longitude REAL,
                status TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("Created facilities table")
    except Exception as e:
        print(f"Error creating facilities table: {e}")

    conn.commit()
    conn.close()
    print("Done")

if __name__ == '__main__':
    run()
