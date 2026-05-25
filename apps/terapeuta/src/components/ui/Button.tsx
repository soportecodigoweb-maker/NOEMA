'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'inverse';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClass: Record<ButtonVariant, string> = {
  primary:
    'bg-noema-sage text-bone hover:bg-noema-deep active:bg-noema-deep disabled:bg-noema-sage/40',
  secondary:
    'bg-transparent text-noema-sage border border-noema-sage hover:bg-noema-sage/10 disabled:opacity-40',
  ghost:
    'bg-transparent text-noema-sage hover:bg-noema-sage/10 disabled:opacity-40',
  danger:
    'bg-[#B85450] text-white hover:bg-[#A14642] disabled:opacity-50',
  inverse:
    'bg-bone text-noema-deep hover:bg-bone/90 disabled:opacity-50',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-[15px]',
  lg: 'h-13 px-6 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-md font-sans font-medium',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noema-sage focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
          'disabled:cursor-not-allowed',
          variantClass[variant],
          sizeClass[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : children}
      </button>
    );
  },
);

Button.displayName = 'Button';
