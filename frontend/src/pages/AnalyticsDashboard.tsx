import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#22c55e', '#eab308', '#f97316', '#ef4444'];

interface InterventionPriority {
  student_id: number;
  full_name: string;
  department: string;
  avg_score: number | null;
  attendance_rate: number | null;
  risk_score: number | null;
  risk_level: string;
  priority: string;
}

export default function AnalyticsDashboard() {
  const { data: summary, isLoading: loadingSummary, error: summaryError } = useQuery({
    queryKey: ['analyticsSummary'],
    queryFn: () => api.getAnalyticsSummary(),
  });

  const { data: gpaDist, isLoading: loadingGpa, error: gpaError } = useQuery({
    queryKey: ['gpaDistribution'],
    queryFn: () => api.getGpaDistribution(),
  });

  const { data: riskDist, isLoading: loadingRisk, error: riskError } = useQuery({
    queryKey: ['riskDistribution'],
    queryFn: () => api.getRiskDistribution(),
  });

  const { data: deptPerf, isLoading: loadingDept, error: deptError } = useQuery({
    queryKey: ['deptPerformance'],
    queryFn: () => api.getDepartmentPerformance(),
  });

  const { data: interventions, isLoading: loadingInterventions, error: interventionsError } = useQuery({
    queryKey: ['interventionPriority'],
    queryFn: () => api.getInterventionPriority(15),
  });

  const isLoading =
    loadingSummary || loadingGpa || loadingRisk || loadingDept || loadingInterventions;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (summaryError || gpaError || riskError || deptError || interventionsError) {
    return <div className="min-h-screen bg-gray-50 p-8 text-center text-red-600">Unable to load analytics data. Please try again.</div>;
  }

  const formatGPA = (gpa: number | null | undefined) => (gpa != null ? (gpa / 25).toFixed(2) : 'N/A');
  const formatPercentage = (val: number | null | undefined) => (val != null ? `${val.toFixed(1)}%` : 'N/A');

  const renderRiskBadge = (level: string) => {
    const colors: Record<string, string> = {
      Low: 'bg-green-100 text-green-800',
      Medium: 'bg-yellow-100 text-yellow-800',
      High: 'bg-orange-100 text-orange-800',
      Critical: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[level] || 'bg-gray-100 text-gray-800'}`}>
        {level}
      </span>
    );
  };

  const renderPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      Normal: 'bg-green-100 text-green-800',
      Monitor: 'bg-yellow-100 text-yellow-800',
      Urgent: 'bg-orange-100 text-orange-800',
      Immediate: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[priority] || 'bg-gray-100 text-gray-800'}`}>
        {priority}
      </span>
    );
  };

  const gpaData = Array.isArray(gpaDist)
    ? gpaDist.map(({ bucket, count }) => ({ range: bucket, count }))
    : [];
  const riskData = Array.isArray(riskDist)
    ? riskDist.map(({ risk_level, count }) => ({ name: risk_level, value: count }))
    : [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Analytics Dashboard</h1>
          <p className="mt-2 text-gray-600">Data-driven insights for student performance monitoring</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-sm font-medium text-gray-500 truncate">Total Students</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">{summary?.total_students || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-sm font-medium text-gray-500 truncate">Average GPA</h3>
            <p className="mt-2 text-3xl font-bold text-indigo-600">{formatGPA(summary?.avg_gpa)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-sm font-medium text-gray-500 truncate">Average Attendance</h3>
            <p className="mt-2 text-3xl font-bold text-green-600">{formatPercentage(summary?.average_attendance)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-sm font-medium text-gray-500 truncate">At-Risk Students</h3>
            <p className="mt-2 text-3xl font-bold text-red-600">{summary?.at_risk_count || 0}</p>
          </div>
        </div>

        {/* Two-column chart row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">GPA Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gpaData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4f46e5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Distribution</h3>
            <div className="h-64 flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label
                  >
                    {riskData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Department Performance */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Department Performance</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptPerf} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis yAxisId="left" orientation="left" stroke="#4f46e5" />
                <YAxis yAxisId="right" orientation="right" stroke="#16a34a" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="avg_score" name="Avg Score (%)" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Intervention Priority Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Intervention Priority</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GPA</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(interventions as InterventionPriority[] | undefined)?.map((item, index) => (
                  <tr key={item.student_id || index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.full_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatGPA(item.avg_score)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPercentage(item.attendance_rate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.risk_score != null ? `${(item.risk_score * 100).toFixed(1)}%` : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{renderRiskBadge(item.risk_level)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{renderPriorityBadge(item.priority)}</td>
                  </tr>
                ))}
                {!interventions || interventions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                      No intervention data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
