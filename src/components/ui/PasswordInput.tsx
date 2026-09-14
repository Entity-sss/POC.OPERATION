import React, { useState } from 'react';
import { Icons } from './Icons';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  id: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  error,
  id,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="text-xs font-medium text-text-secondary tracking-wide uppercase">
            {label}
          </label>
        </div>
      )}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-text-tertiary pointer-events-none flex items-center justify-center">
          <Icons.Lock className="w-4 h-4" />
        </div>
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          className={`w-full bg-surface-card/80 border rounded-lg pl-10 pr-11 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-200 outline-none
            ${error ? 'border-status-error focus:ring-1 focus:ring-status-error' : 'border-border-default focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50'}
            ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          className="absolute right-3 p-1 text-text-tertiary hover:text-text-primary transition-colors focus:outline-none"
          tabIndex={-1}
        >
          {showPassword ? (
            <Icons.EyeOff className="w-4 h-4" />
          ) : (
            <Icons.Eye className="w-4 h-4" />
          )}
        </button>
      </div>
      {error && (
        <p className="text-xs text-status-error flex items-center gap-1 mt-0.5" role="alert">
          <Icons.AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
