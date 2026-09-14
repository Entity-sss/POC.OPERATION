import React from 'react';
import { PinnacleLogo } from '../ui/PinnacleLogo';
import { Icons } from '../ui/Icons';
import { getFilteredNavigation, type NavItem } from './navigation';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  permissions: string[];
  currentPath?: string;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onClose,
  permissions,
  currentPath = '/dashboard',
}) => {
  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0B1120]/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-72 bg-surface-card border-r border-border-subtle p-4 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-200">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-border-subtle/80">
            <PinnacleLogo size="sm" />
            <button
              onClick={onClose}
              aria-label="Close navigation"
              className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-hover"
            >
              <Icons.X className="w-5 h-5" />
            </button>
          </div>

          <nav className="mt-6 space-y-6">
            {sections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                {section.title && (
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
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/30'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                      }`}
                    >
                      {renderIcon(item.iconName)}
                      <span>{item.label}</span>
                    </a>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        <div className="pt-4 border-t border-border-subtle/80 text-[11px] text-text-tertiary flex justify-between items-center">
          <span>Pinnacle Operations</span>
          <span className="font-mono text-brand-primary">v1.0.0</span>
        </div>
      </div>
    </div>
  );
};
