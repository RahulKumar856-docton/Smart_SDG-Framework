from config import get_db_connection

class SDG:
    @staticmethod
    def get_all():
        conn = get_db_connection()
        if not conn: return []
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM sdgs ORDER BY id")
        sdgs = cursor.fetchall()
        cursor.close()
        conn.close()
        return sdgs

    @staticmethod
    def get_by_id(sdg_id):
        conn = get_db_connection()
        if not conn: return None
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM sdgs WHERE id = %s", (sdg_id,))
        sdg = cursor.fetchone()
        cursor.close()
        conn.close()
        return sdg
