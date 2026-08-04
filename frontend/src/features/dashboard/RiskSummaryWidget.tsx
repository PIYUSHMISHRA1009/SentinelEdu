/**
 * Risk Summary Widget Component
 */

import React from 'react';
import type { RiskSummary } from '@/api/types';

interface RiskSummaryWidgetProps {
  data: RiskSummary[];
}

export const RiskSummaryWidget: React.FC<RiskSummaryWidgetProps> = ({ data }) => {
  // Ensure data is an array
  const safeData = Array.isArray(data) ? data : [];
  
  if (!safeData || safeData.length === 0) {
    return <div className="text-center text-gray-500 py-4 dark:text-slate-400">No risk data available</div>;
  }

  const total = safeData.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {safeData.map((item, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 dark:bg-slate-800 dark:border-slate-700"
        >
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-slate-300">{item.reason}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-slate-100">{item.count}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {total > 0 ? ((item.count / total) * 100).toFixed(0) : 0}%
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
