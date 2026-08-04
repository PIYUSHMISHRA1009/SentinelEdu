/**
 * Risk Panel Page - Display risk flags and run risk detection
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/api/axiosClient';
import { API_ENDPOINTS } from '@/api/endpoints';
import { Loading } from '@/components/Loading';
import { useAuth } from '@/features/auth/AuthProvider';
import type { ApiResponse, RiskFlag, RunRiskResponse, RiskRulesConfig } from '@/api/types';
import { useToast } from '@/components/ToastProvider';
import { FadeIn } from '@/components/Motion/FadeIn';
import { StaggerContainer, StaggerItem } from '@/components/Motion/StaggerContainer';
import { AnimatedCounter } from '@/components/Motion/AnimatedCounter';
import { TiltCard } from '@/components/Motion/TiltCard';
import { MagneticButton } from '@/components/Motion/MagneticButton';
import { 
  ExclamationTriangleIcon, 
  PlayIcon, 
  ChartBarIcon,
  UserGroupIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

export const RiskPanelPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const [gpaThreshold, setGpaThreshold] = useState(2.5);
  const [attThreshold, setAttThreshold] = useState(75);
  const [flagSearch, setFlagSearch] = useState('');
  const [flagPage, setFlagPage] = useState(1);
  const flagsPageSize = 10;

  const { data: riskFlags, isLoading } = useQuery({
    queryKey: ['risk-flags'],
    queryFn: async () => {
      const response = await axiosClient.get<ApiResponse<RiskFlag[]>>(API_ENDPOINTS.RISK_FLAGS);
      return response.data.data;
    },
  });

  const filteredFlags = useMemo(() => {
    const term = flagSearch.trim().toLowerCase();
    if (!term) return riskFlags || [];
    return (riskFlags || []).filter((flag) => {
      type ExtendedRiskFlag = RiskFlag & Partial<{ student_name: string; roll_number: string; student: { name?: string; roll_number?: string } }>;
      const ext = flag as ExtendedRiskFlag;
      const name = (ext.student_name || ext.student?.name || '').toLowerCase();
      const roll = (ext.student?.roll_number || ext.roll_number || '').toLowerCase();
      const reason = (flag.reason || '').toLowerCase();
      return name.includes(term) || roll.includes(term) || reason.includes(term);
    });
  }, [flagSearch, riskFlags]);

  useEffect(() => {
    setFlagPage(1);
  }, [flagSearch]);

  const totalFlagPages = Math.max(1, Math.ceil(filteredFlags.length / flagsPageSize));
  useEffect(() => {
    setFlagPage((prev) => Math.min(prev, totalFlagPages));
  }, [totalFlagPages]);

  const flagSliceStart = (flagPage - 1) * flagsPageSize;
  const flagSliceEnd = flagSliceStart + flagsPageSize;
  const visibleFlags = filteredFlags.slice(flagSliceStart, flagSliceEnd);
  const filteredCount = filteredFlags.length;
  const flagRangeStart = filteredCount ? flagSliceStart + 1 : 0;
  const flagRangeEnd = filteredCount ? flagSliceStart + visibleFlags.length : 0;

  const runRiskMutation = useMutation({
    mutationFn: async () => {
      const response = await axiosClient.post<ApiResponse<RunRiskResponse>>(
        API_ENDPOINTS.RUN_RISK,
        { gpaThreshold, attendanceThreshold: attThreshold }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-flags'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      alert('Risk detection completed successfully!');
    },
  });

  if (isLoading) return <Loading message="Loading risk data..." />;

  const atRiskCount = riskFlags?.length || 0;
  const avgGPA = riskFlags && riskFlags.length > 0
    ? riskFlags.reduce((sum, f) => sum + f.avg_gpa, 0) / riskFlags.length
    : 0;
  const avgAtt = riskFlags && riskFlags.length > 0
    ? riskFlags.reduce((sum, f) => sum + f.avg_attendance, 0) / riskFlags.length
    : 0;

  return (
    <FadeIn className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-navy-900 to-navy-800 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
            <ExclamationTriangleIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">Risk Detection Panel</h1>
            <p className="text-gray-300 text-lg mt-1">Identify and monitor at-risk students</p>
          </div>
        </div>

        {/* Stats Row */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <StaggerItem>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <div className="flex items-center gap-3">
                <UserGroupIcon className="w-10 h-10 text-orange-400" />
                <div>
                  <p className="text-sm text-gray-300">Flagged Students</p>
                  <p className="text-3xl font-bold"><AnimatedCounter value={atRiskCount} /></p>
                </div>
              </div>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <div className="flex items-center gap-3">
                <ChartBarIcon className="w-10 h-10 text-cyan-400" />
                <div>
                  <p className="text-sm text-gray-300">Avg GPA (At Risk)</p>
                  <p className="text-3xl font-bold"><AnimatedCounter value={avgGPA} decimals={2} /></p>
                </div>
              </div>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
              <div className="flex items-center gap-3">
                <ChartBarIcon className="w-10 h-10 text-purple-400" />
                <div>
                  <p className="text-sm text-gray-300">Avg Attendance (At Risk)</p>
                  <p className="text-3xl font-bold"><AnimatedCounter value={avgAtt} decimals={1} suffix="%" /></p>
                </div>
              </div>
            </div>
          </StaggerItem>
        </StaggerContainer>
      </div>

      {/* Run Risk Detection Card */}
      <TiltCard>
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-mint-500 to-cyan-500 flex items-center justify-center">
              <PlayIcon className="w-6 h-6 text-white" />
            </div>
            <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Run Risk Detection</h2>
                  <p className="text-gray-600 dark:text-slate-400">Configure thresholds and execute analysis</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-slate-300">
                GPA Threshold
              </label>
              <input
                type="number"
                step="0.1"
                value={gpaThreshold}
                onChange={(e) => setGpaThreshold(parseFloat(e.target.value))}
                    className="w-full rounded-xl bg-gray-50 border border-gray-300 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-mint-500 focus:border-mint-500 outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
                  <p className="text-xs text-gray-500 mt-1 dark:text-slate-400">Students below this GPA will be flagged</p>
            </div>
            <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-slate-300">
                Attendance Threshold (%)
              </label>
              <input
                type="number"
                value={attThreshold}
                onChange={(e) => setAttThreshold(parseInt(e.target.value))}
                    className="w-full rounded-xl bg-gray-50 border border-gray-300 px-4 py-3 text-gray-900 focus:ring-2 focus:ring-mint-500 focus:border-mint-500 outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
                  <p className="text-xs text-gray-500 mt-1 dark:text-slate-400">Students below this attendance will be flagged</p>
            </div>
          </div>

          <MagneticButton
            onClick={() => runRiskMutation.mutate()}
            disabled={runRiskMutation.isPending}
            className="w-full md:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-mint-500 to-cyan-500 text-white font-bold text-lg hover:shadow-xl hover:shadow-mint-500/30 disabled:opacity-60 transition-all"
          >
            {runRiskMutation.isPending ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Running Analysis...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <PlayIcon className="w-5 h-5" />
                Run Risk Detection
              </span>
            )}
          </MagneticButton>
        </div>
      </TiltCard>

  {/* Admin Rules Section */}
  {(role === 'academic_head' || role === 'it') && <AdminRulesSection />}

      {/* Flagged Students Table */}
  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Flagged Students</h2>
            <p className="text-gray-600 dark:text-slate-400">
              {flagSearch.trim()
                ? `${filteredCount} ${filteredCount === 1 ? 'match' : 'matches'} for "${flagSearch.trim()}"`
                : `${atRiskCount} ${atRiskCount === 1 ? 'student' : 'students'} identified as at-risk`}
            </p>
          </div>
        </div>

        {atRiskCount === 0 ? (
          <div className="text-center py-12">
            <ExclamationTriangleIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-lg">No at-risk students detected</p>
            <p className="text-sm text-gray-400 mt-2">Run risk detection to identify students needing support</p>
          </div>
        ) : (
          <>
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative sm:w-72">
                  <input
                    value={flagSearch}
                    onChange={(event) => setFlagSearch(event.target.value)}
                    placeholder="Search flagged students..."
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 shadow-inner focus:border-mint-500 focus:outline-none focus:ring-2 focus:ring-mint-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs uppercase text-gray-400 dark:text-slate-500">
                    {filteredCount}
                  </span>
                </div>
                <div className="flex flex-col gap-2 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-end dark:text-slate-400">
                  <span className="font-medium uppercase tracking-wide">
                    Showing {flagRangeStart.toLocaleString()}-{flagRangeEnd.toLocaleString()} of {filteredCount.toLocaleString()} results
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFlagPage((prev) => Math.max(1, prev - 1))}
                      disabled={flagPage === 1}
                      className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-600 transition hover:border-mint-400 hover:text-mint-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:border-mint-400 dark:hover:text-mint-400"
                    >
                      Previous
                    </button>
                    <span className="text-xs font-semibold text-gray-500">
                      Page {flagPage} of {totalFlagPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFlagPage((prev) => Math.min(totalFlagPages, prev + 1))}
                      disabled={flagPage === totalFlagPages}
                      className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-600 transition hover:border-mint-400 hover:text-mint-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:border-mint-400 dark:hover:text-mint-400"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
              {filteredCount === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-sm text-gray-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  No students match your search.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
                    <thead className="bg-gray-50 dark:bg-slate-800">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider dark:text-slate-300">Student</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider dark:text-slate-300">Reason</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider dark:text-slate-300">GPA</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider dark:text-slate-300">Attendance</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider dark:text-slate-300">Flagged On</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
                      {visibleFlags.map((flag) => (
                        <tr key={flag.flag_id} className="hover:bg-gray-50 transition-colors dark:hover:bg-slate-800">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900 dark:text-slate-100">
                              {(flag as RiskFlag & Partial<{ student_name: string; student: { name?: string } }>).student_name || flag.student?.name || 'Student'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-slate-400">{flag.student?.roll_number || (flag as RiskFlag & Partial<{ roll_number: string }>).roll_number}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white">
                              {flag.reason}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-lg font-bold ${flag.avg_gpa < 2.5 ? 'text-red-600' : 'text-gray-900 dark:text-slate-100'}`}>
                              {flag.avg_gpa.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-lg font-bold ${flag.avg_attendance < 75 ? 'text-red-600' : 'text-gray-900 dark:text-slate-100'}`}>
                              {flag.avg_attendance.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                            {new Date(flag.flagged_on).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
      </div>
    </FadeIn>
  );
};

const AdminRulesSection: React.FC = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { data: rules } = useQuery({
    queryKey: ['risk-rules'],
    queryFn: async () => {
      const response = await axiosClient.get<ApiResponse<RiskRulesConfig>>(API_ENDPOINTS.RISK_RULES);
      return response.data.data;
    },
  });

  const [gpa, setGpa] = useState<number>(2.5);
  const [att, setAtt] = useState<number>(75);
  const [auto, setAuto] = useState<boolean>(false);

  useEffect(() => {
    if (rules) {
      setGpa(Number(rules.gpaThreshold ?? 2.5));
      setAtt(Number(rules.attendanceThreshold ?? 75));
      setAuto(Boolean(rules.autoRunEnabled));
    }
  }, [rules]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        gpaThreshold: gpa,
        attendanceThreshold: att,
        autoRunEnabled: auto,
      };
      const response = await axiosClient.post<ApiResponse<RiskRulesConfig>>(API_ENDPOINTS.RISK_RULES, payload);
      return response.data;
    },
    onSuccess: (res) => {
      if (res.success) {
        addToast('Risk rules updated', 'success');
        queryClient.invalidateQueries({ queryKey: ['risk-rules'] });
      } else {
        addToast(res.message || 'Failed to update rules', 'error');
      }
    },
    onError: (err: any) => addToast(err.message || 'Failed to update rules', 'error'),
  });

  return (
    <TiltCard>
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200 shadow-sm dark:from-slate-900 dark:to-slate-900 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Cog6ToothIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">Admin: Risk Rules Configuration</h3>
            <p className="text-sm text-gray-600 dark:text-slate-400">System-wide risk detection settings</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border border-purple-200 dark:bg-slate-900 dark:border-slate-700">
            <label className="text-sm text-gray-600 mb-1 dark:text-slate-400">GPA Threshold</label>
            <input
              type="number"
              step="0.1"
              value={gpa}
              onChange={(e) => setGpa(parseFloat(e.target.value))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-mint-500 focus:ring-mint-500 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
            />
          </div>
          <div className="bg-white rounded-xl p-4 border border-purple-200 dark:bg-slate-900 dark:border-slate-700">
            <label className="text-sm text-gray-600 mb-1 dark:text-slate-400">Attendance Threshold (%)</label>
            <input
              type="number"
              value={att}
              onChange={(e) => setAtt(parseInt(e.target.value || '0'))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-mint-500 focus:ring-mint-500 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
            />
          </div>
          <div className="bg-white rounded-xl p-4 border border-purple-200 dark:bg-slate-900 dark:border-slate-700">
            <label className="text-sm text-gray-600 mb-2 dark:text-slate-400">Auto-run</label>
            <div className="flex items-center gap-2">
              <input id="autorun" type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
              <label htmlFor="autorun" className="text-sm text-gray-700 dark:text-slate-300">Enable automatic risk runs</label>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-mint-500 to-cyan-500 text-white font-medium disabled:opacity-60"
          >
            {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
          </button>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            auto ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300'
          }`}>
            Auto-run: {auto ? '✓ Enabled' : '✗ Disabled'}
          </span>
        </div>
      </div>
    </TiltCard>
  );
};
