package com.example.insightflowbackend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Data;

/**
 * Request DTO for creating a new intervention.
 */
@Data
public class InterventionRequest {
    @JsonAlias("student_id")
    private Integer studentId;
    @JsonAlias("faculty_id")
    private Integer facultyId;
    @JsonAlias("intervention_type")
    private String interventionType;
    private String notes;
}
