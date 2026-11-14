import { cn } from '@/lib/utils';

export function Badge({ className, variant = 'default', children, ...props }) {
  const variants = {
    default:
      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    brand:
      'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border-brand-200 dark:border-brand-800',
    success:
      'bg-success-50 text-success-700 dark:bg-success-950/60 dark:text-success-300 border-success-200 dark:border-success-800',
    warning:
      'bg-warning-50 text-warning-700 dark:bg-warning-950/60 dark:text-warning-300 border-warning-200 dark:border-warning-800',
    danger:
      'bg-danger-50 text-danger-700 dark:bg-danger-950/60 dark:text-danger-300 border-danger-200 dark:border-danger-800',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

