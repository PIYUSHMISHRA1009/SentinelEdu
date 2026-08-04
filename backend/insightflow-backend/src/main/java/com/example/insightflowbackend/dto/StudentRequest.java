package com.example.insightflowbackend.dto;

import lombok.Data;

/**
 * Request DTO for creating a new student.
 */
@Data
public class StudentRequest {
    private String rollNumber;
    private String name;
    private String email;
    private String department;
    private Integer semester;
    private String contactNumber;
}
