import os
import sqlite3

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'super-secret-sdg-key-2026'
    
    # File uploads
    UPLOAD_FOLDER_EVIDENCE = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'uploads/evidence')
    UPLOAD_FOLDER_FEEDBACK = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'uploads/feedback')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024 # 16 MB limit
    
    # App Settings
    DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() in ('true', '1')

    # Session cookie settings for Render & cross-origin hosting
    SESSION_COOKIE_SAMESITE = os.environ.get('SESSION_COOKIE_SAMESITE', 'Lax')
    SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'False').lower() in ('true', '1')
    SESSION_COOKIE_HTTPONLY = True


class DictCursor:
    def __init__(self, cursor):
        self.cursor = cursor
    
    def execute(self, query, params=None):
        query = query.replace('%s', '?')
        if params is None:
            self.cursor.execute(query)
        else:
            self.cursor.execute(query, params)
    
    def fetchone(self):
        row = self.cursor.fetchone()
        return dict(row) if row else None
        
    def fetchall(self):
        rows = self.cursor.fetchall()
        return [dict(row) for row in rows]
        
    def close(self):
        self.cursor.close()
        
    @property
    def lastrowid(self):
        return self.cursor.lastrowid

class SQLiteConnectionWrapper:
    def __init__(self, db_path):
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
        
    def cursor(self, dictionary=False):
        # Always return dictionary-like access wrapper
        return DictCursor(self.conn.cursor())
        
    def commit(self):
        self.conn.commit()
        
    def rollback(self):
        self.conn.rollback()
        
    def close(self):
        self.conn.close()

def get_db_connection():
    db_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'database.db')
    return SQLiteConnectionWrapper(db_path)
