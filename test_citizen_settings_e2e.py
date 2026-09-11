"""
E2E tests for Citizen Settings module.
Run with: python test_citizen_settings_e2e.py
"""
import requests, json, sys

BASE = "http://localhost:5000/api"
CITIZEN_CREDS = {"username": "test999@example.com", "password": "password123"}

session = requests.Session()

def log(ok, msg):
    sym = "OK" if ok else "FAIL"
    print(f"  [{sym}]  {msg}")
    return ok

def test_login():
    r = session.post(f"{BASE}/auth/login", json=CITIZEN_CREDS)
    ok = r.status_code == 200 and r.json().get("success")
    log(ok, f"Login as citizen -- HTTP {r.status_code}")
    return ok

def test_get_settings():
    r = session.get(f"{BASE}/citizen/settings")
    j = r.json()
    ok = r.status_code == 200 and j.get("success") and "account" in j.get("data", {})
    log(ok, f"GET /citizen/settings returns account+preferences -- HTTP {r.status_code}")
    return ok

def test_settings_has_required_keys():
    r = session.get(f"{BASE}/citizen/settings")
    prefs = r.json().get("data", {}).get("preferences", {})
    required = [
        "notif_service_updates", "notif_messages", "channel_email",
        "theme", "reduce_motion", "text_size", "language", "time_format"
    ]
    missing = [k for k in required if k not in prefs]
    ok = len(missing) == 0
    log(ok, f"Preferences contain all required keys{' -- missing: ' + str(missing) if not ok else ''}")
    return ok

def test_update_preferences():
    payload = {
        "theme": "DARK",
        "reduce_motion": True,
        "text_size": "LARGE",
        "language": "en",
        "time_format": "24h",
        "notif_messages": True,
        "channel_email": True
    }
    r = session.put(f"{BASE}/citizen/settings", json=payload)
    ok = r.status_code == 200 and r.json().get("success")
    log(ok, f"PUT /citizen/settings -- HTTP {r.status_code}")
    return ok

def test_persistence():
    r = session.get(f"{BASE}/citizen/settings")
    prefs = r.json().get("data", {}).get("preferences", {})
    ok = prefs.get("theme") == "DARK" and prefs.get("time_format") == "24h" and prefs.get("text_size") == "LARGE"
    log(ok, f"Settings persisted correctly (theme=DARK, time_format=24h, text_size=LARGE) -- got {prefs.get('theme')}/{prefs.get('time_format')}/{prefs.get('text_size')}")
    return ok

def test_restore_defaults():
    payload = {"theme": "SYSTEM", "reduce_motion": False, "text_size": "NORMAL", "time_format": "12h"}
    r = session.put(f"{BASE}/citizen/settings", json=payload)
    ok = r.status_code == 200 and r.json().get("success")
    log(ok, f"Restored defaults -- HTTP {r.status_code}")
    return ok

def test_change_password_wrong_current():
    payload = {"current_password": "WRONGPASSWORD", "new_password": "newpass123", "confirm_password": "newpass123"}
    r = session.post(f"{BASE}/citizen/change-password", json=payload)
    ok = r.status_code in (400, 401)
    log(ok, f"Wrong current password rejected -- HTTP {r.status_code}")
    return ok

def test_change_password_mismatch():
    payload = {"current_password": CITIZEN_CREDS["password"], "new_password": "newpass123", "confirm_password": "DIFFERENT"}
    r = session.post(f"{BASE}/citizen/change-password", json=payload)
    ok = r.status_code == 400
    log(ok, f"Password mismatch rejected -- HTTP {r.status_code}")
    return ok

def test_401_unauthenticated():
    s2 = requests.Session()
    r = s2.get(f"{BASE}/citizen/settings")
    ok = r.status_code == 401
    log(ok, f"Unauthenticated GET /citizen/settings returns 401 -- HTTP {r.status_code}")
    return ok

def test_delete_account_wrong_pass():
    payload = {"password": "WRONGPASSWORD", "confirmation": "DELETE"}
    r = session.post(f"{BASE}/citizen/delete-account", json=payload)
    ok = r.status_code in (400, 401)
    log(ok, f"Delete account with wrong password rejected -- HTTP {r.status_code}")
    return ok

def test_delete_account_wrong_confirmation():
    payload = {"password": CITIZEN_CREDS["password"], "confirmation": "NO"}
    r = session.post(f"{BASE}/citizen/delete-account", json=payload)
    ok = r.status_code == 400
    log(ok, f"Delete account with wrong confirmation rejected -- HTTP {r.status_code}")
    return ok

if __name__ == "__main__":
    print("\n========================================")
    print("  CITIZEN SETTINGS -- E2E TEST SUITE")
    print("========================================\n")

    results = []

    print("[ AUTH ]")
    if not test_login():
        print("\nLogin failed -- check CITIZEN_CREDS or server status. Aborting.\n")
        sys.exit(1)

    print("\n[ SETTINGS LOAD ]")
    results.append(test_get_settings())
    results.append(test_settings_has_required_keys())

    print("\n[ SETTINGS SAVE & PERSISTENCE ]")
    results.append(test_update_preferences())
    results.append(test_persistence())
    results.append(test_restore_defaults())

    print("\n[ SECURITY -- PASSWORD CHANGE ]")
    results.append(test_change_password_wrong_current())
    results.append(test_change_password_mismatch())

    print("\n[ SECURITY -- AUTH GUARD ]")
    results.append(test_401_unauthenticated())

    print("\n[ ACCOUNT ACTIONS ]")
    results.append(test_delete_account_wrong_pass())
    results.append(test_delete_account_wrong_confirmation())

    passed = sum(results)
    total = len(results)
    print(f"\n{'='*40}")
    print(f"  RESULTS: {passed}/{total} tests passed")
    print(f"{'='*40}\n")
    sys.exit(0 if passed == total else 1)
