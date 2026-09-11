import sqlite3
import random
from datetime import datetime, timedelta

def seed_database():
    conn = sqlite3.connect('database.db')
    c = conn.cursor()

    # 1. Departments
    departments = ['Public Works', 'Water & Sanitation', 'Environmental Protection', 'Urban Planning']
    c.execute("DELETE FROM departments")
    for name in departments:
        c.execute("INSERT INTO departments (name) VALUES (?)", (name,))
    
    # Get department IDs
    c.execute("SELECT id FROM departments")
    dept_ids = [row[0] for row in c.fetchall()]

    # 2. Projects
    projects = [
        ("Urban Drainage Improvement", dept_ids[0], "Active", "Medium"),
        ("Clean Water Extension Phase 2", dept_ids[1], "Delayed", "High"),
        ("City Park Restoration", dept_ids[2], "Completed", "Low"),
        ("Green Energy Streetlights", dept_ids[0], "Active", "Low"),
        ("Smart Waste Management", dept_ids[1], "Active", "Low"),
    ]
    c.execute("DELETE FROM projects")
    for name, dept_id, status, risk in projects:
        progress = random.randint(30, 95) if status != 'Completed' else 100
        c.execute("INSERT INTO projects (project_name, department_id, status, risk_level, reported_progress) VALUES (?, ?, ?, ?, ?)", 
                  (name, dept_id, status, risk, progress))
    
    # 3. Citizen Requests
    c.execute("SELECT id FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'CITIZEN')")
    citizen_user = c.fetchone()
    citizen_id = citizen_user[0] if citizen_user else 1

    requests = [
        ("Blocked Drainage on Main St", "Infrastructure", "In Progress", "High"),
        ("Streetlight not working", "Utilities", "New", "Medium"),
        ("Park needs maintenance", "Environment", "Resolved", "Low"),
        ("Water pipe leaking", "Water", "Under Review", "High")
    ]
    c.execute("DELETE FROM citizen_requests")
    for idx, (title, cat, status, prio) in enumerate(requests):
        c.execute("INSERT INTO citizen_requests (citizen_id, request_id_code, request_type, title, category, description, status, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                  (citizen_id, f"REQ-2026-{idx+100}", "Issue", title, cat, "Sample description", status, prio))

    conn.commit()
    conn.close()
    print("Database seeded with sample data.")

if __name__ == '__main__':
    seed_database()
