import React from 'react';

interface MetricCardProps {
  index: string; // e.g. "01"
  label: string;
  value: string | number;
  sublabel?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  accentColor?: 'slate' | 'emerald' | 'amber' | 'crimson' | 'indigo';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  index,
  label,
  value,
  sublabel,
  trend,
  accentColor = 'slate',
}) => {
  const accentClasses = {
    slate: 'border-t-slate-900',
    emerald: 'border-t-emerald-700',
    amber: 'border-t-amber-600',
    crimson: 'border-t-rose-800',
    indigo: 'border-t-indigo-900',
  };

  return (
    <div
      className={`bg-white border border-stone-200/90 rounded-lg p-5 border-t-2 ${accentClasses[accentColor]} shadow-xs flex flex-col justify-between transition-all duration-150 hover:border-stone-300`}
    >
      <div>
        <div className="flex justify-between items-start mb-2">
          <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {index} // {label}
          </span>
          {trend && (
            <span
              className={`font-mono text-[11px] font-semibold ${
                trend.isNeutral
                  ? 'text-slate-500'
                  : trend.isPositive
                  ? 'text-emerald-700'
                  : 'text-rose-700'
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
        <div className="font-serif text-3xl md:text-4xl font-semibold text-slate-950 tracking-tight mt-1">
          {value}
        </div>
      </div>
      {sublabel && (
        <div className="mt-3 pt-2.5 border-t border-stone-100 font-sans text-xs text-slate-500">
          {sublabel}
        </div>
      )}
    </div>
  );
};
