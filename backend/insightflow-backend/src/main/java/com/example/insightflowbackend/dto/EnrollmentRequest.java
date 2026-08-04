package com.example.insightflowbackend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Request payload for enrolling a student in a course.
 */
@Data
public class EnrollmentRequest {
    @JsonProperty("courseId")
    @JsonAlias({"course_id"})
    private Integer courseId;

    @JsonProperty("semester")
    private Integer semester;

    @JsonProperty("gpa")
    private Double gpa;

    @JsonProperty("grade")
    private String grade;
}
