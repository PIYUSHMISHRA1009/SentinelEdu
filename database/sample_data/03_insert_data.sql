-- ========================================
-- InsightFlow EDU - Sample Data
-- Test data for development and demonstration
-- ========================================

-- ========================================
-- INSERT FACULTY DATA
-- ========================================
INSERT INTO faculty (faculty_id, name, email, username, password, role, department) VALUES
(faculty_seq.NEXTVAL, 'Dr. Priya Sharma', 'priya.sharma@university.edu', 'faculty', 'faculty123', 'faculty', 'Computer Science');

INSERT INTO faculty (faculty_id, name, email, username, password, role, department) VALUES
(faculty_seq.NEXTVAL, 'Dr. Rajesh Kumar', 'rajesh.kumar@university.edu', 'admin', 'admin123', 'academic_head', 'Administration');

INSERT INTO faculty (faculty_id, name, email, username, password, role, department) VALUES
(faculty_seq.NEXTVAL, 'Mr. Amit Patel', 'amit.patel@university.edu', 'it', 'it123', 'it', 'IT Department');

INSERT INTO faculty (faculty_id, name, email, username, password, role, department) VALUES
(faculty_seq.NEXTVAL, 'Prof. Sunita Reddy', 'sunita.reddy@university.edu', 'sunita', 'faculty123', 'faculty', 'Computer Science');

INSERT INTO faculty (faculty_id, name, email, username, password, role, department) VALUES
(faculty_seq.NEXTVAL, 'Dr. Arun Verma', 'arun.verma@university.edu', 'arun', 'faculty123', 'faculty', 'Electronics');

-- ========================================
-- INSERT COURSES DATA
-- ========================================
INSERT INTO courses (course_id, course_code, course_name, credits, department, semester) VALUES
(course_seq.NEXTVAL, 'CS301', 'Database Management Systems', 4, 'Computer Science', 3);

INSERT INTO courses (course_id, course_code, course_name, credits, department, semester) VALUES
(course_seq.NEXTVAL, 'CS302', 'Software Engineering', 4, 'Computer Science', 3);

INSERT INTO courses (course_id, course_code, course_name, credits, department, semester) VALUES
(course_seq.NEXTVAL, 'CS303', 'Computer Networks', 3, 'Computer Science', 3);

INSERT INTO courses (course_id, course_code, course_name, credits, department, semester) VALUES
(course_seq.NEXTVAL, 'CS304', 'Operating Systems', 4, 'Computer Science', 3);

INSERT INTO courses (course_id, course_code, course_name, credits, department, semester) VALUES
(course_seq.NEXTVAL, 'CS305', 'Machine Learning', 3, 'Computer Science', 5);

INSERT INTO courses (course_id, course_code, course_name, credits, department, semester) VALUES
(course_seq.NEXTVAL, 'EC201', 'Digital Electronics', 4, 'Electronics', 2);

INSERT INTO courses (course_id, course_code, course_name, credits, department, semester) VALUES
(course_seq.NEXTVAL, 'EC202', 'Signals and Systems', 3, 'Electronics', 2);

-- ========================================
-- INSERT STUDENTS DATA
-- ========================================
INSERT INTO students (student_id, roll_number, name, email, department, semester, contact_number) VALUES
(student_seq.NEXTVAL, 'CS2021001', 'Rahul Sharma', 'rahul.sharma@student.edu', 'Computer Science', 3, '9876543210');

INSERT INTO students (student_id, roll_number, name, email, department, semester, contact_number) VALUES
(student_seq.NEXTVAL, 'CS2021002', 'Priya Patel', 'priya.patel@student.edu', 'Computer Science', 3, '9876543211');

INSERT INTO students (student_id, roll_number, name, email, department, semester, contact_number) VALUES
(student_seq.NEXTVAL, 'CS2021003', 'Arjun Desai', 'arjun.desai@student.edu', 'Computer Science', 3, '9876543212');

INSERT INTO students (student_id, roll_number, name, email, department, semester, contact_number) VALUES
(student_seq.NEXTVAL, 'CS2021004', 'Ananya Singh', 'ananya.singh@student.edu', 'Computer Science', 3, '9876543213');

INSERT INTO students (student_id, roll_number, name, email, department, semester, contact_number) VALUES
(student_seq.NEXTVAL, 'CS2021005', 'Vikram Rao', 'vikram.rao@student.edu', 'Computer Science', 3, '9876543214');

INSERT INTO students (student_id, roll_number, name, email, department, semester, contact_number) VALUES
(student_seq.NEXTVAL, 'CS2021006', 'Neha Gupta', 'neha.gupta@student.edu', 'Computer Science', 3, '9876543215');

INSERT INTO students (student_id, roll_number, name, email, department, semester, contact_number) VALUES
(student_seq.NEXTVAL, 'CS2021007', 'Karan Mehta', 'karan.mehta@student.edu', 'Computer Science', 3, '9876543216');

INSERT INTO students (student_id, roll_number, name, email, department, semester, contact_number) VALUES
(student_seq.NEXTVAL, 'CS2021008', 'Sneha Iyer', 'sneha.iyer@student.edu', 'Computer Science', 3, '9876543217');

INSERT INTO students (student_id, roll_number, name, email, department, semester, contact_number) VALUES
(student_seq.NEXTVAL, 'CS2021009', 'Kabir Khanna', 'kabir.khanna@student.edu', 'Computer Science', 3, '9876543218');

INSERT INTO students (student_id, roll_number, name, email, department, semester, contact_number) VALUES
(student_seq.NEXTVAL, 'CS2021010', 'Isha Nair', 'isha.nair@student.edu', 'Computer Science', 3, '9876543219');

INSERT INTO students (student_id, roll_number, name, email, department, semester, contact_number) VALUES
(student_seq.NEXTVAL, 'EC2021001', 'Rohan Kumar', 'rohan.kumar@student.edu', 'Electronics', 2, '9876543220');

INSERT INTO students (student_id, roll_number, name, email, department, semester, contact_number) VALUES
(student_seq.NEXTVAL, 'EC2021002', 'Divya Joshi', 'divya.joshi@student.edu', 'Electronics', 2, '9876543221');

INSERT INTO students (student_id, roll_number, name, email, department, semester, contact_number) VALUES
(student_seq.NEXTVAL, 'CS2020001', 'Aditya Saxena', 'aditya.saxena@student.edu', 'Computer Science', 5, '9876543222');

INSERT INTO students (student_id, roll_number, name, email, department, semester, contact_number) VALUES
(student_seq.NEXTVAL, 'CS2020002', 'Megha Pillai', 'megha.pillai@student.edu', 'Computer Science', 5, '9876543223');

INSERT INTO students (student_id, roll_number, name, email, department, semester, contact_number) VALUES
(student_seq.NEXTVAL, 'CS2020003', 'Siddharth Malhotra', 'siddharth.malhotra@student.edu', 'Computer Science', 5, '9876543224');

-- ========================================
-- INSERT ENROLLMENTS DATA
-- ========================================
-- Semester 3 CS students
INSERT INTO enrollments (enrollment_id, student_id, course_id, semester, gpa, grade) VALUES
(enrollment_seq.NEXTVAL, 1, 1, 3, 3.5, 'A');

INSERT INTO enrollments (enrollment_id, student_id, course_id, semester, gpa, grade) VALUES
(enrollment_seq.NEXTVAL, 1, 2, 3, 3.7, 'A');

INSERT INTO enrollments (enrollment_id, student_id, course_id, semester, gpa, grade) VALUES
(enrollment_seq.NEXTVAL, 1, 3, 3, 3.3, 'B+');

INSERT INTO enrollments (enrollment_id, student_id, course_id, semester, gpa, grade) VALUES
(enrollment_seq.NEXTVAL, 1, 4, 3, 3.8, 'A');

-- Student 2 (At Risk - Low GPA)
INSERT INTO enrollments (enrollment_id, student_id, course_id, semester, gpa, grade) VALUES
(enrollment_seq.NEXTVAL, 2, 1, 3, 2.1, 'C');

INSERT INTO enrollments (enrollment_id, student_id, course_id, semester, gpa, grade) VALUES
(enrollment_seq.NEXTVAL, 2, 2, 3, 2.3, 'C+');

INSERT INTO enrollments (enrollment_id, student_id, course_id, semester, gpa, grade) VALUES
(enrollment_seq.NEXTVAL, 2, 3, 3, 2.0, 'C');

-- Student 3
INSERT INTO enrollments (enrollment_id, student_id, course_id, semester, gpa, grade) VALUES
(enrollment_seq.NEXTVAL, 3, 1, 3, 3.2, 'B+');

INSERT INTO enrollments (enrollment_id, student_id, course_id, semester, gpa, grade) VALUES
(enrollment_seq.NEXTVAL, 3, 2, 3, 3.4, 'B+');

INSERT INTO enrollments (enrollment_id, student_id, course_id, semester, gpa, grade) VALUES
(enrollment_seq.NEXTVAL, 3, 3, 3, 3.0, 'B');

-- Student 4 (At Risk - Low GPA)
INSERT INTO enrollments (enrollment_id, student_id, course_id, semester, gpa, grade) VALUES
(enrollment_seq.NEXTVAL, 4, 1, 3, 1.8, 'D');

INSERT INTO enrollments (enrollment_id, student_id, course_id, semester, gpa, grade) VALUES
(enrollment_seq.NEXTVAL, 4, 2, 3, 2.2, 'C');

INSERT INTO enrollments (enrollment_id, student_id, course_id, semester, gpa, grade) VALUES
(enrollment_seq.NEXTVAL, 4, 3, 3, 2.0, 'C');

-- Student 5
INSERT INTO enrollments (enrollment_id, student_id, course_id, semester, gpa, grade) VALUES
(enrollment_seq.NEXTVAL, 5, 1, 3, 3.9, 'A');

INSERT INTO enrollments (enrollment_id, student_id, course_id, semester, gpa, grade) VALUES
(enrollment_seq.NEXTVAL, 5, 2, 3, 3.8, 'A');

-- ========================================
-- INSERT ATTENDANCE DATA
-- ========================================
-- Good attendance
INSERT INTO attendance (attendance_id, student_id, course_id, month, classes_held, classes_attended) VALUES
(attendance_seq.NEXTVAL, 1, 1, '2024-01', 20, 19);

INSERT INTO attendance (attendance_id, student_id, course_id, month, classes_held, classes_attended) VALUES
(attendance_seq.NEXTVAL, 1, 2, '2024-01', 22, 20);

INSERT INTO attendance (attendance_id, student_id, course_id, month, classes_held, classes_attended) VALUES
(attendance_seq.NEXTVAL, 1, 3, '2024-01', 18, 18);

-- Poor attendance (Student 2 - At Risk)
INSERT INTO attendance (attendance_id, student_id, course_id, month, classes_held, classes_attended) VALUES
(attendance_seq.NEXTVAL, 2, 1, '2024-01', 20, 12);

INSERT INTO attendance (attendance_id, student_id, course_id, month, classes_held, classes_attended) VALUES
(attendance_seq.NEXTVAL, 2, 2, '2024-01', 22, 14);

INSERT INTO attendance (attendance_id, student_id, course_id, month, classes_held, classes_attended) VALUES
(attendance_seq.NEXTVAL, 2, 3, '2024-01', 18, 11);

-- Student 3 - Average attendance
INSERT INTO attendance (attendance_id, student_id, course_id, month, classes_held, classes_attended) VALUES
(attendance_seq.NEXTVAL, 3, 1, '2024-01', 20, 17);

INSERT INTO attendance (attendance_id, student_id, course_id, month, classes_held, classes_attended) VALUES
(attendance_seq.NEXTVAL, 3, 2, '2024-01', 22, 18);

-- Student 4 - Poor attendance (At Risk)
INSERT INTO attendance (attendance_id, student_id, course_id, month, classes_held, classes_attended) VALUES
(attendance_seq.NEXTVAL, 4, 1, '2024-01', 20, 10);

INSERT INTO attendance (attendance_id, student_id, course_id, month, classes_held, classes_attended) VALUES
(attendance_seq.NEXTVAL, 4, 2, '2024-01', 22, 12);

-- Student 5 - Excellent attendance
INSERT INTO attendance (attendance_id, student_id, course_id, month, classes_held, classes_attended) VALUES
(attendance_seq.NEXTVAL, 5, 1, '2024-01', 20, 20);

INSERT INTO attendance (attendance_id, student_id, course_id, month, classes_held, classes_attended) VALUES
(attendance_seq.NEXTVAL, 5, 2, '2024-01', 22, 22);

-- ========================================
-- INSERT INTERVENTIONS DATA
-- ========================================
INSERT INTO interventions (intervention_id, student_id, faculty_id, intervention_type, notes, status) VALUES
(intervention_seq.NEXTVAL, 2, 1, 'counseling', 'Student showing signs of academic stress. Scheduled counseling session.', 'completed');

INSERT INTO interventions (intervention_id, student_id, faculty_id, intervention_type, notes, status) VALUES
(intervention_seq.NEXTVAL, 2, 1, 'academic_support', 'Referred to peer tutoring program for DBMS course.', 'in_progress');

INSERT INTO interventions (intervention_id, student_id, faculty_id, intervention_type, notes, status) VALUES
(intervention_seq.NEXTVAL, 4, 4, 'mentoring', 'Assigned mentor to help with time management and study skills.', 'pending');

-- ========================================
-- INSERT FEEDBACK DATA
-- ========================================
INSERT INTO feedback (feedback_id, student_id, feedback_text, sentiment, submitted_by) VALUES
(feedback_seq.NEXTVAL, 1, 'Rahul shows excellent understanding of database concepts and consistently participates in class discussions.', 'positive', 1);

INSERT INTO feedback (feedback_id, student_id, feedback_text, sentiment, submitted_by) VALUES
(feedback_seq.NEXTVAL, 2, 'Priya needs to improve attendance and focus on assignments. Showing concerning patterns.', 'negative', 1);

INSERT INTO feedback (feedback_id, student_id, feedback_text, sentiment, submitted_by) VALUES
(feedback_seq.NEXTVAL, 3, 'Arjun is making steady progress. Good problem-solving skills observed.', 'positive', 4);

INSERT INTO feedback (feedback_id, student_id, feedback_text, sentiment, submitted_by) VALUES
(feedback_seq.NEXTVAL, 4, 'Ananya is struggling with core concepts. Additional support recommended.', 'negative', 1);

INSERT INTO feedback (feedback_id, student_id, feedback_text, sentiment, submitted_by) VALUES
(feedback_seq.NEXTVAL, 5, 'Vikram is an outstanding student with exceptional analytical abilities.', 'positive', 1);

COMMIT;

-- Display summary
SELECT 'Data insertion complete!' as status FROM DUAL;
SELECT 'Total Faculty: ' || COUNT(*) as count FROM faculty;
SELECT 'Total Students: ' || COUNT(*) as count FROM students;
SELECT 'Total Courses: ' || COUNT(*) as count FROM courses;
SELECT 'Total Enrollments: ' || COUNT(*) as count FROM enrollments;
SELECT 'Total Attendance Records: ' || COUNT(*) as count FROM attendance;
SELECT 'Total Interventions: ' || COUNT(*) as count FROM interventions;
SELECT 'Total Feedback: ' || COUNT(*) as count FROM feedback;
