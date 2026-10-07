import React from 'react';

export interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
  };
  progress?: {
    current: number;
    target: number;
    label?: string;
  };
  variant?: 'default' | 'gold' | 'success' | 'warning' | 'error';
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  progress,
  variant = 'default',
  className = '',
}) => {
  const variantStyles = {
    default: 'border-white/5 hover:border-white/10',
    gold: 'border-brand-primary/30 hover:border-brand-primary/50 shadow-gold-glow',
    success: 'border-status-success/30 hover:border-status-success/50',
    warning: 'border-status-warning/30 hover:border-status-warning/50',
    error: 'border-status-error/30 hover:border-status-error/50',
  };

  const trendColor = trend
    ? trend.direction === 'up'
      ? 'text-status-success'
      : trend.direction === 'down'
      ? 'text-status-error'
      : 'text-text-tertiary'
    : '';

  const progressPercent = progress
    ? Math.min(100, Math.round((progress.current / progress.target) * 100))
    : null;

  return (
    <div
      className={`glass-panel p-5 rounded-xl border transition-all duration-200 flex flex-col justify-between ${variantStyles[variant]} ${className}`}
    >
      <div className="flex items-center justify-between text-text-tertiary mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider font-mono">
          {title}
        </span>
        {icon && (
          <div className="p-2 rounded-lg bg-surface-card border border-border-subtle text-brand-primary">
            {icon}
          </div>
        )}
      </div>

      <div>
        <div className="text-2xl sm:text-3xl font-bold font-mono text-text-primary tracking-tight">
          {value}
        </div>

        {trend && (
          <div className={`text-xs flex items-center gap-1.5 mt-1.5 font-medium ${trendColor}`}>
            <span>
              {trend.direction === 'up' && '↑'}
              {trend.direction === 'down' && '↓'}
              {trend.direction === 'neutral' && '→'} {trend.value}
            </span>
            {trend.label && (
              <span className="text-text-tertiary font-normal">{trend.label}</span>
            )}
          </div>
        )}

        {subtitle && !trend && (
          <p className="text-xs text-text-secondary mt-1 font-detail">{subtitle}</p>
        )}

        {progressPercent !== null && (
          <div className="mt-3.5 space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-text-tertiary">{progress?.label || 'Target Completion'}</span>
              <span className="font-semibold text-brand-primary">{progressPercent}%</span>
            </div>
            <div className="w-full bg-surface-base rounded-full h-1.5 overflow-hidden border border-border-subtle">
              <div
                className="bg-brand-primary h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
