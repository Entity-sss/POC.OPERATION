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
  const renderedChildren = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<any>, {
        id: (children as React.ReactElement<any>).props.id || id,
        ...(error
          ? {
              'aria-invalid': true,
              'aria-describedby': (children as React.ReactElement<any>).props['aria-describedby']
                ? `${(children as React.ReactElement<any>).props['aria-describedby']} ${id}-error`
                : `${id}-error`,
            }
          : {}),
      })
    : children;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-xs font-semibold text-text-secondary tracking-wide uppercase font-mono">
          {label}
          {required && <span className="text-status-error ml-1">*</span>}
        </label>
        {hint && !error && (
          <span className="text-xs text-text-tertiary">{hint}</span>
        )}
      </div>

      <div>{renderedChildren}</div>

      {error && (
        <p id={`${id}-error`} className="text-xs text-status-error flex items-center gap-1 mt-1 animate-fadeIn" role="alert">
          <span>⚠</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
