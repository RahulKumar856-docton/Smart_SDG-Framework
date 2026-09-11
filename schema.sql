-- Smart SDG Monitoring System Database Schema

CREATE DATABASE IF NOT EXISTS municipal_sdg_monitoring;
USE municipal_sdg_monitoring;

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table (Admin, Officer, Citizen)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Officer', 'Citizen') NOT NULL,
    department_id INT DEFAULT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    employee_id VARCHAR(50) UNIQUE,
    designation VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- 3. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    department_id INT NOT NULL,
    manager_id INT,
    location VARCHAR(255),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    start_date DATE,
    expected_end_date DATE,
    actual_end_date DATE,
    allocated_budget DECIMAL(15,2) DEFAULT 0.00,
    amount_spent DECIMAL(15,2) DEFAULT 0.00,
    status ENUM('Planned', 'In Progress', 'Completed', 'Delayed', 'Cancelled') DEFAULT 'Planned',
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    population_benefited INT DEFAULT 0,
    environmental_impact TEXT,
    verified_progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    verification_status VARCHAR(50) DEFAULT 'Pending',
    ward VARCHAR(255),
    data_confidence_score DECIMAL(5,2) DEFAULT 0.00,
    risk_score DECIMAL(5,2) DEFAULT 0.00,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (manager_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 4. SDGs Table
CREATE TABLE IF NOT EXISTS sdgs (
    id INT PRIMARY KEY, -- Will use standard numbers: 6, 11, 13, 15
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#000000'
);

-- 5. KPIs Table
CREATE TABLE IF NOT EXISTS kpis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sdg_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    unit VARCHAR(50),
    target_value DECIMAL(10,2) NOT NULL,
    weight DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    FOREIGN KEY (sdg_id) REFERENCES sdgs(id) ON DELETE CASCADE
);

-- 6. Project to SDGs Mapping (Many-to-Many)
CREATE TABLE IF NOT EXISTS project_sdgs (
    project_id INT NOT NULL,
    sdg_id INT NOT NULL,
    PRIMARY KEY (project_id, sdg_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (sdg_id) REFERENCES sdgs(id) ON DELETE CASCADE
);

-- 7. Project KPIs (Values logged for a project)
CREATE TABLE IF NOT EXISTS project_kpis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    kpi_id INT NOT NULL,
    current_value DECIMAL(10,2) DEFAULT 0.00,
    achievement_percentage DECIMAL(5,2) DEFAULT 0.00,
    score DECIMAL(5,2) DEFAULT 0.00,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (kpi_id) REFERENCES kpis(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- 8. Project SDG Scores
CREATE TABLE IF NOT EXISTS sdg_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    sdg_id INT NOT NULL,
    score DECIMAL(5,2) DEFAULT 0.00,
    target_score DECIMAL(5,2) DEFAULT 100.00,
    gap DECIMAL(5,2) DEFAULT 0.00,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (sdg_id) REFERENCES sdgs(id) ON DELETE CASCADE
);

-- 9. Project Progress Tracking (For historical tracking)
CREATE TABLE IF NOT EXISTS project_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    recorded_date DATE NOT NULL,
    progress_percentage DECIMAL(5,2) NOT NULL,
    budget_spent DECIMAL(15,2) NOT NULL,
    recorded_by INT,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id)
);

-- 10. Alerts Table (Early Warning System)
CREATE TABLE IF NOT EXISTS alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    alert_type VARCHAR(100),
    level ENUM('INFO', 'WARNING', 'CRITICAL') DEFAULT 'INFO',
    message TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 11. Recommendations Table
CREATE TABLE IF NOT EXISTS recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    problem TEXT,
    cause TEXT,
    recommended_action TEXT,
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 12. Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    user_id INT NOT NULL,
    category ENUM('Delay', 'Quality', 'Environmental issue', 'Water issue', 'Waste issue', 'Infrastructure issue', 'Other') NOT NULL,
    description TEXT NOT NULL,
    image_path VARCHAR(255),
    status ENUM('Pending', 'Reviewed', 'Resolved') DEFAULT 'Pending',
    admin_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 13. Documents/Evidence Table
CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    title VARCHAR(255),
    file_path VARCHAR(255) NOT NULL,
    stage ENUM('BEFORE', 'DURING', 'AFTER', 'DOCUMENT') DEFAULT 'DOCUMENT',
    uploaded_by INT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- 14. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(50) NOT NULL,
    module VARCHAR(50) NOT NULL,
    record_id INT,
    previous_value TEXT,
    new_value TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 15. Field Inspections Table
CREATE TABLE IF NOT EXISTS field_inspections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    inspector_id INT NOT NULL,
    inspection_date DATE NOT NULL,
    observed_progress DECIMAL(5,2) DEFAULT 0.00,
    issues TEXT,
    remarks TEXT,
    location VARCHAR(255),
    status ENUM('Pending', 'Verified', 'Discrepancy') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (inspector_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 16. Project Environmental Metrics
CREATE TABLE IF NOT EXISTS project_environmental_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    trees_planted INT DEFAULT 0,
    water_saved_liters DECIMAL(15,2) DEFAULT 0.00,
    carbon_reduction_tons DECIMAL(15,2) DEFAULT 0.00,
    land_restored_sqm DECIMAL(15,2) DEFAULT 0.00,
    measurement_date DATE NOT NULL,
    source VARCHAR(255),
    formula TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 17. Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    sender_id INT NOT NULL,
    message TEXT NOT NULL,
    attachment_url VARCHAR(255) DEFAULT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id)
);

-- 18. Citizen Preferences Table
CREATE TABLE IF NOT EXISTS citizen_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    notif_service_updates BOOLEAN DEFAULT TRUE,
    notif_report_updates BOOLEAN DEFAULT TRUE,
    notif_work_updates BOOLEAN DEFAULT TRUE,
    notif_verification_requests BOOLEAN DEFAULT TRUE,
    notif_messages BOOLEAN DEFAULT TRUE,
    notif_announcements BOOLEAN DEFAULT TRUE,
    channel_email BOOLEAN DEFAULT TRUE,
    channel_push BOOLEAN DEFAULT TRUE,
    profile_visibility VARCHAR(50) DEFAULT 'PRIVATE',
    location_sharing VARCHAR(50) DEFAULT 'WHEN_NEEDED',
    report_visibility VARCHAR(50) DEFAULT 'ANONYMOUS',
    theme VARCHAR(20) DEFAULT 'SYSTEM',
    reduce_motion BOOLEAN DEFAULT FALSE,
    text_size VARCHAR(20) DEFAULT 'NORMAL',
    high_contrast BOOLEAN DEFAULT FALSE,
    language VARCHAR(10) DEFAULT 'en',
    time_format VARCHAR(10) DEFAULT '12h',
    date_format VARCHAR(20) DEFAULT 'SYSTEM',
    timezone VARCHAR(50) DEFAULT 'SYSTEM',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


