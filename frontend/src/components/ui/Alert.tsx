import { HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  title?: string;
  description?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const baseStyles = `
  relative flex gap-3 p-4 rounded-xl border
  transition-all duration-150 ease-out
`;

const variants = {
  default: 'bg-slate-800/80 border-slate-700 text-slate-100',
  destructive: 'bg-red-900/30 border-red-900/50 text-red-100',
  success: 'bg-green-900/30 border-green-900/50 text-green-100',
  warning: 'bg-amber-900/30 border-amber-900/50 text-amber-100',
  info: 'bg-cyan-900/30 border-cyan-900/50 text-cyan-100',
};

const icons = {
  default: (
    <svg className="h-5 w-5 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4M12 8h.01" />
    </svg>
  ),
  destructive: (
    <svg className="h-5 w-5 flex-shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  success: (
    <svg className="h-5 w-5 flex-shrink-0 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5 flex-shrink-0 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5 flex-shrink-0 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      variant = 'default',
      title,
      description,
      dismissible = false,
      onDismiss,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={clsx(baseStyles, variants[variant], className)}
        role="alert"
        {...props}
      >
        <div className="flex-shrink-0 pt-0.5" aria-hidden="true">
          {icons[variant]}
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="font-semibold text-base">{title}</h4>
          )}
          {description && (
            <p className="mt-1 text-sm opacity-90">{description}</p>
          )}
          {children && (
            <div className="mt-2">{children}</div>
          )}
        </div>
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 rounded-lg text-current/50 hover:text-current/70 focus:outline-none focus:ring-2 focus:ring-current"
            aria-label="Dismiss"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export default Alert;