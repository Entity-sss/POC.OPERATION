import React, { useState, useEffect } from 'react';
import { Icons } from '../ui/Icons';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Alert } from '../ui/Alert';
import { RegistrationApprovals } from './RegistrationApprovals';
import { EmployeeManagement } from './EmployeeManagement';

type AdminTab = 'overview' | 'registrations' | 'directory' | 'audit' | 'roles' | 'settings';

interface AdminControlCenterProps {
  user: {
    id: string;
    employeeId: string;
    fullName: string;
    email: string;
    isActive: boolean;
    roles?: any;
  };
  permissions?: string[];
  initialTab?: AdminTab;
  initialCounts: {
    activeWorkforce: number;
    pendingRegistrations: number;
    departments: number;
    roles: number;
  };
}

interface AdminData {
  overview: {
    totalEmployees: number;
    activeEmployees: number;
    disabledEmployees: number;
    pendingRegistrations: number;
    departmentsCount: number;
    rolesCount: number;
  };
  departments: Array<{ id: string; name: string; code: string }>;
  roles: Array<{ id: string; name: string; code: string; dataScope: string }>;
  recentLogs: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    description: string;
    createdAt: number;
    actorName: string | null;
    actorEmail: string | null;
    targetName: string | null;
  }>;
  health: {
    database: { status: string; latencyMs: number; region: string };
    workerRuntime: { status: string; platform: string };
    activeSessions: number;
    timestamp: string;
  };
}

export const AdminControlCenter: React.FC<AdminControlCenterProps> = ({
  user,
  initialCounts,
  initialTab = 'overview',
}) => {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [auditFilter, setAuditFilter] = useState('');

  // Sync internal tab when initialTab prop changes (hash navigation)
  const prevInitialTab = React.useRef(initialTab);
  React.useEffect(() => {
    if (initialTab !== prevInitialTab.current) {
      setActiveTab(initialTab);
      prevInitialTab.current = initialTab;
    }
  }, [initialTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/overview');
      if (!res.ok) {
        const errJson: any = await res.json().catch(() => ({}));
        throw new Error(errJson?.error || 'Failed to load admin control data');
      }
      const json: any = await res.json();
      setData(json.data || json);
    } catch (err: unknown) {
      setError((err as any)?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-xs text-text-secondary font-mono">Loading Enterprise Control Center from D1...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6">
        <Alert variant="error" title="Control Center Sync Error">
          {error}
        </Alert>
        <Button className="mt-4" onClick={loadData} variant="secondary" size="sm">
          Retry Connection
        </Button>
      </div>
    );
  }

  const filteredLogs = (data?.recentLogs || []).filter((l) => {
    if (!auditFilter) return true;
    const q = auditFilter.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q) ||
      (l.actorName && l.actorName.toLowerCase().includes(q)) ||
      (l.targetName && l.targetName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="workspace-enter space-y-5">
      {/* 1. Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
            <Icons.Shield className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Administration</h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                {user.employeeId}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 border border-purple-200">
                System Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 font-detail mt-0.5">
              {user.fullName} &middot; Scope: Company-wide &middot; D1 Local
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-detail">Active &amp; Authorized</span>
          </div>
          <button
            onClick={loadData}
            title="Refresh"
            className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <Icons.Clock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-0 -mb-px">
        {([
          { key: 'overview', label: 'System Overview', icon: <Icons.LayoutDashboard className="w-4 h-4" /> },
          { key: 'registrations', label: 'Registration Approvals', icon: <Icons.FileCheck className="w-4 h-4" />, badge: (data?.overview.pendingRegistrations || initialCounts.pendingRegistrations) > 0 ? String(data?.overview.pendingRegistrations || initialCounts.pendingRegistrations) : undefined },
          { key: 'directory', label: 'Workforce Directory', icon: <Icons.Users className="w-4 h-4" /> },
          { key: 'audit', label: 'Audit Log', icon: <Icons.Shield className="w-4 h-4" /> },
          { key: 'roles', label: 'Roles & Permissions', icon: <Icons.Lock className="w-4 h-4" /> },
          { key: 'settings', label: 'System Settings', icon: <Icons.Settings className="w-4 h-4" /> },
        ] as { key: AdminTab; label: string; icon: React.ReactNode; badge?: string }[]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-[13px] font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap -mb-px ${
              activeTab === tab.key
                ? 'border-[#B8962E] text-[#9D7D22]'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 font-mono">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 3. Tab A: System Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <button
              onClick={() => setActiveTab('directory')}
              className="kpi-card text-left group hover:border-blue-200 transition-all"
            >
              <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
                {data?.overview.activeEmployees ?? initialCounts.activeWorkforce}
              </div>
              <div className="text-[13px] font-semibold text-slate-700 mt-1">Active Personnel</div>
              <div className="text-xs text-slate-500 font-detail mt-0.5">In verified directory</div>
            </button>

            <button
              onClick={() => setActiveTab('registrations')}
              className={`kpi-card text-left group transition-all ${
                (data?.overview.pendingRegistrations ?? initialCounts.pendingRegistrations) > 0
                  ? 'border-amber-200 hover:border-amber-300'
                  : 'hover:border-slate-300'
              }`}
            >
              <div className={`text-2xl font-bold font-mono tracking-tight ${
                (data?.overview.pendingRegistrations ?? initialCounts.pendingRegistrations) > 0
                  ? 'text-amber-700' : 'text-slate-900'
              }`}>
                {data?.overview.pendingRegistrations ?? initialCounts.pendingRegistrations}
              </div>
              <div className="text-[13px] font-semibold text-slate-700 mt-1">Pending Applications</div>
              <div className="text-xs text-slate-500 font-detail mt-0.5">Awaiting approval</div>
            </button>

            <div className="kpi-card">
              <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
                {data?.health.activeSessions ?? 1}
              </div>
              <div className="text-[13px] font-semibold text-slate-700 mt-1">Active Sessions</div>
              <div className="text-xs text-slate-500 font-detail mt-0.5">Token validated</div>
            </div>

            <button
              onClick={() => setActiveTab('roles')}
              className="kpi-card text-left group hover:border-slate-300 transition-all"
            >
              <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
                {data?.overview.departmentsCount ?? initialCounts.departments}
              </div>
              <div className="text-[13px] font-semibold text-slate-700 mt-1">Departments</div>
              <div className="text-xs text-slate-500 font-detail mt-0.5">Operational units</div>
            </button>

            <button
              onClick={() => setActiveTab('roles')}
              className="kpi-card text-left group hover:border-slate-300 transition-all"
            >
              <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
                {data?.overview.rolesCount ?? initialCounts.roles}
              </div>
              <div className="text-[13px] font-semibold text-slate-700 mt-1">System Roles</div>
              <div className="text-xs text-slate-500 font-detail mt-0.5">RBAC permission tiers</div>
            </button>
          </div>

          {/* Infrastructure Health Box */}
          <div className="content-card">
            <div className="content-card-header">
              <div className="flex items-center gap-2">
                <Icons.Cpu className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-800">Runtime &amp; Infrastructure</h3>
              </div>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 block text-xs uppercase font-mono font-semibold tracking-wider">Storage Engine</span>
                <strong className="text-slate-900 text-sm block">Cloudflare D1 (SQLite)</strong>
                <div className="text-xs text-emerald-700 font-detail mt-0.5">Status: Online · Local dev</div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 block text-xs uppercase font-mono font-semibold tracking-wider">Runtime Platform</span>
                <strong className="text-slate-900 text-sm block">Cloudflare Workers</strong>
                <div className="text-xs text-emerald-700 font-detail mt-0.5">Edge: v8 workerd</div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 block text-xs uppercase font-mono font-semibold tracking-wider">Authorization</span>
                <strong className="text-slate-900 text-sm block">Server-Authoritative RBAC</strong>
                <div className="text-xs text-[#9D7D22] font-detail mt-0.5">Maker-Checker: Active</div>
              </div>
            </div>
          </div>

          {/* Recent Audit Activity Snapshot */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Icons.Shield className="w-4 h-4 text-slate-400" />
                Recent Audit Activity
              </h3>
              <button
                onClick={() => setActiveTab('audit')}
                className="text-xs text-[#9D7D22] hover:text-[#B8962E] font-semibold transition-colors"
              >
                View Full Audit Log →
              </button>
            </div>

            <div className="content-card overflow-hidden">
              <table className="operational-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Actor</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recentLogs || []).slice(0, 8).map((log) => (
                    <tr key={log.id}>
                      <td className="font-mono text-slate-500 whitespace-nowrap text-xs">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="font-mono font-bold text-[#9D7D22] whitespace-nowrap">
                        {log.action}
                      </td>
                      <td className="text-slate-700 font-semibold whitespace-nowrap">
                        {log.actorName || log.actorEmail || 'System'}
                      </td>
                      <td className="text-slate-600 max-w-xs truncate">
                        {log.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. Tab B: Registration Approvals */}
      {activeTab === 'registrations' && (
        <RegistrationApprovals onCountsUpdated={loadData} />
      )}

      {/* 5. Tab C: Workforce Directory */}
      {activeTab === 'directory' && (
        <EmployeeManagement />
      )}

      {/* 6. Tab D: Audit Log Trail */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-700">
              Audit Logs ({filteredLogs.length} events)
            </h3>
            <input
              type="text"
              placeholder="Search actions, actors, descriptions..."
              value={auditFilter}
              onChange={(e) => setAuditFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-[#B8962E]/30 focus:border-[#B8962E]"
            />
          </div>

          <div className="content-card overflow-hidden">
            <table className="operational-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Target / Entity</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="font-mono text-slate-500 whitespace-nowrap text-xs">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="font-mono font-bold text-[#9D7D22] whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="font-semibold text-slate-700 whitespace-nowrap">
                      {log.actorName || log.actorEmail || 'System'}
                    </td>
                    <td className="font-mono text-slate-500 whitespace-nowrap">
                      {log.targetName || log.entityType || '—'}
                    </td>
                    <td className="text-slate-600">
                      {log.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. Tab E: Roles & Governance Matrix */}
      {activeTab === 'roles' && (
        <div className="space-y-5">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">
              System Roles &amp; Data Scopes ({data?.roles.length || 0})
            </h3>
            <div className="content-card overflow-hidden">
              <table className="operational-table">
                <thead>
                  <tr>
                    <th>Role Name</th>
                    <th>System Code</th>
                    <th>Data Scope</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.roles || []).map((r) => (
                    <tr key={r.id}>
                      <td className="font-semibold text-slate-800">{r.name}</td>
                      <td className="font-mono font-bold text-[#9D7D22]">{r.code}</td>
                      <td>
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold bg-slate-100 border border-slate-200 text-slate-700">
                          {r.dataScope}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">
              Registered Departments ({data?.departments.length || 0})
            </h3>
            <div className="content-card overflow-hidden">
              <table className="operational-table">
                <thead>
                  <tr>
                    <th>Department Name</th>
                    <th>Code</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.departments || []).map((d) => (
                    <tr key={d.id}>
                      <td className="font-semibold text-slate-800">{d.name}</td>
                      <td className="font-mono font-bold text-[#9D7D22]">{d.code}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 8. Tab F: System Settings */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl border border-border-subtle bg-surface-card/30 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary font-mono flex items-center gap-2">
              <Icons.Settings className="w-4 h-4 text-brand-primary" />
              System Configuration
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-lg bg-surface-elevated/60 border border-border-subtle space-y-1.5">
                <span className="text-text-tertiary block text-xs uppercase font-mono">Application Version</span>
                <strong className="text-text-primary font-mono text-sm block">POC.OPERATION v1.0.0</strong>
                <div className="text-xs text-text-tertiary">Astro 7 · React 19 · Cloudflare Workers</div>
              </div>
              <div className="p-4 rounded-lg bg-surface-elevated/60 border border-border-subtle space-y-1.5">
                <span className="text-text-tertiary block text-xs uppercase font-mono">Database Engine</span>
                <strong className="text-text-primary font-mono text-sm block">Cloudflare D1 (SQLite)</strong>
                <div className="text-xs text-status-success">Status: Local · All migrations applied</div>
              </div>
              <div className="p-4 rounded-lg bg-surface-elevated/60 border border-border-subtle space-y-1.5">
                <span className="text-text-tertiary block text-xs uppercase font-mono">Authorization Model</span>
                <strong className="text-text-primary font-mono text-sm block">Server-Authoritative RBAC</strong>
                <div className="text-xs text-brand-primary">Maker-Checker Policy: Active</div>
              </div>
              <div className="p-4 rounded-lg bg-surface-elevated/60 border border-border-subtle space-y-1.5">
                <span className="text-text-tertiary block text-xs uppercase font-mono">Audit Logging</span>
                <strong className="text-text-primary font-mono text-sm block">Immutable Audit Trail</strong>
                <div className="text-xs text-status-success">All write operations audited</div>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-border-subtle bg-surface-card/30 space-y-3">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-text-primary font-mono">Operational Parameters</h3>
            <div className="divide-y divide-border-subtle">
              {[
                { label: 'Session Timeout', value: '8 hours', note: 'Inactivity-based JWT expiry' },
                { label: 'Password Policy', value: 'Min 8 chars, mixed case', note: 'Applied at registration' },
                { label: 'Report Submission Window', value: 'Daily (before 23:59 IST)', note: 'Enforced server-side' },
                { label: 'Delay Request SLA', value: '24 hours for manager approval', note: 'Escalation on breach' },
                { label: 'Task Verification SLA', value: '48 hours for checker sign-off', note: 'Manager accountability' },
              ].map((item) => (
                <div key={item.label} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs sm:text-sm font-semibold text-text-primary">{item.label}</span>
                    <div className="text-xs text-text-tertiary font-detail mt-0.5">{item.note}</div>
                  </div>
                  <span className="text-xs sm:text-sm font-mono text-brand-primary font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
