import requests

BASE = "http://localhost:5000/api"

def run_tests():
    print("Testing Registration Flow...")

    # 1. Register Officer
    data = {
        "role": "OFFICER",
        "username": "test_officer3",
        "full_name": "Test Officer 3",
        "email": "test3@municipality.gov",
        "phone": "9999999999",
        "department_id": 1,
        "employee_id": "EMP-TEST-003",
        "designation": "Inspector",
        "password": "password123"
    }

    print("Submitting registration...")
    r = requests.post(f"{BASE}/auth/register", json=data)
    print(r.status_code, r.text)
    assert r.status_code == 200, "Registration failed"
    print("Success: Registered officer.")

    # 2. Try Login (Should be rejected because PENDING_APPROVAL)
    print("Trying to log in as pending officer...")
    r = requests.post(f"{BASE}/auth/login", json={"username": "test_officer3", "password": "password123"})
    print(r.status_code, r.text)
    assert r.status_code == 403, "Login should be rejected"
    assert "awaiting administrator approval" in r.text
    print("Success: Login correctly rejected.")

    # 3. Duplicate Registration (Should be blocked)
    print("Trying to register same username again...")
    r = requests.post(f"{BASE}/auth/register", json=data)
    print(r.status_code, r.text)
    assert r.status_code == 409, "Duplicate not blocked"
    print("Success: Duplicate registration blocked.")

    # 4. Admin Approves Officer
    print("Logging in as admin...")
    s = requests.Session()
    r = s.post(f"{BASE}/auth/login", json={"username": "admin", "password": "admin123"})
    assert r.status_code == 200, "Admin login failed"
    
    # Get the user ID of test_officer3
    r = s.get(f"{BASE}/admin/officers/?search=test3@municipality")
    officers = r.json().get('data', [])
    assert len(officers) > 0, "Officer not found in admin list"
    officer_id = officers[0]['id']
    
    print(f"Approving officer {officer_id}...")
    r = s.patch(f"{BASE}/admin/officers/{officer_id}/approve")
    print(r.status_code, r.text)
    assert r.status_code == 200, "Approval failed"
    print("Success: Officer approved.")

    # 5. Officer Logs In Again
    print("Logging in as approved officer...")
    r = requests.post(f"{BASE}/auth/login", json={"username": "test_officer3", "password": "password123"})
    print(r.status_code, r.text)
    assert r.status_code == 200, "Login failed after approval"
    print("Success: Officer logged in successfully.")

    print("ALL TESTS PASSED!")

if __name__ == '__main__':
    run_tests()
