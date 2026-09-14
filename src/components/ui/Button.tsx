import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 select-none focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-surface-base disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none rounded-lg';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
    md: 'text-sm px-4 py-2 gap-2 h-10',
    lg: 'text-base px-5 py-2.5 gap-2.5 h-12',
  };

  const variantStyles = {
    primary: 'bg-brand-primary hover:bg-brand-primary-hover text-surface-base font-semibold shadow-gold-glow hover:shadow-gold-glow-lg border border-brand-primary/40 active:translate-y-px',
    secondary: 'bg-surface-card hover:bg-surface-hover text-text-primary border border-border-default hover:border-brand-primary/40 active:translate-y-px',
    outline: 'bg-transparent hover:bg-surface-subtle text-brand-primary border border-brand-primary/60 hover:border-brand-primary active:translate-y-px',
    ghost: 'bg-transparent hover:bg-surface-hover text-text-secondary hover:text-text-primary',
    danger: 'bg-status-error-bg text-status-error hover:bg-status-error/20 border border-status-error/30 active:translate-y-px',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <LoadingSpinner size={size === 'lg' ? 'md' : 'sm'} />
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
};
