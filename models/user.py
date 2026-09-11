from config import get_db_connection

class User:
    @staticmethod
    def get_by_username(username):
        conn = get_db_connection()
        if not conn: return None
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE username = %s OR email = %s", (username, username))
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        return user
        
    @staticmethod
    def get_by_id(user_id):
        conn = get_db_connection()
        if not conn: return None
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        return user

    @staticmethod
    def create_user(full_name, username, email, phone, password_hash, role, employee_id=None, department_id=None, status='Active'):
        conn = get_db_connection()
        if not conn: return False
        cursor = conn.cursor()
        try:
            cursor.execute("""
                INSERT INTO users (full_name, username, email, phone, password_hash, role, employee_id, department_id, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (full_name, username, email, phone, password_hash, role, employee_id, department_id, status))
            conn.commit()
            return True
        except Exception as e:
            print(f"Error creating user: {e}")
            return False
        finally:
            cursor.close()
            conn.close()
            
    @staticmethod
    def update_status(user_id, status):
        conn = get_db_connection()
        if not conn: return False
        cursor = conn.cursor()
        try:
            cursor.execute("UPDATE users SET status = %s WHERE id = %s", (status, user_id))
            conn.commit()
            return True
        except Exception as e:
            print(f"Error updating status: {e}")
            return False
        finally:
            cursor.close()
            conn.close()
