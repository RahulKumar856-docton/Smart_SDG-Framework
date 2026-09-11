from config import get_db_connection

class Project:
    @staticmethod
    def get_all(manager_id=None):
        conn = get_db_connection()
        if not conn: return []
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT p.*, d.name as department_name, u.full_name as manager_name
            FROM projects p
            LEFT JOIN departments d ON p.department_id = d.id
            LEFT JOIN users u ON p.manager_id = u.id
        """
        params = []
        if manager_id:
            query += " WHERE p.manager_id = %s"
            params.append(manager_id)
            
        query += " ORDER BY p.created_at DESC"
        
        cursor.execute(query, tuple(params))
        projects = cursor.fetchall()
        cursor.close()
        conn.close()
        return projects

    @staticmethod
    def get_by_id(project_id):
        conn = get_db_connection()
        if not conn: return None
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT p.*, d.name as department_name, u.full_name as manager_name
            FROM projects p
            LEFT JOIN departments d ON p.department_id = d.id
            LEFT JOIN users u ON p.manager_id = u.id
            WHERE p.id = %s
        """, (project_id,))
        project = cursor.fetchone()
        cursor.close()
        conn.close()
        return project
        
    @staticmethod
    def get_project_sdgs(project_id):
        conn = get_db_connection()
        if not conn: return []
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT s.*
            FROM sdgs s
            JOIN project_sdgs ps ON s.id = ps.sdg_id
            WHERE ps.project_id = %s
        """, (project_id,))
        sdgs = cursor.fetchall()
        cursor.close()
        conn.close()
        return sdgs
