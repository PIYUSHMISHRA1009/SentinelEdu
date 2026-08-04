package com.example.insightflowbackend;

import com.example.insightflowbackend.dto.FeedbackRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for FeedbackController.
 * Tests feedback submission and sentiment analysis endpoints.
 */
@SpringBootTest
@AutoConfigureMockMvc
public class FeedbackControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Test submitting feedback with sentiment analysis.
     */
    @Test
    public void testSubmitFeedback() throws Exception {
        FeedbackRequest request = new FeedbackRequest();
        request.setStudentId(1);
        request.setFeedbackText("The student shows excellent progress and dedication");
        request.setSubmittedBy(1);

        mockMvc.perform(post("/api/feedback")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.feedback_id").exists())
                .andExpect(jsonPath("$.data.sentiment").exists())
                .andExpect(jsonPath("$.data.message").exists());
    }

    /**
     * Test submitting feedback with negative sentiment.
     */
    @Test
    public void testSubmitNegativeFeedback() throws Exception {
        FeedbackRequest request = new FeedbackRequest();
        request.setStudentId(1);
        request.setFeedbackText("Poor performance and frequent absences are concerning");
        request.setSubmittedBy(1);

        mockMvc.perform(post("/api/feedback")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.sentiment").value("negative"));
    }

    /**
     * Test submitting feedback with missing required fields.
     */
    @Test
    public void testSubmitFeedbackMissingFields() throws Exception {
        FeedbackRequest request = new FeedbackRequest();
        request.setFeedbackText("Missing student ID");

        mockMvc.perform(post("/api/feedback")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").exists());
    }

    /**
     * Test retrieving feedback for a specific student.
     */
    @Test
    public void testGetFeedbackByStudent() throws Exception {
        mockMvc.perform(get("/api/feedback/student/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    /**
     * Test retrieving all feedback.
     */
    @Test
    public void testGetAllFeedback() throws Exception {
        mockMvc.perform(get("/api/feedback"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    /**
     * Test getting sentiment statistics.
     */
    @Test
    public void testGetSentimentStats() throws Exception {
        mockMvc.perform(get("/api/feedback/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.total").exists())
                .andExpect(jsonPath("$.data.positive").exists())
                .andExpect(jsonPath("$.data.neutral").exists())
                .andExpect(jsonPath("$.data.negative").exists());
    }
}
