import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Class, StudentRiskSummary } from '../types';
import { PageHeader } from './academic/PageHeader';
import { MetricCard } from './academic/MetricCard';
import { RiskBadge } from './academic/StatusBadges';
import { StudentDetailModal } from './academic/StudentDetailModal';

export default function RiskDashboard() {
  const queryClient = useQueryClient();
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<number | undefined>(undefined);
  const [selectedDepartment, setSelectedDepartment] = useState<string | undefined>(undefined);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string | undefined>(undefined);

  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: () => api.getClasses(),
  });

  const { data: students = [], isLoading } = useQuery<StudentRiskSummary[]>({
    queryKey: ['riskDashboard', selectedClass, selectedDepartment, selectedRiskLevel],
    queryFn: () =>
      api.getRiskDashboard({
        class_id: selectedClass,
        department: selectedDepartment,
        risk_level: selectedRiskLevel,
      }),
  });

  const assessMutation = useMutation({
    mutationFn: () => api.assessAllStudents(selectedClass),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riskDashboard'] });
    },
  });

  const filteredStudents = students.filter((student) => {
    const nameMatch = student.full_name.toLowerCase().includes(search.toLowerCase());
    const emailMatch = student.email.toLowerCase().includes(search.toLowerCase());
    return nameMatch || emailMatch;
  });

  // Calculate summary counts
  const criticalCount = students.filter((s) => s.risk_level === 'critical').length;
  const highCount = students.filter((s) => s.risk_level === 'high').length;
  const mediumCount = students.filter((s) => s.risk_level === 'medium').length;
  const lowCount = students.filter((s) => s.risk_level === 'low').length;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Editorial Header */}
      <PageHeader
        eyebrow="RISK SCORING & ANOMALY MATRIX // ALL ROLES"
        title="Student Risk Assessment Matrix"
        subtitle="Machine-learning risk evaluation combining GPA trends, attendance volatility, and assignment completion indicators."
        action={
          <button
            onClick={() => assessMutation.mutate()}
            disabled={assessMutation.isPending}
            className="font-mono text-xs font-semibold text-white bg-slate-950 hover:bg-slate-800 px-4 py-2 rounded shadow-xs transition-colors border border-slate-800 flex items-center gap-2"
          >
            {assessMutation.isPending ? 'Executing Batch Scoring...' : '⚡ Re-assess All Profiles'}
          </button>
        }
      />

      {/* Numbered Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          index="01"
          label="CRITICAL RISK"
          value={criticalCount}
          sublabel="Score ≥ 0.70 (Immediate 1:1 check-in required)"
          accentColor="crimson"
        />
        <MetricCard
          index="02"
          label="HIGH RISK"
          value={highCount}
          sublabel="Score 0.50–0.69 (Urgent review within 1 week)"
          accentColor="amber"
        />
        <MetricCard
          index="03"
          label="MEDIUM RISK"
          value={mediumCount}
          sublabel="Score 0.30–0.49 (Bi-weekly monitoring)"
          accentColor="slate"
        />
        <MetricCard
          index="04"
          label="LOW RISK"
          value={lowCount}
          sublabel="Score < 0.30 (Normal academic standing)"
          accentColor="emerald"
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-stone-200/90 rounded-lg p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 font-sans text-xs">
        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Search by student name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded text-xs font-sans focus:outline-none focus:border-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Class Filter */}
          <select
            value={selectedClass || ''}
            onChange={(e) => setSelectedClass(e.target.value ? Number(e.target.value) : undefined)}
            className="px-3 py-2 bg-stone-50 border border-stone-300 rounded text-xs font-sans focus:outline-none focus:border-slate-900"
          >
            <option value="">All Assigned Courses</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.code} - {cls.name}
              </option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            value={selectedDepartment || ''}
            onChange={(e) => setSelectedDepartment(e.target.value || undefined)}
            className="px-3 py-2 bg-stone-50 border border-stone-300 rounded text-xs font-sans focus:outline-none focus:border-slate-900"
          >
            <option value="">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Electronics">Electronics</option>
            <option value="Administration">Administration</option>
          </select>

          {/* Risk Level Filter */}
          <select
            value={selectedRiskLevel || ''}
            onChange={(e) => setSelectedRiskLevel(e.target.value || undefined)}
            className="px-3 py-2 bg-stone-50 border border-stone-300 rounded text-xs font-sans focus:outline-none focus:border-slate-900"
          >
            <option value="">All Risk Levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Main Student Risk Matrix Table */}
      <div className="bg-white border border-stone-200/90 rounded-lg p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-baseline border-b border-stone-100 pb-2">
          <h3 className="font-serif text-xl font-medium text-slate-900">
            Student Risk Scoring Matrix
          </h3>
          <span className="font-mono text-xs text-slate-400">
            {filteredStudents.length} RECORDS EVALUATED
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mb-2" />
            <span className="font-mono text-xs text-slate-500">
              Loading risk score assessments...
            </span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <p className="text-xs text-slate-500 font-mono italic p-6 text-center bg-stone-50 rounded">
            No student records match the selected filter criteria.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-stone-100/70 text-slate-700 font-mono text-[10px] uppercase border-b border-stone-200">
                  <th className="py-3 px-4 font-semibold">Student Name</th>
                  <th className="py-3 px-4 font-semibold">Department</th>
                  <th className="py-3 px-4 font-semibold">Risk Level</th>
                  <th className="py-3 px-4 font-semibold">Risk Score</th>
                  <th className="py-3 px-4 font-semibold">GPA Trend</th>
                  <th className="py-3 px-4 font-semibold">Attendance Trend</th>
                  <th className="py-3 px-4 font-semibold text-right">Drill-Down</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredStudents.map((s) => (
                  <tr
                    key={s.student_id}
                    className="hover:bg-stone-50/80 transition-colors cursor-pointer"
                    onClick={() => setSelectedStudentId(s.student_id)}
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{s.full_name}</div>
                      <div className="font-mono text-[10px] text-slate-400">{s.email}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{s.department || 'General'}</td>
                    <td className="py-3 px-4">
                      <RiskBadge level={s.risk_level} score={s.risk_score ?? undefined} size="sm" />
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {s.risk_score !== null && s.risk_score !== undefined
                        ? s.risk_score.toFixed(3)
                        : 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">
                      <span
                        className={(s.gpa_trend ?? 0) < 0 ? 'text-rose-700' : 'text-emerald-700'}
                      >
                        {s.gpa_trend !== null && s.gpa_trend !== undefined
                          ? s.gpa_trend > 0
                            ? `+${s.gpa_trend.toFixed(3)}`
                            : s.gpa_trend.toFixed(3)
                          : '0.00'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">
                      <span
                        className={
                          (s.attendance_trend ?? 0) < 0 ? 'text-rose-700' : 'text-emerald-700'
                        }
                      >
                        {s.attendance_trend !== null && s.attendance_trend !== undefined
                          ? s.attendance_trend > 0
                            ? `+${s.attendance_trend.toFixed(3)}`
                            : s.attendance_trend.toFixed(3)
                          : '0.00'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudentId(s.student_id);
                        }}
                        className="font-mono text-[11px] font-semibold text-slate-900 hover:text-indigo-900 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded border border-stone-300 transition-colors"
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
