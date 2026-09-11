import os
from config import get_db_connection

def init_db():
    print("Connecting to SQLite Database...")
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Read schema file
        schema_path = os.path.join(os.path.dirname(__file__), 'schema_sqlite.sql')
        with open(schema_path, 'r') as f:
            sql_script = f.read()
            
        print("Executing schema_sqlite.sql...")
        # Execute each statement
        # Using sqlite3 natively for script execution
        conn.conn.executescript(sql_script)
                    
        conn.commit()
        cursor.close()
        conn.close()
        print("Database initialized successfully.")
    except Exception as err:
        print(f"Database error: {err}")


if __name__ == '__main__':
    init_db()
