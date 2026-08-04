package com.example.insightflowbackend.dto;

import lombok.Data;

/**
 * Request DTO for creating a new faculty member.
 */
@Data
public class FacultyRequest {
    private String username;
    private String password;
    private String name;
    private String email;
    private String role; // 'faculty', 'academic_head', 'it'
    private String department;
}
