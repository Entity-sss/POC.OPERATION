import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  label,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-5 h-5 border-2',
    lg: 'w-8 h-8 border-3',
  };

  return (
    <div className={`flex items-center gap-2.5 justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full border-brand-primary/20 border-t-brand-primary animate-spin`}
        role="status"
        aria-label={label || 'Loading'}
      />
      {label && <span className="text-xs text-text-secondary font-medium tracking-wide">{label}</span>}
    </div>
  );
};
