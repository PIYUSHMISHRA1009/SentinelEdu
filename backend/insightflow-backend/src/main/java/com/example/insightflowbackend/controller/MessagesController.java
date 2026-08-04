package com.example.insightflowbackend.controller;

import com.example.insightflowbackend.dto.ApiResponse;
import com.example.insightflowbackend.service.AuthService;
import com.example.insightflowbackend.service.MessagesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = {"http://localhost:5173","http://localhost:3000","http://localhost:3001"})
public class MessagesController {
    private final MessagesService messagesService;
    private final AuthService authService;

    @Autowired
    public MessagesController(MessagesService messagesService, AuthService authService) {
        this.messagesService = messagesService;
        this.authService = authService;
    }

    @PostMapping
    public ApiResponse<Map<String,Object>> send(
            @RequestHeader(value = "X-User", required = false) String username,
            @RequestBody Map<String,Object> payload
    ) {
        try {
            if (username == null) return ApiResponse.error("Unauthorized");
            String recipient = payload.get("recipient") instanceof String ? (String) payload.get("recipient") : null;
            String body = payload.get("body") instanceof String ? (String) payload.get("body") : null;
            if (recipient == null || recipient.isBlank() || body == null || body.isBlank()) return ApiResponse.error("recipient and body are required");
            // Role-based permission: IT->any, AH->faculty|student, Faculty->student, Student->none
            boolean isIT = authService.hasRole(username, "it");
            boolean isAH = authService.hasRole(username, "academic_head");
            boolean isFaculty = authService.hasRole(username, "faculty");
            boolean allowed = false;
            if (isIT) {
                allowed = true;
            } else if (isAH) {
                try {
                    String role = getUserRole(recipient);
                    allowed = role.equalsIgnoreCase("faculty") || role.equalsIgnoreCase("student");
                } catch (Exception ignored) {}
            } else if (isFaculty) {
                try {
                    String role = getUserRole(recipient);
                    allowed = role.equalsIgnoreCase("student");
                } catch (Exception ignored) {}
            }
            if (!allowed) return ApiResponse.error("Not allowed to message this recipient");
            return ApiResponse.success(messagesService.send(username, recipient, body));
        } catch (Exception e) {
            return ApiResponse.error("Failed to send: " + e.getMessage());
        }
    }

    @GetMapping
    public ApiResponse<List<Map<String,Object>>> list(
            @RequestHeader(value = "X-User", required = false) String username
    ) {
        try {
            if (username == null) return ApiResponse.error("Unauthorized");
            return ApiResponse.success(messagesService.listForUser(username));
        } catch (Exception e) {
            return ApiResponse.error("Failed to list messages: " + e.getMessage());
        }
    }

    private String getUserRole(String username) {
        // Try faculty table first
        try {
            // Using a static holder for JDBC via reflection on messagesService
            java.lang.reflect.Field f = messagesService.getClass().getDeclaredField("jdbc");
            f.setAccessible(true);
            org.springframework.jdbc.core.JdbcTemplate jdbc = (org.springframework.jdbc.core.JdbcTemplate) f.get(messagesService);
            String r = jdbc.queryForObject("SELECT role FROM faculty WHERE username = ?", String.class, username);
            if (r != null) return r;
        } catch (Exception ignored) {}
        try {
            java.lang.reflect.Field f = messagesService.getClass().getDeclaredField("jdbc");
            f.setAccessible(true);
            org.springframework.jdbc.core.JdbcTemplate jdbc = (org.springframework.jdbc.core.JdbcTemplate) f.get(messagesService);
            Integer sid = jdbc.queryForObject("SELECT student_id FROM student_auth WHERE username = ?", Integer.class, username);
            if (sid != null) return "student";
        } catch (Exception ignored) {}
        return "unknown";
    }
}
