package com.example.insightflowbackend.controller;

import com.example.insightflowbackend.dto.ApiResponse;
import com.example.insightflowbackend.dto.RiskRequest;
import com.example.insightflowbackend.service.RiskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST controller for risk detection and management.
 * Provides endpoints for running risk analysis and viewing flagged students.
 */
@RestController
@RequestMapping("/api/risk")
public class RiskController {
    
    private final RiskService riskService;

    @Autowired
    public RiskController(RiskService riskService) {
        this.riskService = riskService;
    }

    /**
     * Manually flags a student as at-risk.
     */
    @PostMapping("/flag")
    public ApiResponse<java.util.Map<String, Object>> manualFlag(
            @RequestParam("studentId") int studentId,
            @RequestParam(value = "reason", required = false) String reason) {
        try {
            String finalReason = (reason == null || reason.trim().isEmpty()) ? "Manually flagged" : reason.trim();
            int flagId = riskService.manualFlagStudent(studentId, finalReason);
            java.util.Map<String, Object> data = new java.util.HashMap<>();
            data.put("flag_id", flagId);
            data.put("message", "Student flagged successfully");
            return ApiResponse.success(data);
        } catch (Exception e) {
            return ApiResponse.error("Failed to flag student: " + e.getMessage());
        }
    }

    @DeleteMapping("/flags/{flagId}")
    public ApiResponse<java.util.Map<String, Object>> removeFlag(@PathVariable("flagId") int flagId) {
        try {
            boolean removed = riskService.removeRiskFlag(flagId);
            if (!removed) {
                return ApiResponse.error("Flag not found");
            }
            java.util.Map<String, Object> data = new java.util.HashMap<>();
            data.put("flag_id", flagId);
            data.put("message", "Risk flag removed");
            return ApiResponse.success(data);
        } catch (Exception e) {
            return ApiResponse.error("Failed to remove risk flag: " + e.getMessage());
        }
    }

    /**
     * Returns current risk rules configuration. Static for now.
     */
    @GetMapping("/rules")
    public ApiResponse<Map<String, Object>> getRiskRules() {
        return ApiResponse.success(riskService.getRules());
    }

    /**
     * Updates risk rules configuration (demo: in-memory).
     */
    @PostMapping("/rules")
    public ApiResponse<Map<String, Object>> setRiskRules(@RequestBody Map<String, Object> payload) {
        try {
            Double gpa = payload.get("gpaThreshold") instanceof Number ? ((Number) payload.get("gpaThreshold")).doubleValue() : null;
            Integer att = payload.get("attendanceThreshold") instanceof Number ? ((Number) payload.get("attendanceThreshold")).intValue() : null;
            Boolean auto = payload.getOrDefault("autoRunEnabled", null) instanceof Boolean ? (Boolean) payload.get("autoRunEnabled") : null;
            Boolean notify = payload.getOrDefault("notificationsEnabled", null) instanceof Boolean ? (Boolean) payload.get("notificationsEnabled") : null;
            Map<String, Object> updated = riskService.updateRules(gpa, att, auto, notify);
            return ApiResponse.success(updated);
        } catch (Exception e) {
            return ApiResponse.error("Failed to update risk rules: " + e.getMessage());
        }
    }

    /**
     * Executes the risk detection engine with specified thresholds.
     * 
     * @param request Risk detection parameters
     * @return Success message with count of flagged students
     */
    @PostMapping("/run")
    public ApiResponse<Map<String, Object>> runRiskDetection(@RequestBody RiskRequest request) {
        try {
            double gpaThreshold = request.getGpaThreshold() != null ? request.getGpaThreshold() : 2.5;
            int attThreshold = request.getAttendanceThreshold() != null ? request.getAttendanceThreshold() : 75;
            
            riskService.runRiskEngine(gpaThreshold, attThreshold);
            
            int flaggedCount = riskService.getFlaggedCount();
            
            Map<String, Object> result = new HashMap<>();
            result.put("message", "Risk detection completed successfully");
            result.put("flaggedCount", flaggedCount);
            result.put("gpaThreshold", gpaThreshold);
            result.put("attendanceThreshold", attThreshold);
            
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error("Failed to run risk detection: " + e.getMessage());
        }
    }

    /**
     * Retrieves all currently flagged students.
     * 
     * @return List of risk flags with student details
     */
    @GetMapping("/flags")
    public ApiResponse<List<Map<String, Object>>> getRiskFlags() {
        try {
            List<Map<String, Object>> flags = riskService.fetchRiskFlags();
            return ApiResponse.success(flags);
        } catch (Exception e) {
            return ApiResponse.error("Failed to fetch risk flags: " + e.getMessage());
        }
    }

    /**
     * Gets summary statistics for risk dashboard.
     * 
     * @return Count of flagged students
     */
    @GetMapping("/summary")
    public ApiResponse<Map<String, Object>> getRiskSummary() {
        try {
            Map<String, Object> summary = new HashMap<>();
            summary.put("flaggedCount", riskService.getFlaggedCount());
            return ApiResponse.success(summary);
        } catch (Exception e) {
            return ApiResponse.error("Failed to fetch risk summary: " + e.getMessage());
        }
    }

    /**
     * Simple Server-Sent Events stream that emits flagged count periodically.
     * Demo-only: sends updates every ~10s for up to 2 minutes.
     */
    @GetMapping(path = "/stream", produces = "text/event-stream")
    public SseEmitter streamRisk() {
    SseEmitter emitter = new SseEmitter(120_000L);
    final java.util.concurrent.ExecutorService executor = java.util.concurrent.Executors.newSingleThreadExecutor();
    executor.submit(() -> {
            try {
                int last = -1;
                for (int i = 0; i < 12; i++) {
                    int count = riskService.getFlaggedCount();
                    if (count != last) {
                        last = count;
                        emitter.send(SseEmitter.event().name("risk-summary").data(java.util.Map.of("flaggedCount", count)));
                    } else {
                        emitter.send(SseEmitter.event().name("heartbeat").data("ok"));
                    }
                    Thread.sleep(10_000);
                }
                emitter.complete();
            } catch (Exception ex) {
                emitter.completeWithError(ex);
            } finally {
                executor.shutdown();
            }
        });
        return emitter;
    }
}
