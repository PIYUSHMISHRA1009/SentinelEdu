package com.example.insightflowbackend.service;

import com.example.insightflowbackend.util.DatabaseUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class MessagesService {
    private final JdbcTemplate jdbc;
    private final NotificationsService notifications;

    @Autowired
    public MessagesService(JdbcTemplate jdbc, NotificationsService notifications) {
        this.jdbc = jdbc;
        this.notifications = notifications;
        ensure();
    }

    private void ensure() {
        try {
            jdbc.execute("CREATE TABLE direct_messages (" +
                    "message_id NUMBER PRIMARY KEY, " +
                    "sender VARCHAR2(100) NOT NULL, " +
                    "recipient VARCHAR2(100) NOT NULL, " +
                    "body CLOB NOT NULL, " +
                    "created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ");
            jdbc.execute("CREATE SEQUENCE direct_msg_seq START WITH 1 INCREMENT BY 1");
        } catch (Exception ignored) {}
        try { jdbc.execute("CREATE INDEX idx_dm_recipient ON direct_messages(recipient)"); } catch (Exception ignored) {}
        try { jdbc.execute("CREATE INDEX idx_dm_sender ON direct_messages(sender)"); } catch (Exception ignored) {}
    }

    public Map<String,Object> send(String sender, String recipient, String body) {
        jdbc.update("INSERT INTO direct_messages (message_id, sender, recipient, body, created_on) VALUES (direct_msg_seq.NEXTVAL, ?, ?, ?, SYSTIMESTAMP)", sender, recipient, body);
        try { notifications.notifyUser(recipient, "New Message", body.substring(0, Math.min(80, body.length())), "/inbox", "message"); } catch (Exception ignored) {}
        return Map.of("message","sent");
    }

    public List<Map<String,Object>> listForUser(String username) {
        List<Map<String,Object>> rows = jdbc.queryForList("SELECT message_id, sender, recipient, body, created_on FROM direct_messages WHERE recipient = ? OR sender = ? ORDER BY created_on DESC", username, username);
        return DatabaseUtil.normalizeKeys(rows);
    }
}
