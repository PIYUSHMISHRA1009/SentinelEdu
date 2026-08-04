package com.example.insightflowbackend.controller;

import com.example.insightflowbackend.dto.ApiResponse;
import com.example.insightflowbackend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = {"http://localhost:5173","http://localhost:3000","http://localhost:3001"})
public class ProfileController {
    private final JdbcTemplate jdbc;
    private final AuthService authService;

    @Autowired
    public ProfileController(JdbcTemplate jdbc, AuthService authService) {
        this.jdbc = jdbc;
        this.authService = authService;
    }

    @GetMapping
    public ApiResponse<java.util.Map<String, Object>> getProfile(@RequestHeader(value = "X-User", required = false) String username) {
        try {
            if (username == null) return ApiResponse.error("Unauthorized");
            // Try faculty
            try {
                Map<String, Object> row = jdbc.queryForMap("SELECT username, name, email, role, department, contact_number FROM faculty WHERE username = ?", username);
                java.util.Map<String, Object> data = new java.util.HashMap<>();
                data.put("username", row.get("USERNAME"));
                data.put("name", row.get("NAME"));
                data.put("email", row.get("EMAIL"));
                data.put("role", row.get("ROLE"));
                data.put("department", row.get("DEPARTMENT"));
                data.put("contact_number", row.get("CONTACT_NUMBER"));
                return ApiResponse.success(data);
            } catch (Exception ignored) {}
            // Try student
            Map<String, Object> row = jdbc.queryForMap("SELECT sa.username, s.student_id, s.name, s.email, s.department, s.semester, s.contact_number FROM student_auth sa JOIN students s ON s.student_id = sa.student_id WHERE sa.username = ?", username);
            java.util.Map<String, Object> data = new java.util.HashMap<>();
            data.put("username", row.get("USERNAME"));
            data.put("student_id", row.get("STUDENT_ID"));
            data.put("name", row.get("NAME"));
            data.put("email", row.get("EMAIL"));
            data.put("role", "student");
            data.put("department", row.get("DEPARTMENT"));
            data.put("semester", row.get("SEMESTER"));
            data.put("contact_number", row.get("CONTACT_NUMBER"));
            return ApiResponse.success(data);
        } catch (Exception e) {
            return ApiResponse.error("Failed to fetch profile: " + e.getMessage());
        }
    }

    @PutMapping
    public ApiResponse<java.util.Map<String, Object>> updateProfile(@RequestBody java.util.Map<String, Object> payload,
                                                                    @RequestHeader(value = "X-User", required = false) String username) {
        try {
            if (username == null) return ApiResponse.error("Unauthorized");
            boolean isIt = authService.hasRole(username, "it");
            // Faculty update: allow name, contact_number; email/department only if IT
            int updated = 0;
            try {
                String name = payload.get("name") instanceof String ? (String) payload.get("name") : null;
                String contact = payload.get("contact_number") instanceof String ? (String) payload.get("contact_number") : null;
                String email = payload.get("email") instanceof String ? (String) payload.get("email") : null;
                String department = payload.get("department") instanceof String ? (String) payload.get("department") : null;
                if (email != null && !isIt) email = null; // restrict
                if (department != null && !isIt) department = null; // restrict
                StringBuilder sql = new StringBuilder("UPDATE faculty SET ");
                java.util.List<Object> params = new java.util.ArrayList<>();
                if (name != null) { sql.append("name = ?, "); params.add(name); }
                if (contact != null) { sql.append("contact_number = ?, "); params.add(contact); }
                if (email != null) { sql.append("email = ?, "); params.add(email); }
                if (department != null) { sql.append("department = ?, "); params.add(department); }
                if (params.isEmpty()) throw new RuntimeException("No allowed fields to update");
                sql.setLength(sql.length()-2);
                sql.append(" WHERE username = ?");
                params.add(username);
                updated = jdbc.update(sql.toString(), params.toArray());
                if (updated > 0) return ApiResponse.success(java.util.Map.of("updated", updated));
            } catch (Exception ignored) {}
            // Student update: allow name, contact_number; email/department/semester only IT
            String name = payload.get("name") instanceof String ? (String) payload.get("name") : null;
            String contact = payload.get("contact_number") instanceof String ? (String) payload.get("contact_number") : null;
            String email = payload.get("email") instanceof String ? (String) payload.get("email") : null;
            String department = payload.get("department") instanceof String ? (String) payload.get("department") : null;
            Integer semester = payload.get("semester") instanceof Number ? ((Number) payload.get("semester")).intValue() : null;
            if (!isIt) { email = null; department = null; semester = null; }
            // find student_id
            Integer sid = jdbc.queryForObject("SELECT student_id FROM student_auth WHERE username = ?", Integer.class, username);
            if (sid == null) return ApiResponse.error("User not found");
            StringBuilder sql = new StringBuilder("UPDATE students SET ");
            java.util.List<Object> params = new java.util.ArrayList<>();
            if (name != null) { sql.append("name = ?, "); params.add(name); }
            if (contact != null) { sql.append("contact_number = ?, "); params.add(contact); }
            if (email != null) { sql.append("email = ?, "); params.add(email); }
            if (department != null) { sql.append("department = ?, "); params.add(department); }
            if (semester != null) { sql.append("semester = ?, "); params.add(semester); }
            if (params.isEmpty()) return ApiResponse.error("No allowed fields to update");
            sql.setLength(sql.length()-2);
            sql.append(" WHERE student_id = ?");
            params.add(sid);
            updated = jdbc.update(sql.toString(), params.toArray());
            return ApiResponse.success(java.util.Map.of("updated", updated));
        } catch (Exception e) {
            return ApiResponse.error("Failed to update profile: " + e.getMessage());
        }
    }
}
