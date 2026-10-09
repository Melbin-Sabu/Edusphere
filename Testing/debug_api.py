import urllib.request
import urllib.parse
import json

# Login
login_data = json.dumps({
    "email": "alen.chemistry@edusphere.com",
    "password": "Edu@123",
    "role": "TEACHER"
}).encode('utf-8')

req = urllib.request.Request("http://localhost:5000/api/auth/login", data=login_data, headers={'Content-Type': 'application/json'})
try:
    response = urllib.request.urlopen(req)
    res_data = json.loads(response.read().decode('utf-8'))
    token = res_data.get("token")
    print("Login OK")
except Exception as e:
    print("Login error", e)
    exit(1)

# Create quiz
payload = json.dumps({
    "title": "Tom",
    "description": "",
    "course": "General",
    "batch": "JEE Evening Batch",
    "subject": "Chemistry",
    "durationMinutes": 30,
    "negativeMarkingEnabled": False,
    "defaultPositiveMark": 4,
    "defaultNegativeMark": 1,
    "startDate": "2026-10-07",
    "startTime": "12:15",
    "endDate": "2026-10-07",
    "endTime": "12:20",
    "attemptLimit": 1
}).encode('utf-8')

req2 = urllib.request.Request("http://localhost:5000/api/quizzes", data=payload, headers={
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {token}'
})

try:
    response2 = urllib.request.urlopen(req2)
    print("Create OK:", response2.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("Create Error:", e.code, e.read().decode('utf-8'))
except Exception as e:
    print("Create Error:", e)
