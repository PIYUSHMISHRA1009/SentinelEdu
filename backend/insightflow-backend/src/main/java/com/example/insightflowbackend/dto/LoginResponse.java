package com.example.insightflowbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Map;

/**
 * Response DTO for successful login.
 */
@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String role;
    private Map<String, Object> user;
}
