package com.example.insightflowbackend.dto;

import lombok.Data;

/**
 * Request DTO for user login.
 */
@Data
public class LoginRequest {
    private String username;
    private String password;
}
