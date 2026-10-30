import { forwardRef, HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const baseStyles = `
  rounded-2xl border border-slate-700
  bg-slate-800/80 backdrop-blur-sm
  transition-all duration-200 ease-out
`;

const variants = {
  default: `
    shadow-lg
    hover:border-slate-600 hover:shadow-xl
  `,
  elevated: `
    bg-slate-900/90 shadow-2xl border-slate-700/50
  `,
  interactive: `
    cursor-pointer
    hover:border-sky-600/50 hover:shadow-xl hover:-translate-y-1
    active:translate-y-0 active:shadow-lg
  `,
  bordered: `
    border-2 border-slate-700
    hover:border-slate-600
  `,
};

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', padding = 'md', className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(baseStyles, variants[variant], paddings[padding], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={clsx('mb-4', className)} {...props}>
      {children}
    </div>
  )
);
CardHeader.displayName = 'CardHeader';

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}
export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className = '', children, ...props }, ref) => (
    <h3 ref={ref} className={clsx('text-xl font-bold text-slate-50', className)} {...props}>
      {children}
    </h3>
  )
);
CardTitle.displayName = 'CardTitle';

export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}
export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className = '', children, ...props }, ref) => (
    <p ref={ref} className={clsx('text-slate-400 text-sm mt-1', className)} {...props}>
      {children}
    </p>
  )
);
CardDescription.displayName = 'CardDescription';

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}
export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={clsx('', className)} {...props}>
      {children}
    </div>
  )
);
CardContent.displayName = 'CardContent';

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}
export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx('mt-4 pt-4 border-t border-slate-700/50 flex items-center gap-3', className)}
      {...props}
    >
      {children}
    </div>
  )
);
CardFooter.displayName = 'CardFooter';

export default Card;
