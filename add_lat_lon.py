import sqlite3

def add_columns_and_seed():
    print("Connecting to database...")
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    tables = ['projects', 'citizen_requests', 'inspections']
    for table in tables:
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN latitude REAL")
            print(f"Added latitude to {table}")
        except sqlite3.OperationalError:
            print(f"latitude already exists in {table}")
            
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN longitude REAL")
            print(f"Added longitude to {table}")
        except sqlite3.OperationalError:
            print(f"longitude already exists in {table}")

    # Facilities table might not exist in sqlite schema yet
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
        print("Ensured facilities table exists")
    except sqlite3.OperationalError as e:
        print(f"Error with facilities table: {e}")

    # Seed data
    print("Seeding geographic data...")
    # Seed projects
    cursor.execute("UPDATE projects SET latitude = 11.0168, longitude = 76.9558, ward = 'Ward 1' WHERE id = 1")
    cursor.execute("UPDATE projects SET latitude = 11.0045, longitude = 76.9616, ward = 'Ward 2' WHERE id = 2")
    cursor.execute("UPDATE projects SET latitude = 11.0250, longitude = 76.9500, ward = 'Ward 3' WHERE id = 3")
    
    # Seed citizen_requests
    cursor.execute("UPDATE citizen_requests SET latitude = 11.0200, longitude = 76.9500, ward = 'Ward 1' WHERE id = 1")
    cursor.execute("UPDATE citizen_requests SET latitude = 11.0150, longitude = 76.9600, ward = 'Ward 2' WHERE id = 2")
    cursor.execute("UPDATE citizen_requests SET latitude = 11.0080, longitude = 76.9700, ward = 'Ward 3' WHERE id = 3")
    
    # Seed inspections
    cursor.execute("UPDATE inspections SET latitude = 11.0168, longitude = 76.9558 WHERE id = 1")
    cursor.execute("UPDATE inspections SET latitude = 11.0045, longitude = 76.9616 WHERE id = 2")

    conn.commit()
    conn.close()
    print("Completed adding columns and seeding data.")

if __name__ == '__main__':
    add_columns_and_seed()
