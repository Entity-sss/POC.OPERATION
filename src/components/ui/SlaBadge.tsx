import React from 'react';

export type SlaStatus = 'ON_TRACK' | 'WATCH' | 'AT_RISK' | 'CRITICAL' | 'OVERDUE';

export interface SlaBadgeProps {
  status: SlaStatus;
  score?: number;
  label?: string;
  className?: string;
}

export const SlaBadge: React.FC<SlaBadgeProps> = ({
  status,
  score,
  label,
  className = '',
}) => {
  const configs: Record<SlaStatus, { text: string; icon: string; styles: string }> = {
    ON_TRACK: {
      text: 'ON TRACK',
      icon: '✓',
      styles: 'bg-status-success-bg text-status-success border-status-success/30',
    },
    WATCH: {
      text: 'WATCH',
      icon: '◉',
      styles: 'bg-status-warning-bg text-status-warning border-status-warning/30',
    },
    AT_RISK: {
      text: 'AT RISK',
      icon: '▲',
      styles: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    },
    CRITICAL: {
      text: 'CRITICAL',
      icon: '⚠',
      styles: 'bg-status-error-bg text-status-error border-status-error/30 animate-pulse',
    },
    OVERDUE: {
      text: 'OVERDUE',
      icon: '⧗',
      styles: 'bg-status-error text-surface-base font-bold border-status-error',
    },
  };

  const config = configs[status] || configs.ON_TRACK;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border select-none ${config.styles} ${className}`}
    >
      <span aria-hidden="true">{config.icon}</span>
      <span>{config.text}</span>
      {score !== undefined && (
        <span className="opacity-75 font-normal">({score}%)</span>
      )}
      {label && (
        <>
          <span className="opacity-40">•</span>
          <span className="text-xs opacity-90">{label}</span>
        </>
      )}
    </span>
  );
};
