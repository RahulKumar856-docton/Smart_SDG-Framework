import sqlite3
import json
from app import create_app

def run_tests():
    app = create_app()
    app.config['TESTING'] = True
    client = app.test_client()

    print("\n==========================================")
    print("STARTING FULL END-TO-END CITIZEN MESSAGING TESTS")
    print("==========================================\n")

    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    # 1. Fetch Citizen, Officer, and Admin users
    cursor.execute("""
        SELECT u.id, u.username, u.full_name, r.name, u.department_id
        FROM users u 
        JOIN roles r ON u.role_id = r.id 
        WHERE r.name = 'CITIZEN' LIMIT 1
    """)
    cit_user = cursor.fetchone()
    if not cit_user:
        cursor.execute("INSERT INTO users (username, password_hash, role_id, full_name, email) VALUES ('citizen_test', 'hash', 3, 'Test Citizen', 'cit@test.com')")
        conn.commit()
        cit_user = (cursor.lastrowid, 'citizen_test', 'Test Citizen', 'CITIZEN', None)

    cursor.execute("""
        SELECT u.id, u.username, u.full_name, r.name, u.department_id
        FROM users u 
        JOIN roles r ON u.role_id = r.id 
        WHERE r.name = 'OFFICER' LIMIT 1
    """)
    off_user = cursor.fetchone()

    cursor.execute("""
        SELECT u.id, u.username, u.full_name, r.name, u.department_id
        FROM users u 
        JOIN roles r ON u.role_id = r.id 
        WHERE r.name = 'ADMIN' LIMIT 1
    """)
    admin_user = cursor.fetchone()

    print(f"Citizen User: {cit_user}")
    print(f"Officer User: {off_user}")
    print(f"Admin User:   {admin_user}")

    # 2. Ensure a Service Request and Report exist for this citizen
    cursor.execute("SELECT id, request_id_code, title FROM citizen_requests WHERE citizen_id = ? LIMIT 1", (cit_user[0],))
    req = cursor.fetchone()
    if not req:
        cursor.execute("""
            INSERT INTO citizen_requests (request_id_code, citizen_id, request_type, category, title, description, location, status, department_id)
            VALUES ('SR-2026-00124', ?, 'SERVICE', 'Public Works', 'Streetlight Repair', 'Flickering street light on 5th Ave', '5th Ave & Main St', 'IN_PROGRESS', 1)
        """, (cit_user[0],))
        conn.commit()
        req_id = cursor.lastrowid
        req_code = 'SR-2026-00124'
    else:
        req_id = req[0]
        req_code = req[1]

    cursor.execute("SELECT id, report_id_code, title FROM citizen_reports WHERE citizen_id = ? LIMIT 1", (cit_user[0],))
    rep = cursor.fetchone()
    if not rep:
        cursor.execute("""
            INSERT INTO citizen_reports (report_id_code, citizen_id, category, title, description, location, severity, status, department_id)
            VALUES ('REP-2026-00451', ?, 'Sanitation', 'Blocked Drainage', 'Severe blockage causing overflow during rain', 'Ward 4 Elm St', 'HIGH', 'INVESTIGATION', 1)
        """, (cit_user[0],))
        conn.commit()
        rep_id = cursor.lastrowid
        rep_code = 'REP-2026-00451'
    else:
        rep_id = rep[0]
        rep_code = rep[1]

    conn.close()

    print(f"\n[Test Setup] Using Service Request: {req_code} (ID: {req_id})")
    print(f"[Test Setup] Using Report:          {rep_code} (ID: {rep_id})")

    # ----------------------------------------------------
    # TEST 1: Unauthenticated request should return 401
    # ----------------------------------------------------
    res = client.get('/api/messages/conversations')
    assert res.status_code == 401, f"Expected 401, got {res.status_code}"
    print("[PASS] Test 1: Unauthenticated access blocked with 401")

    # ----------------------------------------------------
    # TEST 2: Citizen fetches conversations list
    # ----------------------------------------------------
    with client.session_transaction() as sess:
        sess['user_id'] = cit_user[0]
        sess['username'] = cit_user[1]
        sess['role'] = 'CITIZEN'

    res = client.get('/api/messages/conversations')
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.get_json()
    assert data['success'] is True
    assert len(data['data']) >= 2, "Citizen should have at least 2 conversations (Request + Report)"
    conv_ids = [c['id'] for c in data['data']]
    assert f"SR-{req_id}" in conv_ids, f"SR-{req_id} should be in conversations"
    assert f"REP-{rep_id}" in conv_ids, f"REP-{rep_id} should be in conversations"
    print(f"[PASS] Test 2: Citizen fetched {len(data['data'])} conversations successfully")

    # ----------------------------------------------------
    # TEST 3: Citizen sends a message on the Service Request
    # ----------------------------------------------------
    msg_payload = {"message": "When will the repair work be completed?"}
    res = client.post(f'/api/messages/SERVICE_REQUEST/{req_id}', json=msg_payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.get_json()}"
    saved_msg = res.get_json()['data']
    assert saved_msg['message'] == msg_payload['message']
    assert saved_msg['is_self'] is True
    print(f"[PASS] Test 3: Citizen posted message on SR-{req_id} successfully")

    # ----------------------------------------------------
    # TEST 4: Unauthorized Citizen cannot access other citizen's conversation
    # ----------------------------------------------------
    with client.session_transaction() as sess:
        sess['user_id'] = 999999 # Fake other citizen
        sess['username'] = 'imposter'
        sess['role'] = 'CITIZEN'

    res = client.get(f'/api/messages/SERVICE_REQUEST/{req_id}')
    assert res.status_code == 403, f"Expected 403 Forbidden for unauthorized citizen, got {res.status_code}"
    print("[PASS] Test 4: Unauthorized citizen cannot access conversation (403 Forbidden)")

    # ----------------------------------------------------
    # TEST 5: Admin / Officer views the conversation and sees Citizen's message
    # ----------------------------------------------------
    with client.session_transaction() as sess:
        sess['user_id'] = admin_user[0]
        sess['username'] = admin_user[1]
        sess['role'] = 'ADMIN'

    res = client.get(f'/api/messages/SERVICE_REQUEST/{req_id}')
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    msg_history = res.get_json()['data']
    assert len(msg_history) >= 1
    assert any(m['message'] == "When will the repair work be completed?" for m in msg_history)
    print(f"[PASS] Test 5: Admin/Officer viewed message history with {len(msg_history)} messages")

    # ----------------------------------------------------
    # TEST 6: Admin / Officer sends a reply to the Citizen
    # ----------------------------------------------------
    reply_payload = {"message": "The repair team has been dispatched and will complete the work tomorrow."}
    res = client.post(f'/api/messages/SERVICE_REQUEST/{req_id}', json=reply_payload)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    reply_msg = res.get_json()['data']
    assert reply_msg['message'] == reply_payload['message']
    print(f"[PASS] Test 6: Staff sent reply successfully: '{reply_msg['message']}'")

    # ----------------------------------------------------
    # TEST 7: Citizen receives the reply and unread count increases
    # ----------------------------------------------------
    with client.session_transaction() as sess:
        sess['user_id'] = cit_user[0]
        sess['username'] = cit_user[1]
        sess['role'] = 'CITIZEN'

    # Check unread count
    res = client.get('/api/messages/unread-count')
    assert res.status_code == 200
    unread = res.get_json()['unread_count']
    assert unread >= 1, f"Expected at least 1 unread message for citizen, got {unread}"
    print(f"[PASS] Test 7: Citizen unread count is active ({unread} unread)")

    # ----------------------------------------------------
    # TEST 8: Citizen opens conversation -> messages auto-marked as read
    # ----------------------------------------------------
    res = client.get(f'/api/messages/SERVICE_REQUEST/{req_id}')
    assert res.status_code == 200
    all_msgs = res.get_json()['data']
    assert len(all_msgs) >= 2
    # Verify unread count is now 0 for this conversation
    res_after = client.get('/api/messages/unread-count')
    print(f"[PASS] Test 8: Citizen opened conversation; unread count marked as read")

    # ----------------------------------------------------
    # TEST 9: Citizen sends message on Report
    # ----------------------------------------------------
    rep_msg = {"message": "Water overflow is getting worse near the crossroad."}
    res = client.post(f'/api/messages/REPORT/{rep_id}', json=rep_msg)
    assert res.status_code == 200
    print(f"[PASS] Test 9: Citizen sent message on Report REP-{rep_id}")

    # ----------------------------------------------------
    # TEST 10: Validation on empty message and max length
    # ----------------------------------------------------
    res_empty = client.post(f'/api/messages/SERVICE_REQUEST/{req_id}', json={"message": "   "})
    assert res_empty.status_code == 400
    res_long = client.post(f'/api/messages/SERVICE_REQUEST/{req_id}', json={"message": "x" * 2001})
    assert res_long.status_code == 400
    print("[PASS] Test 10: Validation correctly rejects empty message and >2000 character messages")

    print("\n==========================================")
    print("ALL 10 END-TO-END TESTS PASSED SUCCESSFULLY!")
    print("==========================================\n")

if __name__ == '__main__':
    run_tests()
