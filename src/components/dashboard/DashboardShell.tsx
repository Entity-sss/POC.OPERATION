import React, { useState, useEffect, Suspense, lazy } from 'react';

// Code-split workspaces to avoid massive initial monolithic JavaScript bundle
const AdminControlCenter = lazy(() =>
  import('./AdminControlCenter').then((m) => ({ default: m.AdminControlCenter }))
);
const ManagerOperationsCenter = lazy(() =>
  import('./ManagerOperationsCenter').then((m) => ({ default: m.ManagerOperationsCenter }))
);
const EmployeeCockpit = lazy(() =>
  import('./EmployeeCockpit').then((m) => ({ default: m.EmployeeCockpit }))
);
const ExecutiveWorkspace = lazy(() =>
  import('./ExecutiveWorkspace').then((m) => ({ default: m.ExecutiveWorkspace }))
);
const ProjectsWorkspace = lazy(() =>
  import('./ProjectsWorkspace').then((m) => ({ default: m.ProjectsWorkspace }))
);
const VendorsWorkspace = lazy(() =>
  import('./VendorsWorkspace').then((m) => ({ default: m.VendorsWorkspace }))
);
const FinanceWorkspace = lazy(() =>
  import('./FinanceWorkspace').then((m) => ({ default: m.FinanceWorkspace }))
);
const ClientsCrmWorkspace = lazy(() =>
  import('./ClientsCrmWorkspace').then((m) => ({ default: m.ClientsCrmWorkspace }))
);
const CommandCenterOverview = lazy(() =>
  import('./CommandCenterOverview').then((m) => ({ default: m.CommandCenterOverview }))
);

interface DashboardShellProps {
  user: {
    id: string;
    employeeId: string;
    fullName: string;
    email: string;
    isActive: boolean;
    roles?: Array<{ id: string; code: string; name: string }> | string[];
  };
  permissions: string[];
  initialCounts: {
    activeWorkforce: number;
    pendingRegistrations: number;
    departments: number;
    roles: number;
  };
}

/**
 * Parses the current window hash into a normalized string key.
 * Returns '' for no hash or '#dashboard'.
 */
function getHashKey(): string {
  if (typeof window === 'undefined') return '';
  const hash = window.location.hash.toLowerCase();
  if (!hash || hash === '#' || hash === '#dashboard') return '';
  return hash;
}

/** Workspace skeleton for Suspense fallback */
const WorkspaceSkeleton = () => (
  <div className="animate-pulse space-y-4 p-2">
    <div className="h-8 bg-slate-200 rounded-lg w-64" />
    <div className="grid grid-cols-4 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-24 bg-slate-100 rounded-xl border border-slate-200" />
      ))}
    </div>
    <div className="h-64 bg-slate-100 rounded-xl border border-slate-200" />
  </div>
);

export const DashboardShell: React.FC<DashboardShellProps> = ({
  user,
  permissions,
  initialCounts,
}) => {
  // Normalize roles to string codes
  const roleCodes = Array.isArray(user.roles)
    ? user.roles.map((r: any) =>
        typeof r === 'string' ? r.toUpperCase() : (r.code || '').toUpperCase()
      )
    : [];

  const permSet = new Set(permissions);
  const isSuperUser = permSet.has('*') || permSet.has('admin');

  // Role Authoritative Resolution
  const isCeo = isSuperUser || roleCodes.includes('CEO') || permSet.has('company.view');
  const isAdmin = isSuperUser || roleCodes.includes('ADMIN');
  const isManager =
    !isAdmin && !isCeo && (roleCodes.includes('MANAGER') || permSet.has('team.manage'));

  // Hash-based route state — reactive to hash changes
  const [currentHash, setCurrentHash] = useState<string>(() => getHashKey());

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(getHashKey());
    };
    window.addEventListener('hashchange', handleHashChange);
    // Sync on mount in case hash was set before hydration
    setCurrentHash(getHashKey());
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (hash: string) => {
    window.location.hash = hash;
    setCurrentHash(getHashKey());
  };

  /**
   * Resolve current hash to a workspace component with the correct props.
   * Each hash maps to ONE specific workspace + ONE specific initial tab/section.
   * No two hashes render the same workspace with the same initial state.
   */
  const renderWorkspace = () => {
    // ── Executive ──────────────────────────────────────────────────────────
    if (currentHash === '#executive') {
      return (
        <ExecutiveWorkspace
          user={user}
          permissions={permissions}
          onNavigateTab={navigateTo}
        />
      );
    }

    // ── Projects & Operations ───────────────────────────────────────────────
    if (currentHash === '#projects') {
      return <ProjectsWorkspace user={user} permissions={permissions} />;
    }

    // ── Vendor Management ───────────────────────────────────────────────────
    if (currentHash === '#vendors') {
      return <VendorsWorkspace user={user} permissions={permissions} />;
    }

    // ── Finance & Billing ───────────────────────────────────────────────────
    if (currentHash === '#invoices') {
      return <FinanceWorkspace user={user} permissions={permissions} />;
    }

    // ── Client Accounts (CRM) ───────────────────────────────────────────────
    if (currentHash === '#clients') {
      return (
        <ClientsCrmWorkspace
          user={user}
          permissions={permissions}
          initialView="clients"
        />
      );
    }

    // ── Deal Pipeline ───────────────────────────────────────────────────────
    if (currentHash === '#opportunities') {
      return (
        <ClientsCrmWorkspace
          user={user}
          permissions={permissions}
          initialView="pipeline"
        />
      );
    }

    // ── Employee: My Tasks ──────────────────────────────────────────────────
    if (currentHash === '#tasks') {
      return (
        <EmployeeCockpit
          user={user}
          permissions={permissions}
          initialSection="tasks"
        />
      );
    }

    // ── Employee: My Clients ────────────────────────────────────────────────
    if (currentHash === '#my-clients') {
      return (
        <EmployeeCockpit
          user={user}
          permissions={permissions}
          initialSection="clients"
        />
      );
    }

    // ── Employee: Daily Work Report ─────────────────────────────────────────
    if (currentHash === '#my-reports') {
      return (
        <EmployeeCockpit
          user={user}
          permissions={permissions}
          initialSection="reports"
        />
      );
    }

    // ── Employee: Pipeline / Opportunities ──────────────────────────────────
    if (currentHash === '#my-pipeline') {
      return (
        <EmployeeCockpit
          user={user}
          permissions={permissions}
          initialSection="pipeline"
        />
      );
    }

    // ── Manager: Team Operations ────────────────────────────────────────────
    if (currentHash === '#team') {
      return (
        <ManagerOperationsCenter
          user={user}
          permissions={permissions}
          initialTab="team"
        />
      );
    }

    // ── Manager: Daily Work Reports Review ──────────────────────────────────
    if (currentHash === '#reports') {
      if (isManager || isAdmin || isCeo) {
        return (
          <ManagerOperationsCenter
            user={user}
            permissions={permissions}
            initialTab="reports"
          />
        );
      }
      return (
        <EmployeeCockpit
          user={user}
          permissions={permissions}
          initialSection="reports"
        />
      );
    }

    // ── Manager: Delay Requests & SLA ───────────────────────────────────────
    if (currentHash === '#delays') {
      return (
        <ManagerOperationsCenter
          user={user}
          permissions={permissions}
          initialTab="delays"
        />
      );
    }

    // ── Admin: Workforce Directory ──────────────────────────────────────────
    if (currentHash === '#employees') {
      return (
        <AdminControlCenter
          user={user}
          permissions={permissions}
          initialCounts={initialCounts}
          initialTab="directory"
        />
      );
    }

    // ── Admin: Registration Approvals ───────────────────────────────────────
    if (currentHash === '#registrations') {
      return (
        <AdminControlCenter
          user={user}
          permissions={permissions}
          initialCounts={initialCounts}
          initialTab="registrations"
        />
      );
    }

    // ── Admin: Roles & Permissions ──────────────────────────────────────────
    if (currentHash === '#roles') {
      return (
        <AdminControlCenter
          user={user}
          permissions={permissions}
          initialCounts={initialCounts}
          initialTab="roles"
        />
      );
    }

    // ── Admin: System Settings ──────────────────────────────────────────────
    if (currentHash === '#settings') {
      return (
        <AdminControlCenter
          user={user}
          permissions={permissions}
          initialCounts={initialCounts}
          initialTab="settings"
        />
      );
    }

    // ── Manager: Team Tasks (attention items) ───────────────────────────────
    if (currentHash === '#team-tasks') {
      return (
        <ManagerOperationsCenter
          user={user}
          permissions={permissions}
          initialTab="tasks"
        />
      );
    }

    // ── Manager: Verification Queue ─────────────────────────────────────────
    if (currentHash === '#verification') {
      return (
        <ManagerOperationsCenter
          user={user}
          permissions={permissions}
          initialTab="attention"
        />
      );
    }

    // ── Default Fallbacks: Dashboard Overview for all roles ────────────────
    // When no hash is present, show the role-aware CommandCenterOverview
    return (
      <CommandCenterOverview
        user={user}
        permissions={permissions}
        activeWorkforceCount={initialCounts.activeWorkforce}
        pendingRegistrationsCount={initialCounts.pendingRegistrations}
        departmentsCount={initialCounts.departments}
        rolesCount={initialCounts.roles}
        onNavigate={navigateTo}
      />
    );
  };

  return (
    <Suspense fallback={<WorkspaceSkeleton />}>
      {renderWorkspace()}
    </Suspense>
  );
};
