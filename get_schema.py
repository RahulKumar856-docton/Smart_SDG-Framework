import sqlite3
conn = sqlite3.connect('database.db')
print("CITIZEN REQUESTS SCHEMA:")
print(conn.execute("SELECT sql FROM sqlite_master WHERE name='citizen_requests'").fetchone()[0])
print("\nCITIZEN REPORTS SCHEMA:")
print(conn.execute("SELECT sql FROM sqlite_master WHERE name='citizen_reports'").fetchone()[0])
