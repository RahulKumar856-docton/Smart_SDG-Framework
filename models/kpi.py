from config import get_db_connection

class KPI:
    @staticmethod
    def get_by_sdg(sdg_id):
        conn = get_db_connection()
        if not conn: return []
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM kpis WHERE sdg_id = %s", (sdg_id,))
        kpis = cursor.fetchall()
        cursor.close()
        conn.close()
        return kpis

    @staticmethod
    def get_project_kpis(project_id):
        conn = get_db_connection()
        if not conn: return []
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT pk.*, k.name, k.unit, k.target_value, k.weight, k.sdg_id
            FROM project_kpis pk
            JOIN kpis k ON pk.kpi_id = k.id
            WHERE pk.project_id = %s
        """, (project_id,))
        kpis = cursor.fetchall()
        cursor.close()
        conn.close()
        return kpis
