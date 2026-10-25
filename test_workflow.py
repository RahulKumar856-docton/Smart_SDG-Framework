import sqlite3
import datetime
import os
from config import get_db_connection

conn = get_db_connection()
cursor = conn.cursor()

def log(msg):
    print(f"[TEST] {msg}")

try:
    # 1. Citizen Submits Report
    log("Citizen submits report...")
    cursor.execute("""
        INSERT INTO citizen_requests (citizen_id, request_type, request_id_code, category, priority, title, description, location, ward, status, created_at)
        VALUES (1, 'REPORT', 'REQ-TEST-001', 'Road Damage', 'High', 'Test Pothole', 'Massive pothole test', 'Test St', 'Ward 1', 'SUBMITTED', CURRENT_TIMESTAMP)
    """)
    request_id = cursor.cursor.lastrowid
    
    # 2. Higher Authority Verifies
    log("Authority verifies...")
    cursor.execute("UPDATE citizen_requests SET status = 'VERIFIED' WHERE id = ?", (request_id,))
    cursor.execute("INSERT INTO request_updates (request_id, user_id, status_change, remarks) VALUES (?, 2, 'VERIFIED', 'Verified by admin')", (request_id,))
    
    # 3. Assign Department
    log("Assign Department...")
    sla = 7
    expected_comp = datetime.datetime.now() + datetime.timedelta(days=sla)
    cursor.execute("UPDATE citizen_requests SET status = 'DEPARTMENT_ASSIGNED', department_id = 1, sla_days = ?, expected_completion_date = ? WHERE id = ?", 
                  (sla, expected_comp.strftime('%Y-%m-%d %H:%M:%S'), request_id))
                  
    # 4. Department Assigns Officer
    log("Assign Officer...")
    cursor.execute("INSERT INTO request_assignments (request_id, officer_id, assigned_at) VALUES (?, 3, CURRENT_TIMESTAMP)", (request_id,))
    cursor.execute("UPDATE citizen_requests SET status = 'ASSIGNED' WHERE id = ?", (request_id,))
    
    # 5. Officer Work Progress
    log("Officer updates progress (50%)...")
    cursor.execute("UPDATE citizen_requests SET progress_percentage = 50, status = 'IN_PROGRESS' WHERE id = ?", (request_id,))
    
    # 6. Officer 100% Completion
    log("Officer updates progress (100%)...")
    cursor.execute("UPDATE citizen_requests SET progress_percentage = 100, status = 'AWAITING_VERIFICATION' WHERE id = ?", (request_id,))
    
    # 7. Authority Verification -> Resolved
    log("Authority verifies completion...")
    cursor.execute("UPDATE citizen_requests SET status = 'RESOLVED', actual_completion_date = CURRENT_TIMESTAMP WHERE id = ?", (request_id,))
    
    conn.commit()
    log("SUCCESS: End-to-end workflow database test passed.")
    
except Exception as e:
    conn.rollback()
    log(f"FAILED: {e}")
finally:
    cursor.close()
    conn.close()
