import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosClient from '@/api/axiosClient';
import { API_ENDPOINTS } from '@/api/endpoints';
import type { ApiResponse } from '@/api/types';
import { Loading } from '@/components/Loading';
import { FadeIn } from '@/components/Motion/FadeIn';
import { StaggerContainer, StaggerItem } from '@/components/Motion/StaggerContainer';
import { AnimatedCounter } from '@/components/Motion/AnimatedCounter';
import { AcademicCapIcon, ChartBarIcon, ExclamationTriangleIcon, ChatBubbleLeftRightIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { TiltCard } from '@/components/Motion/TiltCard';

export const StudentDashboardPage: React.FC = () => {
  // Fetch profile to get student_id
  const { data: profile, isLoading: profLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<any>>(API_ENDPOINTS.CONTACT.replace('/contact','/profile'));
      return res.data.data;
    }
  });

  const sid = (profile as any)?.student_id as number | undefined;

  const { data: detail, isLoading } = useQuery({
    queryKey: ['student-self', sid],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<any>>(API_ENDPOINTS.STUDENT_DETAIL(sid!));
      return res.data.data;
    },
    enabled: !!sid,
  });

  if (profLoading || isLoading || !sid) return <Loading message="Loading your dashboard..." />;

  const avgGpa = Number(detail?.avg_gpa ?? 0);
  const avgAttendance = Number(detail?.avg_attendance ?? 0);
  const isAtRisk = Boolean(detail?.is_at_risk);
  const interventions = (detail?.interventions as any[]) ?? [];
  const feedbacks = (detail?.feedbacks as any[]) ?? [];

  return (
    <FadeIn className="space-y-6">
      <div className="bg-gradient-to-br from-navy-900 to-navy-800 rounded-2xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <p className="text-gray-300 mt-1">Your current academic summary and history</p>
      </div>

      {/* Stats Grid */}
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StaggerItem>
          <div className="bg-white rounded-xl p-6 border border-gray-200 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <AcademicCapIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">GPA</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-slate-100"><AnimatedCounter value={avgGpa} decimals={2} /></p>
              </div>
            </div>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="bg-white rounded-xl p-6 border border-gray-200 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">Attendance</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-slate-100"><AnimatedCounter value={avgAttendance} decimals={1} suffix="%" /></p>
              </div>
            </div>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="bg-white rounded-xl p-6 border border-gray-200 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <ExclamationTriangleIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400">Risk Status</p>
                <p className={`text-3xl font-bold ${isAtRisk ? 'text-red-600' : 'text-emerald-600'}`}>{isAtRisk ? 'At Risk' : 'Good'}</p>
              </div>
            </div>
          </div>
        </StaggerItem>
      </StaggerContainer>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interventions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <ClipboardDocumentListIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">Interventions</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">{interventions.length} total</p>
            </div>
          </div>
          {interventions.length === 0 ? (
            <p className="text-gray-500 text-sm dark:text-slate-400">No interventions yet.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {interventions.map((i: any) => (
                <TiltCard key={i.intervention_id}>
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 dark:bg-slate-800 dark:border-slate-700 dark:from-slate-800 dark:to-slate-700">
                    <div className="flex items-center justify-between mb-1">
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-600 text-white">{i.intervention_type}</span>
                      <span className="text-xs text-gray-500 dark:text-slate-400">{new Date(i.created_on).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-slate-200">{i.notes}</p>
                  </div>
                </TiltCard>
              ))}
            </div>
          )}
        </div>
        {/* Feedback */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">Your Feedback</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">{feedbacks.length} entries</p>
            </div>
          </div>
          {feedbacks.length === 0 ? (
            <p className="text-gray-500 text-sm dark:text-slate-400">No feedback yet.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {feedbacks.map((f: any) => (
                <TiltCard key={f.feedback_id}>
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 dark:bg-slate-800 dark:border-slate-700 dark:from-slate-800 dark:to-slate-700">
                    <p className="text-sm text-gray-800 mb-2 dark:text-slate-200">{f.feedback_text}</p>
                    {f.sentiment && (
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        f.sentiment === 'positive' ? 'bg-emerald-600 text-white' : f.sentiment === 'negative' ? 'bg-red-600 text-white' : 'bg-gray-300 text-gray-800'
                      }`}>{f.sentiment}</span>
                    )}
                  </div>
                </TiltCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </FadeIn>
  );
};

export default StudentDashboardPage;
