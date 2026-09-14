import React from 'react';

export interface FormFieldProps {
  label: string;
  id: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  id,
  required = false,
  error,
  hint,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-xs font-semibold text-text-secondary tracking-wide uppercase font-mono">
          {label}
          {required && <span className="text-status-error ml-1">*</span>}
        </label>
        {hint && !error && (
          <span className="text-[11px] text-text-tertiary">{hint}</span>
        )}
      </div>

      <div>{children}</div>

      {error && (
        <p id={`${id}-error`} className="text-xs text-status-error flex items-center gap-1 mt-1 animate-fadeIn">
          <span>⚠</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
