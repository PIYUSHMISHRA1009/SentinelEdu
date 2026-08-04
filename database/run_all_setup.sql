-- ========================================
-- InsightFlow EDU - Complete Database Setup Script
-- Run this script to execute all database setup steps in order
-- ========================================

SET ECHO ON
SET FEEDBACK ON
SET SERVEROUTPUT ON

PROMPT ========================================
PROMPT InsightFlow EDU - Database Setup
PROMPT ========================================
PROMPT
PROMPT This script will:
PROMPT   1. Create all tables (8 tables)
PROMPT   2. Create sequences (8 sequences)
PROMPT   3. Create indexes (10 indexes)
PROMPT
PROMPT Starting setup...
PROMPT

PROMPT
PROMPT ========================================
PROMPT STEP 1: Creating Tables and Sequences
PROMPT ========================================
@E:\Projects\PSE\insightflow-edu\database\ddl\01_create_tables.sql

PROMPT
PROMPT ========================================
PROMPT STEP 1 VERIFICATION
PROMPT ========================================
SELECT 'Tables Created: ' || COUNT(*) as result FROM user_tables;
SELECT 'Sequences Created: ' || COUNT(*) as result FROM user_sequences;

PROMPT
PROMPT ========================================
PROMPT STEP 2: Creating PL/SQL Procedures and Functions
PROMPT ========================================
@E:\Projects\PSE\insightflow-edu\database\plsql\02_procedures_functions.sql

PROMPT
PROMPT ========================================
PROMPT STEP 2 VERIFICATION
PROMPT ========================================
SELECT object_type, COUNT(*) as count 
FROM user_objects 
WHERE object_type IN ('PROCEDURE', 'FUNCTION', 'TRIGGER')
GROUP BY object_type;

PROMPT
PROMPT ========================================
PROMPT STEP 3: Loading Sample Data
PROMPT ========================================
@E:\Projects\PSE\insightflow-edu\database\sample_data\03_insert_data.sql

PROMPT
PROMPT ========================================
PROMPT STEP 3 VERIFICATION - Row Counts
PROMPT ========================================
SELECT 'Faculty: ' || COUNT(*) FROM faculty UNION ALL
SELECT 'Students: ' || COUNT(*) FROM students UNION ALL
SELECT 'Courses: ' || COUNT(*) FROM courses UNION ALL
SELECT 'Enrollments: ' || COUNT(*) FROM enrollments UNION ALL
SELECT 'Attendance: ' || COUNT(*) FROM attendance UNION ALL
SELECT 'Interventions: ' || COUNT(*) FROM interventions UNION ALL
SELECT 'Feedback: ' || COUNT(*) FROM feedback UNION ALL
SELECT 'Risk Flags: ' || COUNT(*) FROM risk_flags;

PROMPT
PROMPT ========================================
PROMPT COMPLETE VERIFICATION
PROMPT ========================================
@E:\Projects\PSE\insightflow-edu\database\verify_setup.sql

PROMPT
PROMPT ========================================
PROMPT Setup Complete!
PROMPT ========================================
PROMPT
PROMPT Next Steps:
PROMPT   1. Exit SQL*Plus (type 'exit')
PROMPT   2. Navigate to backend folder
PROMPT   3. Run: mvn spring-boot:run
PROMPT   4. Access API at http://localhost:8080
PROMPT
PROMPT Demo Credentials:
PROMPT   Faculty: faculty/faculty123
PROMPT   Admin: admin/admin123
PROMPT   IT: itadmin/itadmin123
PROMPT ========================================
