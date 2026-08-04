package com.example.insightflowbackend.service;

import com.example.insightflowbackend.util.DatabaseUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for managing student data and profiles.
 * Provides methods for retrieving student information, enrollments, attendance, and related data.
 */
@Service
public class StudentService {
    
    private final JdbcTemplate jdbc;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Autowired
    public StudentService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
        ensureStudentSequence();
        ensureEnrollmentSequence();
        ensureStudentAuthTable();
        ensureAccountAuditArtifacts();
        ensureOverridesTable();
    }

    private void ensureStudentSequence() {
        try { jdbc.execute("CREATE SEQUENCE student_seq START WITH 1 INCREMENT BY 1"); } catch (Exception ignored) {}
    }

    private void ensureEnrollmentSequence() {
        try { jdbc.execute("CREATE SEQUENCE enrollment_seq START WITH 1 INCREMENT BY 1"); } catch (Exception ignored) {}
    }

    private void ensureAccountAuditArtifacts() {
        try {
            jdbc.execute("CREATE TABLE account_events (" +
                    "event_id NUMBER PRIMARY KEY, " +
                    "student_id NUMBER, " +
                    "username VARCHAR2(100), " +
                    "event_type VARCHAR2(40), " +
                    "description VARCHAR2(255), " +
                    "created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                    "FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE)");
        } catch (Exception ignored) {}
        try { jdbc.execute("CREATE SEQUENCE account_events_seq START WITH 1 INCREMENT BY 1"); } catch (Exception ignored) {}
        try { jdbc.execute("CREATE INDEX idx_account_events_student ON account_events(student_id)"); } catch (Exception ignored) {}
    }

    private void ensureStudentAuthTable() {
        try {
            jdbc.execute("CREATE TABLE student_auth (" +
                    "student_id NUMBER PRIMARY KEY, " +
                    "username VARCHAR2(100) UNIQUE NOT NULL, " +
                    "password_hash VARCHAR2(200), " +
                    "last_plaintext_password VARCHAR2(100), " +
                    "last_reset_on TIMESTAMP, " +
                    "created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                    "last_login TIMESTAMP, " +
                    "FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE)");
        } catch (Exception ignored) {}
        try { jdbc.execute("ALTER TABLE student_auth ADD (password_hash VARCHAR2(200))"); } catch (Exception ignored) {}
        try { jdbc.execute("ALTER TABLE student_auth ADD (last_plaintext_password VARCHAR2(100))"); } catch (Exception ignored) {}
        try { jdbc.execute("ALTER TABLE student_auth ADD (last_reset_on TIMESTAMP)"); } catch (Exception ignored) {}
        try { jdbc.execute("ALTER TABLE student_auth ADD (created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"); } catch (Exception ignored) {}
        try { jdbc.execute("ALTER TABLE student_auth ADD (last_login TIMESTAMP)"); } catch (Exception ignored) {}
        try { jdbc.execute("CREATE INDEX idx_student_auth_username ON student_auth(username)"); } catch (Exception ignored) {}
    }

    private void recordAccountEvent(int studentId, String username, String eventType, String description) {
        try {
            Integer eventId = jdbc.queryForObject("SELECT account_events_seq.NEXTVAL FROM dual", Integer.class);
            if (eventId == null) {
                return;
            }
            jdbc.update(
                    "INSERT INTO account_events (event_id, student_id, username, event_type, description, created_on) VALUES (?,?,?,?,?, SYSTIMESTAMP)",
                    eventId,
                    studentId,
                    username,
                    eventType,
                    description
            );
        } catch (Exception ignored) {}
    }

    private void ensureOverridesTable() {
        try {
            jdbc.execute("CREATE TABLE student_metrics_overrides (" +
                    "student_id NUMBER PRIMARY KEY, " +
                    "avg_gpa NUMBER(3,2), " +
                    "avg_attendance NUMBER(5,2), " +
                    "updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                    "FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE)");
        } catch (Exception ignored) {}
    }

    /**
     * Retrieves a paginated, filterable list of students.
     * 
     * @param search Optional search term for name/roll number
     * @param semester Optional semester filter
     * @param department Optional department filter
     * @param page Page number (0-indexed)
     * @param size Page size
     * @return List of student records
     */
    public Map<String, Object> getStudents(String search, Integer semester, 
                                           String department, int page, int size) {
        StringBuilder sql = new StringBuilder(
            "SELECT s.student_id, s.roll_number, s.name, s.email, s.department, " +
            "s.semester, s.contact_number, " +
            "ROUND(AVG(e.gpa), 2) as avg_gpa, " +
            "ROUND(AVG(a.percentage), 2) as avg_attendance " +
            "FROM students s " +
            "LEFT JOIN enrollments e ON s.student_id = e.student_id " +
            "LEFT JOIN attendance a ON s.student_id = a.student_id " +
            "WHERE 1=1 "
        );
        
        List<Object> params = new ArrayList<>();
        
        if (search != null && !search.trim().isEmpty()) {
            sql.append("AND (LOWER(s.name) LIKE LOWER(?) OR LOWER(s.roll_number) LIKE LOWER(?)) ");
            String searchPattern = "%" + search + "%";
            params.add(searchPattern);
            params.add(searchPattern);
        }
        
        if (semester != null) {
            sql.append("AND s.semester = ? ");
            params.add(semester);
        }
        
        if (department != null && !department.trim().isEmpty()) {
            sql.append("AND s.department = ? ");
            params.add(department);
        }
        
        sql.append("GROUP BY s.student_id, s.roll_number, s.name, s.email, " +
                  "s.department, s.semester, s.contact_number ");
        sql.append("ORDER BY s.roll_number ");
        
        // Get total count
        String countSql = "SELECT COUNT(*) FROM (" + sql.toString() + ") t";
        Integer totalCount = jdbc.queryForObject(countSql, Integer.class, params.toArray());
        
        // Add pagination
        sql.append("OFFSET ? ROWS FETCH NEXT ? ROWS ONLY");
        params.add(page * size);
        params.add(size);
        
        List<Map<String, Object>> students = jdbc.queryForList(sql.toString(), params.toArray());
        
        // Convert Oracle UPPERCASE columns to lowercase and check risk status
        List<Map<String, Object>> normalizedStudents = new ArrayList<>();
        for (Map<String, Object> student : students) {
            Map<String, Object> normalized = new HashMap<>();
            
            // Convert all keys to lowercase and handle null values
            for (Map.Entry<String, Object> entry : student.entrySet()) {
                String key = entry.getKey().toLowerCase();
                Object value = entry.getValue();
                
                // Handle potential null values for avg_gpa and avg_attendance
                if ((key.equals("avg_gpa") || key.equals("avg_attendance")) && value == null) {
                    normalized.put(key, 0.0);
                } else {
                    normalized.put(key, value);
                }
            }
            
            // Check risk status
            Integer studentId = ((Number) student.get("STUDENT_ID")).intValue();
            Integer riskCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM risk_flags WHERE student_id = ?",
                Integer.class,
                studentId
            );
            normalized.put("risk_flag", riskCount != null && riskCount > 0);

            // Apply overrides if present
            try {
                Map<String, Object> ov = jdbc.queryForMap("SELECT avg_gpa, avg_attendance FROM student_metrics_overrides WHERE student_id = ?", studentId);
                if (ov.get("AVG_GPA") != null) {
                    normalized.put("avg_gpa", ov.get("AVG_GPA"));
                }
                if (ov.get("AVG_ATTENDANCE") != null) {
                    normalized.put("avg_attendance", ov.get("AVG_ATTENDANCE"));
                }
            } catch (Exception ignored) {}
            
            normalizedStudents.add(normalized);
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("students", normalizedStudents);
        result.put("total", totalCount != null ? totalCount : 0);
        result.put("page", page);
        result.put("size", size);
        
        return result;
    }

    /**
     * Retrieves complete profile for a specific student including all related data.
     * 
     * @param studentId Student ID
     * @return Complete student profile with enrollments, attendance, interventions, feedback
     */
    public Map<String, Object> getStudentProfile(int studentId) {
        // Get basic student info
        Map<String, Object> profile = jdbc.queryForMap(
            "SELECT student_id, roll_number, name, email, department, semester, contact_number " +
            "FROM students WHERE student_id = ?",
            studentId
        );
        
        // Normalize student basic info keys
        profile = DatabaseUtil.normalizeKeys(profile);
        
        // Get enrollments
        List<Map<String, Object>> enrollments = jdbc.queryForList(
            "SELECT e.enrollment_id, e.course_id, c.course_code, c.course_name, " +
            "e.gpa, e.semester, c.credits " +
            "FROM enrollments e " +
            "JOIN courses c ON e.course_id = c.course_id " +
            "WHERE e.student_id = ? " +
            "ORDER BY e.semester DESC",
            studentId
        );
        profile.put("enrollments", DatabaseUtil.normalizeKeys(enrollments));
        
        // Get attendance records
        List<Map<String, Object>> attendance = jdbc.queryForList(
            "SELECT a.attendance_id, a.course_id, c.course_code, c.course_name, " +
            "a.month, a.percentage, a.classes_held, a.classes_attended " +
            "FROM attendance a " +
            "JOIN courses c ON a.course_id = c.course_id " +
            "WHERE a.student_id = ? " +
            "ORDER BY a.month DESC",
            studentId
        );
        profile.put("attendance", DatabaseUtil.normalizeKeys(attendance));
        
        // Get interventions
        List<Map<String, Object>> interventions = jdbc.queryForList(
            "SELECT i.intervention_id, i.intervention_type, i.notes, i.status, " +
            "i.created_on, f.name as faculty_name " +
            "FROM interventions i " +
            "JOIN faculty f ON i.faculty_id = f.faculty_id " +
            "WHERE i.student_id = ? " +
            "ORDER BY i.created_on DESC",
            studentId
        );
        profile.put("interventions", DatabaseUtil.normalizeKeys(interventions));
        
        // Get feedback
        List<Map<String, Object>> feedbacks = jdbc.queryForList(
            "SELECT fb.feedback_id, fb.feedback_text, fb.sentiment, fb.created_on " +
            "FROM feedback fb " +
            "WHERE fb.student_id = ? " +
            "ORDER BY fb.created_on DESC",
            studentId
        );
        profile.put("feedbacks", DatabaseUtil.normalizeKeys(feedbacks));
        
        // Get risk flags
        List<Map<String, Object>> riskFlags = jdbc.queryForList(
            "SELECT flag_id, reason, avg_gpa, avg_attendance, flagged_on " +
            "FROM risk_flags " +
            "WHERE student_id = ? " +
            "ORDER BY flagged_on DESC",
            studentId
        );
        profile.put("risk_flags", DatabaseUtil.normalizeKeys(riskFlags));
        profile.put("is_at_risk", !riskFlags.isEmpty());
        
        // Calculate summary statistics
        Double avgGpa = jdbc.queryForObject(
            "SELECT ROUND(AVG(gpa), 2) FROM enrollments WHERE student_id = ?",
            Double.class,
            studentId
        );
        profile.put("avg_gpa", avgGpa != null ? avgGpa : 0.0);
        
        Double avgAttendance = jdbc.queryForObject(
            "SELECT ROUND(AVG(percentage), 2) FROM attendance WHERE student_id = ?",
            Double.class,
            studentId
        );
        profile.put("avg_attendance", avgAttendance != null ? avgAttendance : 0.0);

        // Apply overrides if present
        try {
            Map<String, Object> ov = jdbc.queryForMap("SELECT avg_gpa, avg_attendance FROM student_metrics_overrides WHERE student_id = ?", studentId);
            if (ov.get("AVG_GPA") != null) {
                profile.put("avg_gpa", ov.get("AVG_GPA"));
            }
            if (ov.get("AVG_ATTENDANCE") != null) {
                profile.put("avg_attendance", ov.get("AVG_ATTENDANCE"));
            }
        } catch (Exception ignored) {}
        
        return profile;
    }

    /**
     * Gets list of all departments.
     * 
     * @return List of unique departments
     */
    public List<String> getDepartments() {
        return jdbc.queryForList(
            "SELECT DISTINCT department FROM students ORDER BY department",
            String.class
        );
    }

    /**
     * Creates a new student record.
     * 
     * @param rollNumber Student roll number
     * @param name Student full name
     * @param email Student email
     * @param department Department name
     * @param semester Current semester (1-8)
     * @param contactNumber Contact number
     * @return Created student details with generated ID
     */
    public Map<String, Object> createStudent(String rollNumber, String name, String email,
                                             String department, Integer semester, String contactNumber) {
        try {
            Integer rollCount = jdbc.queryForObject("SELECT COUNT(*) FROM students WHERE LOWER(roll_number) = LOWER(?)", Integer.class, rollNumber);
            if (rollCount != null && rollCount > 0) {
                throw new IllegalStateException("Roll number already exists");
            }
            Integer emailCount = jdbc.queryForObject("SELECT COUNT(*) FROM students WHERE LOWER(email) = LOWER(?)", Integer.class, email);
            if (emailCount != null && emailCount > 0) {
                throw new IllegalStateException("Email already exists");
            }
        } catch (IllegalStateException ex) {
            throw ex;
        } catch (Exception ignored) {}

        // Insert new student using sequence for ID
        String sql = "INSERT INTO students (student_id, roll_number, name, email, department, semester, contact_number) " +
                     "VALUES (student_seq.NEXTVAL, ?, ?, ?, ?, ?, ?)";
        
    String normalizedContact = (contactNumber != null && contactNumber.trim().isEmpty()) ? null : contactNumber;

    jdbc.update(sql, rollNumber, name, email, department, semester, normalizedContact);
        
        // Get the generated student_id
        Integer studentId = jdbc.queryForObject("SELECT student_seq.CURRVAL FROM dual", Integer.class);
        
        // Auto-generate student credentials
        Map<String, Object> creds = createStudentCredentials(studentId, rollNumber, email);

        // Return the created student
        Map<String, Object> result = new HashMap<>();
        result.put("student_id", studentId);
        result.put("roll_number", rollNumber);
        result.put("name", name);
        result.put("email", email);
        result.put("department", department);
        result.put("semester", semester);
    result.put("contact_number", normalizedContact);
        if (creds != null) {
            result.putAll(creds);
        }
        
        return result;
    }

    public Map<String, Object> enrollStudentInCourse(int studentId, int courseId, Integer semester, Double gpa, String grade) {
        Integer existing = jdbc.queryForObject(
                "SELECT COUNT(*) FROM enrollments WHERE student_id = ? AND course_id = ?",
                Integer.class, studentId, courseId);
        if (existing != null && existing > 0) {
            throw new IllegalStateException("Student is already enrolled in this course");
        }

        Integer courseSemester = null;
        try {
            Map<String, Object> courseRow = jdbc.queryForMap("SELECT semester FROM courses WHERE course_id = ?", courseId);
            Object val = courseRow.get("SEMESTER");
            if (val instanceof Number) {
                courseSemester = ((Number) val).intValue();
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Course not found: " + courseId);
        }

        Integer targetSemester = semester != null ? semester : courseSemester;
        if (targetSemester == null) {
            targetSemester = 1;
        }

        Integer enrollmentId = jdbc.queryForObject("SELECT enrollment_seq.NEXTVAL FROM dual", Integer.class);
        if (enrollmentId == null) {
            throw new IllegalStateException("Unable to generate enrollment id");
        }

        jdbc.update(
                "INSERT INTO enrollments (enrollment_id, student_id, course_id, semester, gpa, grade) VALUES (?, ?, ?, ?, ?, ?)",
                enrollmentId,
                studentId,
                courseId,
                targetSemester,
                gpa,
                grade
        );

        Map<String, Object> result = new HashMap<>();
        result.put("enrollment_id", enrollmentId);
        result.put("student_id", studentId);
        result.put("course_id", courseId);
        result.put("semester", targetSemester);
        result.put("gpa", gpa);
        result.put("grade", grade);
        return result;
    }

    private Map<String, Object> createStudentCredentials(Integer studentId, String rollNumber, String email) {
        if (studentId == null) return null;
        try {
            String base = (email != null && email.contains("@")) ? email.substring(0, email.indexOf('@')) : ("s" + rollNumber);
            base = base != null ? base.toLowerCase().replaceAll("[^a-z0-9]", "") : ("s" + studentId);
            if (base == null || base.isBlank()) {
                base = "s" + studentId;
            }
            if (base.length() < 3) {
                base = ("s" + studentId);
            }

            String candidate = base;
            int attempt = 0;
            while (true) {
                Integer owner = null;
                try {
                    owner = jdbc.queryForObject("SELECT student_id FROM student_auth WHERE username = ?", Integer.class, candidate);
                } catch (Exception ignored) {}
                if (owner == null || owner == studentId) {
                    break;
                }
                attempt++;
                candidate = base + studentId + (attempt > 1 ? attempt : "");
            }

            boolean accountExists = false;
            try {
                Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM student_auth WHERE student_id = ?", Integer.class, studentId);
                accountExists = count != null && count > 0;
            } catch (Exception ignored) {}

            String password = generatePassword();
            String hash = passwordEncoder.encode(password);

            int updated = jdbc.update(
                    "UPDATE student_auth SET username = ?, password_hash = ?, last_plaintext_password = ?, last_reset_on = SYSTIMESTAMP WHERE student_id = ?",
                    candidate, hash, password, studentId
            );

            if (updated == 0) {
                jdbc.update(
                        "INSERT INTO student_auth (student_id, username, password_hash, last_plaintext_password, last_reset_on, created_on) VALUES (?,?,?,?, SYSTIMESTAMP, SYSTIMESTAMP)",
                        studentId, candidate, hash, password
                );
            }

            recordAccountEvent(
                    studentId,
                    candidate,
                    accountExists ? "PASSWORD_RESET" : "ACCOUNT_CREATED",
                    accountExists ? "Credentials regenerated via admin action" : "Initial account created"
            );

            Map<String, Object> map = new HashMap<>();
            map.put("student_username", candidate);
            map.put("student_password", password);
            return map;
        } catch (Exception e) {
            return null;
        }
    }

    private String generatePassword() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
        StringBuilder sb = new StringBuilder();
        java.util.Random r = new java.util.Random();
        for (int i = 0; i < 8; i++) sb.append(chars.charAt(r.nextInt(chars.length())));
        return sb.toString();
    }

    public List<Map<String, Object>> listStudentAccounts() {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT sa.student_id, sa.username, sa.last_plaintext_password, sa.last_reset_on, sa.created_on, sa.last_login, " +
                        "s.name, s.roll_number " +
                        "FROM student_auth sa " +
                        "JOIN students s ON sa.student_id = s.student_id " +
                        "ORDER BY NVL(sa.last_reset_on, sa.created_on) DESC"
        );
        List<Map<String, Object>> normalized = DatabaseUtil.normalizeKeys(rows);
        for (Map<String, Object> entry : normalized) {
            entry.put("account_type", "student");
        }
        return normalized;
    }

    public List<Map<String, Object>> listRecentAccountEvents(int limit) {
        int fetchLimit = Math.max(1, Math.min(limit, 200));
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT * FROM (SELECT event_id, student_id, username, event_type, description, created_on " +
                        "FROM account_events ORDER BY created_on DESC) WHERE ROWNUM <= ?",
                fetchLimit
        );
        return DatabaseUtil.normalizeKeys(rows);
    }

    public Map<String, Object> resetStudentPassword(String username, String newPassword, boolean autoGenerate) {
        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username is required");
        }
        String trimmedUsername = username.trim();
        String passwordToUse = newPassword != null && !newPassword.trim().isEmpty() ? newPassword.trim() : (autoGenerate ? generatePassword() : null);
        if (passwordToUse == null || passwordToUse.isEmpty()) {
            throw new IllegalArgumentException("New password is required");
        }

        Integer studentId;
        try {
            studentId = jdbc.queryForObject("SELECT student_id FROM student_auth WHERE username = ?", Integer.class, trimmedUsername);
        } catch (Exception e) {
            throw new IllegalStateException("Student account not found for username: " + trimmedUsername);
        }
        if (studentId == null) {
            throw new IllegalStateException("Student account not found for username: " + trimmedUsername);
        }

        String hash = passwordEncoder.encode(passwordToUse);
        int updated = jdbc.update(
                "UPDATE student_auth SET password_hash = ?, last_plaintext_password = ?, last_reset_on = SYSTIMESTAMP WHERE username = ?",
                hash, passwordToUse, trimmedUsername
        );
        if (updated == 0) {
            throw new IllegalStateException("Failed to update password for username: " + trimmedUsername);
        }
        recordAccountEvent(
                studentId,
                trimmedUsername,
                "PASSWORD_RESET",
                "Password reset by administrator"
        );
        Map<String, Object> result = new HashMap<>();
        result.put("student_id", studentId);
        result.put("username", trimmedUsername);
        result.put("password", passwordToUse);
        result.put("account_type", "student");
        return result;
    }

    public int upsertMetricsOverride(int studentId, Double avgGpa, Double avgAttendance) {
        // Try update, if 0 rows then insert
        int updated = jdbc.update("UPDATE student_metrics_overrides SET avg_gpa = ?, avg_attendance = ?, updated_on = SYSTIMESTAMP WHERE student_id = ?",
                avgGpa, avgAttendance, studentId);
        if (updated == 0) {
            try {
                return jdbc.update("INSERT INTO student_metrics_overrides (student_id, avg_gpa, avg_attendance, updated_on) VALUES (?,?,?, SYSTIMESTAMP)",
                        studentId, avgGpa, avgAttendance);
            } catch (Exception e) {
                return 0;
            }
        }
        return updated;
    }

    /**
     * Backfills student_auth credentials for students missing them.
     * Returns count and a list of generated credentials for admin visibility.
     */
    public Map<String, Object> backfillStudentAuth() {
        List<Map<String, Object>> created = new java.util.ArrayList<>();
        try {
            List<Map<String, Object>> rows = jdbc.queryForList(
                    "SELECT s.student_id, s.roll_number, s.email FROM students s " +
                    "LEFT JOIN student_auth sa ON sa.student_id = s.student_id " +
                    "WHERE sa.student_id IS NULL"
            );
            for (Map<String, Object> row : rows) {
                Integer sid = ((Number) row.get("STUDENT_ID")).intValue();
                String roll = row.get("ROLL_NUMBER") != null ? row.get("ROLL_NUMBER").toString() : null;
                String email = row.get("EMAIL") != null ? row.get("EMAIL").toString() : null;
                Map<String, Object> creds = createStudentCredentials(sid, roll, email);
                if (creds != null) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("student_id", sid);
                    item.put("username", creds.get("student_username"));
                    item.put("password", creds.get("student_password"));
                    created.add(item);
                }
            }
        } catch (Exception ignored) {}
        Map<String, Object> result = new HashMap<>();
        result.put("created", created.size());
        result.put("credentials", created);
        return result;
    }
}
