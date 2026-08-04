package com.example.insightflowbackend.controller;

import com.example.insightflowbackend.dto.ApiResponse;
import com.example.insightflowbackend.service.NotificationsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationsController {
    private final NotificationsService notificationsService;

    @Autowired
    public NotificationsController(NotificationsService notificationsService) {
        this.notificationsService = notificationsService;
    }

    @GetMapping
    public ApiResponse<List<Map<String,Object>>> list(@RequestHeader(value = "X-User", required = false) String username) {
        try {
            if (username == null) return ApiResponse.error("Unauthorized");
            return ApiResponse.success(notificationsService.listForUser(username));
        } catch (Exception e) {
            return ApiResponse.error("Failed to fetch notifications: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/read")
    public ApiResponse<Map<String,Object>> markRead(@PathVariable("id") long id, @RequestHeader(value = "X-User", required = false) String username) {
        try {
            if (username == null) return ApiResponse.error("Unauthorized");
            int updated = notificationsService.markRead(username, id);
            return updated > 0 ? ApiResponse.success(Map.of("updated", updated)) : ApiResponse.error("Not found");
        } catch (Exception e) {
            return ApiResponse.error("Failed to mark as read: " + e.getMessage());
        }
    }
}
