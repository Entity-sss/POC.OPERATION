import React from 'react';
import { UserMenu } from './UserMenu';
import { Icons } from '../ui/Icons';

interface TopBarProps {
  user: {
    id: string;
    employeeId: string;
    fullName: string;
    email: string;
    roles?: Array<{ id: string; code: string; name: string }>;
  };
  onOpenMobileNav: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ user, onOpenMobileNav }) => {
  return (
    <header className="h-16 border-b border-border-subtle/80 bg-surface-base/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile hamburger & current breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-surface-card transition-colors"
        >
          <Icons.Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-text-tertiary font-mono">POC.OPERATION</span>
          <span className="text-text-tertiary">/</span>
          <span className="text-text-primary font-medium tracking-wide">Workspace</span>
        </div>
      </div>

      {/* Right: Node Status, Search, Notifications & User Menu */}
      <div className="flex items-center gap-3">
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-card border border-border-subtle text-[11px] font-mono text-text-tertiary">
          <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
          <span>D1_PRIMARY: ACTIVE</span>
        </div>

        <button
          onClick={() => {
            // Trigger global search event
            window.dispatchEvent(new CustomEvent('open-global-search'));
          }}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-card/60 hover:bg-surface-card border border-border-default hover:border-brand-primary/40 text-xs text-text-tertiary w-48 transition-colors text-left"
        >
          <Icons.Search className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="flex-1 truncate">Quick search...</span>
          <kbd className="text-[10px] bg-surface-base px-1.5 py-0.5 rounded border border-border-subtle font-mono text-text-secondary">Ctrl+K</kbd>
        </button>

        <button 
          aria-label="Notifications" 
          className="p-2 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-surface-card transition-colors relative"
        >
          <Icons.Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-primary ring-2 ring-surface-base"></span>
        </button>

        <div className="h-5 w-[1px] bg-border-subtle"></div>

        <UserMenu user={user} />
      </div>
    </header>
  );
};
