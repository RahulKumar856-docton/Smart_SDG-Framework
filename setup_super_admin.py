from config import get_db_connection
from werkzeug.security import generate_password_hash

conn = get_db_connection()
cursor = conn.cursor()

# 1. Check or insert SUPER_ADMIN role
cursor.execute("SELECT id FROM roles WHERE name = 'SUPER_ADMIN'")
row = cursor.fetchone()
if not row:
    cursor.execute("INSERT INTO roles (name, description) VALUES ('SUPER_ADMIN', 'Platform Super Administrator with full system privileges')")
    cursor.execute("SELECT id FROM roles WHERE name = 'SUPER_ADMIN'")
    super_role_id = cursor.fetchone()['id']
    print(f"Inserted SUPER_ADMIN role with id: {super_role_id}")
else:
    super_role_id = row['id']
    print(f"SUPER_ADMIN role exists with id: {super_role_id}")

# 2. Check or insert superadmin user
pw_hash = generate_password_hash('password123')
cursor.execute("SELECT id FROM users WHERE username = 'superadmin' OR email = 'superadmin@municipality.gov'")
user_row = cursor.fetchone()
if not user_row:
    cursor.execute("""
        INSERT INTO users (username, password_hash, role_id, full_name, email, phone, designation, status)
        VALUES ('superadmin', ?, ?, 'Super Administrator', 'superadmin@municipality.gov', '1800123456', 'Head of Platform Administration', 'ACTIVE')
    """, (pw_hash, super_role_id))
    print("Created superadmin user with password123!")
else:
    cursor.execute("UPDATE users SET password_hash = ?, role_id = ?, status = 'ACTIVE' WHERE id = ?", (pw_hash, super_role_id, user_row['id']))
    print("Updated superadmin user with password123 and ACTIVE status!")

# 3. Ensure admin user has password123 and status ACTIVE
cursor.execute("UPDATE users SET password_hash = ?, status = 'ACTIVE' WHERE username = 'admin'", (pw_hash,))
print("Ensured admin user has password123 and ACTIVE status!")

conn.commit()
cursor.close()
conn.close()
print("Super admin database setup completed successfully.")
