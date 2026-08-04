package com.example.insightflowbackend.dto;

import lombok.Data;

/**
 * Request DTO for creating or updating a course.
 */
@Data
public class CourseRequest {
    private String courseCode;
    private String courseName;
    private String department;
    private Integer credits;
    private Integer semester; // optional (1-8)
}
