# InsightFlow EDU - Backend API

Complete Spring Boot backend for InsightFlow EDU student performance tracking system.

## 📋 Table of Contents
- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Database Setup](#database-setup)
- [Application Setup](#application-setup)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Demo Credentials](#demo-credentials)

---

## 🎯 Project Overview

InsightFlow EDU is a comprehensive student performance tracking system designed for university environments. The backend provides RESTful APIs for:

- **Student Management**: List, search, and view detailed student profiles
- **Risk Detection**: Automated identification of at-risk students based on GPA and attendance
- **Intervention Tracking**: Faculty intervention management and status tracking
- **Feedback & Sentiment Analysis**: Student feedback with automated sentiment classification
- **Dashboard Analytics**: Real-time statistics, trends, and performance metrics
- **Authentication & Authorization**: Role-based access control (Faculty, Academic Head, IT)

---

## 🛠 Technology Stack

- **Java**: 21
- **Spring Boot**: 3.5.6
- **Database**: Oracle Database XE 21c (FREEPDB1)
- **Build Tool**: Maven
- **JDBC**: Oracle JDBC Driver (ojdbc11)
- **Testing**: JUnit 5, MockMvc, Spring Boot Test
- **Security**: Spring Security (configured for demo mode)

---

## ✅ Prerequisites

Ensure the following are installed:

1. **Java Development Kit (JDK) 21**
   ```bash
   java -version
   ```

2. **Apache Maven 3.6+**
   ```bash
   mvn -version
   ```

3. **Oracle Database XE 21c**
   - Download from: https://www.oracle.com/database/technologies/xe-downloads.html
   - Ensure FREEPDB1 is accessible on port 1521

4. **Git** (for cloning the repository)

---

## 🗄 Database Setup

### Step 1: Create Database User

Connect to Oracle as SYSTEM user:

```sql
sqlplus sys/your_password@localhost:1521/FREEPDB1 as sysdba
```

Run the user creation script:

```sql
@database/db-scripts/create_insightflow_user.sql
```

This creates user `INSIGHTFLOW` with a password (see the SQL script for details).

### Step 2: Create Tables

Connect as INSIGHTFLOW user:

```sql
sqlplus INSIGHTFLOW/your_password@localhost:1521/FREEPDB1
```

Run DDL script:

```sql
@database/ddl/01_create_tables.sql
```

This creates all tables:
- `students`
- `faculty`
- `courses`
- `enrollments`
- `attendance`
- `risk_flags`
- `interventions`
- `feedback`

### Step 3: Create PL/SQL Procedures

```sql
@database/plsql/02_procedures_functions.sql
```

This creates:
- `run_risk_engine` - Risk detection procedure
- `classify_sentiment` - Sentiment analysis function
- `log_intervention` - Intervention logging procedure
- `get_student_analytics` - Analytics function

### Step 4: Insert Sample Data

```sql
@database/sample_data/03_insert_data.sql
```

This populates the database with:
- 5 faculty members (including demo accounts)
- 15 students across departments
- 7 courses
- Enrollments with GPAs
- Attendance records
- Sample interventions and feedback

---

## 🚀 Application Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd insightflow-edu/backend/insightflow-backend
```

### Step 2: Configure Database Connection

Edit `src/main/resources/application.properties`:

**Note:** Copy `application.properties.template` to `application.properties` and add your credentials:

```properties
spring.datasource.url=jdbc:oracle:thin:@//localhost:1521/FREEPDB1
spring.datasource.username=INSIGHTFLOW
spring.datasource.password=YOUR_PASSWORD_HERE
spring.datasource.driver-class-name=oracle.jdbc.OracleDriver
server.port=8080
```

### Step 3: Build the Project

```bash
mvn clean package
```

This will:
- Compile all Java classes
- Run all tests
- Create JAR file in `target/` directory

### Step 4: Run the Application

```bash
mvn spring-boot:run
```

Or run the JAR directly:

```bash
java -jar target/insightflow-backend-0.0.1-SNAPSHOT.jar
```

The API will be available at: **http://localhost:8080**

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | User login | No |
| GET | `/api/auth/validate` | Validate token | Yes |
| POST | `/api/auth/logout` | User logout | Yes |

**Login Request:**
```json
{
  "username": "faculty",
  "password": "faculty123"
}
```

**Login Response:**
```json
{
  "success": true,
  "data": {
    "token": "Bearer-<uuid>",
    "role": "faculty",
    "user": {
      "id": 1,
      "name": "Dr. Priya Sharma",
      "email": "priya.sharma@university.edu",
      "username": "faculty"
    }
  }
}
```

---

### Students

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | `/api/students` | List students | `search`, `semester`, `department`, `page`, `size` |
| GET | `/api/students/{id}` | Student profile | - |
| GET | `/api/students/departments` | List departments | - |

**Example Request:**
```bash
curl http://localhost:8080/api/students?search=priya&page=0&size=10
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "students": [
      {
        "STUDENT_ID": 2,
        "ROLL_NUMBER": "CS2021002",
        "NAME": "Priya Patel",
        "EMAIL": "priya.patel@student.edu",
        "DEPARTMENT": "Computer Science",
        "SEMESTER": 3,
        "AVG_GPA": 2.13,
        "AVG_ATTENDANCE": 61.67,
        "is_at_risk": true
      }
    ],
    "total": 1,
    "page": 0,
    "size": 10
  }
}
```

---

### Risk Detection

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/risk/run` | Run risk detection engine |
| GET | `/api/risk/flags` | Get all risk flags |
| GET | `/api/risk/summary` | Risk summary statistics |

**Run Risk Detection Request:**
```json
{
  "gpaThreshold": 2.5,
  "attendanceThreshold": 75
}
```

**Response:**
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

---

### Interventions

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| GET | `/api/interventions` | List interventions | `studentId` |
| POST | `/api/interventions` | Create intervention | - |
| PATCH | `/api/interventions/{id}/status` | Update status | `status` |
| GET | `/api/interventions/stats` | Intervention statistics | - |

**Create Intervention Request:**
```json
{
  "studentId": 2,
  "facultyId": 1,
  "interventionType": "counseling",
  "notes": "Student needs academic guidance and support"
}
```

---

### Feedback & Sentiment

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/feedback` | Submit feedback with sentiment |
| GET | `/api/feedback/student/{id}` | Get student feedback |
| GET | `/api/feedback` | Get all feedback |
| GET | `/api/feedback/stats` | Sentiment statistics |

**Submit Feedback Request:**
```json
{
  "studentId": 1,
  "feedbackText": "Excellent progress and dedication shown",
  "submittedBy": 1
}
```

**Response:**
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

---

### Dashboard Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Summary statistics |
| GET | `/api/dashboard/gpa-trend` | GPA trends by semester |
| GET | `/api/dashboard/attendance-trend` | Attendance trends |
| GET | `/api/dashboard/risk-summary` | Risk categorization |
| GET | `/api/dashboard/department-stats` | Department-wise stats |
| GET | `/api/dashboard/course-performance` | Course performance metrics |

---

## 🧪 Testing

### Run All Tests

```bash
mvn test
```

### Run Specific Test Class

```bash
mvn test -Dtest=StudentControllerTest
```

### Test Coverage

Test classes included:
- `AuthControllerTest` - Authentication endpoints
- `StudentControllerTest` - Student management
- `InterventionControllerTest` - Intervention tracking
- `FeedbackControllerTest` - Feedback and sentiment
- `RiskControllerTest` - Risk detection

---

## 📁 Project Structure

```
backend/insightflow-backend/
├── src/
│   ├── main/
│   │   ├── java/com/example/insightflowbackend/
│   │   │   ├── controller/           # REST controllers
│   │   │   │   ├── AuthController.java
│   │   │   │   ├── StudentController.java
│   │   │   │   ├── RiskController.java
│   │   │   │   ├── InterventionController.java
│   │   │   │   ├── FeedbackController.java
│   │   │   │   └── DashboardController.java
│   │   │   ├── service/              # Business logic
│   │   │   │   ├── AuthService.java
│   │   │   │   ├── StudentService.java
│   │   │   │   ├── RiskService.java
│   │   │   │   ├── InterventionService.java
│   │   │   │   ├── FeedbackService.java
│   │   │   │   └── DashboardService.java
│   │   │   ├── dto/                  # Data transfer objects
│   │   │   │   ├── ApiResponse.java
│   │   │   │   ├── LoginRequest.java
│   │   │   │   ├── LoginResponse.java
│   │   │   │   └── ...
│   │   │   ├── config/               # Configuration classes
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   └── GlobalExceptionHandler.java
│   │   │   └── InsightflowBackendApplication.java
│   │   └── resources/
│   │       └── application.properties
│   └── test/
│       └── java/com/example/insightflowbackend/
│           ├── AuthControllerTest.java
│           ├── StudentControllerTest.java
│           └── ...
├── database/
│   ├── ddl/
│   │   └── 01_create_tables.sql
│   ├── plsql/
│   │   └── 02_procedures_functions.sql
│   └── sample_data/
│       └── 03_insert_data.sql
├── pom.xml
└── README.md
```

---

## 🔑 Demo Credentials

### Faculty Account
- **Username**: `faculty`
- **Password**: `faculty123`
- **Role**: faculty
- **Access**: All student and intervention endpoints

### Academic Head Account
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: academic_head
- **Access**: All endpoints including admin functions

### IT Account
- **Username**: `it`
- **Password**: `it123`
- **Role**: it
- **Access**: System administration and configuration

---

## 🔧 Troubleshooting

### Port Already in Use
If port 8080 is occupied:
```properties
# In application.properties
server.port=8081
```

### Database Connection Issues
1. Verify Oracle service is running
2. Check FREEPDB1 is accessible:
   ```sql
   lsnrctl status
   ```
3. Verify credentials in `application.properties`

### Build Failures
```bash
# Clean and rebuild
mvn clean install -U
```

---

## 📚 Additional Resources

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Oracle JDBC Documentation](https://docs.oracle.com/en/database/oracle/oracle-database/21/jjdbc/)
- [DEMO_SCRIPT.md](DEMO_SCRIPT.md) - Step-by-step demo walkthrough

---

## 📞 Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review API endpoint documentation
3. Consult DEMO_SCRIPT.md for usage examples

---

**InsightFlow EDU Backend v1.0** | Built with Spring Boot & Oracle Database
