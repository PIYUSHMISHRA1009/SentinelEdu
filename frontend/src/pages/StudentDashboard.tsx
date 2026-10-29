import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { PageHeader } from '../components/academic/PageHeader';
import { MetricCard } from '../components/academic/MetricCard';
import { RiskBadge } from '../components/academic/StatusBadges';
import { User, Grade, Attendance, Class } from '../types';

export default function StudentDashboard() {
  const { data: user, isLoading: loadingUser } = useQuery<User>({
    queryKey: ['me'],
    queryFn: () => api.getMe(),
  });

  const studentId = user?.id;

  const { data: gradeSummary, isLoading: loadingSummary } = useQuery({
    queryKey: ['studentGradeSummary', studentId],
    queryFn: () => api.getStudentGradeSummary(studentId!),
    enabled: !!studentId,
  });

  const { data: grades = [], isLoading: loadingGrades } = useQuery<Grade[]>({
    queryKey: ['studentGrades', studentId],
    queryFn: () => api.getGrades({ student_id: studentId }),
    enabled: !!studentId,
  });

  const { data: attendanceList = [], isLoading: loadingAttendance } = useQuery<Attendance[]>({
    queryKey: ['studentAttendance', studentId],
    queryFn: () => api.getAttendance({ student_id: studentId }),
    enabled: !!studentId,
  });

  const { data: riskData, isLoading: loadingRisk } = useQuery({
    queryKey: ['studentRisk', studentId],
    queryFn: () => api.getStudentRisk(studentId!),
    enabled: !!studentId,
  });

  const { data: classes = [], isLoading: loadingClasses } = useQuery<Class[]>({
    queryKey: ['enrolledClasses'],
    queryFn: () => api.getClasses(),
    enabled: !!studentId,
  });

  const isLoading = loadingUser || loadingSummary || loadingGrades || loadingAttendance || loadingRisk || loadingClasses;

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

  // Calculate overall attendance rate
  const totalSessions = attendanceList.length;
  const attendedSessions = attendanceList.filter(
    (a) => a.status === 'present' || a.status === 'late' || a.status === 'excused'
  ).length;
  const attendanceRate = totalSessions > 0 ? ((attendedSessions / totalSessions) * 100).toFixed(1) : 'N/A';

  const statusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">Present</span>;
      case 'late':
        return <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase font-semibold bg-amber-50 text-amber-900 border border-amber-200">Late</span>;
      case 'absent':
        return <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase font-semibold bg-rose-50 text-rose-900 border border-rose-200">Absent</span>;
      default:
        return <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase font-semibold bg-slate-100 text-slate-700 border border-stone-200">Excused</span>;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Editorial Header */}
      <PageHeader
        eyebrow="STUDENT SELF-SERVICE PORTAL // ACADEMIC PROFILE"
        title={`Welcome, ${user?.full_name || 'Student'}`}
        subtitle={`Track your course performance, assignment evaluations, session presence, and personalized academic progress.`}
        action={
          riskData && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-slate-500 uppercase">Academic Status:</span>
              <RiskBadge level={riskData.risk_level} score={riskData.risk_score} />
            </div>
          )
        }
      />

      {/* Numbered Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          index="01"
          label="OVERALL GPA (4.0 SCALE)"
          value={gradeSummary?.overall_gpa !== null && gradeSummary?.overall_gpa !== undefined ? gradeSummary.overall_gpa.toFixed(2) : 'N/A'}
          sublabel="Weighted grade point average across courses"
          accentColor="indigo"
        />
        <MetricCard
          index="02"
          label="ATTENDANCE RATE"
          value={`${attendanceRate}%`}
          sublabel={`${attendedSessions} of ${totalSessions} sessions attended`}
          accentColor="emerald"
        />
        <MetricCard
          index="03"
          label="ENROLLED COURSES"
          value={classes.length}
          sublabel="Active course registrations this semester"
          accentColor="slate"
        />
        <MetricCard
          index="04"
          label="GRADES LOGGED"
          value={grades.length}
          sublabel="Evaluated assignments & examinations"
          accentColor="amber"
        />
      </div>

      {/* Course Performance Breakdown */}
      <div className="bg-white border border-stone-200/90 rounded-lg p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-baseline border-b border-stone-100 pb-2">
          <h3 className="font-serif text-xl font-medium text-slate-900">
            Enrolled Course Performance
          </h3>
          <span className="font-mono text-xs text-slate-400">
            {classes.length} COURSES REGISTERED
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => {
            const classGpaInfo = gradeSummary?.class_gpas?.[cls.id];
            return (
              <div
                key={cls.id}
                className="p-4 bg-stone-50 border border-stone-200 rounded-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-xs font-bold text-slate-900">{cls.code}</span>
                    <span className="font-mono text-[10px] text-slate-500">{cls.credits} Credits</span>
                  </div>
                  <h4 className="font-serif text-base font-semibold text-slate-950 mt-1">{cls.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">Instructor: {cls.teacher_name || 'Faculty Member'}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-200/80 flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-600">Course Grade:</span>
                  <span className="font-bold text-slate-950">
                    {classGpaInfo?.gpa !== undefined ? `${classGpaInfo.gpa.toFixed(2)} GPA` : 'Pending'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Recent Assignment Grades & Attendance Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Assignment Grades Table */}
        <div className="bg-white border border-stone-200/90 rounded-lg p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-baseline pb-2 border-b border-stone-100">
            <h3 className="font-serif text-xl font-medium text-slate-900">
              Evaluated Assignments
            </h3>
            <span className="font-mono text-xs text-slate-400">
              LOGGED GRADE RECORDS
            </span>
          </div>

          {grades.length === 0 ? (
            <p className="text-xs text-slate-500 font-mono italic p-3 bg-stone-50 rounded">
              No grades recorded for your profile yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="bg-stone-100/70 text-slate-700 font-mono text-[10px] uppercase border-b border-stone-200">
                    <th className="py-2.5 px-3 font-semibold">Assignment</th>
                    <th className="py-2.5 px-3 font-semibold">Course</th>
                    <th className="py-2.5 px-3 font-semibold">Raw Score</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {grades.slice(0, 8).map((g) => (
                    <tr key={g.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{g.assignment_name}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{g.class_code}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{g.score} / {g.max_score}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-950 text-right">
                        {g.percentage.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Attendance Log Table */}
        <div className="bg-white border border-stone-200/90 rounded-lg p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-baseline pb-2 border-b border-stone-100">
            <h3 className="font-serif text-xl font-medium text-slate-900">
              Session Attendance Log
            </h3>
            <span className="font-mono text-xs text-slate-400">
              RECENT SESSIONS
            </span>
          </div>

          {attendanceList.length === 0 ? (
            <p className="text-xs text-slate-500 font-mono italic p-3 bg-stone-50 rounded">
              No attendance records logged yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="bg-stone-100/70 text-slate-700 font-mono text-[10px] uppercase border-b border-stone-200">
                    <th className="py-2.5 px-3 font-semibold">Date</th>
                    <th className="py-2.5 px-3 font-semibold">Course</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {attendanceList.slice(0, 8).map((a) => (
                    <tr key={a.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-900">
                        {new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{a.class_code || 'Course'}</td>
                      <td className="py-2.5 px-3 text-right">{statusBadge(a.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
