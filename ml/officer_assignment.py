import random
from config import get_db_connection

def predict_best_officer(department_id, sdg_ids=None):
    """
    Predicts the best officer to manage a project based on the department
    and the associated SDGs.
    
    This acts as a simulated ML assignment model.
    It looks for an officer in the same department who has the least active projects.
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Find all officers in the department
        cursor.execute("""
            SELECT id, username 
            FROM users 
            WHERE role = 'Officer' AND department_id = %s
        """, (department_id,))
        officers = cursor.fetchall()
        
        if not officers:
            # Fallback: find any officer if none exist in the department
            cursor.execute("""
                SELECT id, username 
                FROM users 
                WHERE role = 'Officer'
            """)
            officers = cursor.fetchall()
            
        if not officers:
            return None # No officers available in the system
            
        # Get active project counts for these officers
        officer_ids = tuple([o['id'] for o in officers])
        placeholders = ', '.join(['%s'] * len(officer_ids))
        
        cursor.execute(f"""
            SELECT manager_id, COUNT(*) as project_count
            FROM projects
            WHERE status NOT IN ('COMPLETED', 'CANCELLED')
            AND manager_id IN ({placeholders})
            GROUP BY manager_id
        """, officer_ids)
        
        counts = cursor.fetchall()
        
        # Map counts to officer IDs
        workload = {row['manager_id']: row['project_count'] for row in counts}
        
        # Find officer with the minimum workload
        best_officer_id = None
        min_projects = float('inf')
        
        for officer in officers:
            count = workload.get(officer['id'], 0)
            if count < min_projects:
                min_projects = count
                best_officer_id = officer['id']
                
        return best_officer_id

    except Exception as e:
        print(f"ML Assignment Error: {e}")
        return None
    finally:
        cursor.close()
        conn.close()
