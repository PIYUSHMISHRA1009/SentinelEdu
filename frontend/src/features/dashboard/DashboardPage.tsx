/**
 * Dashboard page - main landing after login
 * Shows KPIs, charts, and risk summary
 */

import React, { useEffect, useState } from 'react';
import { FadeIn } from '@/components/Motion/FadeIn';
import { StaggerContainer, StaggerItem } from '@/components/Motion/StaggerContainer';
import { AnimatedCounter } from '@/components/Motion/AnimatedCounter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/api/axiosClient';
import { API_ENDPOINTS } from '@/api/endpoints';
import { Loading } from '@/components/Loading';
import { GpaChart } from './GpaChart';
import { AttendanceChart } from './AttendanceChart';
import { RiskSummaryWidget } from './RiskSummaryWidget';
import type { ApiResponse, DashboardStats, GpaTrend, AttendanceTrend, RiskSummaryResponse } from '@/api/types';
import { AcademicCapIcon, UserGroupIcon, ExclamationTriangleIcon, ChartBarIcon } from '@heroicons/react/24/outline';

/**
 * Main dashboard component with KPI cards, filters, and visualization widgets
 */
export const DashboardPage: React.FC = () => {
  const [semester, setSemester] = useState<number | undefined>();
  const [department, setDepartment] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', semester, department],
    queryFn: async () => {
      const response = await axiosClient.get<ApiResponse<DashboardStats>>(API_ENDPOINTS.DASHBOARD_STATS, {
        params: {
          semester: semester || undefined,
          department: department || undefined,
        },
      });
      return response.data.data;
    },
  });

  // Fetch GPA trends
  const { data: gpaTrends, isLoading: gpaLoading } = useQuery({
    queryKey: ['gpa-trends', semester, department],
    queryFn: async () => {
      const response = await axiosClient.get<ApiResponse<any[]>>(API_ENDPOINTS.DASHBOARD_GPA_TREND, {
        params: { department: department || undefined },
      });
      // Backend returns snake_case keys; map to chart-friendly camelCase
      const raw = response.data.data || [];
      return raw.map((r: any) => ({
        semester: r.semester,
        avgGpa: Number(r.avg_gpa ?? r.avggpa ?? 0),
      })) as GpaTrend[];
    },
  });

  // Fetch attendance trends
  const { data: attendanceTrends, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance-trends', semester, department],
    queryFn: async () => {
      const response = await axiosClient.get<ApiResponse<any[]>>(API_ENDPOINTS.DASHBOARD_ATTENDANCE_TREND, {
        params: { department: department || undefined },
      });
      const raw = response.data.data || [];
      return raw.map((r: any) => ({
        month: r.month,
        avgAttendance: Number(r.avg_attendance ?? r.avgattendance ?? 0),
      })) as AttendanceTrend[];
    },
  });

  // Fetch risk summary
  const { data: riskSummary, isLoading: riskLoading } = useQuery({
    queryKey: ['risk-summary'],
    queryFn: async () => {
      const response = await axiosClient.get<ApiResponse<RiskSummaryResponse>>(API_ENDPOINTS.DASHBOARD_RISK_SUMMARY, {
        params: { department: department || undefined },
      });
      // Extract the by_reason array from the response
      return response.data.data?.by_reason || [];
    },
    // Auto-refresh so user doesn't need to reload the page
    refetchInterval: 30000,
    staleTime: 15000,
  });

  // Subscribe to backend SSE and refresh risk summary when events arrive
  useEffect(() => {
    try {
      const base = (axiosClient.defaults.baseURL || '').replace(/\/$/, '');
      if (!base) return;
      const es = new EventSource(`${base}/risk/stream`, { withCredentials: true });
      const onAny = () => queryClient.invalidateQueries({ queryKey: ['risk-summary'] });
      es.addEventListener('risk-summary', onAny);
      es.addEventListener('message', onAny);
      es.onerror = () => {};
      return () => {
        try { es.close(); } catch {}
      };
    } catch {
      // Ignore when EventSource is not available (tests/older browsers)
    }
  }, [queryClient]);

  if (statsLoading) {
    return <Loading message="Loading dashboard..." />;
  }

  return (
    <FadeIn className="space-y-6">
      <div className="space-y-8">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-navy-900 to-navy-800 rounded-2xl p-8 text-white">
          <h1 className="text-4xl font-bold mb-2">Welcome back</h1>
          <p className="text-gray-300 text-lg">
            Track student performance, detect risks, and improve outcomes.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex flex-wrap gap-4">
            <div>
              <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-2 dark:text-slate-300">
                Semester
              </label>
              <select
                id="semester"
                value={semester || ''}
                onChange={(e) => setSemester(e.target.value ? parseInt(e.target.value) : undefined)}
                className="block w-32 rounded-lg border-gray-300 shadow-sm focus:border-mint-500 focus:ring-mint-500 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
              >
                <option value="">All</option>
                <option value="1">Sem 1</option>
                <option value="2">Sem 2</option>
                <option value="3">Sem 3</option>
                <option value="4">Sem 4</option>
                <option value="5">Sem 5</option>
                <option value="6">Sem 6</option>
              </select>
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2 dark:text-slate-300">
                Department
              </label>
              <select
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="block w-48 rounded-lg border-gray-300 shadow-sm focus:border-mint-500 focus:ring-mint-500 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
              >
                <option value="">All Departments</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Electronics">Electronics</option>
                <option value="Mechanical">Mechanical</option>
              </select>
            </div>
          </div>
        </div>

        {/* KPI Cards - Gradient Backgrounds */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StaggerItem>
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-100">Total Students</p>
                  <p className="mt-2 text-4xl font-bold">
                    <AnimatedCounter value={stats?.totalStudents || 0} />
                  </p>
                </div>
                <UserGroupIcon className="h-12 w-12 text-white/80" />
              </div>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-100">Flagged Students</p>
                  <p className="mt-2 text-4xl font-bold">
                    <AnimatedCounter value={stats?.flaggedStudents || 0} />
                  </p>
                </div>
                <ExclamationTriangleIcon className="h-12 w-12 text-white/80" />
              </div>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-100">Average GPA</p>
                  <p className="mt-2 text-4xl font-bold">
                    <AnimatedCounter value={stats?.avgGpa || 0} decimals={2} />
                  </p>
                </div>
                <AcademicCapIcon className="h-12 w-12 text-white/80" />
              </div>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-100">Avg Attendance</p>
                  <p className="mt-2 text-4xl font-bold">
                    <AnimatedCounter value={stats?.avgAttendance || 0} decimals={1} suffix="%" />
                  </p>
                </div>
                <ChartBarIcon className="h-12 w-12 text-white/80" />
              </div>
            </div>
          </StaggerItem>
        </StaggerContainer>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 dark:bg-slate-900 dark:border-slate-800">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-slate-100">GPA Trend</h3>
            {gpaLoading ? (
              <Loading message="Loading chart..." />
            ) : (
              <GpaChart data={gpaTrends || []} />
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 dark:bg-slate-900 dark:border-slate-800">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-slate-100">Attendance Trend</h3>
            {attendanceLoading ? (
              <Loading message="Loading chart..." />
            ) : (
              <AttendanceChart data={attendanceTrends || []} />
            )}
          </div>
        </div>

        {/* Risk Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 dark:bg-slate-900 dark:border-slate-800">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-slate-100">Risk Summary by Reason</h3>
          {riskLoading ? (
            <Loading message="Loading risk data..." />
          ) : (
            <RiskSummaryWidget data={riskSummary || []} />
          )}
        </div>
      </div>
    </FadeIn>
  );
};

// (Removed unused KPICard component)
