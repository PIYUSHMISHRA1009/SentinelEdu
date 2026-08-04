package com.example.insightflowbackend.controller;

import com.example.insightflowbackend.dto.ApiResponse;
import com.example.insightflowbackend.dto.InterventionRequest;
import com.example.insightflowbackend.service.InterventionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST controller for intervention management.
 * Provides endpoints for creating and viewing student interventions.
 */
@RestController
@RequestMapping("/api/interventions")
public class InterventionController {
    
    private final InterventionService interventionService;
    private final com.example.insightflowbackend.service.AuthService authService;

    @Autowired
    public InterventionController(InterventionService interventionService,
                                  com.example.insightflowbackend.service.AuthService authService) {
        this.interventionService = interventionService;
        this.authService = authService;
    }

    /**
     * Retrieves interventions, optionally filtered by student.
     * 
     * @param studentId Optional student ID filter
     * @return List of intervention records
     */
    @GetMapping
    public ApiResponse<List<Map<String, Object>>> getInterventions(
            @RequestParam(required = false) Integer studentId,
            @RequestHeader(value = "X-User", required = false) String username) {
        try {
            // If caller is a student, force filter to their own studentId
            if (username != null) {
                boolean isStaff = authService.hasRole(username, "it") || authService.hasRole(username, "academic_head") || authService.hasRole(username, "faculty");
                if (!isStaff) {
                    Integer myId = authService.getStudentIdByUsername(username);
                    if (myId == null) return ApiResponse.error("Unauthorized");
                    studentId = myId;
                }
            }
            List<Map<String, Object>> interventions = interventionService.getInterventions(studentId);
            return ApiResponse.success(interventions);
        } catch (Exception e) {
            return ApiResponse.error("Failed to fetch interventions: " + e.getMessage());
        }
    }

    /**
     * Creates a new intervention record.
     * 
     * @param request Intervention details
     * @return Created intervention ID
     */
    @PostMapping
    public ApiResponse<Map<String, Object>> createIntervention(@RequestBody InterventionRequest request,
                                                               @RequestHeader(value = "X-User", required = false) String username) {
        try {
            // Only staff can create interventions
            if (username == null || !(authService.hasRole(username, "it") || authService.hasRole(username, "academic_head") || authService.hasRole(username, "faculty"))) {
                return ApiResponse.error("Forbidden: insufficient role to create intervention");
            }
            // Validate required fields
            if (request.getStudentId() == null || request.getFacultyId() == null) {
                return ApiResponse.error("Student ID and Faculty ID are required");
            }
            
            if (request.getInterventionType() == null || request.getInterventionType().trim().isEmpty()) {
                return ApiResponse.error("Intervention type is required");
            }
            
            int interventionId = interventionService.createIntervention(
                request.getStudentId(),
                request.getFacultyId(),
                request.getInterventionType(),
                request.getNotes()
            );
            
            Map<String, Object> result = new HashMap<>();
            result.put("intervention_id", interventionId);
            result.put("message", "Intervention created successfully");
            
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error("Failed to create intervention: " + e.getMessage());
        }
    }

    /**
     * Updates intervention status.
     * 
     * @param id Intervention ID
     * @param status New status
     * @return Success message
     */
    @PatchMapping("/{id}/status")
    public ApiResponse<Map<String, Object>> updateStatus(
            @PathVariable int id,
            @RequestParam String status) {
        try {
            int updated = interventionService.updateInterventionStatus(id, status);
            
            if (updated > 0) {
                Map<String, Object> result = new HashMap<>();
                result.put("message", "Status updated successfully");
                return ApiResponse.success(result);
            } else {
                return ApiResponse.error("Intervention not found");
            }
        } catch (Exception e) {
            return ApiResponse.error("Failed to update status: " + e.getMessage());
        }
    }

    /**
     * Gets intervention statistics for dashboard.
     * 
     * @return Intervention counts by status
     */
    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> getStats() {
        try {
            Map<String, Object> stats = interventionService.getInterventionStats();
            return ApiResponse.success(stats);
        } catch (Exception e) {
            return ApiResponse.error("Failed to fetch stats: " + e.getMessage());
        }
    }
}
