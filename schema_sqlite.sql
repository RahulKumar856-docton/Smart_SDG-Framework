-- SQLite Schema for Smart SDG Monitoring System

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    department_id INTEGER DEFAULT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    employee_id TEXT UNIQUE,
    designation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- 3. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_name TEXT NOT NULL,
    description TEXT,
    department_id INTEGER NOT NULL,
    manager_id INTEGER,
    location TEXT,
    latitude REAL,
    longitude REAL,
    start_date DATE,
    expected_end_date DATE,
    actual_end_date DATE,
    allocated_budget REAL DEFAULT 0.00,
    amount_spent REAL DEFAULT 0.00,
    status TEXT DEFAULT 'Planned',
    progress_percentage REAL DEFAULT 0.00,
    priority TEXT DEFAULT 'Medium',
    population_benefited INTEGER DEFAULT 0,
    environmental_impact TEXT,
    verified_progress_percentage REAL DEFAULT 0.00,
    verification_status TEXT DEFAULT 'Pending',
    ward TEXT,
    data_confidence_score REAL DEFAULT 0.00,
    risk_score REAL DEFAULT 0.00,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (manager_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 4. SDGs Table
CREATE TABLE IF NOT EXISTS sdgs (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#000000'
);

-- 5. KPIs Table
CREATE TABLE IF NOT EXISTS kpis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sdg_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    unit TEXT,
    target_value REAL NOT NULL,
    weight REAL NOT NULL DEFAULT 1.00,
    FOREIGN KEY (sdg_id) REFERENCES sdgs(id) ON DELETE CASCADE
);

-- 6. Project to SDGs Mapping
CREATE TABLE IF NOT EXISTS project_sdgs (
    project_id INTEGER NOT NULL,
    sdg_id INTEGER NOT NULL,
    PRIMARY KEY (project_id, sdg_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (sdg_id) REFERENCES sdgs(id) ON DELETE CASCADE
);

-- 7. Project KPIs
CREATE TABLE IF NOT EXISTS project_kpis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    kpi_id INTEGER NOT NULL,
    current_value REAL DEFAULT 0.00,
    achievement_percentage REAL DEFAULT 0.00,
    score REAL DEFAULT 0.00,
    updated_by INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (kpi_id) REFERENCES kpis(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- 8. Project SDG Scores
CREATE TABLE IF NOT EXISTS sdg_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    sdg_id INTEGER NOT NULL,
    score REAL DEFAULT 0.00,
    target_score REAL DEFAULT 100.00,
    gap REAL DEFAULT 0.00,
    calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (sdg_id) REFERENCES sdgs(id) ON DELETE CASCADE
);

-- 9. Project Progress Tracking
CREATE TABLE IF NOT EXISTS project_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    recorded_date DATE NOT NULL,
    progress_percentage REAL NOT NULL,
    budget_spent REAL NOT NULL,
    recorded_by INTEGER,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id)
);

-- 10. Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    alert_type TEXT,
    level TEXT DEFAULT 'INFO',
    message TEXT,
    is_resolved BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 11. Recommendations Table
CREATE TABLE IF NOT EXISTS recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    problem TEXT,
    cause TEXT,
    recommended_action TEXT,
    priority TEXT DEFAULT 'Medium',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 12. Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    image_path TEXT,
    status TEXT DEFAULT 'Pending',
    admin_response TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 13. Documents/Evidence Table
CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    title TEXT,
    file_path TEXT NOT NULL,
    stage TEXT DEFAULT 'DOCUMENT',
    uploaded_by INTEGER,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS request_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status_change TEXT,
    remarks TEXT,
    evidence_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES citizen_requests(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 14. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    record_id INTEGER,
    previous_value TEXT,
    new_value TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 15. Field Inspections Table
CREATE TABLE IF NOT EXISTS field_inspections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    inspector_id INTEGER NOT NULL,
    inspection_date DATE NOT NULL DEFAULT (date('now')),
    reported_progress REAL DEFAULT 0.00,
    verified_progress REAL DEFAULT 0.00,
    issues TEXT,
    remarks TEXT,
    location TEXT,
    status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (inspector_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 16. Project Environmental Metrics
CREATE TABLE IF NOT EXISTS project_environmental_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    trees_planted INTEGER DEFAULT 0,
    water_saved_liters REAL DEFAULT 0.00,
    carbon_reduction_tons REAL DEFAULT 0.00,
    land_restored_sqm REAL DEFAULT 0.00,
    measurement_date DATE NOT NULL,
    source TEXT,
    formula TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 17. Citizen Reports (Distinct from Service Requests)
CREATE TABLE IF NOT EXISTS citizen_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id_code TEXT UNIQUE NOT NULL,
    citizen_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT,
    latitude REAL,
    longitude REAL,
    severity TEXT DEFAULT 'MEDIUM',
    evidence_path TEXT,
    status TEXT DEFAULT 'SUBMITTED',
    department_id INTEGER,
    officer_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (citizen_id) REFERENCES users(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (officer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS report_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status_change TEXT,
    remarks TEXT,
    evidence_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES citizen_reports(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS report_evidence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_by INTEGER NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES citizen_reports(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- 18. Messages Table for Citizen & Staff Communication
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL, -- 'SERVICE_REQUEST' or 'REPORT'
    entity_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    attachment_url TEXT DEFAULT NULL,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id)
);

-- 19. Citizen Preferences Table
CREATE TABLE IF NOT EXISTS citizen_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    notif_service_updates BOOLEAN DEFAULT 1,
    notif_report_updates BOOLEAN DEFAULT 1,
    notif_work_updates BOOLEAN DEFAULT 1,
    notif_verification_requests BOOLEAN DEFAULT 1,
    notif_messages BOOLEAN DEFAULT 1,
    notif_announcements BOOLEAN DEFAULT 1,
    channel_email BOOLEAN DEFAULT 1,
    channel_push BOOLEAN DEFAULT 1,
    profile_visibility TEXT DEFAULT 'PRIVATE',
    location_sharing TEXT DEFAULT 'WHEN_NEEDED',
    report_visibility TEXT DEFAULT 'ANONYMOUS',
    theme TEXT DEFAULT 'SYSTEM',
    reduce_motion BOOLEAN DEFAULT 0,
    text_size TEXT DEFAULT 'NORMAL',
    high_contrast BOOLEAN DEFAULT 0,
    language TEXT DEFAULT 'en',
    time_format TEXT DEFAULT '12h',
    date_format TEXT DEFAULT 'SYSTEM',
    timezone TEXT DEFAULT 'SYSTEM',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);



