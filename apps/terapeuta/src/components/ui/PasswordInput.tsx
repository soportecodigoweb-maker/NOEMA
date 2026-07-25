'use client';

import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const inputBase =
  'w-full rounded-md border border-noema-deep/10 bg-bone px-3 py-2.5 pr-11 text-[15px] text-ink ' +
  'placeholder:text-ink/35 ' +
  'focus:outline-none focus:border-noema-sage focus:ring-1 focus:ring-noema-sage ' +
  'disabled:cursor-not-allowed disabled:opacity-60 ' +
  'transition-colors';

export interface PasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  helper?: string;
  error?: string;
}

/**
 * Campo de contraseña con botón de ojo para mostrar/ocultar lo escrito.
 * Mismo estilo que <Input>, pero con el toggle de visibilidad.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, helper, error, className, id, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const inputId = id || props.name;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="caption">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? 'text' : 'password'}
            className={cn(
              inputBase,
              error && 'border-[#B85450] focus:border-[#B85450] focus:ring-[#B85450]',
              className,
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={visible}
            tabIndex={-1}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-ink/45 transition-colors hover:text-ink/70"
          >
            {visible ? (
              <EyeOff className="size-[18px]" strokeWidth={1.7} />
            ) : (
              <Eye className="size-[18px]" strokeWidth={1.7} />
            )}
          </button>
        </div>
        {error ? (
          <p className="text-xs text-[#B85450]">{error}</p>
        ) : helper ? (
          <p className="text-xs text-foreground-muted">{helper}</p>
        ) : null}
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';
