import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { StudentRiskSummary, TrendPoint } from '../types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, AreaChart, Area,
} from 'recharts';

const COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
  gpa: '#3b82f6',
  attendance: '#8b5cf6',
};

const RiskBadge: React.FC<{ level: string | null | undefined }> = ({ level }) => {
  if (!level) return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">N/A</span>;
  const classes = {
    low: 'badge-low',
    medium: 'badge-medium',
    high: 'badge-high',
    critical: 'badge-critical',
  };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${classes[level as keyof typeof classes] || 'bg-gray-100 text-gray-600'}`}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
};

const TrendChart: React.FC<{ data: TrendPoint[]; color: string; title: string; yLabel: string }> = ({ data, color, title, yLabel }) => {
  if (!data.length) return <div className="h-64 flex items-center justify-center text-gray-400">No data available</div>;
  
  return (
    <div className="h-64">
      <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`color-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            stroke="#9ca3af"
            fontSize={11}
            tickLine={false}
          />
          <YAxis 
            stroke="#9ca3af" 
            fontSize={11}
            tickLine={false}
            label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: 10, fill: '#9ca3af', fontSize: 11 }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            formatter={(value: number) => [value.toFixed(2), yLabel]}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#color-${color})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const GPAChart: React.FC<{ data: TrendPoint[] }> = ({ data }) => (
  <TrendChart data={data} color={COLORS.gpa} title="GPA Trend (4.0 Scale)" yLabel="GPA" />
);

const AttendanceChart: React.FC<{ data: TrendPoint[] }> = ({ data }) => (
  <TrendChart data={data} color={COLORS.attendance} title="Attendance Rate (%)" yLabel="Rate %" />
);

const StudentDetailModal: React.FC<{ 
  student: StudentRiskSummary | null; 
  onClose: () => void;
  onAssess: (studentId: number, classId?: number) => void;
}> = ({ student, onClose, onAssess }) => {
  const [trends, setTrends] = useState<{ gpa: TrendPoint[]; attendance: TrendPoint[] }>({ gpa: [], attendance: [] });
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!student) return;
    const fetchTrends = async () => {
      setLoading(true);
      try {
        const data = await api.getStudentTrends(student.student_id);
        setTrends({ gpa: data.gpa_trend, attendance: data.attendance_trend });
      } catch (error) {
        console.error('Failed to fetch trends:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrends();
  }, [student]);

  const assessMutation = useMutation({
    mutationFn: () => api.assessAllStudents(student?.classes[0]?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-dashboard'] });
      if (student) onAssess(student.student_id, student.classes[0]?.id);
    },
  });

  if (!student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{student.student_name}</h2>
            <p className="text-sm text-gray-500">{student.email} • {student.department}</p>
          </div>
          <div className="flex items-center gap-3">
            <RiskBadge level={student.risk_level} />
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Current GPA</p>
              <p className="text-3xl font-bold text-gray-900">{student.current_gpa?.toFixed(2) || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Attendance Rate</p>
              <p className="text-3xl font-bold text-gray-900">{student.attendance_rate?.toFixed(1) || 'N/A'}%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Risk Score</p>
              <p className="text-3xl font-bold" style={{ color: student.risk_level ? COLORS[student.risk_level as keyof typeof COLORS] : '#6b7280' }}>
                {(student.risk_score ? student.risk_score * 100 : 0).toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <GPAChart data={trends.gpa} />
            <AttendanceChart data={trends.attendance} />
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Risk Factors</h4>
            {student.risk_level && student.risk_level !== 'low' ? (
              <ul className="space-y-1">
                {JSON.parse(student.risk_score ? '[]' : '[]').map((factor: string, i: number) => (
                  <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[student.risk_level as keyof typeof COLORS] }} />
                    {factor}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-green-600">No significant risk factors detected.</p>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button 
              onClick={() => { if (student) onAssess(student.student_id, student.classes[0]?.id); }}
              disabled={assessMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {assessMutation.isPending ? 'Re-assessing...' : 'Re-assess Risk'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StudentTable: React.FC<{
  students: StudentRiskSummary[];
  onViewDetails: (student: StudentRiskSummary) => void;
  onAssess: (studentId: number, classId?: number) => void;
}> = ({ students, onViewDetails, onAssess }) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'risk_score', direction: 'desc' });

  const sortedStudents = [...students].sort((a, b) => {
    const aVal = a[sortConfig.key as keyof StudentRiskSummary];
    const bVal = b[sortConfig.key as keyof StudentRiskSummary];
    if (aVal === null) return 1;
    if (bVal === null) return -1;
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {['student_name', 'department', 'current_gpa', 'attendance_rate', 'risk_score', 'risk_level'].map(key => (
              <th
                key={key}
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort(key)}
              >
                {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                {sortConfig.key === key && (
                  <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
            ))}
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedStudents.map(student => (
            <tr key={student.student_id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900">{student.student_name}</div>
                <div className="text-sm text-gray-500">{student.email}</div>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">{student.department}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{student.current_gpa?.toFixed(2) || 'N/A'}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{student.attendance_rate?.toFixed(1) || 'N/A'}%</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${(student.risk_score || 0) * 100}%`,
                        backgroundColor: student.risk_level ? COLORS[student.risk_level as keyof typeof COLORS] : '#9ca3af'
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{(student.risk_score ? student.risk_score * 100 : 0).toFixed(0)}%</span>
                </div>
              </td>
              <td className="px-4 py-3"><RiskBadge level={student.risk_level} /></td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onViewDetails(student)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onAssess(student.student_id, student.classes[0]?.id)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Re-assess"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const RiskDashboard: React.FC = () => {
  const [selectedStudent, setSelectedStudent] = useState<StudentRiskSummary | null>(null);
  const [classFilter, setClassFilter] = useState<number | undefined>(undefined);
  const [riskFilter, setRiskFilter] = useState<string | undefined>(undefined);
  const queryClient = useQueryClient();

  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.getClasses(),
  });

  const { data: students = [], isLoading, refetch } = useQuery({
    queryKey: ['risk-dashboard', classFilter, riskFilter],
    queryFn: () => api.getRiskDashboard({ class_id: classFilter, risk_level: riskFilter }),
  });

  const assessMutation = useMutation({
    mutationFn: ({ studentId, classId }: { studentId: number; classId?: number }) => 
      api.getStudentRisk(studentId, classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-dashboard'] });
    },
  });

  const handleAssess = (studentId: number, classId?: number) => {
    assessMutation.mutate({ studentId, classId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Risk Dashboard</h1>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <select
            value={classFilter || ''}
            onChange={(e) => setClassFilter(e.target.value ? Number(e.target.value) : undefined)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[200px]"
          >
            <option value="">All Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
            ))}
          </select>
          <select
            value={riskFilter || ''}
            onChange={(e) => setRiskFilter(e.target.value || undefined)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[160px]"
          >
            <option value="">All Risk Levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button
            onClick={() => refetch()}
            disabled={assessMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {assessMutation.isPending ? 'Assessing...' : 'Assess All Students'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: students.length, color: 'bg-blue-500' },
          { label: 'Critical Risk', value: students.filter(s => s.risk_level === 'critical').length, color: 'bg-red-500' },
          { label: 'High Risk', value: students.filter(s => s.risk_level === 'high').length, color: 'bg-orange-500' },
          { label: 'Avg Risk Score', value: students.length ? `${Math.round(students.reduce((a, b) => a + (b.risk_score || 0), 0) / students.length * 100)}%` : '0%', color: 'bg-purple-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border p-6">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {students.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0v6v-6z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
            <p className="mt-1 text-sm text-gray-500">Adjust your filters or add students to see risk data.</p>
          </div>
        ) : (
          <StudentTable 
            students={students} 
            onViewDetails={setSelectedStudent}
            onAssess={handleAssess}
          />
        )}
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <StudentDetailModal 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)}
          onAssess={handleAssess}
        />
      )}
    </div>
  );
};

export default RiskDashboard;