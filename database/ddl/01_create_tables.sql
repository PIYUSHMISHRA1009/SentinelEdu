-- ========================================
-- InsightFlow EDU - Complete DDL Script
-- Database Schema for Student Performance Tracking System
-- ========================================

-- Drop existing tables (in correct order to handle foreign keys)
DROP TABLE feedback CASCADE CONSTRAINTS;
DROP TABLE interventions CASCADE CONSTRAINTS;
DROP TABLE risk_flags CASCADE CONSTRAINTS;
DROP TABLE attendance CASCADE CONSTRAINTS;
DROP TABLE enrollments CASCADE CONSTRAINTS;
DROP TABLE courses CASCADE CONSTRAINTS;
DROP TABLE students CASCADE CONSTRAINTS;
DROP TABLE faculty CASCADE CONSTRAINTS;

-- Drop sequences
DROP SEQUENCE student_seq;
DROP SEQUENCE course_seq;
DROP SEQUENCE enrollment_seq;
DROP SEQUENCE attendance_seq;
DROP SEQUENCE intervention_seq;
DROP SEQUENCE feedback_seq;
DROP SEQUENCE risk_flag_seq;
DROP SEQUENCE faculty_seq;

-- Create sequences
CREATE SEQUENCE student_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE course_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE enrollment_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE attendance_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE intervention_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE feedback_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE risk_flag_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE faculty_seq START WITH 1 INCREMENT BY 1;

-- ========================================
-- FACULTY TABLE
-- ========================================
CREATE TABLE faculty (
    faculty_id NUMBER PRIMARY KEY,
    name VARCHAR2(100) NOT NULL,
    email VARCHAR2(100) UNIQUE NOT NULL,
    username VARCHAR2(50) UNIQUE NOT NULL,
    password VARCHAR2(100),
    password_hash VARCHAR2(200),
    role VARCHAR2(20) CHECK (role IN ('faculty', 'academic_head', 'it')) NOT NULL,
    contact_number VARCHAR2(15),
    department VARCHAR2(100),
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- STUDENTS TABLE
-- ========================================
CREATE TABLE students (
    student_id NUMBER PRIMARY KEY,
    roll_number VARCHAR2(20) UNIQUE NOT NULL,
    name VARCHAR2(100) NOT NULL,
    email VARCHAR2(100) UNIQUE NOT NULL,
    department VARCHAR2(100) NOT NULL,
    semester NUMBER CHECK (semester BETWEEN 1 AND 8) NOT NULL,
    contact_number VARCHAR2(15),
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- COURSES TABLE
-- ========================================
CREATE TABLE courses (
    course_id NUMBER PRIMARY KEY,
    course_code VARCHAR2(20) UNIQUE NOT NULL,
    course_name VARCHAR2(100) NOT NULL,
    credits NUMBER CHECK (credits > 0) NOT NULL,
    department VARCHAR2(100) NOT NULL,
    semester NUMBER CHECK (semester BETWEEN 1 AND 8)
);

-- ========================================
-- ENROLLMENTS TABLE
-- ========================================
CREATE TABLE enrollments (
    enrollment_id NUMBER PRIMARY KEY,
    student_id NUMBER NOT NULL,
    course_id NUMBER NOT NULL,
    semester NUMBER NOT NULL,
    gpa NUMBER(3,2) CHECK (gpa BETWEEN 0 AND 4.0),
    grade VARCHAR2(2),
    enrolled_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    UNIQUE (student_id, course_id, semester)
);

-- ========================================
-- ATTENDANCE TABLE
-- ========================================
CREATE TABLE attendance (
    attendance_id NUMBER PRIMARY KEY,
    student_id NUMBER NOT NULL,
    course_id NUMBER NOT NULL,
    month VARCHAR2(20) NOT NULL,
    classes_held NUMBER DEFAULT 0,
    classes_attended NUMBER DEFAULT 0,
    percentage NUMBER(5,2) CHECK (percentage BETWEEN 0 AND 100),
    recorded_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

-- ========================================
-- RISK FLAGS TABLE
-- ========================================
CREATE TABLE risk_flags (
    flag_id NUMBER PRIMARY KEY,
    student_id NUMBER NOT NULL,
    reason VARCHAR2(500),
    avg_gpa NUMBER(3,2),
    avg_attendance NUMBER(5,2),
    flagged_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- ========================================
-- INTERVENTIONS TABLE
-- ========================================
CREATE TABLE interventions (
    intervention_id NUMBER PRIMARY KEY,
    student_id NUMBER NOT NULL,
    faculty_id NUMBER NOT NULL,
    intervention_type VARCHAR2(50) NOT NULL CHECK (intervention_type IN (
        'counseling', 'academic_support', 'mentoring', 'disciplinary', 'other'
    )),
    notes CLOB,
    status VARCHAR2(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES faculty(faculty_id) ON DELETE CASCADE
);

-- ========================================
-- FEEDBACK TABLE
-- ========================================
CREATE TABLE feedback (
    feedback_id NUMBER PRIMARY KEY,
    student_id NUMBER NOT NULL,
    feedback_text CLOB NOT NULL,
    sentiment VARCHAR2(20) CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_by NUMBER,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (submitted_by) REFERENCES faculty(faculty_id) ON DELETE SET NULL
);

-- ========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX idx_student_dept ON students(department);
CREATE INDEX idx_student_semester ON students(semester);
CREATE INDEX idx_enrollment_student ON enrollments(student_id);
CREATE INDEX idx_enrollment_course ON enrollments(course_id);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_course ON attendance(course_id);
CREATE INDEX idx_risk_student ON risk_flags(student_id);
CREATE INDEX idx_intervention_student ON interventions(student_id);
CREATE INDEX idx_intervention_faculty ON interventions(faculty_id);
CREATE INDEX idx_feedback_student ON feedback(student_id);
-- Note: idx_faculty_username not needed - UNIQUE constraint on username already creates an index

-- ========================================
-- GRANT PERMISSIONS (Skip if running as INSIGHTFLOW user)
-- Only needed if tables are created by a different user
-- ========================================
-- GRANT SELECT, INSERT, UPDATE, DELETE ON students TO INSIGHTFLOW;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON courses TO INSIGHTFLOW;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON enrollments TO INSIGHTFLOW;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON attendance TO INSIGHTFLOW;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON risk_flags TO INSIGHTFLOW;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON interventions TO INSIGHTFLOW;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON feedback TO INSIGHTFLOW;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON faculty TO INSIGHTFLOW;

-- GRANT SELECT, ALTER ON student_seq TO INSIGHTFLOW;
-- GRANT SELECT, ALTER ON course_seq TO INSIGHTFLOW;
-- GRANT SELECT, ALTER ON enrollment_seq TO INSIGHTFLOW;
-- GRANT SELECT, ALTER ON attendance_seq TO INSIGHTFLOW;
-- GRANT SELECT, ALTER ON intervention_seq TO INSIGHTFLOW;
-- GRANT SELECT, ALTER ON feedback_seq TO INSIGHTFLOW;
-- GRANT SELECT, ALTER ON risk_flag_seq TO INSIGHTFLOW;
-- GRANT SELECT, ALTER ON faculty_seq TO INSIGHTFLOW;

COMMIT;
