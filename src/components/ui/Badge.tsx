import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'gold' | 'neutral';
  size?: 'sm' | 'md';
  dot?: boolean;
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  pulse = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium font-mono uppercase tracking-wider rounded-md select-none';

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs sm:text-sm px-2.5 py-1 gap-1.5',
  };

  const variantStyles = {
    success: 'bg-status-success-bg text-status-success border border-status-success/30',
    warning: 'bg-status-warning-bg text-status-warning border border-status-warning/30',
    error: 'bg-status-error-bg text-status-error border border-status-error/30',
    info: 'bg-status-info-bg text-status-info border border-status-info/30',
    gold: 'bg-brand-primary/10 text-brand-primary border border-brand-primary/30',
    neutral: 'bg-surface-subtle text-text-secondary border border-border-default',
  };

  const dotColors = {
    success: 'bg-status-success',
    warning: 'bg-status-warning',
    error: 'bg-status-error',
    info: 'bg-status-info',
    gold: 'bg-brand-primary',
    neutral: 'bg-text-tertiary',
  };

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`} {...props}>
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} ${pulse ? 'animate-ping' : ''}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
};
