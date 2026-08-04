package com.example.insightflowbackend.service;

import com.example.insightflowbackend.util.DatabaseUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class NotificationsService {
    private final JdbcTemplate jdbc;

    @Autowired
    public NotificationsService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
        ensureTable();
    }

    private void ensureTable() {
        try {
            jdbc.execute("CREATE TABLE notifications (" +
                    "notification_id NUMBER PRIMARY KEY, " +
                    "username VARCHAR2(100), " +
                    "title VARCHAR2(200), " +
                    "message VARCHAR2(1000), " +
                    "link VARCHAR2(300), " +
                    "type VARCHAR2(50), " +
                    "created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                    "read_on TIMESTAMP) ");
            jdbc.execute("CREATE SEQUENCE notifications_seq START WITH 1 INCREMENT BY 1");
            jdbc.execute("CREATE INDEX idx_notif_user ON notifications(username)");
        } catch (Exception ignored) {}
    }

    public void notifyUser(String username, String title, String message, String link, String type) {
        if (username == null || username.isBlank()) return;
        jdbc.update("INSERT INTO notifications (notification_id, username, title, message, link, type, created_on) VALUES (notifications_seq.NEXTVAL, ?, ?, ?, ?, ?, SYSTIMESTAMP)",
                username, title, message, link, type);
    }

    public List<Map<String,Object>> listForUser(String username) {
        List<Map<String,Object>> rows = jdbc.queryForList("SELECT notification_id, title, message, link, type, created_on, read_on FROM notifications WHERE username = ? ORDER BY created_on DESC FETCH FIRST 50 ROWS ONLY", username);
        return DatabaseUtil.normalizeKeys(rows);
    }

    public int markRead(String username, long id) {
        return jdbc.update("UPDATE notifications SET read_on = SYSTIMESTAMP WHERE notification_id = ? AND username = ?", id, username);
    }
}
