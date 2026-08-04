package com.example.insightflowbackend.dto;

import lombok.Data;

/**
 * Request DTO for running risk detection engine.
 */
@Data
public class RiskRequest {
    private Double gpaThreshold;
    private Integer attendanceThreshold;
}
