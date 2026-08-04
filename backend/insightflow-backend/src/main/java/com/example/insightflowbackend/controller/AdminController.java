package com.example.insightflowbackend.controller;

import com.example.insightflowbackend.dto.ApiResponse;
import com.example.insightflowbackend.dto.FacultyRequest;
import com.example.insightflowbackend.service.AdminService;
import com.example.insightflowbackend.service.AuthService;
import com.example.insightflowbackend.service.StudentService;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * REST controller for admin operations like adding faculty.
 */
@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = {"http://localhost:5173","http://localhost:3000","http://localhost:3001"})
public class AdminController {
    
    private final AdminService adminService;
    private final AuthService authService;
    private final StudentService studentService;

    @Autowired
    public AdminController(AdminService adminService, AuthService authService, StudentService studentService) {
        this.adminService = adminService;
        this.authService = authService;
        this.studentService = studentService;
    }

    /**
     * Creates a new faculty member.
     * 
     * @param request Faculty details
     * @return Created faculty with generated ID
     */
    @PostMapping("/faculty")
    public ApiResponse<Map<String, Object>> createFaculty(@RequestBody FacultyRequest request,
                                                         @RequestHeader(value = "X-User", required = false) String username) {
        try {
            // IT-only operation
            if (username == null || !authService.hasRole(username, "it")) {
                return ApiResponse.error("Forbidden: IT role required");
            }
            // Validate required fields
            if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
                return ApiResponse.error("Username is required");
            }
            if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
                return ApiResponse.error("Password is required");
            }
            if (request.getName() == null || request.getName().trim().isEmpty()) {
                return ApiResponse.error("Name is required");
            }
            if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
                return ApiResponse.error("Email is required");
            }
            if (request.getRole() == null || request.getRole().trim().isEmpty()) {
                return ApiResponse.error("Role is required");
            }

            Map<String, Object> result = adminService.createFaculty(
                request.getUsername(),
                request.getPassword(),
                request.getName(),
                request.getEmail(),
                request.getRole(),
                request.getDepartment()
            );
            
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error("Failed to create faculty: " + e.getMessage());
        }
    }

    /**
     * Lists all faculty members.
     *
     * @return Array of faculty objects
     */
    @GetMapping("/faculty")
    public ApiResponse<java.util.List<java.util.Map<String, Object>>> listFaculty() {
        try {
            java.util.List<java.util.Map<String, Object>> list = adminService.listFaculty();
            return ApiResponse.success(list);
        } catch (Exception e) {
            return ApiResponse.error("Failed to fetch faculty: " + e.getMessage());
        }
    }

    @GetMapping("/accounts")
    public ApiResponse<java.util.List<java.util.Map<String, Object>>> listAllAccounts(@RequestHeader(value = "X-User", required = false) String username) {
        try {
            if (username == null || !authService.hasRole(username, "it")) {
                return ApiResponse.error("Forbidden: IT role required");
            }
            return ApiResponse.success(adminService.listAllAccounts());
        } catch (Exception e) {
            return ApiResponse.error("Failed to fetch accounts: " + e.getMessage());
        }
    }

    @GetMapping("/accounts/events")
    public ApiResponse<java.util.List<java.util.Map<String, Object>>> listStudentAccountEvents(@RequestHeader(value = "X-User", required = false) String username,
                                                                                              @RequestParam(value = "limit", required = false) Integer limit) {
        try {
            if (username == null || !authService.hasRole(username, "it")) {
                return ApiResponse.error("Forbidden: IT role required");
            }
            int fetchLimit = limit != null ? limit : 50;
            return ApiResponse.success(studentService.listRecentAccountEvents(fetchLimit));
        } catch (Exception e) {
            return ApiResponse.error("Failed to fetch account events: " + e.getMessage());
        }
    }

    /**
     * Resets a user's password (admin/IT operation).
     * In production, enforce proper authorization and password hashing.
     */
    @PostMapping("/reset-password")
    public ApiResponse<java.util.Map<String, Object>> resetPassword(@RequestBody ResetPasswordRequest request,
                                                                    @RequestHeader(value = "X-User", required = false) String username) {
        try {
            if (username == null || !authService.hasRole(username, "it")) {
                return ApiResponse.error("Forbidden: IT role required");
            }
            if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
                return ApiResponse.error("Username is required");
            }
            java.util.Map<String, Object> result = adminService.resetPassword(request.getUsername(), request.getNew_password());
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error("Failed to reset password: " + e.getMessage());
        }
    }

    /**
     * Aggregated recent activity feed from key tables (non-sensitive).
     */
    @GetMapping("/activity")
    public ApiResponse<java.util.List<java.util.Map<String, Object>>> getRecentActivity() {
        try {
            java.util.List<java.util.Map<String, Object>> items = adminService.getRecentActivity();
            return ApiResponse.success(items);
        } catch (Exception e) {
            return ApiResponse.error("Failed to fetch activity: " + e.getMessage());
        }
    }

    /**
     * Minimal CSV import for students.
     * Accepts a file with headers: roll_number, first_name, last_name, department, email[, semester, contact_number]
     * IT-only.
     */
    @PostMapping(value = "/import/csv", consumes = {"multipart/form-data"})
    public ApiResponse<java.util.Map<String, Object>> importCsv(@RequestPart("file") MultipartFile file,
                                                                @RequestHeader(value = "X-User", required = false) String username) {
        try {
            if (username == null || !authService.hasRole(username, "it")) {
                return ApiResponse.error("Forbidden: IT role required");
            }
            if (file == null || file.isEmpty()) {
                return ApiResponse.error("No file uploaded");
            }
            java.util.List<java.util.Map<String, Object>> errors = new java.util.ArrayList<>();
            int inserted = 0;
            try (java.io.BufferedReader br = new java.io.BufferedReader(new java.io.InputStreamReader(file.getInputStream()))) {
                String header = br.readLine();
                if (header == null) return ApiResponse.error("Empty file");
                String line;
                int row = 1;
                while ((line = br.readLine()) != null) {
                    row++;
                    String[] cols = line.split(",");
                    try {
                        String roll = cols[0].trim();
                        String first = cols.length > 1 ? cols[1].trim() : "";
                        String last = cols.length > 2 ? cols[2].trim() : "";
                        String dept = cols.length > 3 ? cols[3].trim() : "";
                        String email = cols.length > 4 ? cols[4].trim() : "";
                        Integer semester = cols.length > 5 && !cols[5].trim().isEmpty() ? Integer.parseInt(cols[5].trim()) : 1;
                        String contact = cols.length > 6 ? cols[6].trim() : null;
                        if (roll.isEmpty() || dept.isEmpty() || email.isEmpty()) throw new IllegalArgumentException("Missing required fields");
                        String name = (first + " " + last).trim();
                        if (name.isEmpty()) name = email;
                        studentService.createStudent(roll, name, email, dept, semester, contact);
                        inserted++;
                    } catch (Exception ex) {
                        errors.add(java.util.Map.of("row", row, "message", ex.getMessage()));
                    }
                }
            }
            java.util.Map<String, Object> result = new java.util.HashMap<>();
            result.put("inserted", inserted);
            result.put("errors", errors);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error("Failed to import CSV: " + e.getMessage());
        }
    }

    /**
     * Backfills student login credentials for existing students missing accounts.
     * IT-only operation. Returns count and generated credentials for review/export.
     */
    @PostMapping("/students/backfill-auth")
    public ApiResponse<java.util.Map<String, Object>> backfillStudentAuth(@RequestHeader(value = "X-User", required = false) String username) {
        try {
            if (username == null || !authService.hasRole(username, "it")) {
                return ApiResponse.error("Forbidden: IT role required");
            }
            java.util.Map<String, Object> result = studentService.backfillStudentAuth();
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error("Failed to backfill student credentials: " + e.getMessage());
        }
    }
}

@Data
class ResetPasswordRequest {
    private String username;
    private String new_password;
}
