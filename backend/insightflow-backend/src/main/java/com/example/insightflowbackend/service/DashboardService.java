package com.example.insightflowbackend.service;

import com.example.insightflowbackend.util.DatabaseUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Service for dashboard analytics and statistics.
 * Provides aggregated data for the main dashboard.
 */
@Service
public class DashboardService {
    
    private final JdbcTemplate jdbc;

    @Autowired
    public DashboardService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * Gets summary statistics for the dashboard.
     * Returns camelCase keys for frontend compatibility.
     * 
     * @return Map containing key metrics
     */
    public Map<String, Object> getDashboardStats(Integer semester, String department) {
        Map<String, Object> stats = new HashMap<>();
        
        // Total students (optional department filter)
        StringBuilder totalSql = new StringBuilder("SELECT COUNT(*) FROM students");
        List<Object> totalParams = new ArrayList<>();
        if (department != null && !department.trim().isEmpty()) {
            totalSql.append(" WHERE department = ?");
            totalParams.add(department);
        }
        Integer totalStudents = jdbc.queryForObject(totalSql.toString(), Integer.class, totalParams.toArray());
        stats.put("totalStudents", totalStudents != null ? totalStudents : 0);
        
        // Flagged students (optional department filter)
        StringBuilder flaggedSql = new StringBuilder(
            "SELECT COUNT(DISTINCT rf.student_id) FROM risk_flags rf JOIN students s ON rf.student_id = s.student_id"
        );
        List<Object> flaggedParams = new ArrayList<>();
        if (department != null && !department.trim().isEmpty()) {
            flaggedSql.append(" WHERE s.department = ?");
            flaggedParams.add(department);
        }
        Integer flaggedStudents = jdbc.queryForObject(flaggedSql.toString(), Integer.class, flaggedParams.toArray());
        stats.put("flaggedStudents", flaggedStudents != null ? flaggedStudents : 0);
        
        // Average GPA (optional semester and department filters)
        StringBuilder gpaSql = new StringBuilder(
            "SELECT ROUND(AVG(e.gpa), 2) FROM enrollments e JOIN students s ON e.student_id = s.student_id WHERE 1=1"
        );
        List<Object> gpaParams = new ArrayList<>();
        if (semester != null) {
            gpaSql.append(" AND e.semester = ?");
            gpaParams.add(semester);
        }
        if (department != null && !department.trim().isEmpty()) {
            gpaSql.append(" AND s.department = ?");
            gpaParams.add(department);
        }
        Double avgGpa = jdbc.queryForObject(gpaSql.toString(), Double.class, gpaParams.toArray());
        stats.put("avgGpa", avgGpa != null ? avgGpa : 0.0);
        
        // Average attendance (optional department filter)
        StringBuilder attSql = new StringBuilder(
            "SELECT ROUND(AVG(a.percentage), 2) FROM attendance a JOIN students s ON a.student_id = s.student_id WHERE 1=1"
        );
        List<Object> attParams = new ArrayList<>();
        if (department != null && !department.trim().isEmpty()) {
            attSql.append(" AND s.department = ?");
            attParams.add(department);
        }
        Double avgAttendance = jdbc.queryForObject(attSql.toString(), Double.class, attParams.toArray());
        stats.put("avgAttendance", avgAttendance != null ? avgAttendance : 0.0);
        
        // Total interventions
        Integer totalInterventions = jdbc.queryForObject(
            "SELECT COUNT(*) FROM interventions",
            Integer.class
        );
        stats.put("totalInterventions", totalInterventions != null ? totalInterventions : 0);
        
        // Pending interventions
        Integer pendingInterventions = jdbc.queryForObject(
            "SELECT COUNT(*) FROM interventions WHERE status = 'pending'",
            Integer.class
        );
        stats.put("pendingInterventions", pendingInterventions != null ? pendingInterventions : 0);
        
        return stats;
    }

    /**
     * Gets GPA trend data by semester.
     * Returns normalized lowercase keys.
     * 
     * @return List of GPA averages per semester
     */
    public List<Map<String, Object>> getGpaTrend(String department) {
        StringBuilder sql = new StringBuilder(
            "SELECT e.semester, ROUND(AVG(e.gpa), 2) as avg_gpa, COUNT(DISTINCT e.student_id) as student_count " +
            "FROM enrollments e JOIN students s ON e.student_id = s.student_id WHERE 1=1"
        );
        List<Object> params = new ArrayList<>();
        if (department != null && !department.trim().isEmpty()) {
            sql.append(" AND s.department = ?");
            params.add(department);
        }
        sql.append(" GROUP BY e.semester ORDER BY e.semester");
        List<Map<String, Object>> rawResults = jdbc.queryForList(sql.toString(), params.toArray());
        return DatabaseUtil.normalizeKeys(rawResults);
    }

    /**
     * Gets attendance trend data by month.
     * Returns normalized lowercase keys.
     * 
     * @return List of attendance averages per month
     */
    public List<Map<String, Object>> getAttendanceTrend(String department) {
        StringBuilder sql = new StringBuilder(
            "SELECT a.month, ROUND(AVG(a.percentage), 2) as avg_attendance, COUNT(DISTINCT a.student_id) as student_count " +
            "FROM attendance a JOIN students s ON a.student_id = s.student_id WHERE 1=1"
        );
        List<Object> params = new ArrayList<>();
        if (department != null && !department.trim().isEmpty()) {
            sql.append(" AND s.department = ?");
            params.add(department);
        }
        sql.append(" GROUP BY a.month ORDER BY a.month DESC FETCH FIRST 12 ROWS ONLY");
        List<Map<String, Object>> rawResults = jdbc.queryForList(sql.toString(), params.toArray());
        return DatabaseUtil.normalizeKeys(rawResults);
    }

    /**
     * Gets risk summary by category.
     * 
     * @return Map with risk categories and counts
     */
    public Map<String, Object> getRiskSummary(String department) {
        Map<String, Object> summary = new HashMap<>();
        
        // Count by reason (optional department filter)
        StringBuilder reasonSql = new StringBuilder(
            "SELECT rf.reason, COUNT(*) as count FROM risk_flags rf JOIN students s ON rf.student_id = s.student_id WHERE 1=1"
        );
        List<Object> reasonParams = new ArrayList<>();
        if (department != null && !department.trim().isEmpty()) {
            reasonSql.append(" AND s.department = ?");
            reasonParams.add(department);
        }
        reasonSql.append(" GROUP BY rf.reason ORDER BY count DESC");
        List<Map<String, Object>> byReason = jdbc.queryForList(reasonSql.toString(), reasonParams.toArray());
        summary.put("by_reason", DatabaseUtil.normalizeKeys(byReason));
        
        // Recent flags (optional department filter)
        StringBuilder recentSql = new StringBuilder(
            "SELECT rf.flag_id, rf.student_id, s.name, s.roll_number, rf.reason, rf.avg_gpa, rf.avg_attendance, rf.flagged_on " +
            "FROM risk_flags rf JOIN students s ON rf.student_id = s.student_id WHERE 1=1"
        );
        List<Object> recentParams = new ArrayList<>();
        if (department != null && !department.trim().isEmpty()) {
            recentSql.append(" AND s.department = ?");
            recentParams.add(department);
        }
        recentSql.append(" ORDER BY rf.flagged_on DESC FETCH FIRST 10 ROWS ONLY");
        List<Map<String, Object>> recentFlags = jdbc.queryForList(recentSql.toString(), recentParams.toArray());
        summary.put("recent_flags", DatabaseUtil.normalizeKeys(recentFlags));
        
        return summary;
    }

    /**
     * Gets department-wise statistics.
     * Returns normalized lowercase keys.
     * 
     * @return List of stats per department
     */
    public List<Map<String, Object>> getDepartmentStats() {
        String sql = "SELECT s.department, " +
                     "COUNT(DISTINCT s.student_id) as student_count, " +
                     "ROUND(AVG(e.gpa), 2) as avg_gpa, " +
                     "ROUND(AVG(a.percentage), 2) as avg_attendance, " +
                     "COUNT(DISTINCT rf.flag_id) as flagged_count " +
                     "FROM students s " +
                     "LEFT JOIN enrollments e ON s.student_id = e.student_id " +
                     "LEFT JOIN attendance a ON s.student_id = a.student_id " +
                     "LEFT JOIN risk_flags rf ON s.student_id = rf.student_id " +
                     "GROUP BY s.department " +
                     "ORDER BY s.department";
        
        List<Map<String, Object>> rawResults = jdbc.queryForList(sql);
        return DatabaseUtil.normalizeKeys(rawResults);
    }

    /**
     * Gets course-wise performance data.
     * Returns normalized lowercase keys.
     * 
     * @return List of performance metrics per course
     */
    public List<Map<String, Object>> getCoursePerformance() {
        String sql = "SELECT c.course_id, c.course_code, c.course_name, " +
                     "COUNT(DISTINCT e.student_id) as enrolled_count, " +
                     "ROUND(AVG(e.gpa), 2) as avg_gpa, " +
                     "ROUND(AVG(a.percentage), 2) as avg_attendance " +
                     "FROM courses c " +
                     "LEFT JOIN enrollments e ON c.course_id = e.course_id " +
                     "LEFT JOIN attendance a ON c.course_id = a.course_id " +
                     "GROUP BY c.course_id, c.course_code, c.course_name " +
                     "ORDER BY c.course_code";
        
        List<Map<String, Object>> rawResults = jdbc.queryForList(sql);
        return DatabaseUtil.normalizeKeys(rawResults);
    }
}
