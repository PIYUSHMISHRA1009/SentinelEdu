import React from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  dateStr?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow = 'ACADEMIC INTELLIGENCE PLATFORM',
  title,
  subtitle,
  action,
  dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
}) => {
  return (
    <div className="border-b border-stone-200/90 pb-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-semibold tracking-widest text-slate-500 uppercase">
              {eyebrow}
            </span>
            <span className="text-stone-300">•</span>
            <span className="font-mono text-[11px] text-slate-400">
              {dateStr}
            </span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-slate-950 font-medium tracking-tight mt-1.5">
            {title}
          </h1>
          {subtitle && (
            <p className="text-slate-600 text-sm md:text-base mt-1.5 max-w-3xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          <div className="flex items-center gap-3 shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  );
};
