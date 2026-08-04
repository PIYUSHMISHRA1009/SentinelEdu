package com.example.insightflowbackend.dto;

import lombok.Data;

/**
 * Request DTO for submitting feedback.
 */
@Data
public class FeedbackRequest {
    private Integer studentId;
    private Integer courseId;
    private String feedbackText;
    private Integer submittedBy;
}
