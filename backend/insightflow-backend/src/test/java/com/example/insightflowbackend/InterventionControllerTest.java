package com.example.insightflowbackend;

import com.example.insightflowbackend.dto.InterventionRequest;
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
 * Integration tests for InterventionController.
 * Tests intervention creation and retrieval endpoints.
 */
@SpringBootTest
@AutoConfigureMockMvc
public class InterventionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Test retrieving all interventions.
     */
    @Test
    public void testGetAllInterventions() throws Exception {
        mockMvc.perform(get("/api/interventions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    /**
     * Test retrieving interventions for a specific student.
     */
    @Test
    public void testGetInterventionsByStudent() throws Exception {
        mockMvc.perform(get("/api/interventions")
                .param("studentId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    /**
     * Test creating a new intervention.
     */
    @Test
    public void testCreateIntervention() throws Exception {
        InterventionRequest request = new InterventionRequest();
        request.setStudentId(1);
        request.setFacultyId(1);
        request.setInterventionType("counseling");
        request.setNotes("Student needs academic guidance");

        mockMvc.perform(post("/api/interventions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.intervention_id").exists())
                .andExpect(jsonPath("$.data.message").exists());
    }

    /**
     * Test creating intervention with missing required fields.
     */
    @Test
    public void testCreateInterventionMissingFields() throws Exception {
        InterventionRequest request = new InterventionRequest();
        request.setNotes("Missing student and faculty IDs");

        mockMvc.perform(post("/api/interventions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").exists());
    }

    /**
     * Test getting intervention statistics.
     */
    @Test
    public void testGetInterventionStats() throws Exception {
        mockMvc.perform(get("/api/interventions/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.total").exists())
                .andExpect(jsonPath("$.data.pending").exists())
                .andExpect(jsonPath("$.data.completed").exists());
    }
}
