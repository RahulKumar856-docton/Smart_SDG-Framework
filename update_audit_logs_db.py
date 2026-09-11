import sqlite3

def update_audit_schema():
    print("Connecting to database...")
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    table = 'audit_logs'
    columns = [
        ('module', 'TEXT'),
        ('result', "TEXT DEFAULT 'SUCCESS'")
    ]
    
    for col_name, col_type in columns:
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_type}")
            print(f"Added {col_name} to {table}")
        except sqlite3.OperationalError as e:
            print(f"Column {col_name} might already exist: {e}")
            
    conn.commit()
    conn.close()
    print("Schema updated successfully.")

if __name__ == '__main__':
    update_audit_schema()
