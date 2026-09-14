import React from 'react';
import { PinnacleLogo } from '../ui/PinnacleLogo';
import { Icons } from '../ui/Icons';
import { getFilteredNavigation, type NavItem } from './navigation';

interface SidebarProps {
  permissions: string[];
  currentPath?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  permissions,
  currentPath = '/dashboard',
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const sections = getFilteredNavigation(permissions);

  const renderIcon = (name: NavItem['iconName']) => {
    switch (name) {
      case 'LayoutDashboard': return <Icons.LayoutDashboard className="w-5 h-5 flex-shrink-0" />;
      case 'Users': return <Icons.Users className="w-5 h-5 flex-shrink-0" />;
      case 'Box': return <Icons.Box className="w-5 h-5 flex-shrink-0" />;
      case 'FileCheck': return <Icons.FileCheck className="w-5 h-5 flex-shrink-0" />;
      case 'Settings': return <Icons.Settings className="w-5 h-5 flex-shrink-0" />;
      case 'Shield': return <Icons.Shield className="w-5 h-5 flex-shrink-0" />;
      default: return <Icons.LayoutDashboard className="w-5 h-5 flex-shrink-0" />;
    }
  };

  return (
    <aside
      className={`hidden lg:flex flex-col h-screen border-r border-border-subtle/80 bg-surface-card/40 backdrop-blur-xl transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border-subtle/60">
        {!isCollapsed ? (
          <a href="/dashboard" className="focus:outline-none">
            <PinnacleLogo size="sm" showSubtitle={false} />
          </a>
        ) : (
          <div className="mx-auto">
            <div className="w-8 h-8 rounded-lg bg-surface-card border border-brand-primary/40 flex items-center justify-center text-brand-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M3 20L12 4L16 11L21 20H3Z" fill="rgba(212, 175, 55, 0.2)" />
              </svg>
            </div>
          </div>
        )}

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="text-text-tertiary hover:text-text-primary p-1.5 rounded-lg hover:bg-surface-card transition-colors"
          >
            <Icons.ChevronRight className={`w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!isCollapsed && section.title && (
              <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                {section.title}
              </h4>
            )}
            {section.items.map((item) => {
              const isActive = currentPath === item.href;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/30 shadow-gold-glow'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-card/60'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                >
                  {renderIcon(item.iconName)}
                  {!isCollapsed && <span>{item.label}</span>}
                  {!isCollapsed && item.badge && (
                    <span className="ml-auto text-[9px] px-1.5 py-0.2 rounded bg-brand-primary/20 text-brand-primary font-mono">
                      {item.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </div>
        ))}
      </div>

      {/* System Status Pill */}
      <div className="p-4 border-t border-border-subtle/60">
        {!isCollapsed ? (
          <div className="p-2.5 rounded-lg bg-surface-card/60 border border-border-subtle flex items-center justify-between text-[11px]">
            <span className="text-text-tertiary">Environment</span>
            <span className="font-mono text-brand-primary font-semibold">PRODUCTION</span>
          </div>
        ) : (
          <div className="flex justify-center" title="Environment: Production">
            <span className="w-2 h-2 rounded-full bg-status-success"></span>
          </div>
        )}
      </div>
    </aside>
  );
};
