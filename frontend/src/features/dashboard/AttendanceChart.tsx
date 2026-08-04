/**
 * Attendance Trend Bar Chart Component
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { AttendanceTrend } from '@/api/types';

interface AttendanceChartProps {
  data: AttendanceTrend[];
}

export const AttendanceChart: React.FC<AttendanceChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-center text-gray-500 py-8">No data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis domain={[0, 100]} />
        <Tooltip />
        <Legend />
        <Bar
          dataKey="avgAttendance"
          fill="#10b981"
          name="Average Attendance %"
        />
      </BarChart>
    </ResponsiveContainer>
  );
};
