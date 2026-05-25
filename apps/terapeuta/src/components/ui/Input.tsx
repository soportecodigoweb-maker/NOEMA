import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const inputBase =
  'w-full rounded-md border border-noema-deep/10 bg-bone px-3 py-2.5 text-[15px] text-ink ' +
  'placeholder:text-ink/35 ' +
  'focus:outline-none focus:border-noema-sage focus:ring-1 focus:ring-noema-sage ' +
  'disabled:cursor-not-allowed disabled:opacity-60 ' +
  'transition-colors';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helper, error, className, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="caption">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(inputBase, error && 'border-[#B85450] focus:border-[#B85450] focus:ring-[#B85450]', className)}
          {...props}
        />
        {error ? (
          <p className="text-xs text-[#B85450]">{error}</p>
        ) : helper ? (
          <p className="text-xs text-foreground-muted">{helper}</p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = 'Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helper?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helper, error, className, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="caption">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(inputBase, 'min-h-[120px] resize-y leading-relaxed', error && 'border-[#B85450]', className)}
          {...props}
        />
        {error ? (
          <p className="text-xs text-[#B85450]">{error}</p>
        ) : helper ? (
          <p className="text-xs text-foreground-muted">{helper}</p>
        ) : null}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
