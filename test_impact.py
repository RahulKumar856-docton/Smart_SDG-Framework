import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from services.impact_engine import calculate_impact_index
from config import get_db_connection

def test_impact():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM projects")
    rows = cursor.fetchall()
    
    for row in rows:
        project_id = row[0]
        try:
            res = calculate_impact_index(project_id)
            print(f"Project {project_id}: {res}")
        except Exception as e:
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    test_impact()
