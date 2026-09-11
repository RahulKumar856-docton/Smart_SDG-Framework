import sqlite3
import os

DB_PATH = 'database.db'

def build_db():
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Enable foreign keys
    cursor.execute("PRAGMA foreign_keys = ON;")
    
    # Execute full schema
    schema = """
    -- users, roles, departments
    CREATE TABLE roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT
    );
    
    CREATE TABLE departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT
    );
    
    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role_id INTEGER NOT NULL,
        department_id INTEGER,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT,
        employee_id TEXT UNIQUE,
        designation TEXT,
        status TEXT DEFAULT 'ACTIVE',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id),
        FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    -- projects, project_assignments
    CREATE TABLE projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_name TEXT NOT NULL,
        description TEXT,
        department_id INTEGER NOT NULL,
        location TEXT,
        ward TEXT,
        budget REAL DEFAULT 0.0,
        start_date DATE,
        expected_completion DATE,
        actual_completion DATE,
        status TEXT DEFAULT 'PLANNED',
        risk_level TEXT DEFAULT 'Low',
        reported_progress REAL DEFAULT 0.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id)
    );
    
    CREATE TABLE project_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        officer_id INTEGER NOT NULL,
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (officer_id) REFERENCES users(id)
    );

    -- sdgs, kpis, project_kpis, kpi_measurements
    CREATE TABLE sdgs (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT
    );
    
    CREATE TABLE kpis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        unit TEXT,
        target_value REAL,
        weight REAL,
        frequency TEXT,
        sdg_id INTEGER NOT NULL,
        project_id INTEGER,
        FOREIGN KEY (sdg_id) REFERENCES sdgs(id),
        FOREIGN KEY (project_id) REFERENCES projects(id)
    );
    
    CREATE TABLE project_kpis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        kpi_id INTEGER NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (kpi_id) REFERENCES kpis(id)
    );
    
    CREATE TABLE kpi_measurements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kpi_id INTEGER NOT NULL,
        officer_id INTEGER NOT NULL,
        actual_value REAL NOT NULL,
        measurement_date DATE NOT NULL,
        source TEXT,
        remarks TEXT,
        evidence_path TEXT,
        status TEXT DEFAULT 'PENDING_VERIFICATION',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (kpi_id) REFERENCES kpis(id),
        FOREIGN KEY (officer_id) REFERENCES users(id)
    );

    -- inspections, inspection_evidence
    CREATE TABLE inspections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        request_id INTEGER,
        officer_id INTEGER NOT NULL,
        inspection_date DATE NOT NULL,
        reported_progress REAL,
        observed_progress REAL,
        issues TEXT,
        remarks TEXT,
        location TEXT,
        status TEXT DEFAULT 'PENDING_VERIFICATION',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (officer_id) REFERENCES users(id)
    );
    
    CREATE TABLE inspection_evidence (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        inspection_id INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        description TEXT,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (inspection_id) REFERENCES inspections(id)
    );

    -- citizen_requests, request_assignments, request_updates
    CREATE TABLE citizen_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id_code TEXT UNIQUE NOT NULL,
        citizen_id INTEGER NOT NULL,
        request_type TEXT NOT NULL,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        location TEXT,
        ward TEXT,
        priority TEXT DEFAULT 'Medium',
        evidence_path TEXT,
        status TEXT DEFAULT 'SUBMITTED',
        department_id INTEGER,
        project_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (citizen_id) REFERENCES users(id),
        FOREIGN KEY (department_id) REFERENCES departments(id),
        FOREIGN KEY (project_id) REFERENCES projects(id)
    );
    
    CREATE TABLE request_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id INTEGER NOT NULL,
        officer_id INTEGER NOT NULL,
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (request_id) REFERENCES citizen_requests(id),
        FOREIGN KEY (officer_id) REFERENCES users(id)
    );
    
    CREATE TABLE request_updates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        status_change TEXT,
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (request_id) REFERENCES citizen_requests(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE citizen_feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id INTEGER NOT NULL,
        rating INTEGER,
        feedback TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (request_id) REFERENCES citizen_requests(id)
    );

    -- analytics, risks, recommendations, notifications, audit_logs, reports
    CREATE TABLE risks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        level TEXT,
        factors TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id)
    );
    
    CREATE TABLE recommendations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        action TEXT,
        reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id)
    );
    
    CREATE TABLE notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT 0,
        entity_type TEXT,
        entity_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    
    CREATE TABLE audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        entity TEXT NOT NULL,
        entity_id INTEGER,
        old_value TEXT,
        new_value TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    
    CREATE TABLE reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        report_type TEXT NOT NULL,
        file_path TEXT NOT NULL,
        generated_by INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (generated_by) REFERENCES users(id)
    );

    -- AI
    CREATE TABLE ai_predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        delay_probability REAL,
        risk_level TEXT,
        factors TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id)
    );
    
    CREATE TABLE ai_anomalies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        entity_id INTEGER NOT NULL,
        anomaly_description TEXT NOT NULL,
        severity TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """
    
    cursor.executescript(schema)
    
    # Insert roles
    cursor.execute("INSERT INTO roles (name) VALUES ('ADMIN'), ('OFFICER'), ('CITIZEN');")
    
    # Insert SDGs
    sdgs = [
        (6, 'Clean Water and Sanitation', 'Ensure availability and sustainable management of water and sanitation for all'),
        (11, 'Sustainable Cities and Communities', 'Make cities and human settlements inclusive, safe, resilient and sustainable'),
        (13, 'Climate Action', 'Take urgent action to combat climate change and its impacts'),
        (15, 'Life on Land', 'Protect, restore and promote sustainable use of terrestrial ecosystems')
    ]
    cursor.executemany("INSERT INTO sdgs (id, name, description) VALUES (?, ?, ?);", sdgs)
    
    # Demo admin user (password: admin123 hashed with Werkzeug)
    from werkzeug.security import generate_password_hash
    pw_hash = generate_password_hash('admin123')
    cursor.execute("INSERT INTO users (username, password_hash, role_id, full_name, email) VALUES (?, ?, 1, 'Admin User', 'admin@municipality.gov');", ('admin', pw_hash))
    
    conn.commit()
    conn.close()
    print("Database built successfully.")

if __name__ == '__main__':
    build_db()
