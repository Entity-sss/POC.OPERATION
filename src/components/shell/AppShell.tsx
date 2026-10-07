import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';

interface AppShellProps {
  user: {
    id: string;
    employeeId: string;
    fullName: string;
    email: string;
    roles?: Array<{ id: string; code: string; name: string }>;
  };
  permissions: string[];
  children?: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ user, permissions, children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-surface-base overflow-hidden">
      {/* Desktop Sidebar — dark shell */}
      <Sidebar
        permissions={permissions}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Mobile Drawer Navigation */}
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        permissions={permissions}
      />

      {/* Main Content Area — light workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* TopBar sits on top */}
        <TopBar user={user} onOpenMobileNav={() => setIsMobileNavOpen(true)} />

        {/* Scrollable workspace content: white/light background */}
        <main
          className="flex-1 overflow-y-auto bg-content-bg"
          id="main-content"
        >
          {/* Page-level padding and max width constraint */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
