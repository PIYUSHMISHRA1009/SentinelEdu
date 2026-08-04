-- Quick diagnostic to verify database setup
-- Run this to check if tables and data exist

PROMPT =====================================================
PROMPT INSIGHTFLOW EDU - DATABASE DIAGNOSTIC CHECK
PROMPT =====================================================
PROMPT 

SET PAGESIZE 100
SET LINESIZE 120
SET FEEDBACK ON

PROMPT Checking tables...
SELECT table_name FROM user_tables ORDER BY table_name;

PROMPT 
PROMPT Checking row counts...
SELECT 'students' AS table_name, COUNT(*) AS row_count FROM students
UNION ALL
SELECT 'faculty', COUNT(*) FROM faculty
UNION ALL
SELECT 'courses', COUNT(*) FROM courses
UNION ALL
SELECT 'enrollments', COUNT(*) FROM enrollments
UNION ALL
SELECT 'risk_flags', COUNT(*) FROM risk_flags
UNION ALL
SELECT 'interventions', COUNT(*) FROM interventions
UNION ALL
SELECT 'feedback', COUNT(*) FROM feedback
UNION ALL
SELECT 'audit_log', COUNT(*) FROM audit_log;

PROMPT 
PROMPT Checking faculty credentials (for login test)...
SELECT faculty_id, username, role, email FROM faculty WHERE ROWNUM <= 3;

PROMPT 
PROMPT Checking student sample...
SELECT student_id, usn, name, semester FROM students WHERE ROWNUM <= 5;

PROMPT 
PROMPT =====================================================
PROMPT Diagnostic check complete!
PROMPT If you see data above, database is properly set up.
PROMPT If tables are empty, run: @run_all_setup.sql
PROMPT =====================================================
