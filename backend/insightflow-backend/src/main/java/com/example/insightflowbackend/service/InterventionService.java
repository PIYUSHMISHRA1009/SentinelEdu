package com.example.insightflowbackend.service;

import com.example.insightflowbackend.util.DatabaseUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.util.List;
import java.util.Map;

/**
 * Service for managing student interventions.
 * Handles creation and retrieval of intervention records.
 */
@Service
public class InterventionService {
    
    private final JdbcTemplate jdbc;

    @Autowired
    public InterventionService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
        ensureSequence();
    }

    private void ensureSequence() {
        try {
            jdbc.execute("CREATE SEQUENCE intervention_seq START WITH 1 INCREMENT BY 1");
        } catch (Exception ignored) {}
    }

    /**
     * Retrieves interventions for a specific student or all interventions.
     * 
     * @param studentId Optional student ID filter
     * @return List of intervention records
     */
    public List<Map<String, Object>> getInterventions(Integer studentId) {
        String sql;
        Object[] params;
        
        if (studentId != null) {
            sql = "SELECT i.intervention_id, i.student_id, s.name as student_name, " +
                  "s.roll_number, i.faculty_id, f.name as faculty_name, " +
                  "i.intervention_type, i.notes, i.status, i.created_on " +
                  "FROM interventions i " +
                  "JOIN students s ON i.student_id = s.student_id " +
                  "JOIN faculty f ON i.faculty_id = f.faculty_id " +
                  "WHERE i.student_id = ? " +
                  "ORDER BY i.created_on DESC";
            params = new Object[]{studentId};
        } else {
            sql = "SELECT i.intervention_id, i.student_id, s.name as student_name, " +
                  "s.roll_number, i.faculty_id, f.name as faculty_name, " +
                  "i.intervention_type, i.notes, i.status, i.created_on " +
                  "FROM interventions i " +
                  "JOIN students s ON i.student_id = s.student_id " +
                  "JOIN faculty f ON i.faculty_id = f.faculty_id " +
                  "ORDER BY i.created_on DESC";
            params = new Object[]{};
        }
        
        List<Map<String, Object>> rawResults = jdbc.queryForList(sql, params);
        return DatabaseUtil.normalizeKeys(rawResults);
    }

    /**
     * Creates a new intervention record.
     * 
     * @param studentId Student receiving the intervention
     * @param facultyId Faculty member initiating the intervention
     * @param interventionType Type of intervention (counseling, academic_support, etc.)
     * @param notes Intervention notes/details
     * @return ID of the newly created intervention
     */
    public int createIntervention(int studentId, int facultyId, 
                                  String interventionType, String notes) {
        Integer interventionId = jdbc.queryForObject("SELECT intervention_seq.NEXTVAL FROM dual", Integer.class);
        if (interventionId == null) {
            throw new IllegalStateException("Unable to generate intervention id");
        }

        jdbc.update(
                "INSERT INTO interventions (intervention_id, student_id, faculty_id, intervention_type, notes, status, created_on) " +
                        "VALUES (?, ?, ?, ?, ?, 'pending', ?)",
                interventionId,
                studentId,
                facultyId,
                interventionType,
                notes,
                new Timestamp(System.currentTimeMillis())
        );

        return interventionId;
    }

    /**
     * Updates the status of an intervention.
     * 
     * @param interventionId Intervention ID
     * @param status New status (pending, in_progress, completed)
     * @return Number of rows updated
     */
    public int updateInterventionStatus(int interventionId, String status) {
        String sql = "UPDATE interventions SET status = ? WHERE intervention_id = ?";
        return jdbc.update(sql, status, interventionId);
    }

    /**
     * Gets intervention statistics for dashboard.
     * 
     * @return Map with intervention counts by status
     */
    public Map<String, Object> getInterventionStats() {
        String sql = "SELECT " +
                     "COUNT(*) as total, " +
                     "SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending, " +
                     "SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress, " +
                     "SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed " +
                     "FROM interventions";
        
        return jdbc.queryForMap(sql);
    }
}
