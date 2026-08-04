-- ========================================
-- InsightFlow EDU - Database Verification Script
-- Run this after completing all setup steps
-- ========================================

SET LINESIZE 200
SET PAGESIZE 100
COLUMN table_name FORMAT A20
COLUMN sequence_name FORMAT A25
COLUMN object_name FORMAT A30
COLUMN object_type FORMAT A20

PROMPT ========================================
PROMPT Checking Tables...
PROMPT ========================================
SELECT table_name, num_rows 
FROM user_tables 
ORDER BY table_name;

PROMPT
PROMPT ========================================
PROMPT Checking Sequences...
PROMPT ========================================
SELECT sequence_name, last_number 
FROM user_sequences 
ORDER BY sequence_name;

PROMPT
PROMPT ========================================
PROMPT Checking Indexes...
PROMPT ========================================
SELECT index_name, table_name, uniqueness 
FROM user_indexes 
WHERE table_name IN ('STUDENTS', 'FACULTY', 'COURSES', 'ENROLLMENTS', 
                     'ATTENDANCE', 'RISK_FLAGS', 'INTERVENTIONS', 'FEEDBACK')
ORDER BY table_name, index_name;

PROMPT
PROMPT ========================================
PROMPT Checking PL/SQL Objects...
PROMPT ========================================
SELECT object_name, object_type, status 
FROM user_objects 
WHERE object_type IN ('PROCEDURE', 'FUNCTION', 'TRIGGER')
ORDER BY object_type, object_name;

PROMPT
PROMPT ========================================
PROMPT Checking Table Row Counts...
PROMPT ========================================
SELECT 'FACULTY' as table_name, COUNT(*) as row_count FROM faculty
UNION ALL
SELECT 'STUDENTS', COUNT(*) FROM students
UNION ALL
SELECT 'COURSES', COUNT(*) FROM courses
UNION ALL
SELECT 'ENROLLMENTS', COUNT(*) FROM enrollments
UNION ALL
SELECT 'ATTENDANCE', COUNT(*) FROM attendance
UNION ALL
SELECT 'INTERVENTIONS', COUNT(*) FROM interventions
UNION ALL
SELECT 'FEEDBACK', COUNT(*) FROM feedback
UNION ALL
SELECT 'RISK_FLAGS', COUNT(*) FROM risk_flags
ORDER BY table_name;

PROMPT
PROMPT ========================================
PROMPT Checking Foreign Key Constraints...
PROMPT ========================================
SELECT constraint_name, table_name, constraint_type, status
FROM user_constraints
WHERE constraint_type IN ('R', 'P', 'U', 'C')
AND table_name IN ('STUDENTS', 'FACULTY', 'COURSES', 'ENROLLMENTS', 
                   'ATTENDANCE', 'RISK_FLAGS', 'INTERVENTIONS', 'FEEDBACK')
ORDER BY table_name, constraint_type;

PROMPT
PROMPT ========================================
PROMPT Sample Data Verification
PROMPT ========================================
PROMPT Faculty Members:
SELECT faculty_id, name, username, role FROM faculty ORDER BY faculty_id;

PROMPT
PROMPT Students (First 5):
SELECT student_id, roll_number, name, department, semester 
FROM students 
WHERE ROWNUM <= 5
ORDER BY student_id;

PROMPT
PROMPT Courses:
SELECT course_id, course_code, course_name, credits 
FROM courses 
ORDER BY course_code;

PROMPT
PROMPT ========================================
PROMPT Testing PL/SQL Functions
PROMPT ========================================
PROMPT Testing classify_sentiment function:
SELECT classify_sentiment('This is excellent work, very impressive!') as positive_test FROM DUAL;
SELECT classify_sentiment('Poor performance, needs improvement') as negative_test FROM DUAL;
SELECT classify_sentiment('The student is making progress') as neutral_test FROM DUAL;

PROMPT
PROMPT ========================================
PROMPT Setup Verification Summary
PROMPT ========================================
SELECT 
    'Tables' as object_type,
    COUNT(*) as expected,
    (SELECT COUNT(*) FROM user_tables 
     WHERE table_name IN ('STUDENTS', 'FACULTY', 'COURSES', 'ENROLLMENTS',
                          'ATTENDANCE', 'RISK_FLAGS', 'INTERVENTIONS', 'FEEDBACK')) as actual
FROM DUAL
UNION ALL
SELECT 
    'Sequences',
    8,
    (SELECT COUNT(*) FROM user_sequences) as actual
FROM DUAL
UNION ALL
SELECT 
    'Procedures',
    3,
    (SELECT COUNT(*) FROM user_objects WHERE object_type = 'PROCEDURE') as actual
FROM DUAL
UNION ALL
SELECT 
    'Functions',
    2,
    (SELECT COUNT(*) FROM user_objects WHERE object_type = 'FUNCTION') as actual
FROM DUAL
UNION ALL
SELECT 
    'Triggers',
    2,
    (SELECT COUNT(*) FROM user_objects WHERE object_type = 'TRIGGER') as actual
FROM DUAL
UNION ALL
SELECT 
    'Faculty Records',
    5,
    (SELECT COUNT(*) FROM faculty) as actual
FROM DUAL
UNION ALL
SELECT 
    'Student Records',
    15,
    (SELECT COUNT(*) FROM students) as actual
FROM DUAL
UNION ALL
SELECT 
    'Course Records',
    7,
    (SELECT COUNT(*) FROM courses) as actual
FROM DUAL;

PROMPT
PROMPT ========================================
PROMPT Status Check Complete!
PROMPT ========================================
PROMPT If all expected = actual, setup is successful!
PROMPT ========================================
