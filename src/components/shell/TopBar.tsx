import React, { useState, useEffect, useRef } from 'react';
import { UserMenu } from './UserMenu';
import { Icons } from '../ui/Icons';

interface TopBarProps {
  user: {
    id: string;
    employeeId: string;
    fullName: string;
    email: string;
    roles?: Array<{ id: string; code: string; name: string }>;
    isImpersonated?: boolean;
    impersonatorName?: string;
  };
  onOpenMobileNav: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ user, onOpenMobileNav }) => {
  // Global search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Notifications state
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  // Handle Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsNotifOpen(false);
      }
    };

    const handleCustomOpen = () => setIsSearchOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-global-search', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-global-search', handleCustomOpen);
    };
  }, []);

  // Focus search input when modal opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  // Outside click for notifications
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    if (isNotifOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isNotifOpen]);

  // Load notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const json: any = await res.json();
          const data = json.data || json;
          setNotifications(data.items || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (e) {}
    };

    fetchNotifications();
  }, []);

  // Perform search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const json: any = await res.json();
          const data = json.data || json;
          setSearchResults(data.results || []);
        }
      } catch (e) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchResultClick = (targetHash: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    if (window.location.pathname === '/dashboard') {
      window.location.hash = targetHash;
    } else {
      window.location.href = `/dashboard${targetHash}`;
    }
  };

  return (
    <>
      {/* Persistent Impersonation Banner if active */}
      {user.isImpersonated && (
        <div className="bg-brand-primary text-surface-base px-4 py-1.5 flex items-center justify-between text-xs font-medium z-40">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-status-warning animate-ping" />
            <span>
              <strong>IMPERSONATION ACTIVE:</strong> Operating as {user.fullName} ({user.employeeId}) by {user.impersonatorName || 'Administrator'}. All actions are audited.
            </span>
          </div>
          <button
            onClick={() => {
              window.location.href = '/api/auth/logout';
            }}
            className="px-2.5 py-1 bg-surface-base text-brand-primary font-semibold rounded hover:bg-surface-card transition-colors text-xs font-mono"
          >
            Exit Impersonation
          </button>
        </div>
      )}

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
          <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-surface-card border border-border-subtle text-xs font-mono text-text-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
            <span>D1_PRIMARY: ACTIVE</span>
          </div>

          <button
            onClick={() => setIsSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-card/60 hover:bg-surface-card border border-border-default hover:border-brand-primary/40 text-xs sm:text-[13px] text-text-secondary w-52 transition-colors text-left"
          >
            <Icons.Search className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="flex-1 truncate">Quick search...</span>
            <kbd className="text-xs bg-surface-base px-1.5 py-0.5 rounded border border-border-subtle font-mono text-text-secondary">Ctrl+K</kbd>
          </button>

          {/* Notifications Popover */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              aria-label="Notifications"
              className="p-2 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-surface-card transition-colors relative"
            >
              <Icons.Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-primary ring-2 ring-surface-base" />
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl glass-panel border border-white/10 p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-subtle">
                  <span className="text-xs font-semibold text-text-primary">Operational Alerts</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary">
                    {notifications.length} Active
                  </span>
                </div>

                {notifications.length === 0 ? (
                  <p className="text-xs text-text-tertiary text-center py-4 font-detail">
                    No active operational alerts. Everything is on schedule.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-72 overflow-y-auto">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          setIsNotifOpen(false);
                          handleSearchResultClick(n.targetHash);
                        }}
                        className="p-2.5 rounded-lg bg-surface-card/60 hover:bg-surface-card border border-border-subtle/60 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${
                            n.type === 'URGENT'
                              ? 'bg-status-error-bg text-status-error'
                              : n.type === 'WARNING'
                              ? 'bg-status-warning-bg text-status-warning'
                              : 'bg-brand-primary/10 text-brand-primary'
                          }`}>
                            {n.type}
                          </span>
                          <span className="text-xs text-text-tertiary font-mono">{n.time}</span>
                        </div>
                        <p className="text-xs font-semibold text-text-primary">{n.title}</p>
                        <p className="text-xs text-text-secondary font-detail truncate mt-0.5">{n.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="h-5 w-[1px] bg-border-subtle" />

          <UserMenu user={user} />
        </div>
      </header>

      {/* Quick Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 p-4 animate-in fade-in duration-100">
          <div className="w-full max-w-lg glass-panel border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-3 border-b border-border-subtle flex items-center gap-3">
              <Icons.Search className="w-4 h-4 text-brand-primary flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks, clients, team members..."
                className="w-full bg-transparent text-sm text-text-primary placeholder-text-tertiary focus:outline-none"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="text-xs px-2 py-0.5 rounded bg-surface-card text-text-tertiary hover:text-text-primary border border-border-subtle font-mono"
              >
                ESC
              </button>
            </div>

            <div className="p-2 max-h-80 overflow-y-auto">
              {isSearching && (
                <div className="text-center py-6 text-xs text-text-tertiary font-detail">
                  Searching operational records...
                </div>
              )}

              {!isSearching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                <div className="text-center py-6 text-xs text-text-tertiary font-detail">
                  No matching operational records found for "{searchQuery}".
                </div>
              )}

              {!isSearching && searchResults.length > 0 && (
                <div className="space-y-1">
                  {searchResults.map((item) => (
                    <div
                      key={`${item.type}-${item.id}`}
                      onClick={() => handleSearchResultClick(item.targetHash)}
                      className="p-2.5 rounded-lg hover:bg-surface-card cursor-pointer transition-colors flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-text-primary">{item.title}</p>
                        <p className="text-xs text-text-tertiary font-detail mt-0.5">{item.subtitle}</p>
                      </div>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-card border border-border-subtle text-brand-primary font-medium">
                        {item.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {!isSearching && searchQuery.trim().length < 2 && (
                <div className="p-3 text-xs text-text-tertiary font-detail space-y-1.5">
                  <p className="font-semibold text-text-secondary text-xs">Quick Shortcuts:</p>
                  <p>• Type at least 2 characters to search across Tasks, Clients, or Team Members.</p>
                  <p>• Press <kbd className="px-1.5 py-0.5 rounded bg-surface-card text-text-primary font-mono text-xs border border-border-subtle">Esc</kbd> anytime to close.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
