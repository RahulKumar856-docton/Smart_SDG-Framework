from config import get_db_connection
from flask import request

def log_audit(user_id, action, resource_type, resource_id, details=None):
    """
    Creates an audit log entry for any CRUD operation.
    """
    conn = get_db_connection()
    if not conn: return False
    
    cursor = conn.cursor()
    ip_address = request.remote_addr if request else '127.0.0.1'
    
    cursor.execute("""
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (user_id, action, resource_type, resource_id, details, ip_address))
    
    conn.commit()
    cursor.close()
    conn.close()
    return True
