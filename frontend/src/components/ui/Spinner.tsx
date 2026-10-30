import { HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'inverse';
}

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

const variants = {
  default: 'text-sky-600',
  primary: 'text-sky-600',
  inverse: 'text-white',
};

export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ size = 'md', variant = 'default', className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx('inline-block animate-spin', sizes[size], variants[variant], className)}
        role="status"
        aria-label="Loading"
        {...props}
      >
        <svg
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
);

Spinner.displayName = 'Spinner';

export interface LoadingOverlayProps extends HTMLAttributes<HTMLDivElement> {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingOverlay = forwardRef<HTMLDivElement, LoadingOverlayProps>(
  ({ message = 'Loading...', size = 'md', className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'fixed inset-0 z-50 flex items-center justify-center',
          'bg-slate-950/80 backdrop-blur-sm',
          className
        )}
        role="status"
        aria-live="polite"
        aria-label={message}
        {...props}
      >
        <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl max-w-sm mx-4">
          <Spinner size={size} variant="primary" />
          <p className="text-sm font-medium text-slate-300 text-center">{message}</p>
        </div>
      </div>
    );
  }
);

LoadingOverlay.displayName = 'LoadingOverlay';

export default Spinner;
