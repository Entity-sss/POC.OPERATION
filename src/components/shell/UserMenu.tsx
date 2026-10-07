import React, { useState, useRef, useEffect } from 'react';
import { Icons } from '../ui/Icons';
import { logoutUser } from '@/lib/auth/client';

interface UserMenuProps {
  user: {
    id: string;
    employeeId: string;
    fullName: string;
    email: string;
    roles?: Array<{ id: string; code: string; name: string }>;
  };
}

export const UserMenu: React.FC<UserMenuProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logoutUser();
    window.location.href = '/';
  };

  const primaryRole = user.roles && user.roles.length > 0 ? user.roles[0].name : 'Authorized User';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-surface-card/60 transition-colors focus:outline-none focus:ring-1 focus:ring-brand-primary"
      >
        <div className="w-8 h-8 rounded-full bg-surface-card border border-brand-primary/40 flex items-center justify-center text-brand-primary font-semibold text-xs shadow-gold-glow">
          {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
        </div>
        <div className="hidden md:flex flex-col text-left leading-tight">
          <span className="text-[13px] font-semibold text-text-primary tracking-wide">{user.fullName}</span>
          <span className="text-xs text-brand-primary font-mono">{user.employeeId}</span>
        </div>
        <Icons.ChevronRight className={`w-3.5 h-3.5 text-text-tertiary transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl glass-panel border border-white/10 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 border-b border-border-subtle/80 mb-1">
            <p className="text-sm font-semibold text-text-primary">{user.fullName}</p>
            <p className="text-xs text-text-tertiary truncate">{user.email}</p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="text-xs px-2 py-0.5 rounded bg-brand-primary/10 border border-brand-primary/20 text-brand-primary font-mono uppercase">
                {primaryRole}
              </span>
              <span className="text-xs text-status-success font-mono font-semibold">ACTIVE</span>
            </div>
          </div>

          <div className="space-y-0.5">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs sm:text-[13px] text-status-error hover:bg-status-error-bg rounded-lg transition-colors text-left font-medium"
            >
              <Icons.LogOut className="w-4 h-4" />
              <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
