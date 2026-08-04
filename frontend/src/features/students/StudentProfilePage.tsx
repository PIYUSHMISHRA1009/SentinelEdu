/**
 * Student Profile Page - Detailed view with interventions and feedback
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/api/axiosClient';
import { API_ENDPOINTS } from '@/api/endpoints';
import { Loading } from '@/components/Loading';
import type { ApiResponse } from '@/api/types';
import { FadeIn } from '@/components/Motion/FadeIn';
import { StaggerContainer, StaggerItem } from '@/components/Motion/StaggerContainer';
import { AnimatedCounter } from '@/components/Motion/AnimatedCounter';
import { TiltCard } from '@/components/Motion/TiltCard';
import { AddInterventionForm } from '@/features/interventions/AddInterventionForm';
import { AddEnrollmentForm } from '@/features/students/AddEnrollmentForm';
import { useAuth } from '@/features/auth/AuthProvider';
import { useToast } from '@/components/ToastProvider';
import { 
  ArrowLeftIcon, 
  AcademicCapIcon, 
  ChartBarIcon, 
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

export const StudentProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showAddIntervention, setShowAddIntervention] = useState(false);
  const [showAddEnrollment, setShowAddEnrollment] = useState(false);
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const { addToast } = useToast();
  const manualFlag = useMutation({
    mutationFn: async (reason: string) => {
      const url = `${API_ENDPOINTS.MANUAL_FLAG}?studentId=${id}&reason=${encodeURIComponent(reason)}`;
      const res = await axiosClient.post(url);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-flags'] });
      queryClient.invalidateQueries({ queryKey: ['student', id] });
      // Update header badge and dashboard widgets
      queryClient.invalidateQueries({ queryKey: ['risk-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['gpa-trends'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-trends'] });
      addToast('Student flagged successfully', 'success');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to flag student';
      addToast(message, 'error');
    }
  });

  const removeFlag = useMutation({
    mutationFn: async (flagId: number) => {
      const res = await axiosClient.delete<ApiResponse<any>>(API_ENDPOINTS.UNFLAG(flagId));
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-flags'] });
      queryClient.invalidateQueries({ queryKey: ['student', id] });
      queryClient.invalidateQueries({ queryKey: ['risk-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      addToast('Risk flag removed', 'success');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to remove risk flag';
      addToast(message, 'error');
    }
  });

  // Quick metrics input state and mutation MUST be declared before any conditional returns
  const [gpaInput, setGpaInput] = useState<string>('');
  const [attInput, setAttInput] = useState<string>('');
  const metricsMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {};
      if (gpaInput) payload.avg_gpa = parseFloat(gpaInput);
      if (attInput) payload.avg_attendance = parseFloat(attInput);
      const res = await axiosClient.put(API_ENDPOINTS.STUDENT_METRICS(parseInt(id!)), payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', id] });
      // Auto risk recalculation runs on backend; refresh cached widgets
      queryClient.invalidateQueries({ queryKey: ['risk-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['gpa-trends'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-trends'] });
      addToast('Metrics updated.', 'success');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to update metrics';
      addToast(message, 'error');
    }
  });

  const { data, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: async () => {
      const response = await axiosClient.get<ApiResponse<any>>(
        API_ENDPOINTS.STUDENT_DETAIL(parseInt(id!))
      );
      return response.data.data;
    },
    enabled: !!id,
  });

  if (isLoading) return <Loading message="Loading student profile..." />;
  if (!data) return <div className="p-8 text-center text-gray-400">Student not found</div>;

  // Backend returns student fields at the top-level, not nested under "student"
  const student = {
    name: data.name as string,
    roll_number: data.roll_number as string,
    department: data.department as string,
    avg_gpa: (data.avg_gpa as number) ?? 0,
    avg_attendance: (data.avg_attendance as number) ?? 0,
    risk_flag: Boolean(data.is_at_risk),
  };
  const enrollments = (data.enrollments as any[]) ?? [];
  const interventions = (data.interventions as any[]) ?? [];
  const feedbacks = (data.feedbacks as any[]) ?? [];
  const riskFlags: any[] = (data.risk_flags as any[]) ?? [];
  const latestFlagId = riskFlags.length
    ? (riskFlags[0]?.flag_id ?? riskFlags[riskFlags.length - 1]?.flag_id ?? null)
    : null;

  // Quick metrics update (moved hooks above conditional returns)

  return (
    <FadeIn className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/students')}
          className="p-2 rounded-lg bg-navy-900 text-gray-300 hover:bg-navy-800 hover:text-white transition-all"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-100">Student Profile</h1>
          <p className="text-gray-600 mt-1 dark:text-slate-400">Comprehensive overview and history</p>
        </div>
      </div>

      {/* Hero Card - Student Info */}
      <div className="bg-gradient-to-br from-navy-900 to-navy-800 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">{student.name}</h2>
            <p className="text-gray-300 text-lg">{student.roll_number}</p>
            <p className="text-mint-400 text-lg mt-1">{student.department}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => manualFlag.mutate('Manually flagged from profile')}
                disabled={manualFlag.isPending}
                className="px-3 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-medium disabled:opacity-60"
              >
                {manualFlag.isPending ? 'Flagging…' : 'Flag as At-Risk'}
              </button>
              {student.risk_flag ? (
                <button
                  onClick={() => latestFlagId && removeFlag.mutate(latestFlagId)}
                  disabled={removeFlag.isPending || !latestFlagId}
                  className="px-3 py-2 rounded-lg border border-white/40 text-white text-sm font-medium hover:bg-white/10 disabled:opacity-60"
                >
                  {removeFlag.isPending ? 'Removing…' : 'Remove Flag'}
                </button>
              ) : null}
              <span className={`px-4 py-2 text-sm font-bold rounded-xl shadow-lg ${student.risk_flag ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-green-500 to-teal-500'} text-white`}>
                {student.risk_flag ? '⚠️ At Risk' : '✓ Good Standing'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <StaggerItem>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <AcademicCapIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">GPA</p>
                  <p className="text-3xl font-bold"><AnimatedCounter value={student.avg_gpa} decimals={2} /></p>
                </div>
              </div>
              <p className="text-xs text-gray-400">Grade Point Average</p>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <ChartBarIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Attendance</p>
                  <p className="text-3xl font-bold">
                    <AnimatedCounter value={student.avg_attendance} decimals={1} suffix="%" />
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-400">Overall Attendance Rate</p>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Risk Status</p>
                  <p className="text-3xl font-bold">{student.risk_flag ? 'HIGH' : 'LOW'}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400">Current Risk Level</p>
            </div>
          </StaggerItem>
        </StaggerContainer>

        {(role === 'it' || role === 'academic_head' || role === 'faculty') && (
          <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="text-sm text-gray-200 mb-2 font-medium">Update Metrics (override averages)</div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input type="number" step="0.01" min="0" max="4" placeholder={`GPA (current: ${student.avg_gpa})`} value={gpaInput} onChange={(e)=>setGpaInput(e.target.value)} className="px-3 py-2 rounded-lg bg-white/80 text-gray-800" />
              <input type="number" step="0.1" min="0" max="100" placeholder={`Attendance % (current: ${student.avg_attendance})`} value={attInput} onChange={(e)=>setAttInput(e.target.value)} className="px-3 py-2 rounded-lg bg-white/80 text-gray-800" />
              <button disabled={metricsMutation.isPending} onClick={()=>metricsMutation.mutate()} className="px-4 py-2 rounded-lg bg-gradient-to-r from-mint-500 to-cyan-500 text-white font-medium disabled:opacity-60">{metricsMutation.isPending ? 'Saving…' : 'Save'}</button>
            </div>
            <p className="mt-2 text-xs text-gray-300">These overrides affect lists and profiles without changing historical records.</p>
          </div>
        )}
      </div>

      {/* Course Enrollments */}
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
              <AcademicCapIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">Course Enrollments</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">{enrollments.length} active courses</p>
            </div>
          </div>
          {!showAddEnrollment && (role === 'academic_head' || role === 'faculty' || role === 'it') && (
            <button onClick={() => setShowAddEnrollment(true)} className="px-3 py-2 rounded-lg bg-gradient-to-r from-mint-500 to-cyan-500 text-white text-sm font-medium">+ Add Course</button>
          )}
        </div>

        {showAddEnrollment && (
          <div className="mb-6">
            <AddEnrollmentForm
              studentId={parseInt(id!, 10)}
              onSuccess={() => setShowAddEnrollment(false)}
              onCancel={() => setShowAddEnrollment(false)}
            />
          </div>
        )}

        {enrollments.length === 0 ? (
          <div className="text-center py-12">
            <AcademicCapIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-slate-400">No courses assigned yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider dark:text-slate-300">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider dark:text-slate-300">Semester</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider dark:text-slate-300">GPA</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider dark:text-slate-300">Grade</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-slate-900 dark:divide-slate-800">
                {enrollments.map((enrollment, index) => {
                  const enrollmentId = enrollment.enrollment_id ?? enrollment.enrollmentId ?? `${enrollment.course_id ?? enrollment.courseId ?? 'course'}-${index}`;
                  const courseName = enrollment.course_name ?? enrollment.course?.course_name ?? `Course ${enrollment.course_id ?? enrollment.courseId ?? ''}`;
                  const courseCode = enrollment.course_code ?? enrollment.course?.course_code ?? '';
                  const semesterValue = enrollment.semester ?? enrollment.course_semester ?? '—';
                  const numericGpa = typeof enrollment.gpa === 'number' ? enrollment.gpa : enrollment.gpa ? Number(enrollment.gpa) : undefined;
                  const displayGpa = Number.isFinite(numericGpa as number) ? (numericGpa as number).toFixed(2) : '—';
                  const gradeValue = enrollment.grade ?? enrollment.course_grade ?? '—';

                  return (
                    <tr key={enrollmentId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{courseName}</div>
                        {courseCode ? <div className="text-sm text-gray-500">{courseCode}</div> : null}
                      </td>
                      <td className="px-6 py-4">{semesterValue}</td>
                      <td className="px-6 py-4">{displayGpa}</td>
                      <td className="px-6 py-4 uppercase">{gradeValue || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Interventions Section */}
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <ClipboardDocumentListIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">Interventions</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">{interventions.length} total records</p>
            </div>
            </div>
            {!showAddIntervention && (
              <button onClick={() => setShowAddIntervention(true)} className="px-3 py-2 rounded-lg bg-gradient-to-r from-mint-500 to-cyan-500 text-white text-sm font-medium">+ Add Intervention</button>
            )}
          </div>

          {showAddIntervention && (
            <div className="mb-6">
              <AddInterventionForm studentId={parseInt(id!)} onSuccess={() => setShowAddIntervention(false)} onCancel={() => setShowAddIntervention(false)} />
            </div>
          )}

          {interventions.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardDocumentListIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-slate-400">No interventions recorded yet</p>
            </div>
          ) : (
            <StaggerContainer className="space-y-4 max-h-96 overflow-y-auto">
              {interventions.map((intervention) => (
                <StaggerItem key={intervention.intervention_id}>
                  <TiltCard>
                    <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-all dark:bg-slate-800 dark:border-slate-700 dark:from-slate-800 dark:to-slate-700">
                      <div className="flex items-start justify-between mb-2">
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                          {intervention.intervention_type}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-slate-400">
                          {new Date(intervention.created_on).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed dark:text-slate-200">{intervention.notes}</p>
                      <div className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                        <span className="font-medium">Faculty:</span> {(intervention as any).faculty_name || intervention.faculty?.name || intervention.faculty_id}
                      </div>
                    </div>
                  </TiltCard>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>

        {/* Feedback Section */}
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">Feedback</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">{feedbacks.length} submissions</p>
            </div>
          </div>

          {feedbacks.length === 0 ? (
            <div className="text-center py-12">
              <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-slate-400">No feedback submitted yet</p>
            </div>
          ) : (
            <StaggerContainer className="space-y-4 max-h-96 overflow-y-auto">
              {feedbacks.map((feedback) => (
                <StaggerItem key={feedback.feedback_id}>
                  <TiltCard>
                    <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-all dark:bg-slate-800 dark:border-slate-700 dark:from-slate-800 dark:to-slate-700">
                      <p className="text-sm text-gray-800 leading-relaxed mb-3 dark:text-slate-200">{feedback.feedback_text}</p>
                      {feedback.course_id && (
                        <div className="text-xs text-gray-500 mb-2 dark:text-slate-400">Course: <span className="font-medium">{feedback.course?.course_code || ''} {feedback.course?.course_name || ''}</span></div>
                      )}
                      {feedback.sentiment && (
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                            feedback.sentiment === 'positive' 
                              ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white' 
                              : feedback.sentiment === 'negative' 
                              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' 
                              : 'bg-gray-200 text-gray-700'
                          }`}>
                            {feedback.sentiment === 'positive' ? '😊' : feedback.sentiment === 'negative' ? '😟' : '😐'} {feedback.sentiment}
                          </span>
                        </div>
                      )}
                    </div>
                  </TiltCard>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </div>
    </FadeIn>
  );
};
