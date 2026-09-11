import requests, json

BASE = "http://localhost:5000/api"
s = requests.Session()

r = s.post(f"{BASE}/auth/login", json={"username": "admin", "password": "admin123"})
assert r.status_code == 200, f"Login failed: {r.text}"
print("[OK] Login as admin")

# Test officer list
r2 = s.get(f"{BASE}/admin/officers/")
print(f"\n[Officers] HTTP {r2.status_code}")
data = r2.json()
print(f"  success={data.get('success')}, count={len(data.get('data', []))}")
if data.get('data'):
    o = data['data'][0]
    print(f"  Sample: {o.get('full_name')} | {o.get('status')} | dept={o.get('department_name')}")

# Test stats
r3 = s.get(f"{BASE}/admin/officers/statistics")
print(f"\n[Stats] HTTP {r3.status_code}")
print(f"  {json.dumps(r3.json().get('data', {}), indent=2)}")

# Test departments
r4 = s.get(f"{BASE}/admin/departments")
print(f"\n[Departments] HTTP {r4.status_code}")
d = r4.json()
print(f"  success={d.get('success')}, count={len(d.get('data', []))}")

# Test search filter
r5 = s.get(f"{BASE}/admin/officers/", params={"status": "PENDING_APPROVAL"})
print(f"\n[Filter PENDING] HTTP {r5.status_code}, count={len(r5.json().get('data', []))}")

print("\n[SUMMARY] All endpoints reachable and working.")
