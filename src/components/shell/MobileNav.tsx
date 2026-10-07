import React, { useState, useEffect } from 'react';
import { PinnacleLogo } from '../ui/PinnacleLogo';
import { Icons } from '../ui/Icons';
import { NavIcon } from './NavIcon';
import { getFilteredNavigation, getActiveHref } from './navigation';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  permissions: string[];
}

export const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onClose,
  permissions,
}) => {
  const sections = getFilteredNavigation(permissions);
  const [activeHref, setActiveHref] = useState<string>(() => getActiveHref());

  useEffect(() => {
    const update = () => setActiveHref(getActiveHref());
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0B1120]/75 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-72 bg-[#0D1526] border-r border-slate-800 p-4 flex flex-col justify-between shadow-2xl z-10">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <PinnacleLogo size="sm" />
            <button
              onClick={onClose}
              aria-label="Close navigation"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800"
            >
              <Icons.X className="w-5 h-5" />
            </button>
          </div>

          <nav className="mt-5 space-y-5" aria-label="Mobile navigation">
            {sections.map((section, idx) => (
              <div key={idx} className="space-y-0.5">
                {section.title && (
                  <h4 className="px-3 mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                    {section.title}
                  </h4>
                )}
                {section.items.map((item) => {
                  const isActive =
                    item.href === '/dashboard'
                      ? activeHref === '/dashboard'
                      : activeHref === item.href || activeHref === item.href.toLowerCase();

                  return (
                    <a
                      key={item.id}
                      href={item.href}
                      onClick={onClose}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/25'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                      }`}
                    >
                      <span className={isActive ? 'text-brand-primary' : 'text-slate-500'}>
                        <NavIcon name={item.iconName} />
                      </span>
                      <span>{item.label}</span>
                    </a>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500">Pinnacle Operations</span>
          <span className="font-mono text-emerald-500">LOCAL DEV</span>
        </div>
      </div>
    </div>
  );
};
