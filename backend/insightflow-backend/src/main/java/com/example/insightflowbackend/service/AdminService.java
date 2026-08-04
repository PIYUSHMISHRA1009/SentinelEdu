package com.example.insightflowbackend.service;

import com.example.insightflowbackend.util.DatabaseUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for admin operations like creating faculty.
 */
@Service
public class AdminService {
    
    private final JdbcTemplate jdbc;
    private final StudentService studentService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Autowired
    public AdminService(JdbcTemplate jdbc, StudentService studentService) {
        this.jdbc = jdbc;
        this.studentService = studentService;
        ensureFacultyPasswordStorage();
    }

    private void ensureFacultyPasswordStorage() {
        try { jdbc.execute("ALTER TABLE faculty ADD (password_hash VARCHAR2(200))"); } catch (Exception ignored) {}
        try { jdbc.execute("ALTER TABLE faculty ADD (last_plaintext_password VARCHAR2(100))"); } catch (Exception ignored) {}
        try { jdbc.execute("ALTER TABLE faculty ADD (last_reset_on TIMESTAMP)"); } catch (Exception ignored) {}
        try { jdbc.execute("ALTER TABLE faculty ADD (created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"); } catch (Exception ignored) {}
        try { jdbc.execute("ALTER TABLE faculty ADD (last_login TIMESTAMP)"); } catch (Exception ignored) {}
    }

    /**
     * Creates a new faculty member.
     * 
     * @param username Faculty username for login
     * @param password Faculty password (stored as plain text for demo)
     * @param name Faculty full name
     * @param email Faculty email
     * @param role Role (faculty, academic_head, it)
     * @param department Department name
     * @return Created faculty details with generated ID
     */
    public Map<String, Object> createFaculty(String username, String password, String name,
                                              String email, String role, String department) {
        // Insert new faculty using sequence for ID
    String sql = "INSERT INTO faculty (faculty_id, username, password_hash, last_plaintext_password, last_reset_on, name, email, role, department) " +
             "VALUES (faculty_seq.NEXTVAL, ?, ?, ?, SYSTIMESTAMP, ?, ?, ?, ?)";
        String hash = passwordEncoder.encode(password);
    jdbc.update(sql, username, hash, password, name, email, role, department);
        
        // Get the generated faculty_id
        Integer facultyId = jdbc.queryForObject("SELECT faculty_seq.CURRVAL FROM dual", Integer.class);
        
        // Return the created faculty (without password)
        Map<String, Object> result = new HashMap<>();
        result.put("faculty_id", facultyId);
        result.put("username", username);
        result.put("name", name);
        result.put("email", email);
        result.put("role", role);
        result.put("department", department);
        result.put("password", password);
        
        return result;
    }

    /**
     * Retrieves all faculty members.
     *
     * @return List of faculty records
     */
    public java.util.List<java.util.Map<String, Object>> listFaculty() {
        String sql = "SELECT faculty_id, username, name, email, role, department FROM faculty ORDER BY name";
        java.util.List<java.util.Map<String, Object>> rows = jdbc.queryForList(sql);
        return DatabaseUtil.normalizeKeys(rows);
    }

    public List<Map<String, Object>> listFacultyAccounts() {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT faculty_id, username, name, email, role, department, last_plaintext_password, last_reset_on, created_on, last_login " +
                        "FROM faculty ORDER BY NVL(last_reset_on, created_on) DESC"
        );
        List<Map<String, Object>> normalized = DatabaseUtil.normalizeKeys(rows);
        for (Map<String, Object> entry : normalized) {
            entry.put("account_type", "staff");
        }
        return normalized;
    }

    public List<Map<String, Object>> listAllAccounts() {
        List<Map<String, Object>> accounts = new ArrayList<>();
        accounts.addAll(studentService.listStudentAccounts());
        accounts.addAll(listFacultyAccounts());
        return accounts.stream()
                .sorted((a, b) -> {
                    Object aTime = a.get("last_reset_on");
                    Object bTime = b.get("last_reset_on");
                    java.time.Instant aInstant = parseInstant(aTime, a.get("created_on"));
                    java.time.Instant bInstant = parseInstant(bTime, b.get("created_on"));
                    return bInstant.compareTo(aInstant);
                })
                .collect(Collectors.toList());
    }

    private java.time.Instant parseInstant(Object primary, Object fallback) {
        if (primary instanceof java.sql.Timestamp) {
            return ((java.sql.Timestamp) primary).toInstant();
        }
        if (primary instanceof java.util.Date) {
            return ((java.util.Date) primary).toInstant();
        }
        if (primary instanceof String) {
            try { return java.time.Instant.parse((String) primary); } catch (Exception ignored) {}
        }
        if (fallback instanceof java.sql.Timestamp) {
            return ((java.sql.Timestamp) fallback).toInstant();
        }
        if (fallback instanceof java.util.Date) {
            return ((java.util.Date) fallback).toInstant();
        }
        if (fallback instanceof String) {
            try { return java.time.Instant.parse((String) fallback); } catch (Exception ignored) {}
        }
        return java.time.Instant.EPOCH;
    }

    /**
     * Returns a simple recent activity feed from multiple tables.
     * This avoids sensitive data and passwords.
     */
    public java.util.List<java.util.Map<String, Object>> getRecentActivity() {
        String sql =
            "SELECT 'intervention' as type, intervention_id as id, created_on as ts, notes as summary FROM interventions ORDER BY created_on DESC FETCH FIRST 5 ROWS ONLY " +
            "UNION ALL " +
            "SELECT 'feedback' as type, feedback_id as id, created_on as ts, SUBSTR(feedback_text,1,120) as summary FROM feedback ORDER BY created_on DESC FETCH FIRST 5 ROWS ONLY " +
            "UNION ALL " +
            "SELECT 'course' as type, course_id as id, TO_TIMESTAMP('1970-01-01','YYYY-MM-DD') as ts, course_name as summary FROM courses WHERE course_id IN (SELECT MAX(course_id) FROM courses) " +
            "UNION ALL " +
            "SELECT 'faculty' as type, faculty_id as id, created_on as ts, name as summary FROM faculty ORDER BY created_on DESC FETCH FIRST 3 ROWS ONLY";

        java.util.List<java.util.Map<String, Object>> rows = jdbc.queryForList(sql);
        return DatabaseUtil.normalizeKeys(rows);
    }

    /**
     * Resets a faculty member's password.
     * Demo implementation stores plaintext; in production, hash with BCrypt.
     *
     * @param username Username whose password to reset
     * @param newPassword New password value
     * @return Map with status and affected user info
     */
    public Map<String, Object> resetPassword(String username, String newPassword) {
        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username is required");
        }
        String trimmedUsername = username.trim();
        String passwordToUse = newPassword != null && !newPassword.trim().isEmpty() ? newPassword.trim() : generatePassword();
        String hash = passwordEncoder.encode(passwordToUse);

        int updated = jdbc.update(
                "UPDATE faculty SET password_hash = ?, password = NULL, last_plaintext_password = ?, last_reset_on = SYSTIMESTAMP WHERE username = ?",
                hash, passwordToUse, trimmedUsername
        );
        if (updated > 0) {
            Map<String, Object> result = new HashMap<>();
            result.put("updated", updated);
            result.put("username", trimmedUsername);
            result.put("password", passwordToUse);
            result.put("account_type", "staff");
            return result;
        }
        // Try student account
        Map<String, Object> studentResult = studentService.resetStudentPassword(trimmedUsername, newPassword, newPassword == null || newPassword.trim().isEmpty());
        studentResult.put("updated", 1);
        return studentResult;
    }

    private String generatePassword() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
        StringBuilder sb = new StringBuilder();
        java.util.Random random = new java.util.Random();
        for (int i = 0; i < 8; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
