/**
 * GPA Trend Line Chart Component
 */

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { GpaTrend } from '@/api/types';

interface GpaChartProps {
  data: GpaTrend[];
}

export const GpaChart: React.FC<GpaChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-center text-gray-500 py-8">No data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="semester" />
        <YAxis domain={[0, 4]} />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="avgGpa"
          stroke="#3b82f6"
          strokeWidth={2}
          name="Average GPA"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
