import React from 'react';
import { Icons } from './Icons';

interface AlertProps {
  type?: 'error' | 'warning' | 'success' | 'info';
  variant?: 'error' | 'warning' | 'success' | 'info';
  title?: string;
  message?: string;
  children?: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  variant,
  title,
  message,
  children,
  className = '',
}) => {
  const effectiveType = variant || type;
  const styles = {
    error: {
      bg: 'bg-status-error-bg',
      border: 'border-status-error/30',
      text: 'text-status-error',
      icon: <Icons.AlertCircle className="w-5 h-5 flex-shrink-0 text-status-error" />,
    },
    warning: {
      bg: 'bg-status-warning-bg',
      border: 'border-status-warning/30',
      text: 'text-status-warning',
      icon: <Icons.AlertCircle className="w-5 h-5 flex-shrink-0 text-status-warning" />,
    },
    success: {
      bg: 'bg-status-success-bg',
      border: 'border-status-success/30',
      text: 'text-status-success',
      icon: <Icons.CheckCircle className="w-5 h-5 flex-shrink-0 text-status-success" />,
    },
    info: {
      bg: 'bg-status-info-bg',
      border: 'border-status-info/30',
      text: 'text-status-info',
      icon: <Icons.Info className="w-5 h-5 flex-shrink-0 text-status-info" />,
    },
  };

  const current = styles[effectiveType] || styles.info;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-3.5 rounded-lg border text-sm backdrop-blur-sm ${current.bg} ${current.border} ${className}`}
    >
      {current.icon}
      <div className="flex flex-col gap-0.5 leading-tight">
        {title && <span className="font-semibold text-text-primary text-xs tracking-wide uppercase">{title}</span>}
        {children ? <div className="text-text-secondary">{children}</div> : <span className="text-text-secondary">{message}</span>}
      </div>
    </div>
  );
};
