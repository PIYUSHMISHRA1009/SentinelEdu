import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axiosClient from '@/api/axiosClient';
import { API_ENDPOINTS } from '@/api/endpoints';
import type { ApiResponse } from '@/api/types';

export const ReportsPage: React.FC = () => {
  const { data: deptStats } = useQuery({
    queryKey: ['department-stats'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<Array<Record<string, any>>>>(API_ENDPOINTS.DASHBOARD_DEPARTMENT_STATS);
      return res.data.data;
    },
  });

  const { data: coursePerf } = useQuery({
    queryKey: ['course-performance'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<Array<Record<string, any>>>>(API_ENDPOINTS.DASHBOARD_COURSE_PERFORMANCE);
      return res.data.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 dark:bg-slate-900 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">Aggregated Student Reports</h1>
        <p className="text-gray-600 dark:text-slate-400">Department- and course-level performance summaries for Academic Head and Faculty.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 dark:bg-slate-900 dark:border-slate-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4">Department Stats</h2>
        {!deptStats || deptStats.length === 0 ? (
          <p className="text-gray-500 dark:text-slate-400">No data</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  {Object.keys(deptStats[0]).map((k) => (
                    <th key={k} className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase dark:text-slate-300">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-slate-900 dark:divide-slate-800">
                {deptStats.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                    {Object.keys(deptStats[0]).map((k) => (
                      <td key={k} className="px-4 py-3 text-sm text-gray-800 dark:text-slate-200">{String(row[k])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 dark:bg-slate-900 dark:border-slate-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4">Course Performance</h2>
        {!coursePerf || coursePerf.length === 0 ? (
          <p className="text-gray-500 dark:text-slate-400">No data</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  {Object.keys(coursePerf[0]).map((k) => (
                    <th key={k} className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase dark:text-slate-300">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-slate-900 dark:divide-slate-800">
                {coursePerf.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                    {Object.keys(coursePerf[0]).map((k) => (
                      <td key={k} className="px-4 py-3 text-sm text-gray-800 dark:text-slate-200">{String(row[k])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
