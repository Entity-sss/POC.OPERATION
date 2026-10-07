import React, { useState, useEffect } from 'react';
import { PinnacleLogo } from '../ui/PinnacleLogo';
import { Icons } from '../ui/Icons';
import { NavIcon } from './NavIcon';
import { getFilteredNavigation, getActiveHref } from './navigation';

interface SidebarProps {
  permissions: string[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  permissions,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const sections = getFilteredNavigation(permissions);

  // Reactive active href: tracks the hash so active state updates on nav
  const [activeHref, setActiveHref] = useState<string>(() => getActiveHref());

  useEffect(() => {
    const update = () => setActiveHref(getActiveHref());
    window.addEventListener('hashchange', update);
    window.addEventListener('popstate', update);
    update();
    return () => {
      window.removeEventListener('hashchange', update);
      window.removeEventListener('popstate', update);
    };
  }, []);

  return (
    <aside
      className={`hidden lg:flex flex-col h-screen border-r border-slate-800 bg-[#0D1526] transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        {!isCollapsed ? (
          <a href="/dashboard" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded">
            <PinnacleLogo size="sm" showSubtitle={false} />
          </a>
        ) : (
          <div className="mx-auto">
            <div className="w-8 h-8 rounded-lg bg-[#111C33] border border-brand-primary/40 flex items-center justify-center text-brand-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M3 20L12 4L16 11L21 20H3Z" fill="rgba(212, 175, 55, 0.2)" />
              </svg>
            </div>
          </div>
        )}

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Icons.ChevronRight className={`w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-0.5">
            {!isCollapsed && section.title && (
              <h4 className="px-3 mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                {section.title}
              </h4>
            )}
            {section.items.map((item) => {
              // Match full href including hash; for plain /dashboard match when no hash
              const isActive =
                item.href === '/dashboard'
                  ? activeHref === '/dashboard' || activeHref === '/dashboard'
                  : activeHref === item.href ||
                    activeHref === item.href.toLowerCase();

              return (
                <a
                  key={item.id}
                  href={item.href}
                  title={isCollapsed ? item.label : undefined}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] sm:text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/25'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                >
                  <span className={`flex-shrink-0 transition-colors ${isActive ? 'text-brand-primary' : 'text-slate-500 group-hover:text-slate-300'}`}>
                    <NavIcon name={item.iconName} />
                  </span>
                  {!isCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                  {!isCollapsed && item.badge && (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-brand-primary/20 text-brand-primary font-mono font-bold">
                      {item.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </div>
        ))}
      </div>

      {/* Environment Status */}
      <div className="p-4 border-t border-slate-800">
        {!isCollapsed ? (
          <div className="px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-400">Environment</span>
            </div>
            <span className="font-mono text-emerald-400 font-semibold">LOCAL DEV</span>
          </div>
        ) : (
          <div className="flex justify-center" title="Environment: Local Dev">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        )}
      </div>
    </aside>
  );
};
