export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'teacher' | 'student';
  department: string | null;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: number;
  code: string;
  name: string;
  department: string;
  semester: number;
  credits: number;
  teacher_id: number;
  teacher_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: number;
  student_id: number;
  student_name?: string;
  class_id: number;
  class_code?: string;
  enrolled_at: string;
  is_active: boolean;
}

export interface Grade {
  id: number;
  student_id: number;
  student_name?: string;
  class_id: number;
  class_code?: string;
  assignment_name: string;
  score: number;
  max_score: number;
  percentage: number;
  weight: number;
  graded_at: string;
  created_at: string;
}

export interface Attendance {
  id: number;
  student_id: number;
  student_name?: string;
  class_id: number;
  class_code?: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  recorded_at: string;
}

export interface RiskAssessment {
  id: number;
  student_id: number;
  student_name?: string;
  class_id: number | null;
  class_code?: string | null;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  gpa_trend: number | null;
  attendance_trend: number | null;
  factors: string; // JSON string
  assessed_at: string;
}

export interface StudentRiskSummary {
  student_id: number;
  student_name: string;
  roll_number?: string;
  email: string;
  department: string;
  semester: number;
  current_gpa: number | null;
  attendance_rate: number | null;
  risk_score: number | null;
  risk_level: 'low' | 'medium' | 'high' | 'critical' | null;
  gpa_trend: number | null;
  attendance_trend: number | null;
  classes: Class[];
}

export interface TrendPoint {
  date: string;
  value: number;
}

export interface StudentTrends {
  student_id: number;
  gpa_trend: TrendPoint[];
  attendance_trend: TrendPoint[];
}

export interface AttendanceSummary {
  student_id: number;
  class_id: number;
  total_sessions: number;
  present: number;
  late: number;
  excused: number;
  absent: number;
  attendance_rate: number;
}

export interface ClassAttendanceSummary {
  class_id: number;
  class_code: string;
  class_name: string;
  students: AttendanceSummary[];
}

export interface GradeSummary {
  student_id: number;
  overall_gpa: number | null;
  class_gpas: Record<
    string,
    {
      gpa: number;
      class_code: string | null;
      class_name: string | null;
      assignment_count: number;
    }
  >;
  total_assignments: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'teacher' | 'student';
  department?: string;
}
