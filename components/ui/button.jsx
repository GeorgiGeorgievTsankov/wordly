import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Button = forwardRef(function Button(
  {
    className,
    variant = 'primary',
    size = 'md',
    type = 'button',
    disabled = false,
    children,
    ...props
  },
  ref
) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] select-none';

  const variants = {
    primary:
      'bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500 shadow-sm shadow-brand-500/20',
    secondary:
      'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 focus:ring-slate-400',
    outline:
      'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 focus:ring-brand-500',
    ghost:
      'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-slate-400',
    danger:
      'bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500 shadow-sm shadow-danger-500/20',
    success:
      'bg-success-600 text-white hover:bg-success-700 focus:ring-success-500 shadow-sm shadow-success-500/20',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5',
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
});

