# InsightFlow EDU - API Testing Guide

Complete guide for testing all REST API endpoints using cURL, Postman, or browser.

---

## 🧪 Testing Setup

### Prerequisites
- Backend running on http://localhost:8080
- Database populated with sample data
- Terminal or Postman ready

### Quick Health Check
```bash
curl http://localhost:8080/api/dashboard/stats
```

---

## 🔐 Authentication Endpoints

### 1. Login (Faculty)
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "faculty",
    "password": "faculty123"
  }'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "Bearer-12345-abcde",
    "role": "faculty",
    "user": {
      "id": 1,
      "name": "Dr. Priya Sharma",
      "email": "priya.sharma@university.edu",
      "username": "faculty"
    }
  },
  "error": null
}
```

### 2. Login (Academic Head)
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### 3. Invalid Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "invalid",
    "password": "wrong"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "data": null,
  "error": "Invalid username or password"
}
```

---

## 👥 Student Endpoints

### 1. Get All Students (Paginated)
```bash
curl http://localhost:8080/api/students?page=0&size=10
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "students": [
      {
        "STUDENT_ID": 1,
        "ROLL_NUMBER": "CS2021001",
        "NAME": "Rahul Sharma",
        "EMAIL": "rahul.sharma@student.edu",
        "DEPARTMENT": "Computer Science",
        "SEMESTER": 3,
        "AVG_GPA": 3.58,
        "AVG_ATTENDANCE": 95.0,
        "is_at_risk": false
      }
    ],
    "total": 15,
    "page": 0,
    "size": 10
  }
}
```

### 2. Search Students by Name
```bash
curl "http://localhost:8080/api/students?search=priya"
```

### 3. Filter by Department
```bash
curl "http://localhost:8080/api/students?department=Computer%20Science&page=0&size=10"
```

### 4. Filter by Semester
```bash
curl "http://localhost:8080/api/students?semester=3&page=0&size=10"
```

### 5. Combined Filters
```bash
curl "http://localhost:8080/api/students?search=ra&semester=3&department=Computer%20Science"
```

### 6. Get Student Profile by ID
```bash
curl http://localhost:8080/api/students/1
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "STUDENT_ID": 1,
    "ROLL_NUMBER": "CS2021001",
    "NAME": "Rahul Sharma",
    "enrollments": [
      {
        "COURSE_CODE": "CS301",
        "COURSE_NAME": "Database Management Systems",
        "GPA": 3.5,
        "GRADE": "A"
      }
    ],
    "attendance": [
      {
        "COURSE_CODE": "CS301",
        "MONTH": "2024-01",
        "PERCENTAGE": 95.0
      }
    ],
    "interventions": [],
    "feedbacks": [
      {
        "FEEDBACK_TEXT": "Excellent student",
        "SENTIMENT": "positive"
      }
    ],
    "risk_flags": [],
    "is_at_risk": false,
    "avg_gpa": 3.58,
    "avg_attendance": 95.0
  }
}
```

### 7. Get Departments List
```bash
curl http://localhost:8080/api/students/departments
```

---

## 🚨 Risk Detection Endpoints

### 1. Run Risk Detection Engine
```bash
curl -X POST http://localhost:8080/api/risk/run \
  -H "Content-Type: application/json" \
  -d '{
    "gpaThreshold": 2.5,
    "attendanceThreshold": 75
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "message": "Risk detection completed successfully",
    "flaggedCount": 3,
    "gpaThreshold": 2.5,
    "attendanceThreshold": 75
  }
}
```

### 2. Get All Risk Flags
```bash
curl http://localhost:8080/api/risk/flags
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "FLAG_ID": 1,
      "STUDENT_ID": 2,
      "STUDENT_NAME": "Priya Patel",
      "ROLL_NUMBER": "CS2021002",
      "REASON": "Low GPA (2.13) and Low Attendance (61.67%)",
      "AVG_GPA": 2.13,
      "AVG_ATTENDANCE": 61.67,
      "FLAGGED_ON": "2024-10-22T10:30:00"
    }
  ]
}
```

### 3. Get Risk Summary
```bash
curl http://localhost:8080/api/risk/summary
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "flaggedCount": 3
  }
}
```

---

## 🤝 Intervention Endpoints

### 1. Get All Interventions
```bash
curl http://localhost:8080/api/interventions
```

### 2. Get Interventions for Specific Student
```bash
curl "http://localhost:8080/api/interventions?studentId=2"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "INTERVENTION_ID": 1,
      "STUDENT_ID": 2,
      "STUDENT_NAME": "Priya Patel",
      "ROLL_NUMBER": "CS2021002",
      "FACULTY_ID": 1,
      "FACULTY_NAME": "Dr. Priya Sharma",
      "INTERVENTION_TYPE": "counseling",
      "NOTES": "Student showing signs of academic stress",
      "STATUS": "completed",
      "CREATED_ON": "2024-10-15T14:30:00"
    }
  ]
}
```

### 3. Create New Intervention
```bash
curl -X POST http://localhost:8080/api/interventions \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": 2,
    "facultyId": 1,
    "interventionType": "academic_support",
    "notes": "Assigned peer tutor for database course. Will monitor progress weekly."
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "intervention_id": 4,
    "message": "Intervention created successfully"
  }
}
```

### 4. Update Intervention Status
```bash
curl -X PATCH "http://localhost:8080/api/interventions/1/status?status=completed" \
  -H "Content-Type: application/json"
```

### 5. Get Intervention Statistics
```bash
curl http://localhost:8080/api/interventions/stats
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "TOTAL": 5,
    "PENDING": 1,
    "IN_PROGRESS": 2,
    "COMPLETED": 2
  }
}
```

---

## 💬 Feedback & Sentiment Endpoints

### 1. Submit Positive Feedback
```bash
curl -X POST http://localhost:8080/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": 1,
    "feedbackText": "Rahul demonstrates excellent understanding of database normalization and shows great enthusiasm in class discussions.",
    "submittedBy": 1
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "feedback_id": 12,
    "sentiment": "positive",
    "message": "Feedback submitted successfully"
  }
}
```

### 2. Submit Negative Feedback
```bash
curl -X POST http://localhost:8080/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": 2,
    "feedbackText": "Poor attendance and struggling with assignments. Requires immediate intervention.",
    "submittedBy": 1
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "feedback_id": 13,
    "sentiment": "negative",
    "message": "Feedback submitted successfully"
  }
}
```

### 3. Submit Neutral Feedback
```bash
curl -X POST http://localhost:8080/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": 3,
    "feedbackText": "Student is making progress at expected pace. No major concerns.",
    "submittedBy": 1
  }'
```

### 4. Get Feedback for Student
```bash
curl http://localhost:8080/api/feedback/student/1
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "FEEDBACK_ID": 1,
      "STUDENT_ID": 1,
      "STUDENT_NAME": "Rahul Sharma",
      "FEEDBACK_TEXT": "Excellent progress",
      "SENTIMENT": "positive",
      "CREATED_ON": "2024-10-20T09:15:00",
      "SUBMITTED_BY_NAME": "Dr. Priya Sharma"
    }
  ]
}
```

### 5. Get All Feedback
```bash
curl http://localhost:8080/api/feedback
```

### 6. Get Sentiment Statistics
```bash
curl http://localhost:8080/api/feedback/stats
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "TOTAL": 10,
    "POSITIVE": 6,
    "NEUTRAL": 2,
    "NEGATIVE": 2
  }
}
```

---

## 📊 Dashboard Analytics Endpoints

### 1. Get Dashboard Summary Stats
```bash
curl http://localhost:8080/api/dashboard/stats
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "total_students": 15,
    "flagged_students": 3,
    "avg_gpa": 2.87,
    "avg_attendance": 78.5,
    "total_interventions": 5,
    "pending_interventions": 1
  }
}
```

### 2. Get GPA Trend by Semester
```bash
curl http://localhost:8080/api/dashboard/gpa-trend
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "SEMESTER": 2,
      "AVG_GPA": 3.2,
      "STUDENT_COUNT": 5
    },
    {
      "SEMESTER": 3,
      "AVG_GPA": 2.8,
      "STUDENT_COUNT": 10
    }
  ]
}
```

### 3. Get Attendance Trend by Month
```bash
curl http://localhost:8080/api/dashboard/attendance-trend
```

### 4. Get Risk Summary with Categories
```bash
curl http://localhost:8080/api/dashboard/risk-summary
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "by_reason": [
      {
        "REASON": "Low GPA and Low Attendance",
        "COUNT": 2
      },
      {
        "REASON": "Low GPA",
        "COUNT": 1
      }
    ],
    "recent_flags": [...]
  }
}
```

### 5. Get Department Statistics
```bash
curl http://localhost:8080/api/dashboard/department-stats
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "DEPARTMENT": "Computer Science",
      "STUDENT_COUNT": 12,
      "AVG_GPA": 2.9,
      "AVG_ATTENDANCE": 79.5,
      "FLAGGED_COUNT": 3
    },
    {
      "DEPARTMENT": "Electronics",
      "STUDENT_COUNT": 3,
      "AVG_GPA": 3.1,
      "AVG_ATTENDANCE": 85.0,
      "FLAGGED_COUNT": 0
    }
  ]
}
```

### 6. Get Course Performance Metrics
```bash
curl http://localhost:8080/api/dashboard/course-performance
```

---

## 🧪 Error Testing

### 1. Test 404 - Student Not Found
```bash
curl http://localhost:8080/api/students/999
```

**Expected Response (404):**
```json
{
  "success": false,
  "data": null,
  "error": "Resource not found"
}
```

### 2. Test 400 - Missing Required Field
```bash
curl -X POST http://localhost:8080/api/interventions \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Missing student and faculty IDs"
  }'
```

**Expected Response (400):**
```json
{
  "success": false,
  "data": null,
  "error": "Student ID and Faculty ID are required"
}
```

### 3. Test 500 - Database Error
```bash
# Stop Oracle database, then:
curl http://localhost:8080/api/students
```

**Expected Response (500):**
```json
{
  "success": false,
  "data": null,
  "error": "Database error: Connection refused"
}
```

---

## 📦 Postman Collection

### Import into Postman

Create a new collection with these requests:

**Collection Variables:**
- `base_url`: http://localhost:8080
- `token`: (set after login)

**Folder Structure:**
```
InsightFlow EDU
├── Auth
│   ├── Login (Faculty)
│   ├── Login (Admin)
│   └── Logout
├── Students
│   ├── Get All Students
│   ├── Search Students
│   ├── Filter by Department
│   ├── Get Student Profile
│   └── Get Departments
├── Risk
│   ├── Run Risk Detection
│   ├── Get Risk Flags
│   └── Get Risk Summary
├── Interventions
│   ├── Get All Interventions
│   ├── Get by Student
│   ├── Create Intervention
│   └── Update Status
├── Feedback
│   ├── Submit Feedback
│   ├── Get by Student
│   ├── Get All
│   └── Get Stats
└── Dashboard
    ├── Summary Stats
    ├── GPA Trend
    ├── Attendance Trend
    ├── Risk Summary
    ├── Department Stats
    └── Course Performance
```

---

## ✅ Testing Checklist

Use this checklist for comprehensive testing:

### Authentication
- [ ] Login with valid faculty credentials
- [ ] Login with valid admin credentials
- [ ] Login with invalid credentials
- [ ] Logout functionality

### Students Module
- [ ] Get all students (paginated)
- [ ] Search by name
- [ ] Filter by department
- [ ] Filter by semester
- [ ] Combined filters
- [ ] Get student profile
- [ ] Get departments list

### Risk Detection
- [ ] Run risk engine with default thresholds
- [ ] Run risk engine with custom thresholds
- [ ] Get all risk flags
- [ ] Verify database updates (check risk_flags table)

### Interventions
- [ ] Get all interventions
- [ ] Filter by student
- [ ] Create new intervention
- [ ] Update intervention status
- [ ] Get intervention statistics

### Feedback & Sentiment
- [ ] Submit positive feedback
- [ ] Submit negative feedback
- [ ] Submit neutral feedback
- [ ] Get feedback for student
- [ ] Get all feedback
- [ ] Get sentiment statistics

### Dashboard
- [ ] Get summary statistics
- [ ] Get GPA trend
- [ ] Get attendance trend
- [ ] Get risk summary
- [ ] Get department stats
- [ ] Get course performance

### Error Handling
- [ ] Test 404 errors
- [ ] Test 400 validation errors
- [ ] Test 500 database errors

---

## 🔍 SQL Verification

After API calls, verify in database:

```sql
-- Check risk flags created
SELECT * FROM risk_flags ORDER BY flagged_on DESC;

-- Check new intervention
SELECT * FROM interventions ORDER BY created_on DESC FETCH FIRST 1 ROW ONLY;

-- Check feedback with sentiment
SELECT feedback_id, feedback_text, sentiment 
FROM feedback 
ORDER BY created_on DESC 
FETCH FIRST 5 ROWS ONLY;

-- Verify student stats
SELECT s.name, AVG(e.gpa) as avg_gpa, AVG(a.percentage) as avg_att
FROM students s
LEFT JOIN enrollments e ON s.student_id = e.student_id
LEFT JOIN attendance a ON s.student_id = a.student_id
GROUP BY s.name
ORDER BY avg_gpa;
```

---

## 📝 Notes

- All endpoints return consistent `ApiResponse` format
- CORS is configured for http://localhost:5173
- Timestamps are in ISO 8601 format
- Pagination uses 0-based indexing
- Case-insensitive search is implemented

---

**Happy Testing! 🚀**
