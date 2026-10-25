import sqlite3

def run_migration():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()

    # 1. Ensure all defined roles exist in `roles` table
    roles_to_ensure = [
        (1, 'ADMIN', 'Operational Platform Administrator'),
        (2, 'OFFICER', 'Municipal Field Officer'),
        (3, 'CITIZEN', 'Registered Citizen'),
        (4, 'SUPER_ADMIN', 'Platform Super Administrator with full system control'),
        (5, 'HIGHER_OFFICIAL', 'Municipal Higher Authority & Review Official'),
        (6, 'DEPARTMENT_HEAD', 'Municipal Department Leadership & Management'),
        (7, 'FIELD_OFFICER', 'Field Officer & Inspector')
    ]

    for rid, name, desc in roles_to_ensure:
        cursor.execute("SELECT id FROM roles WHERE id = ? OR name = ?", (rid, name))
        row = cursor.fetchone()
        if not row:
            cursor.execute("INSERT INTO roles (id, name, description) VALUES (?, ?, ?)", (rid, name, desc))
        else:
            cursor.execute("UPDATE roles SET description = ? WHERE id = ?", (desc, row[0]))

    # 2. Create Permissions Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS permissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            module TEXT NOT NULL
        )
    """)

    # 3. Create Role Permissions Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS role_permissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            role_id INTEGER NOT NULL,
            permission_id INTEGER NOT NULL,
            UNIQUE(role_id, permission_id),
            FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
            FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
        )
    """)

    # 4. Create Login Attempts Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS login_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            ip_address TEXT,
            user_agent TEXT,
            success INTEGER DEFAULT 0,
            failure_reason TEXT,
            attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 5. Create Security Events Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS security_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            severity TEXT NOT NULL,
            event_type TEXT NOT NULL,
            description TEXT NOT NULL,
            user_id INTEGER,
            ip_address TEXT,
            metadata TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 6. Seed Permissions
    permissions_list = [
        ('users.view', 'View Users', 'View user directory and profiles', 'USERS'),
        ('users.manage', 'Manage Users', 'Create, update, and manage permitted user accounts', 'USERS'),
        ('admin_accounts.manage', 'Manage Admin Accounts', 'Create and modify Admin role assignments', 'SECURITY'),
        ('roles.view', 'View Roles & Permissions', 'Inspect system roles and permission matrix', 'SECURITY'),
        ('roles.manage', 'Manage Roles & Permissions', 'Modify role permissions and access grants', 'SECURITY'),
        ('departments.view', 'View Departments', 'Access department listings and structure', 'MUNICIPAL'),
        ('departments.manage', 'Manage Departments', 'Create and configure municipal departments', 'MUNICIPAL'),
        ('sla.view', 'View SLA Rules', 'View service level agreement thresholds', 'MUNICIPAL'),
        ('sla.manage', 'Manage SLA Rules', 'Configure SLA policies and escalation timings', 'MUNICIPAL'),
        ('ai.view', 'View AI Engine', 'Inspect AI performance and intent analytics', 'AI'),
        ('ai.configure', 'Configure AI Models', 'Adjust AI confidence, models, and auto-dispatch rules', 'AI'),
        ('security.view', 'View Security Telemetry', 'Monitor security events and failed login audits', 'SECURITY'),
        ('security.manage', 'Manage Security Policies', 'Configure password rules, session timeouts, lockouts', 'SECURITY'),
        ('audit.view', 'View Audit Logs', 'Inspect system and operational audit trails', 'AUDIT'),
        ('audit.manage', 'Manage Audit Records', 'Prune historical audit logs per retention policy', 'AUDIT'),
        ('system.health', 'System Health Monitoring', 'Inspect database connectivity, memory, and services', 'SYSTEM'),
        ('system.configure', 'System Configuration', 'Adjust global platform settings and feature toggles', 'SYSTEM'),
        ('analytics.operational', 'Operational Analytics', 'View routine reports, SLAs, and department workloads', 'REPORTING'),
        ('analytics.platform', 'Platform Analytics', 'View municipality-wide infrastructure telemetry', 'REPORTING'),
        ('communications.manage', 'Manage Communications', 'Publish announcements and broadcast notices', 'COMMUNICATIONS'),
    ]

    for code, name, desc, module in permissions_list:
        cursor.execute("SELECT id FROM permissions WHERE code = ?", (code,))
        if not cursor.fetchone():
            cursor.execute("INSERT INTO permissions (code, name, description, module) VALUES (?, ?, ?, ?)", (code, name, desc, module))

    # 7. Map Role Permissions
    # Get all permissions map: code -> id
    cursor.execute("SELECT id, code FROM permissions")
    perm_map = {row[1]: row[0] for row in cursor.fetchall()}

    # Super Admin (ID 4) gets ALL permissions
    for p_id in perm_map.values():
        cursor.execute("INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (4, ?)", (p_id,))

    # Admin (ID 1) gets operational permissions only (NO admin_accounts.manage, NO roles.manage, NO ai.configure, NO security.manage, NO system.configure, NO audit.manage)
    admin_perms = [
        'users.view', 'users.manage',
        'departments.view', 'departments.manage',
        'sla.view',
        'ai.view',
        'audit.view',
        'analytics.operational',
        'communications.manage'
    ]
    for code in admin_perms:
        if code in perm_map:
            cursor.execute("INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (1, ?)", (perm_map[code],))

    # 8. Seed sample security events and login attempts for real audit verification
    cursor.execute("SELECT COUNT(*) FROM login_attempts")
    if cursor.fetchone()[0] == 0:
        cursor.executemany("""
            INSERT INTO login_attempts (username, ip_address, user_agent, success, failure_reason, attempted_at)
            VALUES (?, ?, ?, ?, ?, datetime('now', ?))
        """, [
            ('superadmin', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 1, None, '-10 minutes'),
            ('admin', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 1, None, '-25 minutes'),
            ('unknown_user', '192.168.1.45', 'Python-Requests/2.31', 0, 'User not found', '-1 hour'),
            ('admin', '192.168.1.100', 'Mozilla/5.0', 0, 'Invalid password attempt', '-2 hours'),
            ('officer1', '127.0.0.1', 'Mozilla/5.0', 1, None, '-3 hours'),
        ])

    cursor.execute("SELECT COUNT(*) FROM security_events")
    if cursor.fetchone()[0] == 0:
        cursor.executemany("""
            INSERT INTO security_events (severity, event_type, description, user_id, ip_address, created_at)
            VALUES (?, ?, ?, ?, ?, datetime('now', ?))
        """, [
            ('INFO', 'AUTH_SUCCESS', 'Super Admin logged in from local subnet', 10, '127.0.0.1', '-10 minutes'),
            ('INFO', 'AUTH_SUCCESS', 'Admin user logged in to operational console', 1, '127.0.0.1', '-25 minutes'),
            ('WARNING', 'FAILED_LOGIN', 'Repeated login failure detected for user: unknown_user', None, '192.168.1.45', '-1 hour'),
            ('LOW', 'POLICY_CHECK', 'Automated SLA integrity audit routine completed with 0 violations', 10, '127.0.0.1', '-3 hours'),
            ('INFO', 'CONFIG_AUDIT', 'Super Administrator updated global platform settings', 10, '127.0.0.1', '-5 hours')
        ])

    conn.commit()
    conn.close()
    print("Migration completed successfully!")

if __name__ == '__main__':
    run_migration()
