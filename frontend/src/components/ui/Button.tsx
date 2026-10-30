import { forwardRef, ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const baseStyles = `
  inline-flex items-center justify-center gap-2
  font-medium rounded-lg transition-all duration-150 ease-out
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950
  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none
  touch-manipulation
`;

const variants = {
  primary: `
    bg-sky-700 text-white
    hover:bg-sky-600 active:bg-sky-800
    shadow-glow-sky
    hover:shadow-glow-sky-lg hover:-translate-y-0.5
    active:shadow-sm active:translate-y-0
  `,
  secondary: `
    bg-slate-800 text-slate-50 border border-slate-700
    hover:bg-slate-700 hover:border-slate-600
    active:bg-slate-800
  `,
  ghost: `
    bg-transparent text-slate-400
    hover:bg-slate-900 hover:text-slate-100
    active:bg-slate-900/50
  `,
  destructive: `
    bg-red-600 text-white
    hover:bg-red-600/80 active:bg-red-700
    shadow-glow-red
    hover:shadow-glow-red-lg hover:-translate-y-0.5
    active:shadow-sm active:translate-y-0
  `,
  outline: `
    bg-transparent text-sky-600 border border-sky-600/50
    hover:bg-sky-600/10 hover:border-sky-600 hover:text-sky-500
    active:bg-sky-600/20
  `,
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs min-h-[36px] gap-1.5',
  md: 'px-4 py-2 text-sm min-h-[44px] gap-2',
  lg: 'px-6 py-3 text-base min-h-[48px] gap-2.5',
  icon: 'p-2 min-h-[44px] min-w-[44px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={clsx(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={isDisabled}
        aria-busy={loading}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
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
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && (
              <span className="flex-shrink-0" aria-hidden="true">
                {leftIcon}
              </span>
            )}
            {children}
            {rightIcon && (
              <span className="flex-shrink-0" aria-hidden="true">
                {rightIcon}
              </span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
