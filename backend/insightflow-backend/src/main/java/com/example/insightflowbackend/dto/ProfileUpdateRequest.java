package com.example.insightflowbackend.dto;

import lombok.Data;

@Data
public class ProfileUpdateRequest {
    private String name;
    private String email; // IT-only
    private String contact_number;
    private String department; // IT-only
    private Integer semester; // IT-only (students)
}
