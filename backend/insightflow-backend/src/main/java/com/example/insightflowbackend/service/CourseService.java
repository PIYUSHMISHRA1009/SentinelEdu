package com.example.insightflowbackend.service;

import com.example.insightflowbackend.util.DatabaseUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Service for course operations.
 */
@Service
public class CourseService {
    
    private final JdbcTemplate jdbc;

    @Autowired
    public CourseService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * Retrieves all courses with normalized keys.
     * 
     * @return List of all courses
     */
    public List<Map<String, Object>> getAllCourses() {
        String sql = "SELECT course_id, course_code, course_name, credits, department, semester " +
                     "FROM courses " +
                     "ORDER BY course_code";
        
        List<Map<String, Object>> rawResults = jdbc.queryForList(sql);
        return DatabaseUtil.normalizeKeys(rawResults);
    }

    /**
     * Creates a new course and returns the created record data.
     *
     * @param courseCode Unique course code
     * @param courseName Course name
     * @param department Department name
     * @param credits Number of credits (>0)
     * @param semester Optional semester (1-8)
     * @return Map containing created course fields
     */
    public Map<String, Object> createCourse(String courseCode, String courseName, String department, int credits, Integer semester) {
        // Generate ID from sequence first
        Integer courseId = jdbc.queryForObject("SELECT course_seq.NEXTVAL FROM dual", Integer.class);

        String insertSql = "INSERT INTO courses (course_id, course_code, course_name, credits, department, semester) " +
                           "VALUES (?, ?, ?, ?, ?, ?)";

        jdbc.update(insertSql, courseId, courseCode, courseName, credits, department, semester);

        Map<String, Object> created = new java.util.HashMap<>();
        created.put("course_id", courseId);
        created.put("course_code", courseCode);
        created.put("course_name", courseName);
        created.put("department", department);
        created.put("credits", credits);
        created.put("semester", semester);

        return DatabaseUtil.normalizeKeys(created);
    }
}
