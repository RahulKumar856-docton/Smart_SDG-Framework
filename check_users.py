from config import get_db_connection
c = get_db_connection()
cur = c.cursor()
cur.execute("UPDATE users SET status='ACTIVE' WHERE status='PENDING_APPROVAL'")
c.commit()
print(f"Updated {cur.rowcount} pending officer(s) to ACTIVE")
cur.execute("SELECT id, full_name, status FROM users WHERE role_id=(SELECT id FROM roles WHERE name='OFFICER')")
for row in cur.fetchall():
    print(f"  Officer #{row[0]}: {row[1]} -> {row[2]}")
c.close()
