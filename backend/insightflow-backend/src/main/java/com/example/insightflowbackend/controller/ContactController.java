package com.example.insightflowbackend.controller;

import com.example.insightflowbackend.dto.ApiResponse;
import com.example.insightflowbackend.service.AuthService;
import com.example.insightflowbackend.service.ContactService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contact")
public class ContactController {
    private final ContactService contactService;
    private final AuthService authService;

    @Autowired
    public ContactController(ContactService contactService, AuthService authService) {
        this.contactService = contactService;
        this.authService = authService;
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> submit(@RequestBody Map<String, String> payload, @RequestHeader(value = "X-User", required = false) String username) {
        try {
            String name = payload.getOrDefault("name", "");
            String email = payload.getOrDefault("email", "");
            String subject = payload.getOrDefault("subject", "");
            String message = payload.getOrDefault("message", "");
            if (name.isBlank() || email.isBlank() || message.isBlank()) {
                return ApiResponse.error("Name, email and message are required");
            }
            Map<String, Object> result = contactService.submit(name, email, username, subject, message);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error("Failed to submit contact message: " + e.getMessage());
        }
    }

    @GetMapping
        public ApiResponse<List<Map<String, Object>>> list(@RequestHeader(value = "X-User", required = false) String username) {
        try {
                if (username == null || !authService.hasRole(username, "it")) {
                return ApiResponse.error("Unauthorized");
            }
            return ApiResponse.success(contactService.list());
        } catch (Exception e) {
            return ApiResponse.error("Failed to fetch messages: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/reply")
    public ApiResponse<Map<String, Object>> reply(
            @PathVariable("id") long id,
            @RequestHeader(value = "X-User", required = false) String username,
            @RequestBody Map<String, Object> payload
    ) {
        try {
            if (username == null || !authService.hasRole(username, "it")) {
                return ApiResponse.error("Unauthorized");
            }
            String reply = payload.get("reply") instanceof String ? (String) payload.get("reply") : null;
            boolean complete = false;
            if (payload.get("complete") instanceof Boolean) complete = (Boolean) payload.get("complete");
            if (reply == null || reply.isBlank()) return ApiResponse.error("Reply text is required");
            return ApiResponse.success(contactService.reply(id, reply, username, complete));
        } catch (Exception e) {
            return ApiResponse.error("Failed to save reply: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/status")
    public ApiResponse<Map<String, Object>> updateStatus(
            @PathVariable("id") long id,
            @RequestHeader(value = "X-User", required = false) String username,
            @RequestBody Map<String, Object> payload
    ) {
        try {
            if (username == null || !authService.hasRole(username, "it")) {
                return ApiResponse.error("Unauthorized");
            }
            String status = payload.get("status") instanceof String ? (String) payload.get("status") : null;
            if (status == null || status.isBlank()) return ApiResponse.error("Status is required");
            return ApiResponse.success(contactService.updateStatus(id, status));
        } catch (Exception e) {
            return ApiResponse.error("Failed to update status: " + e.getMessage());
        }
    }
}
