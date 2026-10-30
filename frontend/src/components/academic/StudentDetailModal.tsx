import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import { RiskBadge, PriorityBadge } from './StatusBadges';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface StudentDetailModalProps {
  studentId: number | null;
  studentName?: string;
  onClose: () => void;
}

interface TrendChartPoint {
  date?: string;
  gpa?: number;
  score?: number;
}

interface StudentTrendChartData {
  gpa_history?: TrendChartPoint[];
  attendance_history?: Array<{ attendance_rate?: number }>;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  studentId,
  studentName,
  onClose,
}) => {
  const { data: riskData, isLoading: loadingRisk } = useQuery({
    queryKey: ['studentRiskDetail', studentId],
    queryFn: () => api.getStudentRisk(studentId!),
    enabled: !!studentId,
  });

  const { data: trendData, isLoading: loadingTrends } = useQuery<StudentTrendChartData>({
    queryKey: ['studentTrendsDetail', studentId],
    queryFn: () => api.getStudentTrends(studentId!),
    enabled: !!studentId,
  });

  if (!studentId) return null;

  const isLoading = loadingRisk || loadingTrends;

  // Format trend points for chart if available
  const chartPoints =
    trendData?.gpa_history?.map((pt, idx) => ({
      session: pt.date || `P${idx + 1}`,
      gpa: pt.gpa || pt.score || 0,
      attendance: trendData?.attendance_history?.[idx]?.attendance_rate || 85,
    })) || [];

  const factorsList: string[] = Array.isArray(riskData?.factors)
    ? riskData.factors
    : typeof riskData?.factors === 'string'
      ? JSON.parse(riskData.factors || '[]')
      : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-stone-200 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-stone-200/90 flex justify-between items-start bg-slate-900 text-white rounded-t-xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
                STUDENT PROFILE & ACADEMIC AUDIT
              </span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-[10px] text-slate-400">ID #{studentId}</span>
            </div>
            <h2 className="font-serif text-2xl font-semibold tracking-tight">
              {riskData?.student_name || studentName || `Student #${studentId}`}
            </h2>
            <p className="text-xs text-slate-300 font-sans mt-1">
              {riskData?.department || 'Department Academic Record'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {riskData && <RiskBadge level={riskData.risk_level} score={riskData.risk_score} />}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-md text-lg leading-none transition-colors"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Content */}
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center min-h-[300px]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900 mb-3" />
            <p className="font-mono text-xs text-slate-500 uppercase tracking-wider">
              Compiling student academic record...
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg">
                <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider block">
                  Current GPA
                </span>
                <span className="font-serif text-xl font-bold text-slate-900 mt-0.5 block">
                  {riskData?.features?.current_gpa !== undefined
                    ? riskData.features.current_gpa.toFixed(2)
                    : 'N/A'}
                </span>
              </div>
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg">
                <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider block">
                  Attendance Rate
                </span>
                <span className="font-serif text-xl font-bold text-slate-900 mt-0.5 block">
                  {riskData?.features?.attendance_rate !== undefined
                    ? `${riskData.features.attendance_rate.toFixed(1)}%`
                    : 'N/A'}
                </span>
              </div>
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg">
                <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider block">
                  GPA Trend Slope
                </span>
                <span
                  className={`font-mono text-base font-semibold mt-0.5 block ${
                    (riskData?.gpa_trend || 0) < 0 ? 'text-rose-700' : 'text-emerald-700'
                  }`}
                >
                  {riskData?.gpa_trend !== undefined
                    ? riskData.gpa_trend > 0
                      ? `+${riskData.gpa_trend.toFixed(3)}`
                      : riskData.gpa_trend.toFixed(3)
                    : '0.00'}
                </span>
              </div>
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg">
                <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider block">
                  Unsubmitted Tasks
                </span>
                <span className="font-serif text-xl font-bold text-slate-900 mt-0.5 block">
                  {riskData?.features?.missing_assignments ?? 0}
                </span>
              </div>
            </div>

            {/* Performance Trend Chart */}
            {chartPoints.length > 0 && (
              <div className="border border-stone-200 rounded-lg p-4 bg-white">
                <h4 className="font-serif text-base font-medium text-slate-900 mb-3 border-b border-stone-100 pb-2">
                  Academic Performance Trajectory
                </h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartPoints}>
                      <defs>
                        <linearGradient id="gpaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0f172a" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="session" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis domain={[0, 4]} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="gpa"
                        stroke="#0f172a"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#gpaGrad)"
                        name="GPA (4.0 Scale)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Risk Factors Breakdown */}
            <div className="border border-stone-200 rounded-lg p-4 bg-white space-y-3">
              <h4 className="font-serif text-base font-medium text-slate-900 border-b border-stone-100 pb-2">
                Identified Risk Factors
              </h4>
              {factorsList.length === 0 ? (
                <p className="text-xs text-slate-500 font-mono italic">
                  No risk indicators flagged for this student profile.
                </p>
              ) : (
                <div className="space-y-2">
                  {factorsList.map((factor, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded bg-rose-50/60 border border-rose-200/60 flex items-start gap-2.5 text-xs text-rose-950 font-medium"
                    >
                      <span className="text-rose-700 font-bold">•</span>
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommended Deterministic Intervention Plan */}
            {riskData?.intervention && (
              <div className="border border-stone-200 rounded-lg p-4 bg-slate-900 text-white space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h4 className="font-serif text-base font-medium text-white">
                    Recommended Intervention Strategy
                  </h4>
                  <PriorityBadge priority={riskData.intervention.priority} />
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono text-slate-300">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">
                      Review Cadence
                    </span>
                    <span className="font-semibold text-white">
                      {riskData.intervention.review_frequency}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">
                      Escalation Path
                    </span>
                    <span className="font-semibold text-white">
                      {riskData.intervention.escalation}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                    Action Plan Checklist
                  </span>
                  <ul className="space-y-1 text-xs text-slate-200 font-sans">
                    {riskData.intervention.recommended_actions?.map((act: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 rounded-b-xl flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-sans text-xs font-medium rounded shadow-xs transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
