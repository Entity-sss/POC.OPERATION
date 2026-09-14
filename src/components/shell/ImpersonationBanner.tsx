import React from 'react';
import { Icons } from '../ui/Icons';

export interface ImpersonationBannerProps {
  targetEmployeeId: string;
  targetFullName: string;
  onExit?: () => void;
}

export const ImpersonationBanner: React.FC<ImpersonationBannerProps> = ({
  targetEmployeeId,
  targetFullName,
  onExit,
}) => {
  return (
    <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-xs flex items-center justify-between z-40 relative backdrop-blur-sm">
      <div className="flex items-center gap-2 text-amber-400 font-medium">
        <Icons.Shield className="w-4 h-4 flex-shrink-0 text-amber-400 animate-pulse" />
        <span>
          <strong className="uppercase font-mono tracking-wider">Impersonation Active:</strong> Operating as{' '}
          <span className="text-text-primary underline decoration-amber-400/50">
            {targetFullName} ({targetEmployeeId})
          </span>{' '}
          under administrator delegation. All actions are audited.
        </span>
      </div>

      <button
        onClick={onExit || (() => { window.location.href = '/api/auth/exit-impersonation'; })}
        className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-surface-base font-bold text-[11px] uppercase tracking-wider font-mono shadow-sm transition-colors"
      >
        Exit Impersonation
      </button>
    </div>
  );
};
