import json
import sys
from app import create_app

def run_tests():
    print("=" * 75)
    print("MUNICIPAL MONITOR — ADMIN & SUPER ADMIN SEPARATION SECURITY SUITE")
    print("=" * 75)

    app = create_app()
    app.config['TESTING'] = True
    
    total_passed = 0
    total_tests = 0

    def assert_test(name, condition, details=""):
        nonlocal total_passed, total_tests
        total_tests += 1
        if condition:
            total_passed += 1
            print(f" [PASS] Test {total_tests:02d}: {name}")
        else:
            print(f" [FAIL] Test {total_tests:02d}: {name} - {details}")

    # ----------------------------------------------------
    # TEST 1: Super Admin Login via dedicated /api/auth/system-login
    # ----------------------------------------------------
    super_client = app.test_client()
    res = super_client.post('/api/auth/system-login', json={
        "username": "superadmin",
        "password": "password123"
    })
    res_data = res.get_json() or {}
    assert_test(
        "Super Admin authenticate via /api/auth/system-login",
        res.status_code == 200 and res_data.get('success') is True,
        f"status: {res.status_code}, data: {res_data}"
    )

    # ----------------------------------------------------
    # TEST 2: Non-SuperAdmin rejected by /api/auth/system-login
    # ----------------------------------------------------
    bad_client = app.test_client()
    res = bad_client.post('/api/auth/system-login', json={
        "username": "admin",
        "password": "password123"
    })
    res_data = res.get_json() or {}
    assert_test(
        "Operational Admin blocked from /api/auth/system-login with 403",
        res.status_code == 403 and "SUPER_ADMIN" in res_data.get('message', ''),
        f"status: {res.status_code}, data: {res_data}"
    )

    # ----------------------------------------------------
    # TEST 3: Super Admin access to /api/system/overview
    # ----------------------------------------------------
    res = super_client.get('/api/system/overview')
    res_data = res.get_json() or {}
    assert_test(
        "Super Admin can access /api/system/overview telemetry",
        res.status_code == 200 and res_data.get('success') is True and 'counts' in res_data.get('data', {}),
        f"status: {res.status_code}"
    )

    # ----------------------------------------------------
    # TEST 4: Operational Admin authenticate via /api/auth/login
    # ----------------------------------------------------
    admin_client = app.test_client()
    res = admin_client.post('/api/auth/login', json={
        "username": "admin",
        "password": "password123"
    })
    res_data = res.get_json() or {}
    assert_test(
        "Operational Admin authenticate via /api/auth/login",
        res.status_code == 200 and res_data.get('success') is True,
        f"status: {res.status_code}"
    )

    # ----------------------------------------------------
    # TEST 5: Operational Admin strictly blocked from /api/system/*
    # ----------------------------------------------------
    res = admin_client.get('/api/system/overview')
    assert_test(
        "Operational Admin strictly blocked from /api/system/overview (403)",
        res.status_code == 403,
        f"status: {res.status_code}"
    )

    res = admin_client.get('/api/system/security')
    assert_test(
        "Operational Admin strictly blocked from /api/system/security (403)",
        res.status_code == 403,
        f"status: {res.status_code}"
    )

    # ----------------------------------------------------
    # TEST 6: Operational Admin access to /api/admin/overview
    # ----------------------------------------------------
    res = admin_client.get('/api/admin/overview')
    res_data = res.get_json() or {}
    assert_test(
        "Operational Admin can access /api/admin/overview operational metrics",
        res.status_code == 200 and res_data.get('success') is True and 'metrics' in res_data,
        f"status: {res.status_code}"
    )

    # ----------------------------------------------------
    # TEST 7: Operational Admin CANNOT create Super Admin or Admin account
    # ----------------------------------------------------
    res = admin_client.post('/api/admin/users', json={
        "username": "rogue_super",
        "email": "rogue@hack.org",
        "password": "password123",
        "role": "SUPER_ADMIN"
    })
    res_data = res.get_json() or {}
    assert_test(
        "Operational Admin cannot create Super Admin account (403)",
        res.status_code == 403 and "cannot create Admin or Super Admin" in res_data.get('message', ''),
        f"status: {res.status_code}, data: {res_data}"
    )

    res = admin_client.post('/api/admin/users', json={
        "username": "rogue_admin",
        "email": "rogue2@hack.org",
        "password": "password123",
        "role": "ADMIN"
    })
    res_data = res.get_json() or {}
    assert_test(
        "Operational Admin cannot create Admin account (403)",
        res.status_code == 403 and "cannot create Admin or Super Admin" in res_data.get('message', ''),
        f"status: {res.status_code}"
    )

    # ----------------------------------------------------
    # TEST 8: Operational Admin CANNOT alter status of Super Admin or Admin
    # ----------------------------------------------------
    res_users = super_client.get('/api/system/users')
    users_list = res_users.get_json().get('data', {}).get('users', [])
    super_user = next((u for u in users_list if u['username'].lower() == 'superadmin'), None)
    admin_user = next((u for u in users_list if u['username'].lower() == 'admin'), None)

    if super_user:
        res = admin_client.put(f"/api/admin/users/{super_user['id']}/status", json={"status": "INACTIVE"})
        assert_test(
            "Operational Admin cannot deactivate Super Admin account (403)",
            res.status_code == 403,
            f"status: {res.status_code}"
        )

    if admin_user:
        res = admin_client.put(f"/api/admin/users/{admin_user['id']}/status", json={"status": "INACTIVE"})
        assert_test(
            "Operational Admin cannot deactivate Admin account (403)",
            res.status_code == 403,
            f"status: {res.status_code}"
        )

    # ----------------------------------------------------
    # TEST 9: Super Admin CAN manage operational and admin accounts
    # ----------------------------------------------------
    res = super_client.get('/api/system/users')
    assert_test(
        "Super Admin can view all platform users and admin accounts",
        res.status_code == 200 and len(res.get_json().get('data', {}).get('users', [])) > 0,
        f"status: {res.status_code}"
    )

    # ----------------------------------------------------
    # TEST 10: Unauthenticated requests are rejected (401)
    # ----------------------------------------------------
    anon_client = app.test_client()
    res = anon_client.get('/api/system/overview')
    assert_test(
        "Unauthenticated request to /api/system/overview rejected (401)",
        res.status_code == 401,
        f"status: {res.status_code}"
    )

    res = anon_client.get('/api/admin/overview')
    assert_test(
        "Unauthenticated request to /api/admin/overview rejected (401)",
        res.status_code == 401,
        f"status: {res.status_code}"
    )

    # ----------------------------------------------------
    # TEST 11: Citizen login & access boundaries
    # ----------------------------------------------------
    citizen_client = app.test_client()
    res = citizen_client.post('/api/auth/login', json={
        "username": "rah@gmail.com",
        "password": "password123"
    })
    assert_test(
        "Citizen authenticate via /api/auth/login",
        res.status_code == 200 and res.get_json().get('success') is True,
        f"status: {res.status_code}"
    )

    res = citizen_client.get('/api/admin/overview')
    assert_test(
        "Citizen strictly blocked from /api/admin/overview (403)",
        res.status_code == 403,
        f"status: {res.status_code}"
    )

    res = citizen_client.get('/api/system/overview')
    assert_test(
        "Citizen strictly blocked from /api/system/overview (403)",
        res.status_code == 403,
        f"status: {res.status_code}"
    )

    # ----------------------------------------------------
    # TEST 12: Security events logged in security_events table
    # ----------------------------------------------------
    res = super_client.get('/api/system/security')
    sec_data = res.get_json().get('data', {})
    sec_events = sec_data.get('security_events', [])
    assert_test(
        "Sensitive privilege escalation attempts recorded in security_events",
        any('PRIVILEGE_ESCALATION' in ev.get('event_type', '') or 'UNAUTHORIZED' in ev.get('event_type', '') for ev in sec_events),
        f"events found: {[e.get('event_type') for e in sec_events[:5]]}"
    )

    # ----------------------------------------------------
    # TEST 13: Communications CRUD works for Admin
    # ----------------------------------------------------
    res = admin_client.post('/api/admin/communications', json={
        "title": "Automated Security Test Announcement",
        "content": "Verifying separation of admin communications",
        "priority": "HIGH",
        "target_role": "ALL"
    })
    created_id = res.get_json().get('id')
    assert_test(
        "Operational Admin can broadcast announcements",
        res.status_code == 201 and created_id is not None,
        f"status: {res.status_code}"
    )

    if created_id:
        res = admin_client.delete(f'/api/admin/communications/{created_id}')
        assert_test(
            "Operational Admin can delete announcements",
            res.status_code == 200,
            f"status: {res.status_code}"
        )

    # ----------------------------------------------------
    # TEST 14: System Health PRAGMA check works for Super Admin
    # ----------------------------------------------------
    res = super_client.post('/api/system/health/db-check')
    assert_test(
        "Super Admin can execute SQLite PRAGMA integrity check",
        res.status_code == 200 and res.get_json().get('data', {}).get('status') == 'HEALTHY',
        f"status: {res.status_code}, data: {res.get_json()}"
    )

    # ----------------------------------------------------
    # TEST 15: Session logout invalidation
    # ----------------------------------------------------
    res = super_client.post('/api/auth/logout')
    assert_test(
        "Logout successfully clears session",
        res.status_code == 200 and res.get_json().get('success') is True,
        f"status: {res.status_code}"
    )

    res = super_client.get('/api/system/overview')
    assert_test(
        "Terminated session rejected from protected endpoint (401)",
        res.status_code == 401,
        f"status: {res.status_code}"
    )

    print("=" * 75)
    print(f"SECURITY SUITE RESULT: {total_passed}/{total_tests} TESTS PASSED")
    print("=" * 75)

    if total_passed == total_tests:
        print("ALL 15 SECURITY, ROLE BOUNDARY & SEPARATION TESTS PASSED!")
        return 0
    else:
        print(f"WARNING: {total_tests - total_passed} tests failed.")
        return 1

if __name__ == "__main__":
    sys.exit(run_tests())
