import React from 'react';

interface RiskBadgeProps {
  level: string; // 'low' | 'medium' | 'high' | 'critical'
  score?: number;
  size?: 'sm' | 'md';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score, size = 'md' }) => {
  const lvl = level?.toLowerCase() || 'low';

  const styles: Record<string, string> = {
    low: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    medium: 'bg-amber-50 text-amber-900 border-amber-200/80',
    high: 'bg-orange-50 text-orange-950 border-orange-200/80',
    critical: 'bg-rose-50 text-rose-950 border-rose-200/80',
  };

  const dotColors: Record<string, string> = {
    low: 'bg-emerald-600',
    medium: 'bg-amber-600',
    high: 'bg-orange-600',
    critical: 'bg-rose-700',
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-semibold uppercase tracking-wider rounded border ${
        styles[lvl] || styles.low
      } ${sizeClasses}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColors[lvl] || dotColors.low}`} />
      <span>{lvl}</span>
      {score !== undefined && score !== null && (
        <span className="opacity-75 font-normal">({score.toFixed(2)})</span>
      )}
    </span>
  );
};

interface PriorityBadgeProps {
  priority: string; // 'Immediate' | 'Urgent' | 'Monitor' | 'Normal'
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const p = priority?.toLowerCase() || 'normal';

  const styles: Record<string, string> = {
    immediate: 'bg-rose-900 text-rose-50 border-rose-950 font-bold',
    urgent: 'bg-amber-800 text-amber-50 border-amber-900 font-bold',
    monitor: 'bg-amber-100 text-amber-950 border-amber-300 font-medium',
    normal: 'bg-stone-100 text-slate-700 border-stone-300 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-mono tracking-wider uppercase rounded border ${
        styles[p] || styles.normal
      }`}
    >
      {priority}
    </span>
  );
};
