import { HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'critical' | 'high' | 'medium' | 'low' | 'success' | 'warning' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

const baseStyles = `
  inline-flex items-center gap-1.5
  font-semibold uppercase tracking-wider
  rounded-full
  transition-all duration-150 ease-out
`;

const variants = {
  critical: 'bg-red-900/30 text-red-400 border border-red-900/50',
  high: 'bg-orange-900/30 text-orange-400 border border-orange-900/50',
  medium: 'bg-amber-900/30 text-amber-400 border border-amber-900/50',
  low: 'bg-green-900/30 text-green-400 border border-green-900/50',
  success: 'bg-green-900/30 text-green-400 border border-green-900/50',
  warning: 'bg-amber-900/30 text-amber-400 border border-amber-900/50',
  info: 'bg-cyan-900/30 text-cyan-400 border border-cyan-900/50',
  neutral: 'bg-slate-700/50 text-slate-400 border border-slate-700',
};

const sizes = {
  sm: 'px-2 py-0.5 text-[10px] gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
  lg: 'px-3 py-1.5 text-xs gap-2',
};

const dotSizes = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
  lg: 'h-2.5 w-2.5',
};

const dotColors = {
  critical: 'bg-red-400',
  high: 'bg-orange-400',
  medium: 'bg-amber-400',
  low: 'bg-green-400',
  success: 'bg-green-400',
  warning: 'bg-amber-400',
  info: 'bg-cyan-400',
  neutral: 'bg-slate-400',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'neutral', size = 'md', dot = false, className = '', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {dot && (
          <span
            className={clsx('rounded-full animate-pulse', dotSizes[size], dotColors[variant])}
            aria-hidden="true"
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
