package com.example.insightflowbackend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for StudentController.
 * Tests student listing and profile endpoints.
 */
@SpringBootTest
@AutoConfigureMockMvc
public class StudentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    /**
     * Test retrieving list of students.
     */
    @Test
    public void testGetStudents() throws Exception {
        mockMvc.perform(get("/api/students")
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.students").isArray())
                .andExpect(jsonPath("$.data.total").exists())
                .andExpect(jsonPath("$.data.page").value(0))
                .andExpect(jsonPath("$.data.size").value(10));
    }

    /**
     * Test searching students by name.
     */
    @Test
    public void testSearchStudents() throws Exception {
        mockMvc.perform(get("/api/students")
                .param("search", "test")
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.students").isArray());
    }

    /**
     * Test filtering students by department.
     */
    @Test
    public void testFilterByDepartment() throws Exception {
        mockMvc.perform(get("/api/students")
                .param("department", "Computer Science")
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    /**
     * Test filtering students by semester.
     */
    @Test
    public void testFilterBySemester() throws Exception {
        mockMvc.perform(get("/api/students")
                .param("semester", "3")
                .param("page", "0")
                .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    /**
     * Test getting student profile by ID.
     */
    @Test
    public void testGetStudentProfile() throws Exception {
        // Assuming student with ID 1 exists
        mockMvc.perform(get("/api/students/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.student_id").exists())
                .andExpect(jsonPath("$.data.enrollments").isArray())
                .andExpect(jsonPath("$.data.attendance").isArray())
                .andExpect(jsonPath("$.data.interventions").isArray())
                .andExpect(jsonPath("$.data.feedbacks").isArray());
    }

    /**
     * Test getting departments list.
     */
    @Test
    public void testGetDepartments() throws Exception {
        mockMvc.perform(get("/api/students/departments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }
}
