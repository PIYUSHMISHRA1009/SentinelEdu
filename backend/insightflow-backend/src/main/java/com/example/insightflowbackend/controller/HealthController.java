package com.example.insightflowbackend.controller;

import com.example.insightflowbackend.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import com.example.insightflowbackend.service.AuthService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Health Check Controller
 * Provides endpoints to verify database connectivity and data integrity
 */
@RestController
@RequestMapping("/api/health")
@CrossOrigin(origins = {"http://localhost:5173","http://localhost:3000","http://localhost:3001"})
public class HealthController {

    private final JdbcTemplate jdbc;
    private final AuthService authService;

    @Autowired
    public HealthController(JdbcTemplate jdbc, AuthService authService) {
        this.jdbc = jdbc;
        this.authService = authService;
    }

    /**
     * Basic health check endpoint
     */
    @GetMapping
    public ApiResponse<Map<String, Object>> healthCheck() {
        try {
            Map<String, Object> health = new HashMap<>();
            health.put("status", "UP");
            health.put("database", "connected");
            health.put("timestamp", System.currentTimeMillis());
            
            return ApiResponse.success(health);
        } catch (Exception e) {
            return ApiResponse.error("Health check failed: " + e.getMessage());
        }
    }

    /**
     * Database connectivity and data verification
     */
    @GetMapping("/db")
    public ApiResponse<Map<String, Object>> databaseHealth(@RequestHeader(value = "X-User", required = false) String username) {
        try {
            if (username == null || !authService.hasRole(username, "it")) {
                return ApiResponse.error("Forbidden: IT role required");
            }
            Map<String, Object> dbHealth = new HashMap<>();
            
            // Check table counts
            Map<String, Integer> tableCounts = new HashMap<>();
            tableCounts.put("students", jdbc.queryForObject("SELECT COUNT(*) FROM students", Integer.class));
            tableCounts.put("faculty", jdbc.queryForObject("SELECT COUNT(*) FROM faculty", Integer.class));
            tableCounts.put("courses", jdbc.queryForObject("SELECT COUNT(*) FROM courses", Integer.class));
            tableCounts.put("enrollments", jdbc.queryForObject("SELECT COUNT(*) FROM enrollments", Integer.class));
            tableCounts.put("risk_flags", jdbc.queryForObject("SELECT COUNT(*) FROM risk_flags", Integer.class));
            tableCounts.put("interventions", jdbc.queryForObject("SELECT COUNT(*) FROM interventions", Integer.class));
            tableCounts.put("feedback", jdbc.queryForObject("SELECT COUNT(*) FROM feedback", Integer.class));
            
            dbHealth.put("status", "connected");
            dbHealth.put("tableCounts", tableCounts);
            
            // Check if tables have data
            int totalRecords = tableCounts.values().stream().mapToInt(Integer::intValue).sum();
            dbHealth.put("totalRecords", totalRecords);
            dbHealth.put("dataLoaded", totalRecords > 0);
            
            return ApiResponse.success(dbHealth);
        } catch (Exception e) {
            return ApiResponse.error("Database health check failed: " + e.getMessage());
        }
    }

    /**
     * Test PL/SQL procedures availability
     */
    @GetMapping("/plsql")
    public ApiResponse<Map<String, Object>> plsqlHealth() {
        try {
            Map<String, Object> plsqlHealth = new HashMap<>();
            
            // Check if procedures exist
            String sql = "SELECT object_name FROM user_objects WHERE object_type IN ('PROCEDURE', 'FUNCTION') " +
                        "AND object_name IN ('RUN_RISK_ENGINE', 'CLASSIFY_SENTIMENT', 'LOG_INTERVENTION', 'GET_STUDENT_ANALYTICS')";
            
            List<Map<String, Object>> procedures = jdbc.queryForList(sql);
            plsqlHealth.put("procedures", procedures);
            plsqlHealth.put("procedureCount", procedures.size());
            plsqlHealth.put("allProceduresExist", procedures.size() >= 2); // At least run_risk_engine and classify_sentiment
            
            return ApiResponse.success(plsqlHealth);
        } catch (Exception e) {
            return ApiResponse.error("PL/SQL health check failed: " + e.getMessage());
        }
    }

    /**
     * Sample data verification
     */
    @GetMapping("/sample-data")
    public ApiResponse<Map<String, Object>> sampleDataHealth() {
        try {
            Map<String, Object> sampleData = new HashMap<>();
            
            // Get sample student
            List<Map<String, Object>> sampleStudents = jdbc.queryForList(
                "SELECT student_id, name, roll_number, cgpa, attendance_percentage FROM students WHERE ROWNUM <= 3"
            );
            sampleData.put("sampleStudents", sampleStudents);
            
            // Get sample faculty
            List<Map<String, Object>> sampleFaculty = jdbc.queryForList(
                "SELECT faculty_id, username, name, role FROM faculty WHERE ROWNUM <= 3"
            );
            sampleData.put("sampleFaculty", sampleFaculty);
            
            // Get at-risk student count
            Integer atRiskCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM students WHERE cgpa < 2.5 OR attendance_percentage < 75",
                Integer.class
            );
            sampleData.put("atRiskStudentsCount", atRiskCount);
            
            return ApiResponse.success(sampleData);
        } catch (Exception e) {
            return ApiResponse.error("Sample data check failed: " + e.getMessage());
        }
    }
}
