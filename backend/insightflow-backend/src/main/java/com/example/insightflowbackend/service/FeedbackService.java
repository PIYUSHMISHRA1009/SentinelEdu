package com.example.insightflowbackend.service;

import com.example.insightflowbackend.util.DatabaseUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.stereotype.Service;

import java.sql.CallableStatement;
import java.sql.Timestamp;
import java.sql.Types;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for managing student feedback and sentiment analysis.
 * Integrates with PL/SQL sentiment classification function.
 */
@Service
public class FeedbackService {
    
    private final JdbcTemplate jdbc;

    @Autowired
    public FeedbackService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
        ensureCourseIdSupport();
        ensureFeedbackSequence();
    }

    private void ensureCourseIdSupport() {
        // Add course_id column if it doesn't exist; add FK constraint best-effort
        try {
            jdbc.execute("ALTER TABLE feedback ADD (course_id NUMBER)");
        } catch (Exception ignored) {}
        try {
            jdbc.execute("ALTER TABLE feedback ADD CONSTRAINT fk_feedback_course FOREIGN KEY (course_id) REFERENCES courses(course_id)");
        } catch (Exception ignored) {}
        try {
            jdbc.execute("CREATE INDEX idx_feedback_course ON feedback(course_id)");
        } catch (Exception ignored) {}
    }

    private void ensureFeedbackSequence() {
        try {
            jdbc.execute("CREATE SEQUENCE feedback_seq START WITH 1 INCREMENT BY 1");
        } catch (Exception ignored) {}
    }

    /**
     * Creates a new feedback entry with sentiment analysis.
     * Calls PL/SQL function classify_sentiment if available, otherwise uses basic analysis.
     * 
     * @param studentId Student receiving feedback
     * @param feedbackText Feedback content
    * @param submittedBy Faculty member ID submitting feedback (nullable for student-submitted)
     * @return Map containing feedback ID and sentiment classification
     */
    public Map<String, Object> createFeedback(int studentId, Integer courseId, String feedbackText, Integer submittedBy) {
        // Try to call PL/SQL function for sentiment analysis
        String sentiment = classifySentiment(feedbackText);
        
        // Insert feedback with sentiment
        Integer feedbackId = jdbc.queryForObject("SELECT feedback_seq.NEXTVAL FROM dual", Integer.class);
        if (feedbackId == null) {
            throw new IllegalStateException("Unable to generate feedback id");
        }

        jdbc.update(conn -> {
            java.sql.PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO feedback (feedback_id, student_id, course_id, feedback_text, sentiment, created_on, submitted_by) VALUES (?,?,?,?,?,?,?)"
            );
            ps.setInt(1, feedbackId);
            ps.setInt(2, studentId);
            if (courseId == null) {
                ps.setNull(3, java.sql.Types.INTEGER);
            } else {
                ps.setInt(3, courseId);
            }
            ps.setString(4, feedbackText);
            ps.setString(5, sentiment);
            ps.setTimestamp(6, new Timestamp(System.currentTimeMillis()));
            if (submittedBy == null) {
                ps.setNull(7, java.sql.Types.INTEGER);
            } else {
                ps.setInt(7, submittedBy);
            }
            return ps;
        });
        
        Map<String, Object> result = new HashMap<>();
        result.put("feedback_id", feedbackId);
        result.put("sentiment", sentiment);
        result.put("message", "Feedback submitted successfully");
        
        return result;
    }

    /**
     * Checks whether a student is enrolled in a given course.
     */
    public boolean isStudentEnrolled(int studentId, int courseId) {
        try {
            Integer cnt = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM enrollments WHERE student_id = ? AND course_id = ?",
                    Integer.class, studentId, courseId);
            return cnt != null && cnt > 0;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Classifies sentiment of feedback text.
     * First attempts to call PL/SQL function, falls back to basic keyword analysis.
     * 
     * @param feedbackText Text to analyze
     * @return Sentiment classification: positive, neutral, or negative
     */
    private String classifySentiment(String feedbackText) {
        try {
            // Try to call PL/SQL function
            return jdbc.execute((ConnectionCallback<String>) conn -> {
                try (CallableStatement cs = conn.prepareCall("{? = call classify_sentiment(?)}")) {
                    cs.registerOutParameter(1, Types.VARCHAR);
                    cs.setString(2, feedbackText);
                    cs.execute();
                    return cs.getString(1);
                }
            });
        } catch (Exception e) {
            // Fallback to basic keyword analysis if PL/SQL function not available
            return basicSentimentAnalysis(feedbackText);
        }
    }

    /**
     * Basic sentiment analysis using keyword matching.
     * Used as fallback when PL/SQL function is unavailable.
     * 
     * @param text Text to analyze
     * @return Sentiment: positive, neutral, or negative
     */
    private String basicSentimentAnalysis(String text) {
        String lowerText = text.toLowerCase();
        
        // Positive keywords
        String[] positiveWords = {"excellent", "great", "good", "outstanding", "brilliant", 
                                  "wonderful", "amazing", "fantastic", "impressive", "strong",
                                  "improved", "progress", "dedicated", "talented"};
        
        // Negative keywords
        String[] negativeWords = {"poor", "bad", "terrible", "weak", "struggling", 
                                  "failing", "inadequate", "disappointing", "concern", 
                                  "problem", "issue", "difficulty", "absent"};
        
        int positiveCount = 0;
        int negativeCount = 0;
        
        for (String word : positiveWords) {
            if (lowerText.contains(word)) {
                positiveCount++;
            }
        }
        
        for (String word : negativeWords) {
            if (lowerText.contains(word)) {
                negativeCount++;
            }
        }
        
        if (positiveCount > negativeCount) {
            return "positive";
        } else if (negativeCount > positiveCount) {
            return "negative";
        } else {
            return "neutral";
        }
    }

    /**
     * Public analysis method that returns both sentiment and a simple confidence score (0-1).
     * Does not persist anything to the database.
     *
     * @param text Text to analyze
     * @return Map containing keys 'sentiment' and 'score'
     */
    public Map<String, Object> analyzeText(String text) {
        String lowerText = text != null ? text.toLowerCase() : "";

        String[] positiveWords = {"excellent", "great", "good", "outstanding", "brilliant",
                "wonderful", "amazing", "fantastic", "impressive", "strong",
                "improved", "progress", "dedicated", "talented"};

        String[] negativeWords = {"poor", "bad", "terrible", "weak", "struggling",
                "failing", "inadequate", "disappointing", "concern",
                "problem", "issue", "difficulty", "absent"};

        int positiveCount = 0;
        int negativeCount = 0;

        for (String word : positiveWords) {
            if (lowerText.contains(word)) positiveCount++;
        }
        for (String word : negativeWords) {
            if (lowerText.contains(word)) negativeCount++;
        }

        String sentiment;
        if (positiveCount > negativeCount) sentiment = "positive";
        else if (negativeCount > positiveCount) sentiment = "negative";
        else sentiment = "neutral";

        // Compute a simple confidence score centered at 0.5 and bounded [0,1]
        int total = positiveCount + negativeCount;
        double imbalance = total > 0 ? (Math.abs(positiveCount - negativeCount) / (double) total) : 0.0;
        double score = Math.max(0.0, Math.min(1.0, 0.5 + (imbalance * 0.5)));

        Map<String, Object> result = new HashMap<>();
        result.put("sentiment", sentiment);
        result.put("score", score);
        return result;
    }

    /**
     * Retrieves feedback for a specific student.
     * 
     * @param studentId Student ID
     * @return List of feedback records
     */
    public List<Map<String, Object>> getFeedbackByStudent(int studentId) {
    String sql = "SELECT f.feedback_id, f.student_id, s.name as student_name, " +
             "f.course_id, c.course_code, c.course_name, " +
             "f.feedback_text, f.sentiment, f.created_on, " +
                     "fa.name as submitted_by_name " +
                     "FROM feedback f " +
                     "JOIN students s ON f.student_id = s.student_id " +
             "LEFT JOIN courses c ON f.course_id = c.course_id " +
                     "LEFT JOIN faculty fa ON f.submitted_by = fa.faculty_id " +
                     "WHERE f.student_id = ? " +
                     "ORDER BY f.created_on DESC";
        
        List<Map<String, Object>> rawResults = jdbc.queryForList(sql, studentId);
        return DatabaseUtil.normalizeKeys(rawResults);
    }

    /**
     * Retrieves all feedback records.
     * 
     * @return List of all feedback
     */
    public List<Map<String, Object>> getAllFeedback() {
    String sql = "SELECT f.feedback_id, f.student_id, s.name as student_name, " +
             "s.roll_number, f.course_id, c.course_code, c.course_name, " +
             "f.feedback_text, f.sentiment, f.created_on, " +
                     "fa.name as submitted_by_name " +
                     "FROM feedback f " +
                     "JOIN students s ON f.student_id = s.student_id " +
             "LEFT JOIN courses c ON f.course_id = c.course_id " +
                     "LEFT JOIN faculty fa ON f.submitted_by = fa.faculty_id " +
                     "ORDER BY f.created_on DESC";
        
        List<Map<String, Object>> rawResults = jdbc.queryForList(sql);
        return DatabaseUtil.normalizeKeys(rawResults);
    }

    /**
     * Returns a sanitized copy of feedback records with student identity removed.
     * Used when faculty members need to review feedback without knowing the author.
     */
    public List<Map<String, Object>> anonymizeStudentIdentity(List<Map<String, Object>> records) {
        if (records == null) {
            return java.util.Collections.emptyList();
        }
        List<Map<String, Object>> sanitized = new java.util.ArrayList<>(records.size());
        for (Map<String, Object> record : records) {
            Map<String, Object> copy = new java.util.HashMap<>(record);
            copy.put("student_name", "Anonymous");
            copy.remove("roll_number");
            sanitized.add(copy);
        }
        return sanitized;
    }

    /**
     * Gets sentiment distribution statistics.
     * 
     * @return Map with counts for each sentiment category
     */
    public Map<String, Object> getSentimentStats() {
        String sql = "SELECT " +
                     "COUNT(*) as total, " +
                     "SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END) as positive, " +
                     "SUM(CASE WHEN sentiment = 'neutral' THEN 1 ELSE 0 END) as neutral, " +
                     "SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END) as negative " +
                     "FROM feedback";
        
        return jdbc.queryForMap(sql);
    }
}
