package com.example.insightflowbackend;

import com.example.insightflowbackend.dto.RiskRequest;
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
 * Integration tests for RiskController.
 * Tests risk detection engine endpoints.
 */
@SpringBootTest
@AutoConfigureMockMvc
public class RiskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Test running risk detection engine.
     */
    @Test
    public void testRunRiskDetection() throws Exception {
        RiskRequest request = new RiskRequest();
        request.setGpaThreshold(2.5);
        request.setAttendanceThreshold(75);

        mockMvc.perform(post("/api/risk/run")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.message").exists())
                .andExpect(jsonPath("$.data.flaggedCount").exists());
    }

    /**
     * Test retrieving risk flags.
     */
    @Test
    public void testGetRiskFlags() throws Exception {
        mockMvc.perform(get("/api/risk/flags"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    /**
     * Test getting risk summary.
     */
    @Test
    public void testGetRiskSummary() throws Exception {
        mockMvc.perform(get("/api/risk/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.flaggedCount").exists());
    }
}
