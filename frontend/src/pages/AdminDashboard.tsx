import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { PageHeader } from '../components/academic/PageHeader';
import { MetricCard } from '../components/academic/MetricCard';
import { RiskBadge, PriorityBadge } from '../components/academic/StatusBadges';
import { StudentDetailModal } from '../components/academic/StudentDetailModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function AdminDashboard() {
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['adminSummary'],
    queryFn: () => api.getAnalyticsSummary(),
  });

  const { data: depts = [], isLoading: loadingDepts } = useQuery({
    queryKey: ['adminDepts'],
    queryFn: () => api.getDepartmentPerformance(),
  });

  const { data: riskDist = [], isLoading: loadingRisk } = useQuery({
    queryKey: ['adminRiskDist'],
    queryFn: () => api.getRiskDistribution(),
  });

  const { data: dqReport, isLoading: loadingDq } = useQuery({
    queryKey: ['adminDqReport'],
    queryFn: () => api.getDataQualityReport(),
  });

  const { data: priorityList = [], isLoading: loadingPriority } = useQuery({
    queryKey: ['adminPriorityList'],
    queryFn: () => api.getInterventionPriority(20),
  });

  const isLoading = loadingSummary || loadingDepts || loadingRisk || loadingDq || loadingPriority;

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-pulse">
        <div className="h-20 bg-stone-200/60 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-32 bg-stone-200/60 rounded-lg" />
          <div className="h-32 bg-stone-200/60 rounded-lg" />
          <div className="h-32 bg-stone-200/60 rounded-lg" />
          <div className="h-32 bg-stone-200/60 rounded-lg" />
        </div>
      </div>
    );
  }

  const filteredPriority = priorityList.filter((s: any) =>
    s.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Editorial Header */}
      <PageHeader
        eyebrow="ACADEMIC INTELLIGENCE // INSTITUTIONAL OVERSIGHT"
        title="Institutional Performance Overview"
        subtitle="Population-level academic performance metrics, department-wide analysis, data quality audit health, and prioritized academic interventions."
      />

      {/* Numbered Academic Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          index="01"
          label="ENROLLED POPULATION"
          value={summary?.total_students ? summary.total_students.toLocaleString() : '0'}
          sublabel="Active student registrations across all departments"
          accentColor="indigo"
        />
        <MetricCard
          index="02"
          label="INSTITUTION AVERAGE SCORE"
          value={summary?.avg_gpa !== undefined ? `${summary.avg_gpa.toFixed(1)}%` : 'N/A'}
          sublabel="Global weighted student assignment average"
          accentColor="slate"
        />
        <MetricCard
          index="03"
          label="ATTENDANCE RATE"
          value={summary?.avg_attendance !== undefined ? `${summary.avg_attendance.toFixed(1)}%` : 'N/A'}
          sublabel="Average session presence across all courses"
          accentColor="emerald"
        />
        <MetricCard
          index="04"
          label="AT-RISK POPULATION"
          value={summary?.at_risk_count !== undefined ? summary.at_risk_count : 0}
          sublabel="Students requiring immediate or urgent academic check-ins"
          accentColor="crimson"
        />
      </div>

      {/* Department Analytics & Data Health Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Department Performance Chart */}
        <div className="lg:col-span-2 bg-white border border-stone-200/90 rounded-lg p-6 shadow-xs">
          <div className="flex justify-between items-baseline mb-4 pb-2 border-b border-stone-100">
            <h3 className="font-serif text-xl font-medium text-slate-900">
              Department Academic Comparison
            </h3>
            <span className="font-mono text-xs text-slate-400">
              AVERAGE SCORE (%) BY DEPARTMENT
            </span>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={depts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="department" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="avg_score" fill="#0f172a" radius={[3, 3, 0, 0]} name="Avg Score (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Data Quality Health Audit Card */}
        <div className="bg-white border border-stone-200/90 rounded-lg p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-baseline mb-4 pb-2 border-b border-stone-100">
              <h3 className="font-serif text-xl font-medium text-slate-900">
                Data Quality Health
              </h3>
              <span className="font-mono text-[10px] text-emerald-700 font-semibold uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Audit Active
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Automated database integrity validation checking for orphan records, duplicate attendance, and score anomalies.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-stone-50 rounded border border-stone-200/80 flex justify-between items-center">
                <span className="text-slate-600">Total Audit Checks</span>
                <span className="font-bold text-slate-900">{dqReport?.summary?.total_records_checked || 0}</span>
              </div>
              <div className="p-3 bg-emerald-50/70 rounded border border-emerald-200/80 flex justify-between items-center text-emerald-950">
                <span>Valid Records</span>
                <span className="font-bold">{dqReport?.summary?.valid_records || 0}</span>
              </div>
              <div className="p-3 bg-rose-50/70 rounded border border-rose-200/80 flex justify-between items-center text-rose-950">
                <span>Integrity Exceptions</span>
                <span className="font-bold">{dqReport?.summary?.issues_found || 0}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-100 text-right">
            <a
              href="/data-quality"
              className="font-mono text-xs font-semibold text-slate-900 hover:text-indigo-900 transition-colors inline-flex items-center gap-1"
            >
              Full Integrity Report →
            </a>
          </div>
        </div>
      </div>

      {/* Priority Interventions Table */}
      <div className="bg-white border border-stone-200/90 rounded-lg p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-3 border-b border-stone-100">
          <div>
            <h3 className="font-serif text-xl font-medium text-slate-900">
              Institutional Priority Interventions
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked list of students requiring immediate or urgent academic check-ins across all departments.
            </p>
          </div>
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search student or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded text-xs font-sans focus:outline-none focus:border-slate-900"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-stone-100/70 text-slate-700 font-mono text-[10px] uppercase border-b border-stone-200">
                <th className="py-3 px-4 font-semibold">Rank</th>
                <th className="py-3 px-4 font-semibold">Student Name</th>
                <th className="py-3 px-4 font-semibold">Department</th>
                <th className="py-3 px-4 font-semibold">Avg Score</th>
                <th className="py-3 px-4 font-semibold">Attendance</th>
                <th className="py-3 px-4 font-semibold">Risk Level</th>
                <th className="py-3 px-4 font-semibold">Priority</th>
                <th className="py-3 px-4 font-semibold text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredPriority.map((item: any, i: number) => (
                <tr
                  key={item.student_id || i}
                  className="hover:bg-stone-50/80 transition-colors cursor-pointer"
                  onClick={() => setSelectedStudentId(item.student_id)}
                >
                  <td className="py-3 px-4 font-mono font-bold text-slate-500">#{item.rank || i + 1}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{item.student_name}</td>
                  <td className="py-3 px-4 text-slate-600">{item.department}</td>
                  <td className="py-3 px-4 font-mono text-slate-900 font-medium">
                    {item.gpa !== undefined ? `${item.gpa.toFixed(1)}%` : 'N/A'}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-900 font-medium">
                    {item.attendance !== undefined ? `${item.attendance.toFixed(1)}%` : 'N/A'}
                  </td>
                  <td className="py-3 px-4">
                    <RiskBadge level={item.risk_level} score={item.risk_score} size="sm" />
                  </td>
                  <td className="py-3 px-4">
                    <PriorityBadge priority={item.priority} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStudentId(item.student_id);
                      }}
                      className="font-mono text-[11px] font-semibold text-slate-900 hover:text-indigo-900 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded border border-stone-300 transition-colors"
                    >
                      Report →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drilldown Student Detail Modal */}
      {selectedStudentId && (
        <StudentDetailModal
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
        />
      )}
    </div>
  );
}
