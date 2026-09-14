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

      {/* Right: Search, Notifications & User Menu */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-card/60 border border-border-default text-xs text-text-tertiary w-48">
          <Icons.Search className="w-3.5 h-3.5" />
          <span>Quick search...</span>
          <kbd className="ml-auto text-[10px] bg-surface-base px-1.5 py-0.5 rounded border border-border-subtle font-mono">⌘K</kbd>
        </div>

        <button 
          aria-label="Notifications" 
          className="p-2 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-surface-card transition-colors relative"
        >
          <Icons.Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-primary"></span>
        </button>

        <div className="h-5 w-[1px] bg-border-subtle"></div>

        <UserMenu user={user} />
      </div>
    </header>
  );
};
