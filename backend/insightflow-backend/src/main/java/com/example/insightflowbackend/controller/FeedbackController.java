package com.example.insightflowbackend.controller;

import com.example.insightflowbackend.dto.ApiResponse;
import com.example.insightflowbackend.dto.FeedbackRequest;
import com.example.insightflowbackend.service.FeedbackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for feedback management and sentiment analysis.
 * Provides endpoints for submitting feedback and retrieving sentiment analysis.
 */
@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {
    
    private final FeedbackService feedbackService;
    private final com.example.insightflowbackend.service.AuthService authService;

    @Autowired
    public FeedbackController(FeedbackService feedbackService, com.example.insightflowbackend.service.AuthService authService) {
        this.feedbackService = feedbackService;
        this.authService = authService;
    }

    /**
     * Analyzes sentiment for a given text without saving to the database.
     * Useful for previewing analysis results on the frontend.
     *
     * @param payload Map containing a single key 'text'
     * @return Sentiment classification and confidence score
     */
    @PostMapping("/analyze")
    public ApiResponse<Map<String, Object>> analyze(@RequestBody Map<String, Object> payload) {
        try {
            String text = payload != null ? (String) payload.get("text") : null;
            if (text == null || text.trim().isEmpty()) {
                return ApiResponse.error("Text is required for analysis");
            }

            Map<String, Object> result = feedbackService.analyzeText(text);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error("Failed to analyze text: " + e.getMessage());
        }
    }

    /**
     * Submits new feedback with automatic sentiment analysis.
     * 
     * @param request Feedback details
     * @return Feedback ID and sentiment classification
     */
    @PostMapping
    public ApiResponse<Map<String, Object>> submitFeedback(@RequestBody FeedbackRequest request,
                                                           @RequestHeader(value = "X-User", required = false) String username) {
        try {
            // Validate required fields
            if (request.getStudentId() == null) {
                return ApiResponse.error("Student ID is required");
            }
            
            if (request.getFeedbackText() == null || request.getFeedbackText().trim().isEmpty()) {
                return ApiResponse.error("Feedback text is required");
            }
            
            // submittedBy is optional: if null, treat as student-submitted feedback
            // If caller is a student, ensure they can only submit for themselves (student-submitted feedback)
            if (username != null) {
                Integer sid = authService.getStudentIdByUsername(username);
                if (sid != null && sid.intValue() != request.getStudentId()) {
                    return ApiResponse.error("Forbidden: students can only submit their own feedback");
                }
                // For students, courseId must be provided and must be an enrolled course
                if (sid != null) {
                    if (request.getCourseId() == null) {
                        return ApiResponse.error("Course ID is required when submitting feedback as a student");
                    }
                    boolean enrolled = feedbackService.isStudentEnrolled(request.getStudentId(), request.getCourseId());
                    if (!enrolled) {
                        return ApiResponse.error("You can only submit feedback for your enrolled courses");
                    }
                }
            }

            Map<String, Object> result = feedbackService.createFeedback(
                request.getStudentId(),
                request.getCourseId(),
                request.getFeedbackText(),
                request.getSubmittedBy()
            );
            
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error("Failed to submit feedback: " + e.getMessage());
        }
    }

    /**
     * Retrieves feedback for a specific student.
     * 
     * @param studentId Student ID
     * @return List of feedback records
     */
    @GetMapping("/student/{studentId}")
    public ApiResponse<List<Map<String, Object>>> getFeedbackByStudent(@PathVariable int studentId,
                                                                       @RequestHeader(value = "X-User", required = false) String username) {
        try {
            // If caller is a student, restrict to own id
            if (username != null) {
                Integer sid = authService.getStudentIdByUsername(username);
                if (sid != null && sid.intValue() != studentId) {
                    return ApiResponse.error("Forbidden: cannot view other student's feedback");
                }
            }
            List<Map<String, Object>> feedback = feedbackService.getFeedbackByStudent(studentId);
            return ApiResponse.success(feedback);
        } catch (Exception e) {
            return ApiResponse.error("Failed to fetch feedback: " + e.getMessage());
        }
    }

    /**
     * Retrieves all feedback records.
     * 
     * @return List of all feedback
     */
    @GetMapping
    public ApiResponse<List<Map<String, Object>>> getAllFeedback(@RequestHeader(value = "X-User", required = false) String username) {
        try {
            // If caller is a student, return only their own feedback
            if (username != null) {
                Integer sid = authService.getStudentIdByUsername(username);
                if (sid != null) {
                    List<Map<String, Object>> feedback = feedbackService.getFeedbackByStudent(sid);
                    return ApiResponse.success(feedback);
                }
                String role = authService.getRole(username);
                List<Map<String, Object>> all = feedbackService.getAllFeedback();
                if (role != null) {
                    switch (role) {
                        case "faculty" -> {
                            return ApiResponse.success(feedbackService.anonymizeStudentIdentity(all));
                        }
                        case "academic_head", "it" -> {
                            return ApiResponse.success(all);
                        }
                        default -> {
                            return ApiResponse.success(all);
                        }
                    }
                }
            }
            List<Map<String, Object>> all = feedbackService.getAllFeedback();
            return ApiResponse.success(all);
        } catch (Exception e) {
            return ApiResponse.error("Failed to fetch feedback: " + e.getMessage());
        }
    }

    /**
     * Gets sentiment distribution statistics.
     * 
     * @return Sentiment counts by category
     */
    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> getSentimentStats() {
        try {
            Map<String, Object> stats = feedbackService.getSentimentStats();
            return ApiResponse.success(stats);
        } catch (Exception e) {
            return ApiResponse.error("Failed to fetch sentiment stats: " + e.getMessage());
        }
    }
}
