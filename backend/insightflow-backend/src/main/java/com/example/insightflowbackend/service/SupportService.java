package com.example.insightflowbackend.service;

import com.example.insightflowbackend.util.DatabaseUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class SupportService {
    private final JdbcTemplate jdbc;
    private final NotificationsService notifications;

    @Autowired
    public SupportService(JdbcTemplate jdbc, NotificationsService notifications) {
        this.jdbc = jdbc;
        this.notifications = notifications;
        ensureTables();
    }

    private void ensureTables() {
        try {
            jdbc.execute("CREATE TABLE support_tickets (" +
                    "ticket_id NUMBER PRIMARY KEY, " +
                    "ticket_code VARCHAR2(30), " +
                    "subject VARCHAR2(200), " +
                    "description CLOB, " +
                    "created_by VARCHAR2(100), " +
                    "name VARCHAR2(100), " +
                    "email VARCHAR2(150), " +
                    "status VARCHAR2(20) DEFAULT 'open', " +
                    "created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                    "updated_on TIMESTAMP) ");
            jdbc.execute("CREATE SEQUENCE support_ticket_seq START WITH 1 INCREMENT BY 1");
        } catch (Exception ignored) {}
        try { jdbc.execute("ALTER TABLE support_tickets ADD (ticket_code VARCHAR2(30))"); } catch (Exception ignored) {}
        try {
            jdbc.execute("CREATE TABLE support_responses (" +
                    "response_id NUMBER PRIMARY KEY, " +
                    "ticket_id NUMBER, " +
                    "responder VARCHAR2(100), " +
                    "message CLOB, " +
                    "created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                    "CONSTRAINT fk_ticket FOREIGN KEY (ticket_id) REFERENCES support_tickets(ticket_id)) ");
            jdbc.execute("CREATE SEQUENCE support_resp_seq START WITH 1 INCREMENT BY 1");
        } catch (Exception ignored) {}
    }

    public Map<String,Object> create(String subject, String description, String createdBy, String name, String email) {
        jdbc.update("INSERT INTO support_tickets (ticket_id, subject, description, created_by, name, email, status, created_on) VALUES (support_ticket_seq.NEXTVAL, ?, ?, ?, ?, ?, 'open', SYSTIMESTAMP)",
                subject, description, createdBy, name, email);
        // Set a human-friendly ticket_code like TKT-2025-000123
        try {
            Long id = jdbc.queryForObject("SELECT support_ticket_seq.CURRVAL FROM dual", Long.class);
            String year = java.time.Year.now().toString();
            String code = String.format("TKT-%s-%06d", year, id);
            jdbc.update("UPDATE support_tickets SET ticket_code = ? WHERE ticket_id = ?", code, id);
        } catch (Exception ignored) {}
        // Notify IT users of new ticket
        try {
            List<Map<String,Object>> its = DatabaseUtil.normalizeKeys(jdbc.queryForList("SELECT username FROM faculty WHERE LOWER(role) = 'it'"));
            for (Map<String,Object> it : its) {
                String u = (String) it.get("username");
                notifications.notifyUser(u, "New Support Ticket", subject, "/admin", "support");
            }
        } catch (Exception ignored) {}
        return Map.of("message","Created");
    }

    public List<Map<String,Object>> listAll() {
    List<Map<String,Object>> rows = jdbc.queryForList("SELECT ticket_id, ticket_code, subject, description, created_by, name, email, status, created_on, updated_on FROM support_tickets ORDER BY created_on DESC");
        List<Map<String,Object>> list = DatabaseUtil.normalizeKeys(rows);
        for (Map<String,Object> t : list) {
            Object id = t.get("ticket_id");
            if (id instanceof Number) {
                List<Map<String,Object>> resps = DatabaseUtil.normalizeKeys(jdbc.queryForList("SELECT response_id, ticket_id, responder, message, created_on FROM support_responses WHERE ticket_id = ? ORDER BY created_on ASC", ((Number) id).longValue()));
                t.put("responses", resps);
            }
        }
        return list;
    }

    public List<Map<String,Object>> listMine(String username) {
    List<Map<String,Object>> rows = jdbc.queryForList("SELECT ticket_id, ticket_code, subject, description, created_by, name, email, status, created_on, updated_on FROM support_tickets WHERE created_by = ? ORDER BY created_on DESC", username);
        List<Map<String,Object>> list = DatabaseUtil.normalizeKeys(rows);
        for (Map<String,Object> t : list) {
            Object id = t.get("ticket_id");
            if (id instanceof Number) {
                List<Map<String,Object>> resps = DatabaseUtil.normalizeKeys(jdbc.queryForList("SELECT response_id, ticket_id, responder, message, created_on FROM support_responses WHERE ticket_id = ? ORDER BY created_on ASC", ((Number) id).longValue()));
                t.put("responses", resps);
            }
        }
        return list;
    }

    public Map<String,Object> get(long id) {
    Map<String,Object> row = jdbc.queryForMap("SELECT ticket_id, ticket_code, subject, description, created_by, name, email, status, created_on, updated_on FROM support_tickets WHERE ticket_id = ?", id);
        Map<String,Object> norm = DatabaseUtil.normalizeKeys(row);
        List<Map<String,Object>> resps = DatabaseUtil.normalizeKeys(jdbc.queryForList("SELECT response_id, ticket_id, responder, message, created_on FROM support_responses WHERE ticket_id = ? ORDER BY created_on ASC", id));
        norm.put("responses", resps);
        return norm;
    }

    public Map<String,Object> reply(long id, String responder, String message) {
        // Block replies if resolved
        try {
            String status = jdbc.queryForObject("SELECT status FROM support_tickets WHERE ticket_id = ?", String.class, id);
            if (status != null && status.equalsIgnoreCase("resolved")) {
                throw new RuntimeException("Ticket is resolved; replies are closed");
            }
        } catch (RuntimeException e) { throw e; } catch (Exception ignored) {}
        int updated = jdbc.update("INSERT INTO support_responses (response_id, ticket_id, responder, message, created_on) VALUES (support_resp_seq.NEXTVAL, ?, ?, ?, SYSTIMESTAMP)", id, responder, message);
        if (updated == 0) throw new RuntimeException("Ticket not found");
        jdbc.update("UPDATE support_tickets SET status = 'in_progress', updated_on = SYSTIMESTAMP WHERE ticket_id = ?", id);
        // Notify the other party
        try {
            Map<String,Object> t = DatabaseUtil.normalizeKeys(jdbc.queryForMap("SELECT subject, created_by FROM support_tickets WHERE ticket_id = ?", id));
            String owner = (String) t.get("created_by");
            if (owner != null && !owner.equalsIgnoreCase(responder)) {
                notifications.notifyUser(owner, "Ticket Reply", (String) t.get("subject"), "/support", "support");
            }
        } catch (Exception ignored) {}
        return Map.of("message","Reply added");
    }

    public Map<String,Object> resolve(long id) {
        // If already resolved, no-op with friendly message
        try {
            String status = jdbc.queryForObject("SELECT status FROM support_tickets WHERE ticket_id = ?", String.class, id);
            if (status != null && status.equalsIgnoreCase("resolved")) {
                return Map.of("message", "Already resolved");
            }
        } catch (Exception ignored) {}
        int updated = jdbc.update("UPDATE support_tickets SET status = 'resolved', updated_on = SYSTIMESTAMP WHERE ticket_id = ?", id);
        if (updated == 0) throw new RuntimeException("Ticket not found");
        try {
            Map<String,Object> t = DatabaseUtil.normalizeKeys(jdbc.queryForMap("SELECT subject, created_by FROM support_tickets WHERE ticket_id = ?", id));
            String owner = (String) t.get("created_by");
            if (owner != null) {
                notifications.notifyUser(owner, "Ticket Resolved", (String) t.get("subject"), "/support", "support");
            }
        } catch (Exception ignored) {}
        return Map.of("message","Resolved");
    }
}
