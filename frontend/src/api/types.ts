/**
 * Shared TypeScript type definitions for InsightFlow EDU API
 * Defines all entities, DTOs, and API response shapes
 */

// ============= Core Entities =============

export interface User {
  id: number;
  faculty_id?: number;
  name: string;
  username: string;
  email: string;
  role: UserRole;
}

export type UserRole = 'faculty' | 'academic_head' | 'it' | 'student';

export interface Student {
  student_id: number;
  roll_number: string;
  name: string;  // Backend returns single name field
  email: string;
  contact_number?: string;
  department: string;
  semester: number;
  avg_gpa: number;
  avg_attendance: number;
  risk_flag: boolean;
  created_on?: string;
}

export interface Course {
  course_id: number;
  course_code: string;
  course_name: string;
  department: string;
  credits: number;
  semester: number;
  created_at: string;
}

export interface Enrollment {
  enrollment_id: number;
  student_id: number;
  course_id: number;
  semester: number;
  grade?: string;
  gpa?: number;
  status: 'enrolled' | 'completed' | 'dropped';
  enrolled_on: string;
  course?: Course;
}

export interface Attendance {
  attendance_id: number;
  student_id: number;
  course_id: number;
  attendance_date: string;
  status: 'present' | 'absent' | 'late';
  marked_by?: number;
  created_at: string;
  course?: Course;
}

export interface Intervention {
  intervention_id: number;
  student_id: number;
  faculty_id: number;
  intervention_type: 'counseling' | 'academic_support' | 'mentoring' | 'disciplinary' | 'other';
  notes: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_on: string;
  updated_on?: string;
  faculty?: User;
  student?: Student;
}

export interface Feedback {
  feedback_id: number;
  student_id: number;
  course_id: number;
  feedback_text: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  sentiment_score?: number;
  submitted_on: string;
  analyzed_on?: string;
  student?: Student;
  course?: Course;
}

export interface RiskFlag {
  flag_id: number;
  student_id: number;
  reason: string;
  avg_gpa: number;
  avg_attendance: number;
  flagged_on: string;
  resolved: boolean;
  student?: Student;
}

// ============= API Request/Response DTOs =============

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  role: UserRole;
  user: User;
}

export interface ResetPasswordRequest {
  username: string;
  new_password?: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface ChangePasswordRequest {
  username: string;
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

export interface StudentsListParams {
  search?: string;
  page?: number;
  limit?: number;
  semester?: number;
  department?: string;
}

export interface StudentsListResponse {
  students: Student[];  // Changed from "data" to "students"
  total: number;
  page: number;
  size: number;  // Changed from "limit" to "size"
}

export interface StudentDetailResponse {
  student: Student;
  enrollments: Enrollment[];
  attendance: Attendance[];
  interventions: Intervention[];
  feedbacks: Feedback[];
}

export interface RunRiskRequest {
  gpaThreshold?: number;
  attThreshold?: number;
}

export interface RunRiskResponse {
  status: 'ok';
  flagged: number;
  message: string;
}

export interface CreateInterventionRequest {
  studentId: number;
  facultyId: number;
  interventionType: Intervention['intervention_type'];
  notes: string;
}

export interface CreateEnrollmentRequest {
  courseId: number;
  semester?: number;
  gpa?: number;
  grade?: string;
}

export interface CreateCourseRequest {
  courseCode: string;
  courseName: string;
  department: string;
  credits: number;
  semester?: number;
}

export interface AdminAccount {
  account_type: 'student' | 'staff';
  username: string;
  name?: string;
  email?: string;
  roll_number?: string;
  department?: string;
  role?: UserRole;
  student_id?: number;
  faculty_id?: number;
  last_plaintext_password?: string;
  last_reset_on?: string;
  created_on?: string;
  last_login?: string;
}

export interface AccountEvent {
  event_id: number;
  student_id?: number;
  username?: string;
  event_type: string;
  description?: string;
  created_on: string;
}

export interface ResetPasswordResult {
  username: string;
  password?: string;
  account_type: 'student' | 'staff';
  student_id?: number;
  faculty_id?: number;
  updated?: number;
}

export interface CreateInterventionResponse {
  intervention_id: number;
  created_on: string;
}

export interface CreateFeedbackRequest {
  student_id: number;
  course_id: number;
  feedback_text: string;
}

export interface CreateFeedbackResponse {
  feedback_id: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentiment_score: number;
}

export interface AnalyzeSentimentRequest {
  text: string;
}

export interface AnalyzeSentimentResponse {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
}

export interface ImportCsvResponse {
  errors: Array<{ row: number; message: string }>;
  inserted: number;
}

// ============= Dashboard & Analytics =============

export interface DashboardStats {
  totalStudents: number;
  flaggedStudents: number;
  avgGpa: number;
  avgAttendance: number;
}

export interface GpaTrend {
  semester: string;
  avgGpa: number;
}

export interface AttendanceTrend {
  month: string;
  avgAttendance: number;
}

export interface RiskSummary {
  reason: string;
  count: number;
}

export interface RiskSummaryResponse {
  by_reason: RiskSummary[];
  recent_flags: any[];
}

// ============= Admin & Configuration =============

export interface RiskRulesConfig {
  gpaThreshold: number;
  attendanceThreshold: number;
  autoRunEnabled: boolean;
  notificationsEnabled: boolean;
}

// ============= Contact & Support =============

export interface ContactMessage {
  contact_id?: number; // legacy alias
  message_id?: number; // backend field
  name: string;
  email: string;
  subject?: string;
  message: string;
  submitted_on?: string; // legacy alias
  created_on?: string; // backend field
  reply_text?: string;
  replied_by?: string;
  replied_on?: string;
  status?: 'open' | 'replied' | 'completed';
}

export interface CreateContactRequest {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export interface CreateContactResponse {
  contact_id: number;
  submitted_on: string;
}

// Support tickets
export interface SupportTicket {
  ticket_id: number;
  ticket_code?: string;
  subject: string;
  description: string;
  created_by?: string;
  name?: string;
  email?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_on: string;
  updated_on?: string;
  responses?: SupportResponse[];
}

export interface SupportResponse {
  response_id: number;
  ticket_id: number;
  responder: string;
  message: string;
  created_on: string;
}

export interface DirectMessage {
  message_id: number;
  sender: string;
  recipient: string;
  body: string;
  created_on: string;
}

export interface CreateTicketRequest {
  subject: string;
  description: string;
}

export interface CreateTicketResponse {
  ticket_id: number;
  created_on: string;
}

export interface Faculty {
  faculty_id: number;
  name: string;
  email: string;
  department: string;
  role: UserRole;
}
