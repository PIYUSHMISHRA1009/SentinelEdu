import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { PageHeader } from '../components/academic/PageHeader';
import { MetricCard } from '../components/academic/MetricCard';
import { PriorityBadge } from '../components/academic/StatusBadges';
import { StudentDetailModal } from '../components/academic/StudentDetailModal';
import { User, Class } from '../types';

interface InterventionPriorityItem {
  student_id: number;
  student_name: string;
  department: string | null;
  gpa: number | null;
  attendance: number | null;
  priority: string;
}

interface DecliningStudent {
  student_id: number;
  student_name: string;
  decline_amount?: number;
  recent_avg?: number;
  older_avg?: number;
}

export default function FacultyDashboard() {
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: user } = useQuery<User>({
    queryKey: ['me'],
    queryFn: () => api.getMe(),
  });

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['facultySummary'],
    queryFn: () => api.getAnalyticsSummary(),
  });

  const { data: classes = [], isLoading: loadingClasses } = useQuery<Class[]>({
    queryKey: ['facultyClasses'],
    queryFn: () => api.getClasses(),
  });

  const { data: priorityList = [], isLoading: loadingPriority } = useQuery<
    InterventionPriorityItem[]
  >({
    queryKey: ['facultyPriority'],
    queryFn: () => api.getInterventionPriority(20),
  });

  const { data: decliningList = [], isLoading: loadingDeclining } = useQuery<DecliningStudent[]>({
    queryKey: ['facultyDeclining'],
    queryFn: () => api.getDecliningStudents(10),
  });

  const isLoading = loadingSummary || loadingClasses || loadingPriority || loadingDeclining;

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

  const filteredPriority = priorityList.filter(
    (s) =>
      s.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Editorial Header */}
      <PageHeader
        eyebrow="FACULTY ADVISOR WORKSPACE // OPERATIONAL INTERVENTION"
        title={`My Students & Course Rosters`}
        subtitle={`Academic performance metrics and intervention workflows scoped to your assigned teaching courses (${user?.full_name || 'Faculty'}).`}
      />

      {/* Numbered Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          index="01"
          label="TEACHING ASSIGNMENTS"
          value={classes.length}
          sublabel="Active courses assigned to you"
          accentColor="indigo"
        />
        <MetricCard
          index="02"
          label="ASSIGNED STUDENTS"
          value={summary?.total_students !== undefined ? summary.total_students : 0}
          sublabel="Students enrolled in your active courses"
          accentColor="slate"
        />
        <MetricCard
          index="03"
          label="COURSE AVERAGE SCORE"
          value={summary?.avg_gpa !== undefined ? `${summary.avg_gpa.toFixed(1)}%` : 'N/A'}
          sublabel="Average assignment score in your courses"
          accentColor="emerald"
        />
        <MetricCard
          index="04"
          label="AT-RISK IN YOUR COURSES"
          value={summary?.at_risk_count !== undefined ? summary.at_risk_count : 0}
          sublabel="Students requiring advisor intervention"
          accentColor="crimson"
        />
      </div>

      {/* Assigned Course Rosters */}
      <div className="bg-white border border-stone-200/90 rounded-lg p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-baseline border-b border-stone-100 pb-2">
          <h3 className="font-serif text-xl font-medium text-slate-900">Active Teaching Courses</h3>
          <span className="font-mono text-xs text-slate-400">
            {classes.length} COURSES ASSIGNED
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="p-4 bg-stone-50 border border-stone-200 rounded-lg flex flex-col justify-between hover:border-slate-400 transition-colors"
            >
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-xs font-bold text-slate-900">{cls.code}</span>
                  <span className="font-mono text-[10px] uppercase text-slate-500 bg-stone-200/60 px-2 py-0.5 rounded">
                    Sem {cls.semester}
                  </span>
                </div>
                <h4 className="font-serif text-base font-semibold text-slate-950 mt-1">
                  {cls.name}
                </h4>
                <p className="text-xs text-slate-500 mt-1">{cls.department} Department</p>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-200/80 flex justify-between items-center text-xs font-mono">
                <span className="text-slate-600">{cls.credits} Academic Credits</span>
                <span className="font-semibold text-emerald-700">Active</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Priority Interventions & Academic Declines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Priority Interventions Table */}
        <div className="lg:col-span-2 bg-white border border-stone-200/90 rounded-lg p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-3 border-b border-stone-100">
            <div>
              <h3 className="font-serif text-xl font-medium text-slate-900">
                Assigned Student Intervention Queue
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Students enrolled in your courses ranked by intervention urgency.
              </p>
            </div>
            <div className="w-full sm:w-48">
              <input
                type="text"
                placeholder="Search..."
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
                  <th className="py-3 px-3 font-semibold">Student Name</th>
                  <th className="py-3 px-3 font-semibold">Department</th>
                  <th className="py-3 px-3 font-semibold">Avg Score</th>
                  <th className="py-3 px-3 font-semibold">Attendance</th>
                  <th className="py-3 px-3 font-semibold">Priority</th>
                  <th className="py-3 px-4 font-semibold text-right">Workflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredPriority.map((item, i) => (
                  <tr
                    key={item.student_id || i}
                    className="hover:bg-stone-50/80 transition-colors cursor-pointer"
                    onClick={() => setSelectedStudentId(item.student_id)}
                  >
                    <td className="py-3 px-3 font-semibold text-slate-900">{item.student_name}</td>
                    <td className="py-3 px-3 text-slate-600">{item.department}</td>
                    <td className="py-3 px-3 font-mono text-slate-900 font-medium">
                      {item.gpa !== undefined ? `${item.gpa.toFixed(1)}%` : 'N/A'}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-900 font-medium">
                      {item.attendance !== undefined ? `${item.attendance.toFixed(1)}%` : 'N/A'}
                    </td>
                    <td className="py-3 px-3">
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
                        Action Plan →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Declining Performance Alert Sidebar */}
        <div className="bg-white border border-stone-200/90 rounded-lg p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex justify-between items-baseline mb-4 pb-2 border-b border-stone-100">
              <h3 className="font-serif text-xl font-medium text-slate-900">Recent Grade Drops</h3>
              <span className="font-mono text-[10px] text-amber-800 font-semibold uppercase bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Decline Alerts
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Students whose last 3 assignment averages dropped by &gt;5% compared to earlier
              coursework.
            </p>

            {decliningList.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono italic p-3 bg-stone-50 rounded">
                No recent grade drops detected in your assigned courses.
              </p>
            ) : (
              <div className="space-y-3">
                {decliningList.map((st, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedStudentId(st.student_id)}
                    className="p-3 bg-stone-50 rounded border border-stone-200/80 hover:border-slate-400 transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-sans font-semibold text-xs text-slate-900">
                        {st.student_name}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-rose-700">
                        -{st.decline_amount?.toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-1 flex justify-between text-[11px] font-mono text-slate-500">
                      <span>Recent: {st.recent_avg?.toFixed(1)}%</span>
                      <span>Older: {st.older_avg?.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
