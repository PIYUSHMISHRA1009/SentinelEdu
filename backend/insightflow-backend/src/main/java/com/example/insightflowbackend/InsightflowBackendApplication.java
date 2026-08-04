package com.example.insightflowbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
 

@SpringBootApplication
public class InsightflowBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(InsightflowBackendApplication.class, args);
    }

    // Seed a demo student account for login (student/student123) if missing
    @Bean
    CommandLineRunner seedDemoStudent(JdbcTemplate jdbc) {
        return args -> {
            try {
                Integer exists = jdbc.queryForObject("SELECT COUNT(*) FROM student_auth WHERE username='student'", Integer.class);
                if (exists == null || exists == 0) {
                    // Create a demo student if none exists
                    jdbc.update("INSERT INTO students (student_id, roll_number, name, email, department, semester, contact_number, created_on) VALUES (student_seq.NEXTVAL, ?, ?, ?, ?, ?, ?, SYSTIMESTAMP)",
                            "STU-DEMO-1", "Demo Student", "student@example.edu", "Computer Science", 1, "+1-555-0100");
                    Integer sid = jdbc.queryForObject("SELECT student_seq.CURRVAL FROM dual", Integer.class);
                    jdbc.update("INSERT INTO student_auth (student_id, username, password, created_on) VALUES (?,?,?, SYSTIMESTAMP)",
                            sid, "student", "student123");
                }
            } catch (Exception ignored) {}
        };
    }

}
