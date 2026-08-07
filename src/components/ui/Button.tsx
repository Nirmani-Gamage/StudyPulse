import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-[var(--radius-btn)] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
          {
            'bg-[var(--color-primary)] text-white hover:bg-[#4338CA] shadow-sm hover:shadow': variant === 'primary',
            'bg-[var(--color-secondary)] text-white hover:bg-[#6D28D9] shadow-sm hover:shadow': variant === 'secondary',
            'border border-[var(--border-color)] bg-transparent hover:bg-[var(--border-color)] text-[var(--text-primary)]': variant === 'outline',
            'bg-transparent hover:bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]': variant === 'ghost',
            'bg-[var(--color-error)] text-white hover:bg-[#DC2626]': variant === 'danger',
            'h-9 px-3 text-sm': size === 'sm',
            'h-11 px-4 text-base': size === 'md',
            'h-12 px-6 text-lg': size === 'lg',
            'h-10 w-10 p-2': size === 'icon',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
