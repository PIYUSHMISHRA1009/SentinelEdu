import {
  forwardRef,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
} from 'react';
import { clsx } from 'clsx';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const baseStyles = `
  w-full bg-slate-950 border border-slate-700 rounded-xl
  px-4 py-3 text-sm text-slate-50
  placeholder:text-slate-500/60
  transition-all duration-150 ease-out
  min-h-[44px]
`;

const states = {
  default: `
    hover:border-slate-600
    focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20 focus:ring-offset-2 focus:ring-offset-slate-950
  `,
  error: `
    border-red-600
    focus:border-red-600 focus:ring-2 focus:ring-red-600/20 focus:ring-offset-2 focus:ring-offset-slate-950
  `,
  disabled: `
    opacity-50 cursor-not-allowed
  `,
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      className = '',
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const helperId = helperText ? `${inputId}-helper` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const describedBy = [helperId, errorId].filter(Boolean).join(' ') || undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-1.5"
          >
            {label}
            {required && (
              <span className="text-red-500" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none flex items-center justify-center"
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              baseStyles,
              error ? states.error : states.default,
              disabled && states.disabled,
              leftIcon && 'pl-12',
              rightIcon && 'pr-12',
              className
            )}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={describedBy}
            aria-required={required}
            {...props}
          />
          {rightIcon && (
            <div
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none flex items-center justify-center"
              aria-hidden="true"
            >
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p
            id={errorId}
            className="mt-2 text-xs text-red-400 flex items-center gap-1"
            role="alert"
          >
            <svg
              className="h-3.5 w-3.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-2 text-xs text-slate-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className = '', required, children, ...props }, ref) => (
    <label
      ref={ref}
      className={clsx(
        'block text-sm font-medium text-slate-300 mb-2 flex items-center gap-1.5',
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="text-red-500" aria-hidden="true">
          *
        </span>
      )}
    </label>
  )
);
Label.displayName = 'Label';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, className = '', id, disabled, required, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const helperId = helperText ? `${textareaId}-helper` : undefined;
    const errorId = error ? `${textareaId}-error` : undefined;
    const describedBy = [helperId, errorId].filter(Boolean).join(' ') || undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-1.5"
          >
            {label}
            {required && (
              <span className="text-red-500" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={clsx(
            baseStyles,
            error ? states.error : states.default,
            disabled && states.disabled,
            className
          )}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          aria-required={required}
          rows={4}
          {...props}
        />
        {error && (
          <p
            id={errorId}
            className="mt-2 text-xs text-red-400 flex items-center gap-1"
            role="alert"
          >
            <svg
              className="h-3.5 w-3.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-2 text-xs text-slate-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      error,
      options,
      placeholder,
      className = '',
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const helperId = helperText ? `${selectId}-helper` : undefined;
    const errorId = error ? `${selectId}-error` : undefined;
    const describedBy = [helperId, errorId].filter(Boolean).join(' ') || undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-1.5"
          >
            {label}
            {required && (
              <span className="text-red-500" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={clsx(
              baseStyles,
              error ? states.error : states.default,
              disabled && states.disabled,
              'appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")] bg-no-repeat bg-right-4 bg-center pr-12',
              className
            )}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={describedBy}
            aria-required={required}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div
            className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500"
            aria-hidden="true"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
        {error && (
          <p className="mt-2 text-xs text-red-400 flex items-center gap-1" role="alert">
            <svg
              className="h-3.5 w-3.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
        {helperText && !error && <p className="mt-2 text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

export default Input;
