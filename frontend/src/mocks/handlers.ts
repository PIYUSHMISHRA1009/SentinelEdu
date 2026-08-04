/**
 * MSW (Mock Service Worker) request handlers
 * Simulates backend API responses for frontend development
 */

import { http, HttpResponse, delay } from 'msw';
import type {
  LoginRequest,
  RunRiskRequest,
  CreateInterventionRequest,
  CreateFeedbackRequest,
  AnalyzeSentimentRequest,
  DirectMessage,
} from '@/api/types';
import {
  mockStudents,
  mockCourses,
  mockEnrollments,
  mockAttendance,
  mockInterventions,
  mockFeedbacks,
  mockRiskFlags,
  mockDashboardStats,
  mockGpaTrends,
  mockAttendanceTrends,
  mockRiskSummary,
  mockFaculty,
} from './mockData';

let mockDirectMessages: DirectMessage[] = [
  {
    message_id: 1,
    sender: 'faculty',
    recipient: 'student1',
    body: 'Reminder: Submit assignment by Friday.',
    created_on: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    message_id: 2,
    sender: 'student1',
    recipient: 'faculty',
    body: 'Noted, professor. I will submit it by tomorrow.',
    created_on: new Date(Date.now() - 3600000).toISOString(),
  },
];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const handlers = [
  // ============= Authentication =============
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as LoginRequest;

    // Mock authentication logic
    const validUsers = [
      { username: 'faculty', password: 'faculty123', role: 'faculty' as const, id: 1, name: 'Dr. Rajesh Kumar' },
      { username: 'admin', password: 'admin123', role: 'academic_head' as const, id: 2, name: 'Prof. Meera Iyer' },
      { username: 'itadmin', password: 'itadmin123', role: 'it' as const, id: 3, name: 'IT Admin' },
    ];

    const user = validUsers.find(
      (u) => u.username === body.username && u.password === body.password
    );

    if (!user) {
      return HttpResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: {
        token: `mock-jwt-token-${user.role}-${Date.now()}`,
        role: user.role,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: `${user.username}@university.edu`,
          role: user.role,
        },
      },
    });
  }),

  // ============= Students =============
  http.get(`${API_BASE_URL}/students`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const page = parseInt(url.searchParams.get('page') || '0');
    const limit = parseInt(url.searchParams.get('limit') || url.searchParams.get('size') || '10');
    const department = url.searchParams.get('department') || '';

    let filtered = mockStudents;

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (s: any) =>
          s.name.toLowerCase().includes(searchLower) ||
          s.roll_number.toLowerCase().includes(searchLower) ||
          s.email.toLowerCase().includes(searchLower)
      );
    }

    // Apply department filter
    if (department) {
  filtered = filtered.filter((s: any) => s.department === department);
    }

    const total = filtered.length;
    const start = page * limit;
    const end = start + limit;
    const paginatedData = filtered.slice(start, end);

    return HttpResponse.json({
      success: true,
      data: {
        students: paginatedData,
        total,
        page,
        size: limit,
      },
    });
  }),

  http.get(`${API_BASE_URL}/students/:id`, async ({ params }) => {
    await delay(300);
    const { id } = params;
    const studentId = parseInt(id as string);
    const student = mockStudents.find((s: any) => s.student_id === studentId);

    if (!student) {
      return HttpResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    const enrollments = mockEnrollments.filter((e) => e.student_id === studentId);
    const attendance = mockAttendance.filter((a) => a.student_id === studentId);
    const interventions = mockInterventions.filter((i) => i.student_id === studentId);
    const feedbacks = mockFeedbacks.filter((f) => f.student_id === studentId);
    const riskFlags = mockRiskFlags.filter((r) => r.student_id === studentId);

    return HttpResponse.json({
      success: true,
      data: {
        ...student,
        enrollments,
        attendance,
        interventions,
        feedbacks,
        risk_flags: riskFlags,
        is_at_risk: riskFlags.length > 0,
      },
    });
  }),

  // ============= Courses =============
  http.get(`${API_BASE_URL}/courses`, async () => {
    await delay(200);
    return HttpResponse.json({
      success: true,
      data: mockCourses,
    });
  }),

  // ============= Risk Management =============
  http.get(`${API_BASE_URL}/risk-flags`, async () => {
    await delay(300);
    return HttpResponse.json({
      success: true,
      data: mockRiskFlags,
    });
  }),

  http.post(`${API_BASE_URL}/run-risk`, async ({ request }) => {
    await delay(1000); // Simulate processing time
    const body = (await request.json()) as RunRiskRequest;

    console.log('Running risk detection with thresholds:', body);

    return HttpResponse.json({
      success: true,
      data: {
        status: 'ok',
        flagged: mockRiskFlags.length,
        message: `Risk detection completed. ${mockRiskFlags.length} students flagged.`,
      },
    });
  }),

  http.get(`${API_BASE_URL}/risk-rules`, async () => {
    await delay(200);
    return HttpResponse.json({
      success: true,
      data: {
        gpaThreshold: 2.5,
        attendanceThreshold: 75.0,
        autoRunEnabled: true,
        notificationsEnabled: true,
      },
    });
  }),

  http.put(`${API_BASE_URL}/risk-rules`, async ({ request }) => {
    await delay(300);
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      data: body,
      message: 'Risk rules updated successfully',
    });
  }),

  // ============= Interventions =============
  http.get(`${API_BASE_URL}/interventions`, async () => {
    await delay(300);
    return HttpResponse.json({
      success: true,
      data: mockInterventions,
    });
  }),

  http.post(`${API_BASE_URL}/interventions`, async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as CreateInterventionRequest;

    const newIntervention = {
      intervention_id: mockInterventions.length + 1,
      ...body,
      status: 'pending' as const,
      created_on: new Date().toISOString(),
    };

  (mockInterventions as any[]).push(newIntervention);

    return HttpResponse.json({
      success: true,
      data: {
        intervention_id: newIntervention.intervention_id,
        created_on: newIntervention.created_on,
      },
    });
  }),

  // ============= Feedback & Sentiment =============
  http.get(`${API_BASE_URL}/feedback`, async () => {
    await delay(300);
    return HttpResponse.json({
      success: true,
      data: mockFeedbacks,
    });
  }),

  http.post(`${API_BASE_URL}/feedback`, async ({ request }) => {
    await delay(600);
    const body = (await request.json()) as CreateFeedbackRequest;

    // Simple sentiment analysis mock
    const text = body.feedback_text.toLowerCase();
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    let score = 0.5;

    if (
      text.includes('great') ||
      text.includes('excellent') ||
      text.includes('good') ||
      text.includes('helpful') ||
      text.includes('enjoy')
    ) {
      sentiment = 'positive';
      score = 0.8 + Math.random() * 0.2;
    } else if (
      text.includes('bad') ||
      text.includes('poor') ||
      text.includes('difficult') ||
      text.includes('struggle') ||
      text.includes('disappointed')
    ) {
      sentiment = 'negative';
      score = 0.7 + Math.random() * 0.2;
    }

    const newFeedback = {
      feedback_id: mockFeedbacks.length + 1,
      ...body,
      sentiment,
      sentiment_score: score,
      submitted_on: new Date().toISOString(),
      analyzed_on: new Date().toISOString(),
    };

    mockFeedbacks.push(newFeedback);

    return HttpResponse.json({
      success: true,
      data: {
        feedback_id: newFeedback.feedback_id,
        sentiment,
        sentiment_score: score,
      },
    });
  }),

  http.post(`${API_BASE_URL}/analyze`, async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as AnalyzeSentimentRequest;

    const text = body.text.toLowerCase();
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    let score = 0.5;

    if (
      text.includes('great') ||
      text.includes('excellent') ||
      text.includes('good') ||
      text.includes('love') ||
      text.includes('amazing')
    ) {
      sentiment = 'positive';
      score = 0.8 + Math.random() * 0.2;
    } else if (
      text.includes('bad') ||
      text.includes('terrible') ||
      text.includes('hate') ||
      text.includes('awful') ||
      text.includes('poor')
    ) {
      sentiment = 'negative';
      score = 0.7 + Math.random() * 0.3;
    }

    return HttpResponse.json({
      success: true,
      data: {
        sentiment,
        score,
      },
    });
  }),

  // ============= Dashboard & Analytics =============
  http.get(`${API_BASE_URL}/dashboard/stats`, async () => {
    await delay(300);
    return HttpResponse.json({
      success: true,
      data: mockDashboardStats,
    });
  }),

  http.get(`${API_BASE_URL}/dashboard/gpa-trends`, async () => {
    await delay(300);
    return HttpResponse.json({
      success: true,
      data: mockGpaTrends,
    });
  }),

  http.get(`${API_BASE_URL}/dashboard/attendance-trends`, async () => {
    await delay(300);
    return HttpResponse.json({
      success: true,
      data: mockAttendanceTrends,
    });
  }),

  http.get(`${API_BASE_URL}/dashboard/risk-summary`, async () => {
    await delay(300);
    return HttpResponse.json({
      success: true,
      data: mockRiskSummary,
    });
  }),

  // ============= Admin =============
  http.post(`${API_BASE_URL}/import/csv`, async () => {
    await delay(1500);
    return HttpResponse.json({
      success: true,
      data: {
        errors: [],
        inserted: 10,
      },
      message: '10 records imported successfully',
    });
  }),

  http.get(`${API_BASE_URL}/admin/accounts`, async () => {
    await delay(200);
    const studentAccounts = mockStudents.slice(0, 6).map((s: any, index: number) => ({
      account_type: 'student',
      student_id: s.student_id,
      roll_number: s.roll_number,
      name: s.name,
      username: `student${index + 1}`,
      last_plaintext_password: `TempPass${index + 1}!`,
      last_reset_on: new Date(Date.now() - index * 86400000).toISOString(),
      created_on: new Date(Date.now() - (index + 5) * 86400000).toISOString(),
      last_login: new Date(Date.now() - index * 5400000).toISOString(),
    }));

    const staffAccounts = mockFaculty.slice(0, 3).map((f: any, index: number) => ({
      account_type: 'staff',
      faculty_id: f.faculty_id,
      name: f.name,
      email: f.email,
      role: f.role,
      department: f.department,
      username: `faculty${index + 1}`,
      last_plaintext_password: index % 2 === 0 ? `ResetPass${index + 1}!` : undefined,
      last_reset_on: index % 2 === 0 ? new Date(Date.now() - (index + 2) * 7200000).toISOString() : undefined,
      created_on: new Date(Date.now() - (index + 10) * 86400000).toISOString(),
      last_login: new Date(Date.now() - (index + 3) * 7200000).toISOString(),
    }));

    return HttpResponse.json({
      success: true,
      data: [...studentAccounts, ...staffAccounts],
    });
  }),

  http.get(`${API_BASE_URL}/admin/accounts/events`, async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const events = Array.from({ length: limit }).map((_, idx) => ({
      event_id: idx + 1,
      student_id: mockStudents[idx % mockStudents.length]?.student_id,
      username: `student${(idx % mockStudents.length) + 1}`,
      event_type: idx % 2 === 0 ? 'ACCOUNT_CREATED' : 'PASSWORD_RESET',
      description: idx % 2 === 0 ? 'New account provisioned via mock API' : 'Temporary password regenerated',
      created_on: new Date(Date.now() - idx * 3600000).toISOString(),
    }));
    return HttpResponse.json({
      success: true,
      data: events,
    });
  }),

  http.get(`${API_BASE_URL}/messages`, async () => {
    await delay(200);
    return HttpResponse.json({
      success: true,
      data: mockDirectMessages,
    });
  }),

  http.post(`${API_BASE_URL}/messages`, async ({ request }) => {
    await delay(200);
    const payload = (await request.json()) as { recipient: string; body: string };
    const newMessage: DirectMessage = {
      message_id: mockDirectMessages.length + 1,
      sender: 'faculty',
      recipient: payload.recipient,
      body: payload.body,
      created_on: new Date().toISOString(),
    };
    mockDirectMessages = [newMessage, ...mockDirectMessages];
    return HttpResponse.json({ success: true, data: { message: 'sent' } });
  }),

  http.get(`${API_BASE_URL}/faculty`, async () => {
    await delay(200);
    return HttpResponse.json({
      success: true,
      data: mockFaculty,
    });
  }),
];
