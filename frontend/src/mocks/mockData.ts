/**
 * Mock data generator for InsightFlow EDU
 * Provides realistic seed data for students, courses, enrollments, etc.
 */

import type {
  Course,
  Enrollment,
  Attendance,
  Intervention,
  Feedback,
  RiskFlag,
  Faculty,
} from '@/api/types';

// ============= Mock Data =============

export const mockCourses: Course[] = [
  {
    course_id: 1,
    course_code: 'CS301',
    course_name: 'Database Management Systems',
    department: 'Computer Science',
    credits: 4,
    semester: 5,
    created_at: '2024-01-15T00:00:00Z',
  },
  {
    course_id: 2,
    course_code: 'CS302',
    course_name: 'Software Engineering',
    department: 'Computer Science',
    credits: 4,
    semester: 5,
    created_at: '2024-01-15T00:00:00Z',
  },
  {
    course_id: 3,
    course_code: 'CS303',
    course_name: 'Computer Networks',
    department: 'Computer Science',
    credits: 3,
    semester: 5,
    created_at: '2024-01-15T00:00:00Z',
  },
  {
    course_id: 4,
    course_code: 'CS304',
    course_name: 'Operating Systems',
    department: 'Computer Science',
    credits: 4,
    semester: 5,
    created_at: '2024-01-15T00:00:00Z',
  },
  {
    course_id: 5,
    course_code: 'CS305',
    course_name: 'Machine Learning',
    department: 'Computer Science',
    credits: 3,
    semester: 6,
    created_at: '2024-01-15T00:00:00Z',
  },
];

export const mockStudents = [
  {
    student_id: 1,
    roll_number: 'CS2021001',
  name: 'Aarav Sharma',
    email: 'aarav.sharma@university.edu',
    phone: '+91-9876543210',
    department: 'Computer Science',
  semester: 5,
    avg_gpa: 3.85,
    avg_attendance: 92.5,
    risk_flag: false,
    created_on: '2021-08-01T00:00:00Z',
  },
  {
    student_id: 2,
    roll_number: 'CS2021002',
  name: 'Priya Patel',
    email: 'priya.patel@university.edu',
    phone: '+91-9876543211',
    department: 'Computer Science',
  semester: 5,
    avg_gpa: 2.45,
    avg_attendance: 68.0,
    risk_flag: true,
    created_on: '2021-08-01T00:00:00Z',
  },
  {
    student_id: 3,
    roll_number: 'CS2021003',
  name: 'Rohan Kumar',
    email: 'rohan.kumar@university.edu',
    phone: '+91-9876543212',
    department: 'Computer Science',
  semester: 5,
    avg_gpa: 3.92,
    avg_attendance: 95.0,
    risk_flag: false,
    created_on: '2021-08-01T00:00:00Z',
  },
  {
    student_id: 4,
    roll_number: 'CS2021004',
  name: 'Ananya Singh',
    email: 'ananya.singh@university.edu',
    phone: '+91-9876543213',
    department: 'Computer Science',
  semester: 5,
    avg_gpa: 2.15,
    avg_attendance: 58.5,
    risk_flag: true,
    created_on: '2021-08-01T00:00:00Z',
  },
  {
    student_id: 5,
    roll_number: 'CS2021005',
  name: 'Arjun Reddy',
    email: 'arjun.reddy@university.edu',
    phone: '+91-9876543214',
    department: 'Computer Science',
  semester: 5,
    avg_gpa: 3.65,
    avg_attendance: 88.0,
    risk_flag: false,
    created_on: '2021-08-01T00:00:00Z',
  },
  {
    student_id: 6,
    roll_number: 'CS2021006',
  name: 'Isha Verma',
    email: 'isha.verma@university.edu',
    department: 'Computer Science',
  semester: 5,
    avg_gpa: 3.78,
    avg_attendance: 91.0,
    risk_flag: false,
    created_on: '2021-08-01T00:00:00Z',
  },
  {
    student_id: 7,
    roll_number: 'CS2021007',
  name: 'Vivaan Gupta',
    email: 'vivaan.gupta@university.edu',
    department: 'Computer Science',
  semester: 5,
    avg_gpa: 2.85,
    avg_attendance: 74.0,
    risk_flag: false,
    created_on: '2021-08-01T00:00:00Z',
  },
  {
    student_id: 8,
    roll_number: 'CS2021008',
  name: 'Diya Joshi',
    email: 'diya.joshi@university.edu',
    department: 'Computer Science',
  semester: 5,
    avg_gpa: 3.95,
    avg_attendance: 96.5,
    risk_flag: false,
    created_on: '2021-08-01T00:00:00Z',
  },
  {
    student_id: 9,
    roll_number: 'CS2021009',
  name: 'Kabir Mehta',
    email: 'kabir.mehta@university.edu',
    department: 'Computer Science',
  semester: 5,
    avg_gpa: 2.35,
    avg_attendance: 65.0,
    risk_flag: true,
    created_on: '2021-08-01T00:00:00Z',
  },
  {
    student_id: 10,
    roll_number: 'CS2021010',
  name: 'Saanvi Iyer',
    email: 'saanvi.iyer@university.edu',
    department: 'Computer Science',
  semester: 5,
    avg_gpa: 3.58,
    avg_attendance: 86.0,
    risk_flag: false,
    created_on: '2021-08-01T00:00:00Z',
  },
  // Additional students for pagination testing
  ...Array.from({ length: 10 }, (_, i) => ({
    student_id: 11 + i,
    roll_number: `CS2021${String(11 + i).padStart(3, '0')}`,
    name: `${['Aditya', 'Mira', 'Vihaan', 'Aisha', 'Reyansh', 'Navya', 'Advait', 'Kiara', 'Atharv', 'Myra'][i]} ${['Shah', 'Nair', 'Desai', 'Rao', 'Shetty', 'Pillai', 'Bhat', 'Kaur', 'Pandey', 'Malhotra'][i]}`,
    email: `student${11 + i}@university.edu`,
    department: 'Computer Science',
    semester: 5,
    avg_gpa: 2.5 + Math.random() * 1.5,
    avg_attendance: 70 + Math.random() * 25,
    risk_flag: Math.random() > 0.7,
    created_on: '2021-08-01T00:00:00Z',
  })),
] as any;

export const mockFaculty: Faculty[] = [
  {
    faculty_id: 1,
    name: 'Dr. Rajesh Kumar',
    email: 'rajesh.kumar@university.edu',
    department: 'Computer Science',
    role: 'faculty',
  },
  {
    faculty_id: 2,
    name: 'Prof. Meera Iyer',
    email: 'meera.iyer@university.edu',
    department: 'Computer Science',
    role: 'academic_head',
  },
  {
    faculty_id: 3,
    name: 'Dr. Amit Sharma',
    email: 'amit.sharma@university.edu',
    department: 'Computer Science',
    role: 'faculty',
  },
];

export const mockEnrollments: Enrollment[] = mockStudents.flatMap((student: any) =>
  mockCourses.slice(0, 4).map((course, idx) => ({
    enrollment_id: student.student_id * 10 + idx,
    student_id: student.student_id,
    course_id: course.course_id,
    semester: 5,
    grade: ['A', 'B+', 'B', 'C+', 'C', 'D'][Math.floor(Math.random() * 6)],
    gpa: student.avg_gpa + (Math.random() - 0.5) * 0.5,
    status: 'enrolled' as const,
    enrolled_on: '2024-08-01T00:00:00Z',
    course,
  }))
);

export const mockAttendance: Attendance[] = mockStudents.flatMap((student: any) =>
  Array.from({ length: 20 }, (_, i) => ({
    attendance_id: student.student_id * 100 + i,
    student_id: student.student_id,
    course_id: mockCourses[i % mockCourses.length].course_id,
    attendance_date: new Date(2024, 8, i + 1).toISOString(),
    status: (Math.random() > (student.avg_attendance / 100) ? 'absent' : 'present') as 'present' | 'absent',
    marked_by: 1,
    created_at: new Date(2024, 8, i + 1).toISOString(),
    course: mockCourses[i % mockCourses.length],
  }))
);

export const mockInterventions: Intervention[] = [
  {
    intervention_id: 1,
    student_id: 2,
    faculty_id: 1,
    intervention_type: 'academic_support',
    notes: 'Student struggling with DBMS concepts. Arranged additional tutoring sessions.',
    status: 'in_progress',
    created_on: '2024-09-15T10:30:00Z',
    updated_on: '2024-09-20T14:00:00Z',
  },
  {
    intervention_id: 2,
    student_id: 4,
    faculty_id: 2,
    intervention_type: 'disciplinary',
    notes: 'Multiple absences noted. Met with student to discuss personal issues affecting attendance.',
    status: 'completed',
    created_on: '2024-09-10T09:00:00Z',
    updated_on: '2024-09-25T16:00:00Z',
  },
  {
    intervention_id: 3,
    student_id: 9,
    faculty_id: 1,
    intervention_type: 'academic_support',
    notes: 'Low performance in recent exams. Recommended joining study group.',
    status: 'pending',
    created_on: '2024-09-28T11:00:00Z',
  },
];

export const mockFeedbacks: Feedback[] = [
  {
    feedback_id: 1,
    student_id: 1,
    course_id: 1,
    feedback_text: 'The professor explains complex database concepts very clearly. Really enjoying the course!',
    sentiment: 'positive',
    sentiment_score: 0.92,
    submitted_on: '2024-09-20T14:30:00Z',
    analyzed_on: '2024-09-20T14:31:00Z',
  },
  {
    feedback_id: 2,
    student_id: 2,
    course_id: 2,
    feedback_text: 'The pace is too fast and I am having difficulty keeping up with assignments.',
    sentiment: 'negative',
    sentiment_score: 0.78,
    submitted_on: '2024-09-18T10:15:00Z',
    analyzed_on: '2024-09-18T10:16:00Z',
  },
  {
    feedback_id: 3,
    student_id: 3,
    course_id: 1,
    feedback_text: 'The course material is comprehensive. Lab sessions are particularly helpful.',
    sentiment: 'positive',
    sentiment_score: 0.85,
    submitted_on: '2024-09-22T16:00:00Z',
    analyzed_on: '2024-09-22T16:01:00Z',
  },
  {
    feedback_id: 4,
    student_id: 5,
    course_id: 3,
    feedback_text: 'The networking labs need better equipment. Otherwise content is good.',
    sentiment: 'neutral',
    sentiment_score: 0.55,
    submitted_on: '2024-09-25T11:30:00Z',
    analyzed_on: '2024-09-25T11:31:00Z',
  },
];

export const mockRiskFlags: RiskFlag[] = [
  {
    flag_id: 1,
    student_id: 2,
    reason: 'Low GPA (2.45) and Low Attendance (68%)',
    avg_gpa: 2.45,
    avg_attendance: 68.0,
    flagged_on: '2024-09-15T08:00:00Z',
    resolved: false,
    student: mockStudents[1],
  },
  {
    flag_id: 2,
    student_id: 4,
    reason: 'Critically Low GPA (2.15) and Poor Attendance (58.5%)',
    avg_gpa: 2.15,
    avg_attendance: 58.5,
    flagged_on: '2024-09-15T08:00:00Z',
    resolved: false,
    student: mockStudents[3],
  },
  {
    flag_id: 3,
    student_id: 9,
    reason: 'Low GPA (2.35) and Below Threshold Attendance (65%)',
    avg_gpa: 2.35,
    avg_attendance: 65.0,
    flagged_on: '2024-09-20T08:00:00Z',
    resolved: false,
    student: mockStudents[8],
  },
];

// Dashboard mock data
export const mockDashboardStats = {
  totalStudents: mockStudents.length,
  flaggedStudents: mockRiskFlags.length,
  avgGpa: mockStudents.reduce((sum: number, s: any) => sum + s.avg_gpa, 0) / mockStudents.length,
  avgAttendance: mockStudents.reduce((sum: number, s: any) => sum + s.avg_attendance, 0) / mockStudents.length,
};

export const mockGpaTrends = [
  { semester: 'Sem 1', avgGpa: 3.2 },
  { semester: 'Sem 2', avgGpa: 3.3 },
  { semester: 'Sem 3', avgGpa: 3.25 },
  { semester: 'Sem 4', avgGpa: 3.4 },
  { semester: 'Sem 5', avgGpa: 3.35 },
];

export const mockAttendanceTrends = [
  { month: 'Aug', avgAttendance: 85 },
  { month: 'Sep', avgAttendance: 82 },
  { month: 'Oct', avgAttendance: 80 },
];

export const mockRiskSummary = [
  { reason: 'Low GPA', count: 3 },
  { reason: 'Poor Attendance', count: 3 },
  { reason: 'Both', count: 2 },
];
