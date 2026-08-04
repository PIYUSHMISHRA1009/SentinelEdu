package com.example.insightflowbackend.controller;

import com.example.insightflowbackend.dto.ApiResponse;
import com.example.insightflowbackend.dto.CourseRequest;
import com.example.insightflowbackend.service.CourseService;
import com.example.insightflowbackend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST controller for course management.
 * Provides endpoints for listing courses.
 */
@RestController
@RequestMapping("/api/courses")
@CrossOrigin(origins = {"http://localhost:5173","http://localhost:3000","http://localhost:3001"})
public class CourseController {
    
    private final CourseService courseService;
    private final AuthService authService;

    @Autowired
    public CourseController(CourseService courseService, AuthService authService) {
        this.courseService = courseService;
        this.authService = authService;
    }

    /**
     * Retrieves all courses.
     * 
     * @return List of all courses
     */
    @GetMapping
    public ApiResponse<List<Map<String, Object>>> getAllCourses() {
        try {
            List<Map<String, Object>> courses = courseService.getAllCourses();
            return ApiResponse.success(courses);
        } catch (Exception e) {
            return ApiResponse.error("Failed to fetch courses: " + e.getMessage());
        }
    }

    /**
     * Creates a new course.
     *
     * @param request Course details
     * @return Created course info
     */
    @PostMapping
    public ApiResponse<Map<String, Object>> createCourse(@RequestBody CourseRequest request,
                                                         @RequestHeader(value = "X-User", required = false) String username) {
        try {
            if (username == null || !authService.hasRole(username, "it")) {
                return ApiResponse.error("Forbidden: IT role required");
            }
            // Basic validation
            if (request.getCourseCode() == null || request.getCourseCode().trim().isEmpty()) {
                return ApiResponse.error("Course code is required");
            }
            if (request.getCourseName() == null || request.getCourseName().trim().isEmpty()) {
                return ApiResponse.error("Course name is required");
            }
            if (request.getDepartment() == null || request.getDepartment().trim().isEmpty()) {
                return ApiResponse.error("Department is required");
            }
            if (request.getCredits() == null || request.getCredits() <= 0) {
                return ApiResponse.error("Credits must be greater than 0");
            }

            Map<String, Object> created = courseService.createCourse(
                request.getCourseCode().trim(),
                request.getCourseName().trim(),
                request.getDepartment().trim(),
                request.getCredits(),
                request.getSemester()
            );

            Map<String, Object> result = new HashMap<>();
            result.putAll(created);
            result.put("message", "Course created successfully");
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error("Failed to create course: " + e.getMessage());
        }
    }
}
