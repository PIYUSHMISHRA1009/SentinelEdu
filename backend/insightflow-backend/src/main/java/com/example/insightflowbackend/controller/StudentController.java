package com.example.insightflowbackend.controller;

import com.example.insightflowbackend.dto.ApiResponse;
import com.example.insightflowbackend.dto.StudentRequest;
import com.example.insightflowbackend.dto.EnrollmentRequest;
import com.example.insightflowbackend.service.StudentService;
import com.example.insightflowbackend.service.RiskService;
import com.example.insightflowbackend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * REST controller for student management.
 * Provides endpoints for listing students, viewing detailed profiles, and creating new students.
 */
@RestController
@RequestMapping("/api/students")
public class StudentController {
    
    private final StudentService studentService;
    private final AuthService authService;
    private final RiskService riskService;
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final Pattern CONTACT_PATTERN = Pattern.compile("^\\+?[0-9]{7,15}$");
    private static final Pattern ROLL_PATTERN = Pattern.compile("^[A-Za-z0-9_-]{3,20}$");

    @Autowired
    public StudentController(StudentService studentService, AuthService authService, RiskService riskService) {
        this.studentService = studentService;
        this.authService = authService;
        this.riskService = riskService;
    }

    /**
     * Retrieves a paginated, searchable list of students.
     * 
     * @param search Optional search term
     * @param semester Optional semester filter (1-8)
     * @param department Optional department filter
     * @param page Page number (default 0)
     * @param size Page size (default 10)
     * @return Paginated list of students
     */
    @GetMapping
    public ApiResponse<Map<String, Object>> getStudents(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer semester,
            @RequestParam(required = false) String department,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestHeader(value = "X-User", required = false) String username) {
        try {
            // Students are not allowed to list all students
            if (username != null) {
                boolean isStaff = authService.hasRole(username, "it") || authService.hasRole(username, "academic_head") || authService.hasRole(username, "faculty");
                if (!isStaff) {
                    Integer sid = authService.getStudentIdByUsername(username);
                    if (sid != null) {
                        return ApiResponse.error("Forbidden: students cannot list all students");
                    }
                }
            }
            Map<String, Object> result = studentService.getStudents(
                search, semester, department, page, size
            );
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error("Failed to fetch students: " + e.getMessage());
        }
    }

    /**
     * Retrieves complete profile for a specific student.
     * Includes student info, enrollments, attendance, interventions, and feedback.
     * 
     * @param id Student ID
     * @return Complete student profile
     */
    @GetMapping("/{id}")
    public ApiResponse<Map<String, Object>> getStudentProfile(@PathVariable int id,
                                                              @RequestHeader(value = "X-User", required = false) String username) {
        try {
            // If caller is a student, restrict to their own profile
            if (username != null) {
                boolean isStaff = authService.hasRole(username, "it") || authService.hasRole(username, "academic_head") || authService.hasRole(username, "faculty");
                if (!isStaff) {
                    Integer myId = authService.getStudentIdByUsername(username);
                    if (myId == null || myId != id) {
                        return ApiResponse.error("Forbidden: cannot access other student's profile");
                    }
                }
            }
            Map<String, Object> profile = studentService.getStudentProfile(id);
            return ApiResponse.success(profile);
        } catch (Exception e) {
            return ApiResponse.error("Failed to fetch student profile: " + e.getMessage());
        }
    }

    /**
     * Gets list of all departments for filtering.
     * 
     * @return List of department names
     */
    @GetMapping("/departments")
    public ApiResponse<List<String>> getDepartments() {
        try {
            List<String> departments = studentService.getDepartments();
            return ApiResponse.success(departments);
        } catch (Exception e) {
            return ApiResponse.error("Failed to fetch departments: " + e.getMessage());
        }
    }

    /**
     * Creates a new student record.
     * 
     * @param request Student details
     * @return Created student with generated ID
     */
    @PostMapping
    public ApiResponse<Map<String, Object>> createStudent(@RequestBody StudentRequest request,
                                                          @RequestHeader(value = "X-User", required = false) String username) {
        try {
            if (username == null || !authService.hasRole(username, "it")) {
                return ApiResponse.error("Forbidden: IT role required");
            }
            // Validate required fields
            if (request.getRollNumber() == null || request.getRollNumber().trim().isEmpty()) {
                return ApiResponse.error("Roll number is required");
            }
            if (!ROLL_PATTERN.matcher(request.getRollNumber().trim()).matches()) {
                return ApiResponse.error("Roll number must be 3-20 characters (letters, numbers, _ or -)");
            }
            if (request.getName() == null || request.getName().trim().isEmpty()) {
                return ApiResponse.error("Name is required");
            }
            if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
                return ApiResponse.error("Email is required");
            }
            if (!EMAIL_PATTERN.matcher(request.getEmail().trim()).matches()) {
                return ApiResponse.error("Invalid email format");
            }
            if (request.getDepartment() == null || request.getDepartment().trim().isEmpty()) {
                return ApiResponse.error("Department is required");
            }
            if (request.getSemester() == null) {
                return ApiResponse.error("Semester is required");
            }
            if (request.getContactNumber() != null && !request.getContactNumber().trim().isEmpty()) {
                if (!CONTACT_PATTERN.matcher(request.getContactNumber().trim()).matches()) {
                    return ApiResponse.error("Contact number must contain 7-15 digits and optional leading +");
                }
            }

            String roll = request.getRollNumber().trim();
            String name = request.getName().trim();
            String email = request.getEmail().trim();
            String department = request.getDepartment().trim();
            Integer semester = request.getSemester();
            String contact = request.getContactNumber() != null ? request.getContactNumber().trim() : null;

            Map<String, Object> result = studentService.createStudent(
                roll,
                name,
                email,
                department,
                semester,
                contact
            );
            
            return ApiResponse.success(result);
        } catch (IllegalStateException ise) {
            return ApiResponse.error(ise.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("Failed to create student: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/enrollments")
    public ApiResponse<Map<String, Object>> addEnrollment(@PathVariable int id,
                                                          @RequestBody EnrollmentRequest request,
                                                          @RequestHeader(value = "X-User", required = false) String username) {
        try {
            if (username == null || !(authService.hasRole(username, "it") || authService.hasRole(username, "academic_head") || authService.hasRole(username, "faculty"))) {
                return ApiResponse.error("Forbidden: insufficient role");
            }
            if (request.getCourseId() == null) {
                return ApiResponse.error("Course ID is required");
            }

            Map<String, Object> enrollment = studentService.enrollStudentInCourse(
                    id,
                    request.getCourseId(),
                    request.getSemester(),
                    request.getGpa(),
                    request.getGrade()
            );
            try {
                riskService.runRiskEngineWithDefaults();
            } catch (Exception ignored) {}
            return ApiResponse.success(enrollment);
        } catch (IllegalStateException e) {
            return ApiResponse.error(e.getMessage());
        } catch (Exception e) {
            return ApiResponse.error("Failed to enroll student: " + e.getMessage());
        }
    }

    /**
     * Updates metrics overrides (avg_gpa, avg_attendance) for a student.
     * Accepts any of the fields; nulls mean no change.
     * Allowed roles: it, academic_head, faculty
     */
    @PutMapping("/{id}/metrics")
    public ApiResponse<Map<String, Object>> updateMetrics(@PathVariable int id,
                                                          @RequestBody Map<String, Object> payload,
                                                          @RequestHeader(value = "X-User", required = false) String username) {
        try {
            if (username == null || !(authService.hasRole(username, "it") || authService.hasRole(username, "academic_head") || authService.hasRole(username, "faculty"))) {
                return ApiResponse.error("Forbidden: insufficient role");
            }
            Double avgGpa = null;
            Double avgAttendance = null;
            if (payload != null) {
                Object g = payload.get("avg_gpa");
                Object a = payload.get("avg_attendance");
                if (g instanceof Number) avgGpa = ((Number) g).doubleValue();
                if (a instanceof Number) avgAttendance = ((Number) a).doubleValue();
            }
            studentService.upsertMetricsOverride(id, avgGpa, avgAttendance);
            // Auto-run risk recalculation with defaults after metric updates
            try {
                riskService.runRiskEngineWithDefaults();
            } catch (Exception ignored) {}
            Map<String, Object> result = new java.util.HashMap<>();
            result.put("student_id", id);
            result.put("avg_gpa", avgGpa);
            result.put("avg_attendance", avgAttendance);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error("Failed to update metrics: " + e.getMessage());
        }
    }
}
