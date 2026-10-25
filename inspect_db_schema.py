import sqlite3

conn = sqlite3.connect('database.db')
cursor = conn.cursor()

cursor.execute("SELECT id, name, description FROM roles")
print("ROLES:", cursor.fetchall())

cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in cursor.fetchall()]
print("\nTABLES LIST:", tables)

for t in ['permissions', 'role_permissions', 'login_attempts', 'security_events']:
    if t in tables:
        cursor.execute(f"PRAGMA table_info({t})")
        print(f"\n{t} COLS:", [c[1] for c in cursor.fetchall()])

cursor.execute("PRAGMA table_info(users)")
print("\nUSERS COLS:", [c[1] for c in cursor.fetchall()])

cursor.execute("SELECT id, username, role_id, status FROM users")
print("\nCURRENT USERS:", cursor.fetchall())
