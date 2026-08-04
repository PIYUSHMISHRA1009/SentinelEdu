package com.example.insightflowbackend.service;

import com.example.insightflowbackend.util.DatabaseUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.stereotype.Service;

import java.sql.CallableStatement;
import java.util.List;
import java.util.Map;

/**
 * Service for managing risk detection and flagging students at risk.
 * Integrates with Oracle PL/SQL procedure run_risk_engine.
 */
@Service
public class RiskService {
    private final JdbcTemplate jdbc;
    // Defaults; persisted in DB table risk_rules (single row)
    private volatile double gpaThresholdDefault = 2.5;
    private volatile int attendanceThresholdDefault = 75;
    private volatile boolean autoRunEnabled = true;
    private volatile boolean notificationsEnabled = true;

    @Autowired
    public RiskService(JdbcTemplate jdbc) { 
        this.jdbc = jdbc; 
        ensureRulesTable();
        ensureRiskFlagSequence();
        ensureFlagSourceColumn();
        loadRulesFromDb();
    }

    private void ensureFlagSourceColumn() {
        try { jdbc.execute("ALTER TABLE risk_flags ADD (flag_source VARCHAR2(20) DEFAULT 'AUTO')"); } catch (Exception ignored) {}
        try { jdbc.execute("UPDATE risk_flags SET flag_source = 'AUTO' WHERE flag_source IS NULL"); } catch (Exception ignored) {}
    }

    private void ensureRulesTable() {
        try {
            jdbc.execute("CREATE TABLE risk_rules (" +
                    "id NUMBER PRIMARY KEY, " +
                    "gpa_threshold NUMBER(3,2), " +
                    "attendance_threshold NUMBER(5,2), " +
                    "auto_run NUMBER(1), " +
                    "notifications NUMBER(1))");
        } catch (Exception ignored) {}
        try { jdbc.execute("CREATE SEQUENCE risk_rules_seq START WITH 1 INCREMENT BY 1"); } catch (Exception ignored) {}
    }

    private void ensureRiskFlagSequence() {
        try {
            jdbc.execute("CREATE SEQUENCE risk_flag_seq START WITH 1 INCREMENT BY 1");
        } catch (Exception ignored) {}
    }

    private void loadRulesFromDb() {
        try {
            java.util.Map<String,Object> row = jdbc.queryForMap("SELECT gpa_threshold, attendance_threshold, auto_run, notifications FROM risk_rules WHERE ROWNUM = 1");
            if (row.get("GPA_THRESHOLD") != null) this.gpaThresholdDefault = ((Number)row.get("GPA_THRESHOLD")).doubleValue();
            if (row.get("ATTENDANCE_THRESHOLD") != null) this.attendanceThresholdDefault = ((Number)row.get("ATTENDANCE_THRESHOLD")).intValue();
            if (row.get("AUTO_RUN") != null) this.autoRunEnabled = ((Number)row.get("AUTO_RUN")).intValue() == 1;
            if (row.get("NOTIFICATIONS") != null) this.notificationsEnabled = ((Number)row.get("NOTIFICATIONS")).intValue() == 1;
        } catch (Exception e) {
            // Insert defaults if empty
            try {
                jdbc.update("INSERT INTO risk_rules (id, gpa_threshold, attendance_threshold, auto_run, notifications) VALUES (risk_rules_seq.NEXTVAL, ?, ?, ?, ?)",
                        this.gpaThresholdDefault, this.attendanceThresholdDefault, this.autoRunEnabled ? 1 : 0, this.notificationsEnabled ? 1 : 0);
            } catch (Exception ignored) {}
        }
    }

    /**
     * Executes the risk detection engine with configurable thresholds.
     * 
     * @param gpaThreshold Minimum GPA threshold (e.g., 2.5)
     * @param attThreshold Minimum attendance percentage threshold (e.g., 75)
     */
    public void runRiskEngine(double gpaThreshold, int attThreshold) {
        try {
            jdbc.execute((ConnectionCallback<Void>) conn -> {
                try (CallableStatement cs = conn.prepareCall("{call run_risk_engine(?,?)}")) {
                    cs.setDouble(1, gpaThreshold);
                    cs.setInt(2, attThreshold);
                    cs.execute();
                }
                return null;
            });
        } catch (Exception ignored) {
            // fall back below
        }
        runRiskEngineFallback(gpaThreshold, attThreshold);
    }

    private void runRiskEngineFallback(double gpaThreshold, int attThreshold) {
        // Simple Java fallback when PL/SQL procedure is unavailable
    jdbc.update("DELETE FROM risk_flags WHERE flag_source = 'AUTO' OR flag_source IS NULL");

        String metricsSql = "SELECT s.student_id, " +
        "COALESCE(ov.avg_gpa, ROUND(AVG(e.gpa), 2)) AS avg_gpa, " +
        "COALESCE(ov.avg_attendance, ROUND(AVG(CASE WHEN a.percentage IS NOT NULL THEN a.percentage " +
        "WHEN a.classes_held > 0 THEN (a.classes_attended/NULLIF(a.classes_held,0))*100 ELSE NULL END), 2)) AS avg_attendance " +
                "FROM students s " +
                "LEFT JOIN student_metrics_overrides ov ON ov.student_id = s.student_id " +
                "LEFT JOIN enrollments e ON e.student_id = s.student_id " +
                "LEFT JOIN attendance a ON a.student_id = s.student_id " +
                "GROUP BY s.student_id, ov.avg_gpa, ov.avg_attendance";

        List<Map<String, Object>> rows = jdbc.queryForList(metricsSql);
        for (Map<String, Object> row : rows) {
            Integer studentId = row.get("STUDENT_ID") != null ? ((Number) row.get("STUDENT_ID")).intValue() : null;
            if (studentId == null) continue;
            double avgGpa = row.get("AVG_GPA") != null ? ((Number) row.get("AVG_GPA")).doubleValue() : 0.0;
            double avgAttendance = row.get("AVG_ATTENDANCE") != null ? ((Number) row.get("AVG_ATTENDANCE")).doubleValue() : 0.0;
            boolean lowGpa = avgGpa < gpaThreshold;
            boolean lowAttendance = avgAttendance < attThreshold;
            if (!lowGpa && !lowAttendance) {
                continue;
            }

            String reason;
            if (lowGpa && lowAttendance) {
                reason = String.format("GPA %.2f < %.2f & attendance %.2f%% < %d%%", avgGpa, gpaThreshold, avgAttendance, attThreshold);
            } else if (lowGpa) {
                reason = String.format("GPA %.2f below %.2f", avgGpa, gpaThreshold);
            } else {
                reason = String.format("Attendance %.2f%% below %d%%", avgAttendance, attThreshold);
            }

            jdbc.update(
            "INSERT INTO risk_flags (flag_id, student_id, reason, avg_gpa, avg_attendance, flagged_on, flag_source) VALUES (risk_flag_seq.NEXTVAL, ?, ?, ?, ?, SYSTIMESTAMP, 'AUTO')",
                    studentId,
                    reason,
                    avgGpa,
                    avgAttendance
            );
        }
    }

    /**
     * Runs the risk engine with the currently configured default thresholds.
     * Useful for auto-recalculation after metric updates.
     */
    public void runRiskEngineWithDefaults() {
        runRiskEngine(this.gpaThresholdDefault, this.attendanceThresholdDefault);
    }

    public Map<String, Object> getRules() {
        java.util.Map<String, Object> rules = new java.util.HashMap<>();
        rules.put("gpaThreshold", gpaThresholdDefault);
        rules.put("attendanceThreshold", attendanceThresholdDefault);
        rules.put("autoRunEnabled", autoRunEnabled);
        rules.put("notificationsEnabled", notificationsEnabled);
        return rules;
    }

    public Map<String, Object> updateRules(Double gpa, Integer attendance, Boolean autoRun, Boolean notify) {
        if (gpa != null) this.gpaThresholdDefault = gpa;
        if (attendance != null) this.attendanceThresholdDefault = attendance;
        if (autoRun != null) this.autoRunEnabled = autoRun;
        if (notify != null) this.notificationsEnabled = notify;
        // Upsert DB row
        int updated = jdbc.update("UPDATE risk_rules SET gpa_threshold=?, attendance_threshold=?, auto_run=?, notifications=? WHERE id = (SELECT id FROM risk_rules WHERE ROWNUM = 1)",
                this.gpaThresholdDefault, this.attendanceThresholdDefault, this.autoRunEnabled ? 1 : 0, this.notificationsEnabled ? 1 : 0);
        if (updated == 0) {
            try {
                jdbc.update("INSERT INTO risk_rules (id, gpa_threshold, attendance_threshold, auto_run, notifications) VALUES (risk_rules_seq.NEXTVAL, ?, ?, ?, ?)",
                        this.gpaThresholdDefault, this.attendanceThresholdDefault, this.autoRunEnabled ? 1 : 0, this.notificationsEnabled ? 1 : 0);
            } catch (Exception ignored) {}
        }
        return getRules();
    }

    /**
     * Retrieves all risk flags ordered by most recent first.
     * Returns normalized lowercase keys for frontend compatibility.
     * 
     * @return List of risk flag records with student info
     */
    public List<Map<String,Object>> fetchRiskFlags() {
        List<Map<String, Object>> rawResults = jdbc.queryForList(
                "SELECT rf.flag_id, rf.student_id, rf.reason, rf.avg_gpa, " +
                "rf.avg_attendance, rf.flagged_on, s.name as student_name, " +
                "s.roll_number, s.department " +
                "FROM risk_flags rf " +
                "JOIN students s ON rf.student_id = s.student_id " +
                "ORDER BY rf.flagged_on DESC"
        );
        
        // Normalize Oracle UPPERCASE keys to lowercase
        return DatabaseUtil.normalizeKeys(rawResults);
    }
    
    /**
     * Gets count of flagged students.
     * 
     * @return Number of currently flagged students
     */
    public int getFlaggedCount() {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM risk_flags", 
                Integer.class
        );
        return count != null ? count : 0;
    }

    /**
     * Manually flags a student as at-risk with a provided reason.
     * Computes avg_gpa and avg_attendance from existing tables.
     *
     * @param studentId student to flag
     * @param reason reason text
     * @return generated flag_id
     */
    public int manualFlagStudent(int studentId, String reason) {
    // Compute aggregates
    Double avgGpa = jdbc.queryForObject(
        "SELECT NVL(ROUND(AVG(gpa), 2), 0) FROM enrollments WHERE student_id = ?",
        Double.class, studentId
    );

    Double avgAttendance = jdbc.queryForObject(
        "SELECT NVL(ROUND(AVG(CASE WHEN classes_held > 0 THEN (classes_attended/classes_held)*100 END), 2), 0) FROM attendance WHERE student_id = ?",
        Double.class, studentId
    );

    // Insert risk flag using sequence
    jdbc.update(
        "INSERT INTO risk_flags (flag_id, student_id, reason, avg_gpa, avg_attendance, flagged_on, flag_source) VALUES (risk_flag_seq.NEXTVAL, ?, ?, ?, ?, SYSTIMESTAMP, 'MANUAL')",
        studentId, reason, avgGpa, avgAttendance
    );

    Integer id = jdbc.queryForObject("SELECT risk_flag_seq.CURRVAL FROM dual", Integer.class);
    return id != null ? id : -1;
    }

    public boolean removeRiskFlag(int flagId) {
        return jdbc.update("DELETE FROM risk_flags WHERE flag_id = ?", flagId) > 0;
    }
}
