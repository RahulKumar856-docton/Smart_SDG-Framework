import sqlite3
from werkzeug.security import generate_password_hash

conn = sqlite3.connect('database.db')
c = conn.cursor()
c.execute("UPDATE users SET password_hash=? WHERE username='admin'", (generate_password_hash('password123'),))
conn.commit()
conn.close()
print("Password reset successfully")
