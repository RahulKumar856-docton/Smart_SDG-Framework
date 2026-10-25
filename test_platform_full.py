import requests
import json

BASE = 'http://localhost:5173'

def test_portal(name, username, password, expected_role, endpoints):
    print(f"\n==========================================")
    print(f"Testing {name} ({username})")
    print(f"==========================================")
    s = requests.Session()
    login_res = s.post(f"{BASE}/api/auth/login", json={
        'username': username,
        'password': password,
        'expected_role': expected_role
    })
    
    if login_res.status_code != 200:
        print(f"[FAIL] Login failed: {login_res.status_code} - {login_res.text}")
        return False
        
    user_data = login_res.json().get('data', {})
    print(f"[PASS] Login OK: user={user_data.get('username')}, role={user_data.get('role')}")

    results = []
    for ep in endpoints:
        try:
            r = s.get(f"{BASE}{ep}")
            if r.status_code in [200, 201]:
                print(f"  [PASS] {ep} -> {r.status_code}")
                results.append(True)
            else:
                print(f"  [FAIL] {ep} -> {r.status_code} : {r.text[:120]}")
                results.append(False)
        except Exception as e:
            print(f"  [ERROR] {ep} -> {e}")
            results.append(False)
            
    return all(results)

# 1. Super Admin
sa_ok = test_portal('Super Admin', 'superadmin', 'password123', 'ADMIN', [
    '/api/super-admin/overview',
    '/api/super-admin/users',
    '/api/super-admin/departments',
    '/api/super-admin/system/tables',
    '/api/super-admin/system/settings',
    '/api/dashboards/super-admin',
    '/api/admin/audit-logs/',
    '/api/admin/audit-logs/statistics',
    '/api/admin/settings/',
    '/api/admin/risk/summary',
    '/api/admin/data-quality/summary',
    '/api/admin/impact-analysis/summary',
    '/api/projects/',
    '/api/departments/'
])

# 2. Officer
off_ok = test_portal('Officer', 'officer1', 'password123', 'OFFICER', [
    '/api/dashboards/officer',
    '/api/officer/dashboard/summary',
    '/api/officer/projects',
    '/api/officer/requests',
    '/api/officer/inspections',
    '/api/officer/notifications',
    '/api/officer/evidence',
    '/api/officer/kpis',
    '/api/officer/reports',
    '/api/officer/alerts'
])

# 3. Citizen
cit_ok = test_portal('Citizen', 'rah@gmail.com', 'password123', 'CITIZEN', [
    '/api/citizen/dashboard/summary',
    '/api/citizen/requests',
    '/api/citizen/reports',
    '/api/citizen/notifications',
    '/api/citizen/map/data'
])

# 4. Higher Official / Authority
auth_ok = test_portal('Higher Official / Authority', 'admin', 'password123', 'ADMIN', [
    '/api/authority/dashboard',
    '/api/authority/reports',
    '/api/authority/operations',
    '/api/authority/gis',
    '/api/authority/ai-insights'
])

# 5. AI Chatbot
print("\n==========================================")
print("Testing AI Chatbot API")
print("==========================================")
s = requests.Session()
s.post(f"{BASE}/api/auth/login", json={'username': 'rah@gmail.com', 'password': 'password123', 'expected_role': 'CITIZEN'})
bot_res = s.post(f"{BASE}/api/chatbot/chat", json={'message': 'Water pipe leakage on MG Road Ward 4'})
bot_ok = False
if bot_res.status_code == 200:
    print(f"  [PASS] /api/chatbot/chat -> 200: {bot_res.json().get('success')}")
    bot_ok = True
else:
    print(f"  [FAIL] /api/chatbot/chat -> {bot_res.status_code}: {bot_res.text[:120]}")

print("\n==========================================")
print("OVERALL SUMMARY:")
print(f"  Super Admin Portal: {'PASS' if sa_ok else 'FAIL'}")
print(f"  Officer Portal:     {'PASS' if off_ok else 'FAIL'}")
print(f"  Citizen Portal:     {'PASS' if cit_ok else 'FAIL'}")
print(f"  Higher Official:    {'PASS' if auth_ok else 'FAIL'}")
print(f"  AI Assistant Chat:  {'PASS' if bot_ok else 'FAIL'}")
print("==========================================")
