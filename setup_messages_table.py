import sqlite3

def init_messages_table():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL, -- 'SERVICE_REQUEST' or 'REPORT'
        entity_id INTEGER NOT NULL, -- ID of citizen_requests or citizen_reports
        sender_id INTEGER NOT NULL, -- FK to users(id)
        message TEXT NOT NULL,
        attachment_url TEXT DEFAULT NULL,
        is_read BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id)
    );
    """)
    
    # Create indexes for fast lookup
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_entity ON messages(entity_type, entity_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(is_read);")
    
    conn.commit()
    conn.close()
    print("Messages table and indexes created successfully.")

if __name__ == '__main__':
    init_messages_table()
