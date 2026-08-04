package com.example.insightflowbackend.service;

import com.example.insightflowbackend.util.DatabaseUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class ContactService {
    private final JdbcTemplate jdbc;
    private final NotificationsService notifications;

    @Autowired
    public ContactService(JdbcTemplate jdbc, NotificationsService notifications) {
        this.jdbc = jdbc;
        this.notifications = notifications;
        ensureTable();
    }

    private void ensureTable() {
        try {
            jdbc.execute("CREATE TABLE contact_messages (" +
                    "message_id NUMBER PRIMARY KEY, " +
                    "name VARCHAR2(100), " +
                    "email VARCHAR2(150), " +
                    "created_by VARCHAR2(100), " +
                    "subject VARCHAR2(200), " +
                    "message CLOB, " +
                    "created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ");
            jdbc.execute("CREATE SEQUENCE contact_msg_seq START WITH 1 INCREMENT BY 1");
        } catch (Exception ignored) {
            // already exists
        }
        // Best-effort schema evolution: add reply/status columns if missing
        try { jdbc.execute("ALTER TABLE contact_messages ADD (created_by VARCHAR2(100))"); } catch (Exception ignored) {}
        try { jdbc.execute("ALTER TABLE contact_messages ADD (reply_text CLOB)"); } catch (Exception ignored) {}
        try { jdbc.execute("ALTER TABLE contact_messages ADD (replied_by VARCHAR2(100))"); } catch (Exception ignored) {}
        try { jdbc.execute("ALTER TABLE contact_messages ADD (replied_on TIMESTAMP)"); } catch (Exception ignored) {}
        try { jdbc.execute("ALTER TABLE contact_messages ADD (status VARCHAR2(20) DEFAULT 'open')"); } catch (Exception ignored) {}
    }

    public Map<String, Object> submit(String name, String email, String createdBy, String subject, String message) {
        String sql = "INSERT INTO contact_messages (message_id, name, email, created_by, subject, message, created_on) " +
                "VALUES (contact_msg_seq.NEXTVAL, ?, ?, ?, ?, ?, SYSTIMESTAMP)";
        jdbc.update(sql, name, email, createdBy, subject, message);
        // Proactively notify all IT users about the new contact message (works for guests and logged-in users)
        try {
            java.util.List<java.util.Map<String,Object>> its = com.example.insightflowbackend.util.DatabaseUtil
                    .normalizeKeys(jdbc.queryForList("SELECT username FROM faculty WHERE LOWER(role) = 'it'"));
            String summary = (subject != null && !subject.isBlank()) ? subject : (name != null ? ("Message from " + name) : "New message");
            for (java.util.Map<String,Object> it : its) {
                String u = (String) it.get("username");
                notifications.notifyUser(u, "New Contact Message", summary, "/it/support", "contact");
            }
        } catch (Exception ignored) { }
        return Map.of("message", "Submitted");
    }

    public List<Map<String, Object>> list() {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT message_id, name, email, subject, message, created_on, reply_text, replied_by, replied_on, status FROM contact_messages ORDER BY created_on DESC");
        // Auto-hide completed contacts older than 7 days from default admin list
        java.time.Instant cut = java.time.Instant.now().minus(java.time.Duration.ofDays(7));
        java.util.List<java.util.Map<String,Object>> filtered = new java.util.ArrayList<>();
        for (Map<String,Object> r : rows) {
            String status = (String) r.get("STATUS");
            Object ro = r.get("REPLIED_ON");
            java.time.Instant ts = null;
            try { if (ro != null) ts = ((java.sql.Timestamp) ro).toInstant(); } catch (Exception ignored) {}
            if ("completed".equalsIgnoreCase(status) && ts != null && ts.isBefore(cut)) continue;
            filtered.add(r);
        }
        return DatabaseUtil.normalizeKeys(filtered);
    }

    public Map<String, Object> reply(long messageId, String replyText, String repliedBy, boolean complete) {
        String status = complete ? "completed" : "replied";
        int updated = jdbc.update(
                "UPDATE contact_messages SET reply_text = ?, replied_by = ?, replied_on = SYSTIMESTAMP, status = ? WHERE message_id = ?",
                replyText, repliedBy, status, messageId
        );
        if (updated == 0) {
            throw new RuntimeException("Contact message not found: id=" + messageId);
        }
        // Notify account holder if known
        try {
            String createdBy = jdbc.queryForObject("SELECT created_by FROM contact_messages WHERE message_id = ?", String.class, messageId);
            if (createdBy != null) {
                notifications.notifyUser(createdBy, complete ? "Contact Completed" : "Contact Reply", replyText != null ? replyText.substring(0, Math.min(80, replyText.length())) : "", "/admin", "contact");
            }
        } catch (Exception ignored) {}
        return Map.of("message", "Reply saved", "status", status);
    }

    public Map<String, Object> updateStatus(long messageId, String status) {
        int updated = jdbc.update("UPDATE contact_messages SET status = ? WHERE message_id = ?", status, messageId);
        if (updated == 0) throw new RuntimeException("Contact message not found: id=" + messageId);
        return Map.of("message", "Status updated", "status", status);
    }
}
