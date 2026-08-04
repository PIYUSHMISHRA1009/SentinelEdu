package com.example.insightflowbackend.controller;

import com.example.insightflowbackend.dto.ApiResponse;
import com.example.insightflowbackend.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for dashboard analytics.
 * Provides aggregated statistics and trend data.
 */
@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = {"http://localhost:5173","http://localhost:3000","http://localhost:3001"})
public class DashboardController {
    
    private final DashboardService dashboardService;

    @Autowired
    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    /**
     * Gets summary statistics for the main dashboard.
     * 
     * @return Key performance metrics
     */
    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> getDashboardStats(
            @RequestParam(required = false) Integer semester,
            @RequestParam(required = false) String department) {
        try {
            Map<String, Object> stats = dashboardService.getDashboardStats(semester, department);
            return ApiResponse.success(stats);
        } catch (Exception e) {
            return ApiResponse.error("Failed to fetch dashboard stats: " + e.getMessage());
        }
    }

    /**
     * Gets GPA trend data by semester.
     * 
     * @return GPA trends
     */
    @GetMapping("/gpa-trend")
    public ApiResponse<List<Map<String, Object>>> getGpaTrend(
            @RequestParam(required = false) String department) {
        try {
            List<Map<String, Object>> trend = dashboardService.getGpaTrend(department);
            return ApiResponse.success(trend);
        } catch (Exception e) {
            return ApiResponse.error("Failed to fetch GPA trend: " + e.getMessage());
        }
    }

    /**
     * Gets attendance trend data by month.
     * 
     * @return Attendance trends
     */
    @GetMapping("/attendance-trend")
    public ApiResponse<List<Map<String, Object>>> getAttendanceTrend(
            @RequestParam(required = false) String department) {
        try {
            List<Map<String, Object>> trend = dashboardService.getAttendanceTrend(department);
            return ApiResponse.success(trend);
        } catch (Exception e) {
            return ApiResponse.error("Failed to fetch attendance trend: " + e.getMessage());
        }
    }

    /**
     * Gets risk summary with categorization.
     * 
     * @return Risk summary data
     */
    @GetMapping("/risk-summary")
    public ApiResponse<Map<String, Object>> getRiskSummary(
            @RequestParam(required = false) String department) {
        try {
            Map<String, Object> summary = dashboardService.getRiskSummary(department);
            return ApiResponse.success(summary);
        } catch (Exception e) {
            return ApiResponse.error("Failed to fetch risk summary: " + e.getMessage());
        }
    }

    /**
     * Gets department-wise statistics.
     * 
     * @return Stats per department
     */
    @GetMapping("/department-stats")
    public ApiResponse<List<Map<String, Object>>> getDepartmentStats() {
        try {
            List<Map<String, Object>> stats = dashboardService.getDepartmentStats();
            return ApiResponse.success(stats);
        } catch (Exception e) {
            return ApiResponse.error("Failed to fetch department stats: " + e.getMessage());
        }
    }

    /**
     * Gets course-wise performance metrics.
     * 
     * @return Performance data per course
     */
    @GetMapping("/course-performance")
    public ApiResponse<List<Map<String, Object>>> getCoursePerformance() {
        try {
            List<Map<String, Object>> performance = dashboardService.getCoursePerformance();
            return ApiResponse.success(performance);
        } catch (Exception e) {
            return ApiResponse.error("Failed to fetch course performance: " + e.getMessage());
        }
    }
}
