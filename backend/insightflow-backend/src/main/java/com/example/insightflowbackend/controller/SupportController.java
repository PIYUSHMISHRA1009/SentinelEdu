package com.example.insightflowbackend.controller;

import com.example.insightflowbackend.dto.ApiResponse;
import com.example.insightflowbackend.service.AuthService;
import com.example.insightflowbackend.service.SupportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/support")
@CrossOrigin(origins = {"http://localhost:5173","http://localhost:3000","http://localhost:3001"})
public class SupportController {
    private final SupportService supportService;
    private final AuthService authService;

    @Autowired
    public SupportController(SupportService supportService, AuthService authService) {
        this.supportService = supportService;
        this.authService = authService;
    }

    @PostMapping
    public ApiResponse<Map<String,Object>> create(
            @RequestHeader(value = "X-User", required = false) String username,
            @RequestBody Map<String,Object> payload
    ) {
        try {
            String subject = payload.get("subject") instanceof String ? (String) payload.get("subject") : null;
            String description = payload.get("description") instanceof String ? (String) payload.get("description") : null;
            String name = payload.get("name") instanceof String ? (String) payload.get("name") : null;
            String email = payload.get("email") instanceof String ? (String) payload.get("email") : null;
            if (subject == null || subject.isBlank() || description == null || description.isBlank()) return ApiResponse.error("Subject and description are required");
            String createdBy = username != null ? username : (email != null ? email : "anonymous");
            return ApiResponse.success(supportService.create(subject, description, createdBy, name, email));
        } catch (Exception e) {
            return ApiResponse.error("Failed to create ticket: " + e.getMessage());
        }
    }

    @GetMapping
    public ApiResponse<List<Map<String,Object>>> list(
            @RequestHeader(value = "X-User", required = false) String username
    ) {
        try {
            if (username != null && authService.hasRole(username, "it")) {
                // IT: hide resolved older than 7 days in default list for cleanliness
                List<Map<String,Object>> all = supportService.listAll();
                java.time.Instant cut = java.time.Instant.now().minus(java.time.Duration.ofDays(7));
                java.util.List<java.util.Map<String,Object>> filtered = new java.util.ArrayList<>();
                for (Map<String,Object> t : all) {
                    String status = (String) t.get("status");
                    Object updatedOn = t.get("updated_on");
                    java.time.Instant ts = null;
                    try { if (updatedOn != null) ts = ((java.sql.Timestamp) updatedOn).toInstant(); } catch (Exception ignored) {}
                    if ("resolved".equalsIgnoreCase(status) && ts != null && ts.isBefore(cut)) continue;
                    filtered.add(t);
                }
                return ApiResponse.success(filtered);
            } else if (username != null) {
                // Non-IT: hide resolved older than 7 days
                List<Map<String,Object>> mine = supportService.listMine(username);
                java.time.Instant cut = java.time.Instant.now().minus(java.time.Duration.ofDays(7));
                java.util.List<java.util.Map<String,Object>> filtered = new java.util.ArrayList<>();
                for (Map<String,Object> t : mine) {
                    String status = (String) t.get("status");
                    Object updatedOn = t.get("updated_on");
                    java.time.Instant ts = null;
                    try { if (updatedOn != null) ts = ((java.sql.Timestamp) updatedOn).toInstant(); } catch (Exception ignored) {}
                    if ("resolved".equalsIgnoreCase(status) && ts != null && ts.isBefore(cut)) continue;
                    filtered.add(t);
                }
                return ApiResponse.success(filtered);
            } else {
                return ApiResponse.error("Unauthorized");
            }
        } catch (Exception e) {
            return ApiResponse.error("Failed to fetch tickets: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ApiResponse<Map<String,Object>> get(
            @PathVariable("id") long id,
            @RequestHeader(value = "X-User", required = false) String username
    ) {
        try {
            Map<String,Object> ticket = supportService.get(id);
            if (username != null && authService.hasRole(username, "it")) {
                return ApiResponse.success(ticket);
            }
            String createdBy = (String) ticket.get("created_by");
            if (username != null && username.equals(createdBy)) return ApiResponse.success(ticket);
            return ApiResponse.error("Unauthorized");
        } catch (Exception e) {
            return ApiResponse.error("Failed to fetch ticket: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/reply")
    public ApiResponse<Map<String,Object>> reply(
            @PathVariable("id") long id,
            @RequestHeader(value = "X-User", required = false) String username,
            @RequestBody Map<String,Object> payload
    ) {
        try {
            if (username == null) return ApiResponse.error("Unauthorized");
            // Disallow replies if ticket resolved
            try {
                Map<String,Object> t = supportService.get(id);
                if (t != null) {
                    String s = (String) t.get("status");
                    if ("resolved".equalsIgnoreCase(s)) return ApiResponse.error("Replies are closed for resolved tickets");
                }
            } catch (Exception ignored) {}
            String message = payload.get("message") instanceof String ? (String) payload.get("message") : null;
            if (message == null || message.isBlank()) return ApiResponse.error("Message is required");
            // Allow IT or ticket owner to reply
            if (authService.hasRole(username, "it")) {
                return ApiResponse.success(supportService.reply(id, username, message));
            }
            Map<String,Object> t = supportService.get(id);
            if (t != null) {
                String owner = (String) t.get("created_by");
                if (username.equals(owner)) {
                    return ApiResponse.success(supportService.reply(id, username, message));
                }
            }
            return ApiResponse.error("Unauthorized");
        } catch (Exception e) {
            return ApiResponse.error("Failed to add reply: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/resolve")
    public ApiResponse<Map<String,Object>> resolve(
            @PathVariable("id") long id,
            @RequestHeader(value = "X-User", required = false) String username
    ) {
        try {
            if (username == null || !authService.hasRole(username, "it")) return ApiResponse.error("Unauthorized");
            return ApiResponse.success(supportService.resolve(id));
        } catch (Exception e) {
            return ApiResponse.error("Failed to resolve ticket: " + e.getMessage());
        }
    }
}
