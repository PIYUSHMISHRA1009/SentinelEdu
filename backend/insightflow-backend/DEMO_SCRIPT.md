# InsightFlow EDU - Demo Script

Complete walkthrough for DBMS & SE Lab demonstration.

---

## 🎬 Demo Overview

**Duration**: 15-20 minutes  
**Audience**: Faculty, Lab Instructors  
**Objective**: Demonstrate full-stack integration with Oracle DB and PL/SQL

---

## 📋 Pre-Demo Checklist

- [ ] Oracle Database XE running
- [ ] Backend API running on port 8080
- [ ] Frontend running on port 5173
- [ ] Sample data loaded
- [ ] Browser open to http://localhost:5173

---

## 🚀 Demo Flow

### Part 1: Authentication & Dashboard (3 minutes)

#### Step 1.1: Login as Faculty
1. Navigate to http://localhost:5173
2. Enter credentials:
   - Username: `faculty`
   - Password: `faculty123`
3. Click "Login"

**Expected Result:**
- Redirect to Dashboard
- See header with "Dr. Priya Sharma" and role badge "Faculty"

#### Step 1.2: View Dashboard Statistics
Point out the key metrics:
- **Total Students**: 15
- **Flagged Students**: 0 (initially)
- **Average GPA**: ~2.8
- **Average Attendance**: ~78%

**Explain:**
- Data comes from aggregated SQL queries in `DashboardService`
- Joins across `students`, `enrollments`, `attendance` tables

#### Step 1.3: View Trend Charts
Scroll down to show:
- **GPA Trend Chart**: Line graph showing semester-wise GPA
- **Attendance Trend Chart**: Bar chart of monthly attendance

**Backend Integration:**
- `GET /api/dashboard/gpa-trend`
- `GET /api/dashboard/attendance-trend`
- Uses SQL GROUP BY queries

---

### Part 2: Student Management (4 minutes)

#### Step 2.1: View Students List
1. Click "Students" in sidebar
2. Show the table with 15 students

**Point out features:**
- Pagination (10 per page)
- Search functionality
- Department filter
- Semester filter
- Risk status indicator (red badge)

#### Step 2.2: Search for At-Risk Student
1. Type "Priya" in search box
2. Show "Priya Patel" with:
   - GPA: 2.13
   - Attendance: 61.67%
   - At Risk: Yes (red badge)

**Backend Call:**
```bash
GET /api/students?search=priya&page=0&size=10
```

**SQL Behind the Scenes:**
```sql
SELECT s.student_id, s.roll_number, s.name, 
       ROUND(AVG(e.gpa), 2) as avg_gpa,
       ROUND(AVG(a.percentage), 2) as avg_attendance
FROM students s
LEFT JOIN enrollments e ON s.student_id = e.student_id
LEFT JOIN attendance a ON s.student_id = a.student_id
WHERE LOWER(s.name) LIKE LOWER('%priya%')
GROUP BY s.student_id, s.roll_number, s.name
```

#### Step 2.3: View Student Profile
1. Click on "Priya Patel" row
2. Show detailed profile with tabs:
   - **Info**: Student details, GPA, attendance
   - **Enrollments**: 3 courses with grades
   - **Attendance**: Monthly records per course
   - **Interventions**: 2 interventions logged
   - **Feedback**: Faculty feedback with sentiment

**Backend Call:**
```bash
GET /api/students/2
```

**Emphasize:**
- Single endpoint returns complete profile
- Multiple table joins in one query
- Efficient data retrieval

---

### Part 3: Risk Detection Engine (4 minutes)

#### Step 3.1: Navigate to Risk Panel
1. Click "Risk Panel" in sidebar
2. Show the risk detection interface

#### Step 3.2: Configure Thresholds
Set parameters:
- **GPA Threshold**: 2.5
- **Attendance Threshold**: 75%

**Explain:**
- These are configurable by academic heads
- Determines who gets flagged as at-risk

#### Step 3.3: Run Risk Detection
1. Click "Run Risk Detection" button
2. Show loading indicator
3. View success message: "3 students flagged"

**Backend Call:**
```bash
POST /api/risk/run
{
  "gpaThreshold": 2.5,
  "attendanceThreshold": 75
}
```

**PL/SQL Procedure Called:**
```sql
CALL run_risk_engine(2.5, 75)
```

**Show in Oracle:**
```sql
SELECT * FROM risk_flags;
```

#### Step 3.4: View Flagged Students
Scroll down to see table with:
- Priya Patel - Low GPA (2.13) and Low Attendance (61.67%)
- Ananya Singh - Low GPA (2.00)
- Additional at-risk students

**Backend Call:**
```bash
GET /api/risk/flags
```

**SQL:**
```sql
SELECT rf.flag_id, rf.student_id, s.name, rf.reason, 
       rf.avg_gpa, rf.avg_attendance, rf.flagged_on
FROM risk_flags rf
JOIN students s ON rf.student_id = s.student_id
ORDER BY rf.flagged_on DESC
```

---

### Part 4: Intervention Tracking (3 minutes)

#### Step 4.1: Navigate to Interventions
1. Click "Interventions" in sidebar
2. Show existing interventions with status badges:
   - Pending (gray)
   - In Progress (yellow)
   - Completed (green)

#### Step 4.2: Create New Intervention
1. Click "Add Intervention" button
2. Fill in form:
   - **Student**: Select "Priya Patel"
   - **Type**: Academic Support
   - **Notes**: "Assigned peer tutor for DBMS course"
3. Click "Submit"

**Backend Call:**
```bash
POST /api/interventions
{
  "studentId": 2,
  "facultyId": 1,
  "interventionType": "academic_support",
  "notes": "Assigned peer tutor for DBMS course"
}
```

**SQL Executed:**
```sql
INSERT INTO interventions (
  intervention_id, student_id, faculty_id, 
  intervention_type, notes, status, created_on
) VALUES (
  intervention_seq.NEXTVAL, 2, 1, 
  'academic_support', 'Assigned peer tutor...', 
  'pending', CURRENT_TIMESTAMP
)
```

#### Step 4.3: View Updated List
1. Show new intervention appears at top
2. Point out auto-timestamp
3. Show faculty name populated from JOIN

---

### Part 5: Feedback & Sentiment Analysis (3 minutes)

#### Step 5.1: Navigate to Feedback
1. Click "Feedback" in sidebar
2. Show feedback submission form

#### Step 5.2: Submit Positive Feedback
1. Select student "Rahul Sharma"
2. Enter text: "Excellent progress in database design. Shows strong understanding of normalization concepts."
3. Click "Analyze Sentiment"

**Backend Call:**
```bash
POST /api/feedback
{
  "studentId": 1,
  "feedbackText": "Excellent progress...",
  "submittedBy": 1
}
```

**PL/SQL Function Called:**
```sql
SELECT classify_sentiment('Excellent progress...') FROM DUAL;
-- Returns: 'positive'
```

**Show Result:**
- Sentiment badge: "Positive" (green)
- Feedback saved with timestamp
- Appears in recent feedback list

#### Step 5.3: Submit Negative Feedback
1. Select student "Ananya Singh"
2. Enter: "Poor attendance and struggling with assignments. Requires immediate attention."
3. Analyze sentiment

**Result:**
- Sentiment: "Negative" (red)

#### Step 5.4: View Sentiment Statistics
Scroll to chart showing:
- Positive: 60%
- Neutral: 25%
- Negative: 15%

**Backend Call:**
```bash
GET /api/feedback/stats
```

---

### Part 6: Admin Features (2 minutes)

#### Step 6.1: Logout and Login as Admin
1. Click profile icon → Logout
2. Login with:
   - Username: `admin`
   - Password: `admin123`

#### Step 6.2: Access Admin Panel
1. Note new "Admin" menu item visible
2. Click "Admin"
3. Show admin-only features:
   - CSV Import section
   - Course management table
   - Faculty management table

**Explain:**
- Role-based access control
- Academic Head and IT roles see admin features
- Regular faculty does not

---

## 🗄 Database Integration Highlights

### 1. Complex Joins Demonstrated
```sql
-- Student profile with all related data
SELECT s.*, e.gpa, a.percentage, i.notes, f.sentiment
FROM students s
LEFT JOIN enrollments e ON s.student_id = e.student_id
LEFT JOIN attendance a ON s.student_id = a.student_id
LEFT JOIN interventions i ON s.student_id = i.student_id
LEFT JOIN feedback f ON s.student_id = f.student_id
```

### 2. PL/SQL Procedures Used
- ✅ `run_risk_engine(gpa_threshold, att_threshold)`
- ✅ `classify_sentiment(feedback_text)`
- ✅ Auto-increment sequences
- ✅ Triggers for attendance percentage calculation

### 3. JDBC Integration
- ✅ `JdbcTemplate` for queries
- ✅ `CallableStatement` for PL/SQL calls
- ✅ Connection pooling
- ✅ Transaction management

---

## 🎯 Key Points to Emphasize

### Database Design
- **Normalization**: Tables in 3NF
- **Foreign Keys**: Referential integrity enforced
- **Indexes**: Performance optimization on frequently queried columns
- **Sequences**: Auto-incrementing primary keys

### Backend Architecture
- **Layered Architecture**: Controller → Service → Database
- **RESTful APIs**: Consistent JSON responses
- **Error Handling**: Global exception handler
- **CORS Configuration**: Frontend-backend communication

### Full-Stack Integration
- **React Frontend** → **Spring Boot Backend** → **Oracle Database**
- Real-time data updates
- Responsive UI with data from DB
- No mock data used in demo

---

## 🧪 Optional: Show Database Queries in SQL Developer

If time permits, open SQL Developer and run:

```sql
-- Show all at-risk students
SELECT s.name, AVG(e.gpa) as avg_gpa, AVG(a.percentage) as avg_att
FROM students s
LEFT JOIN enrollments e ON s.student_id = e.student_id
LEFT JOIN attendance a ON s.student_id = a.student_id
GROUP BY s.name
HAVING AVG(e.gpa) < 2.5 OR AVG(a.percentage) < 75;

-- Show risk flags
SELECT * FROM risk_flags;

-- Show interventions with faculty names
SELECT i.notes, f.name as faculty_name, s.name as student_name
FROM interventions i
JOIN faculty f ON i.faculty_id = f.faculty_id
JOIN students s ON i.student_id = s.student_id;

-- Show sentiment distribution
SELECT sentiment, COUNT(*) as count
FROM feedback
GROUP BY sentiment;
```

---

## 📊 Expected Demo Results

| Metric | Value |
|--------|-------|
| Total Students | 15 |
| At-Risk Students (after risk run) | 3 |
| Interventions Created | 3+ |
| Feedback Entries | 5+ |
| Courses | 7 |
| Faculty | 5 |

---

## ❓ Q&A Preparation

### Q: "How does sentiment analysis work?"
**A:** We use a PL/SQL function `classify_sentiment` that performs keyword-based analysis. Positive words (excellent, great) vs negative words (poor, struggling). In production, this could integrate with external NLP APIs.

### Q: "What if the database is down?"
**A:** The backend includes a GlobalExceptionHandler that catches all database exceptions and returns user-friendly error messages. The frontend shows error notifications.

### Q: "Can we export data?"
**A:** Yes, the admin panel includes CSV export functionality (demonstrated in admin section). SQL queries can also export to CSV using SQL*Plus SPOOL.

### Q: "How is data security handled?"
**A:** Spring Security with role-based access control. Passwords should be hashed with BCrypt in production (currently plaintext for demo). HTTPS should be enabled in production.

---

## 🎓 Submission Checklist

For DBMS & SE Lab:

- [ ] ER Diagram with all entities and relationships
- [ ] Complete DDL scripts with all tables
- [ ] PL/SQL procedures and functions
- [ ] Sample data population scripts
- [ ] Backend code with all controllers and services
- [ ] Integration test results (mvn test output)
- [ ] Frontend screenshots showing all features
- [ ] README with setup instructions
- [ ] This demo script

---

## 🏁 Conclusion

InsightFlow EDU demonstrates:
- ✅ Full-stack web application architecture
- ✅ Oracle database integration with complex queries
- ✅ PL/SQL procedures for business logic
- ✅ RESTful API design
- ✅ Modern React frontend
- ✅ Real-world university use case

**Thank you for the demonstration!**

---

**Prepared for**: DBMS & Software Engineering Lab  
**Date**: October 2025  
**Version**: 1.0
