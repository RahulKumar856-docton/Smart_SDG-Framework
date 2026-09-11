import sqlite3

def setup_citizen_preferences_table():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS citizen_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        
        -- Notifications
        notif_service_updates BOOLEAN DEFAULT 1,
        notif_report_updates BOOLEAN DEFAULT 1,
        notif_work_updates BOOLEAN DEFAULT 1,
        notif_verification_requests BOOLEAN DEFAULT 1,
        notif_messages BOOLEAN DEFAULT 1,
        notif_announcements BOOLEAN DEFAULT 1,
        
        -- Communication channels
        channel_email BOOLEAN DEFAULT 1,
        channel_push BOOLEAN DEFAULT 1,
        
        -- Privacy
        profile_visibility TEXT DEFAULT 'PRIVATE',
        location_sharing TEXT DEFAULT 'WHEN_NEEDED',
        report_visibility TEXT DEFAULT 'ANONYMOUS',
        
        -- Appearance
        theme TEXT DEFAULT 'SYSTEM',
        
        -- Accessibility
        reduce_motion BOOLEAN DEFAULT 0,
        text_size TEXT DEFAULT 'NORMAL',
        high_contrast BOOLEAN DEFAULT 0,
        
        -- Regional
        language TEXT DEFAULT 'en',
        time_format TEXT DEFAULT '12h',
        date_format TEXT DEFAULT 'SYSTEM',
        timezone TEXT DEFAULT 'SYSTEM',
        
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_citizen_pref_user ON citizen_preferences(user_id);")

    conn.commit()
    conn.close()
    print("citizen_preferences table and index created successfully.")

if __name__ == '__main__':
    setup_citizen_preferences_table()
