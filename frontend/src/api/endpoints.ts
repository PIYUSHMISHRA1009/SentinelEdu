/**
 * Centralized API endpoint paths for InsightFlow EDU
 */

export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  VALIDATE: '/auth/validate',
  CHANGE_PASSWORD: '/auth/change-password',
  // Health
  HEALTH: '/health',
  HEALTH_DB: '/health/db',

  // Students
  STUDENTS: '/students',
  STUDENT_DETAIL: (id: number) => `/students/${id}`,
  STUDENT_METRICS: (id: number) => `/students/${id}/metrics`,
  STUDENT_ENROLLMENTS: (id: number) => `/students/${id}/enrollments`,
  STUDENT_DEPARTMENTS: '/students/departments',

  // Courses
  COURSES: '/courses',
  COURSE_DETAIL: (id: number) => `/courses/${id}`,

  // Risk Management
  RISK_FLAGS: '/risk/flags',
  RUN_RISK: '/risk/run',
  MANUAL_FLAG: '/risk/flag',
  UNFLAG: (flagId: number) => `/risk/flags/${flagId}`,
  RISK_SUMMARY: '/risk/summary',
  // Config
  RISK_RULES: '/risk/rules',

  // Interventions
  INTERVENTIONS: '/interventions',
  INTERVENTION_DETAIL: (id: number) => `/interventions/${id}`,
  INTERVENTION_UPDATE_STATUS: (id: number) => `/interventions/${id}/status`,
  INTERVENTION_STATS: '/interventions/stats',

  // Feedback & Sentiment Analysis
  FEEDBACK: '/feedback',
  FEEDBACK_STUDENT: (id: number) => `/feedback/student/${id}`,
  FEEDBACK_STATS: '/feedback/stats',
  ANALYZE_SENTIMENT: '/feedback/analyze',

  // Admin
  IMPORT_CSV: '/admin/import/csv',
  EXPORT_CSV: '/admin/export/csv',
  FACULTY: '/admin/faculty',
  ADMIN_RESET_PASSWORD: '/admin/reset-password',
  ADMIN_BACKFILL_STUDENT_AUTH: '/admin/students/backfill-auth',
  ADMIN_ACCOUNTS: '/admin/accounts',
  ADMIN_ACCOUNT_EVENTS: '/admin/accounts/events',

  // Dashboard & Analytics
  DASHBOARD_STATS: '/dashboard/stats',
  DASHBOARD_GPA_TREND: '/dashboard/gpa-trend',
  DASHBOARD_ATTENDANCE_TREND: '/dashboard/attendance-trend',
  DASHBOARD_RISK_SUMMARY: '/dashboard/risk-summary',
  DASHBOARD_DEPARTMENT_STATS: '/dashboard/department-stats',
  DASHBOARD_COURSE_PERFORMANCE: '/dashboard/course-performance',

  // Contact & Support
  CONTACT: '/contact',
  PROFILE: '/profile',
  CONTACT_REPLY: (id: number) => `/contact/${id}/reply`,
  CONTACT_STATUS: (id: number) => `/contact/${id}/status`,
  SUPPORT: '/support',
  SUPPORT_TICKET: (id: number) => `/support/${id}`,
  SUPPORT_REPLY: (id: number) => `/support/${id}/reply`,
  SUPPORT_RESOLVE: (id: number) => `/support/${id}/resolve`,
  // Direct Messages
  MESSAGES: '/messages',
  MESSAGES_SEND: '/messages',
  MESSAGES_LIST: '/messages',
  // Notifications
  NOTIFICATIONS: '/notifications',
  NOTIFICATION_MARK_READ: (id: number) => `/notifications/${id}/read`,
} as const;
