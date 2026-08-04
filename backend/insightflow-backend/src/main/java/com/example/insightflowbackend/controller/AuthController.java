package com.example.insightflowbackend.controller;

import com.example.insightflowbackend.dto.ApiResponse;
import com.example.insightflowbackend.dto.LoginRequest;
import com.example.insightflowbackend.dto.LoginResponse;
import com.example.insightflowbackend.dto.ChangePasswordRequest;
import com.example.insightflowbackend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST controller for authentication and authorization.
 * Handles user login and token validation.
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://localhost:3001"})
public class AuthController {
    
    private final AuthService authService;

    @Autowired
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Authenticates a user and returns a token.
     * 
     * @param request Login credentials
     * @return Authentication token and user info
     */
    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@RequestBody LoginRequest request) {
        try {
            // Validate input
            if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
                return ApiResponse.error("Username is required");
            }
            
            if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
                return ApiResponse.error("Password is required");
            }
            
            // Authenticate user
            Map<String, Object> authResult = authService.authenticate(
                request.getUsername(), 
                request.getPassword()
            );
            
            if (authResult != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> userMap = (Map<String, Object>) authResult.get("user");
                
                LoginResponse response = new LoginResponse(
                    (String) authResult.get("token"),
                    (String) authResult.get("role"),
                    userMap
                );
                
                return ApiResponse.success(response);
            } else {
                return ApiResponse.error("Invalid username or password");
            }
        } catch (Exception e) {
            return ApiResponse.error("Authentication failed: " + e.getMessage());
        }
    }

    /**
     * Validates an authentication token.
     * 
     * @param token Token from Authorization header
     * @return User info if token is valid
     */
    @GetMapping("/validate")
    public ApiResponse<Map<String, Object>> validateToken(
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null) {
                return ApiResponse.error("No token provided");
            }
            
            Map<String, Object> userInfo = authService.validateToken(token);
            
            if (userInfo != null) {
                return ApiResponse.success(userInfo);
            } else {
                return ApiResponse.error("Invalid token");
            }
        } catch (Exception e) {
            return ApiResponse.error("Token validation failed: " + e.getMessage());
        }
    }

    /**
     * Logs out a user (mock implementation).
     * In production, would invalidate the token.
     * 
     * @return Success message
     */
    @PostMapping("/logout")
    public ApiResponse<String> logout() {
        return ApiResponse.success("Logged out successfully");
    }

    /**
     * Allows a user to change their password by providing current and new password.
     */
    @PostMapping("/change-password")
    public ApiResponse<java.util.Map<String, Object>> changePassword(@RequestBody ChangePasswordRequest request) {
        try {
            if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
                return ApiResponse.error("Username is required");
            }
            if (request.getCurrentPassword() == null || request.getCurrentPassword().trim().isEmpty()) {
                return ApiResponse.error("Current password is required");
            }
            if (request.getNewPassword() == null || request.getNewPassword().trim().isEmpty()) {
                return ApiResponse.error("New password is required");
            }

            java.util.Map<String, Object> result = authService.changePassword(
                request.getUsername(), request.getCurrentPassword(), request.getNewPassword()
            );
            if (((Integer) result.getOrDefault("updated", 0)) > 0) {
                return ApiResponse.success(result);
            }
            return ApiResponse.error("Invalid current password or user not found");
        } catch (Exception e) {
            return ApiResponse.error("Failed to change password: " + e.getMessage());
        }
    }
}
