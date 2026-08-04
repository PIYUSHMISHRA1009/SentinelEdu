# Frontend Manual Testing Guide

This guide walks you through testing all features of the InsightFlow Edu platform using the React frontend.

## 🚀 Prerequisites

1. **Start the full stack**:
   ```bash
   cd InsightFlow-Edu-master/new
   docker-compose up -d
   ```

2. **Wait for all services to be healthy** (30-60 seconds):
   ```bash
   docker-compose ps
   ```

3. **Open the frontend**: http://localhost:3000

---

## 🔐 Test 1: Authentication & Login

### Test 1.1: Admin Login
1. Navigate to http://localhost:3000
2. You should be redirected to `/login`
3. Enter credentials:
   - **Email**: `admin@university.edu`
   - **Password**: `admin123`
4. Click **Sign In**
5. ✅ **Expected**: Redirected to `/dashboard` with admin navbar showing all menu items

### Test 1.2: Teacher Login
1. Logout (click user avatar → Logout)
2. Login with:
   - **Email**: `priya.sharma@university.edu`
   - **Password**: `faculty123`
3. ✅ **Expected**: Redirected to dashboard, navbar shows teacher-relevant items only

### Test 1.3: Student Login
1. Logout
2. Login with:
   - **Email**: `rahul.sharma@student.edu`
   - **Password**: `student123`
4. ✅ **Expected**: Redirected to dashboard, only sees own data

### Test 1.4: Failed Login
1. Try invalid credentials
4. ✅ **Expected**: Error message "Incorrect email or password"

---

## 📊 Test 2: Risk Dashboard (Main Feature)

### Test 2.1: Dashboard Overview (Admin/Teacher)
1. Login as **admin** or **teacher**
2. Navigate to **Dashboard** (default landing page)
4. ✅ **Verify**:
   - Stats cards: Total Students, Critical Risk, High Risk, Avg Risk Score
   - Risk level filters (All, Critical, High, Medium, Low)
   - Class filter dropdown
   - "Assess All Students" button
   - Student table with: Name, Department, GPA, Attendance, Risk Score, Risk Level, Actions

### Test 2.2: Risk Assessment
1. Click **"Assess All Students"** button
2. ✅ **Expected**: 
   - Button shows loading state
   - Table refreshes with updated risk scores
   - Risk levels update (Critical/High/Medium/Low badges)

### Test 2.3: Student Detail Modal
1. Click **Eye icon** (View Details) on any student row
2. ✅ **Expected**: Modal opens with:
   - Student info (Name, Email, Department)
   - Current GPA, Attendance Rate, Risk Score
   - Risk Level badge
   - **GPA Trend Chart** (Recharts area chart)
   - **Attendance Trend Chart** (Recharts area chart)
   - Risk Factors list
   - "Re-assess Risk" button

### Test 2.4: Filtering & Sorting
1. **Filter by Risk Level**: Select "Critical" from dropdown
   ✅ Only critical students shown
2. **Filter by Class**: Select specific class
   ✅ Only students in that class shown
3. **Sort columns**: Click column headers (Risk Score, Name, etc.)
   ✅ Table sorts ascending/descending

### Test 2.5: Student Self-View (Student Role)
1. Login as **student** (`rahul.sharma@student.edu` / `student123`)
2. Navigate to Dashboard
   ✅ **Expected**: Only sees own row, no filters, no "Assess All" button

---

## 🏫 Test 3: Classes Management

### Test 3.1: Class List (Admin/Teacher)
1. Navigate to **Classes** in sidebar
2. ✅ **Expected**: Table with columns: Code, Name, Department, Semester, Credits, Teacher, Actions
3. Admin sees all classes, Teacher sees only their classes

### Test 3.2: Create Class (Admin)
1. Click **"Add Class"** button
2. Fill form:
   - Code: `TEST101`
   - Name: `Test Class`
   - Department: `Computer Science`
   - Semester: `3`
   - Credits: `3`
   - Teacher: Select a teacher
4. Click **Create**
   ✅ Class appears in list

### Test 3.3: Class Students
1. Click **Students icon** on a class row
2. ✅ **Expected**: Modal with enrolled students list

---

## 📝 Test 4: Grades Management

### Test 4.1: Grade List
1. Navigate to **Grades** in sidebar
2. ✅ **Expected**: Table with filters (Student, Class) and pagination

### Test 4.2: Create Grade (Teacher)
1. Click **"Add Grade"**
2. Fill form:
   - Student: Select student
   - Class: Select class
   - Assignment Name: `Midterm Exam`
   - Score: `85`
   - Max Score: `100`
   - Weight: `1.0`
3. Click **Create**
   ✅ Grade appears in list

### Test 4.3: Student Grade Summary
1. Navigate to a student's detail (from Dashboard)
2. ✅ **Expected**: Shows GPA, class-wise GPA breakdown

---

## 📅 Test 5: Attendance Management

### Test 5.1: Attendance List
1. Navigate to **Attendance** in sidebar
2. ✅ **Expected**: Filters (Student, Class, Date range), pagination

### Test 5.2: Record Attendance (Teacher)
1. Click **"Record Attendance"**
2. Fill form:
   - Student: Select student
   - Class: Select class
   - Date: Today
   - Status: `Present` / `Absent` / `Late` / `Excused`
3. Click **Create**
   ✅ Attendance record created

### Test 5.3: Bulk Attendance
1. Click **"Bulk Record"**
2. Select Class, Date
3. Set status for multiple students at once
   ✅ Efficient bulk entry

### Test 5.4: Attendance Summary
1. Click **Summary** on a class row
   ✅ **Expected**: Shows attendance rates for all students in class

---

## 🤖 Test 6: Security & Anomaly Detection

### Test 6.1: Anomaly Dashboard
1. Login as **admin** or **teacher**
2. Navigate to **Security** → **Anomalies** in sidebar
3. ✅ **Expected**: Tabs for:
   - **All Anomalies** - ML-detected anomalies
   - **Impossible Travel** - Login location anomalies
   - **Privilege Escalation** - Failed authz + config changes
   - **Brute Force** - Failed login patterns
   - **Full Detection** - Combined view

### Test 6.2: Generate Anomalies
1. Make several failed login attempts (wrong password)
2. Wait a moment
3. Go to **Brute Force** tab
   ✅ **Expected**: Alert for your IP with failure count

### Test 6.3: Full Detection Report
1. Click **Full Detection** tab
2. Click **Run Detection** (if button exists) or refresh
   ✅ **Expected**: Combined report with:
   - Total alerts count
   - By severity (Critical/High/Medium/Low)
   - By type (Anomaly, Impossible Travel, Privilege Escalation, Brute Force)
   - Top 50 alerts with details

---

## 📈 Test 7: Observability & Monitoring

### Test 7.1: Health & Metrics
1. Visit http://localhost:8000/health
   ✅ `{"status":"healthy",...}`
2. Visit http://localhost:8000/metrics
   ✅ Prometheus metrics (http_requests_total, etc.)

### Test 7.2: Grafana Dashboards
1. Open http://localhost:3001 (admin/admin)
2. Navigate to **Dashboards** → **InsightFlow**
3. ✅ **Expected dashboards**:
   - **Backend Metrics**: Request rate, latency, error rate, active requests
   - **Frontend Metrics**: (if configured)
   - **Business Metrics**: Risk assessments, active students

### Test 7.3: Loki Logs
1. In Grafana, go to **Explore** → **Loki**
2. Query: `{job="insightflow-backend"}`
   ✅ Structured JSON logs with correlation IDs

### Test 7.4: Distributed Tracing (Tempo)
1. In Grafana, go to **Explore** → **Tempo**
2. Search for recent traces
   ✅ Distributed traces with service map

---

## 🔧 Test 8: Keycloak Integration (SSO)

### Test 8.1: Keycloak Admin Console
1. Open http://localhost:8082
2. Login: `admin` / `admin`
3. Navigate to **Realm: insightflow** → **Users**
   ✅ See imported users

### Test 8.2: OIDC Flow (if configured)
1. Logout from frontend
2. Click login → Should redirect to Keycloak
3. Login with Keycloak credentials
   ✅ Redirected back to frontend with valid session

---

## 📋 Test 9: Audit Logging Verification

### Test 9.1: API Audit Logs
1. Perform several actions in frontend (login, view dashboard, create grade)
2. Check backend logs (Docker logs):
   ```bash
   docker-compose logs backend | grep "event_type"
   ```
   ✅ Structured JSON logs with: event_type, user_id, correlation_id, resource, action, outcome

### Test 9.2: Database Audit Logs
1. Connect to PostgreSQL:
   ```bash
   docker-compose exec postgres psql -U postgres -d insightflow
   ```
2. Query audit logs:
   ```sql
   SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 10;
   ```
   ✅ Events persisted with all fields

---

## ⚡ Test 10: Performance & Load

### Test 10.1: Concurrent Users
1. Open multiple browser tabs/incognito windows
2. Login as different users simultaneously
3. Perform actions concurrently
   ✅ No errors, data isolation maintained

### Test 10.2: Large Data Sets
1. As admin, run risk assessment on all students
2. Navigate dashboard with 100+ students
   ✅ Pagination works, sorting responsive

---

## 🐛 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Frontend not loading | Check `docker-compose logs frontend`, ensure backend is healthy |
| Login fails | Verify backend is running: `curl http://localhost:8000/health` |
| Charts not rendering | Check browser console for Recharts errors, ensure data format matches |
| Grafana no data | Verify Prometheus scraping: `http://localhost:9090/targets` |
| Keycloak not accessible | Check `docker-compose logs keycloak`, wait for startup |
| OpenFGA errors | Verify OpenFGA running: `curl http://localhost:8080/healthz` |

---

## 📝 Test Checklist Summary

```
□ Admin Login
□ Teacher Login
□ Student Login
□ Failed Login Handling
□ Dashboard Stats Cards
□ Risk Assessment Button
□ Student Detail Modal
□ GPA Trend Chart
□ Attendance Trend Chart
□ Risk Level Filters
□ Class Filter
□ Column Sorting
□ Student Self-View
□ Class List
□ Create Class
□ Class Students Modal
□ Grade List
□ Create Grade
□ Student Grade Summary
□ Attendance List
□ Record Attendance
□ Bulk Attendance
□ Attendance Summary
□ Anomaly Dashboard
□ Brute Force Detection
□ Full Detection Report
□ Health Endpoint
□ Prometheus Metrics
□ Grafana Dashboards
□ Loki Logs
□ Tempo Traces
□ Keycloak Console
□ Audit Logs (Console)
□ Audit Logs (Database)
□ Concurrent Users
□ Large Data Sets
```

---

## 📞 Need Help?

- **Backend logs**: `docker-compose logs -f backend`
- **Frontend logs**: `docker-compose logs -f frontend`
- **All logs**: `docker-compose logs -f`
- **Restart services**: `docker-compose restart`
- **Full reset**: `docker-compose down -v && docker-compose up -d`

---

**Happy Testing! 🎉** 

If you find any issues, please report them on [GitHub Issues](https://github.com/PIYUSHMISHRA1009/InsightFlow-Edu/issues).