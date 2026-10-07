import React from 'react';
import { Icons } from '../ui/Icons';

interface CommandCenterOverviewProps {
  user: {
    id: string;
    employeeId: string;
    fullName: string;
    email: string;
    isActive: boolean;
    roles?: any;
  };
  permissions: string[];
  activeWorkforceCount: number;
  pendingRegistrationsCount: number;
  departmentsCount: number;
  rolesCount: number;
  onNavigate: (hash: string) => void;
}

const getRoleBadge = (permissions: string[], roles?: any) => {
  const permSet = new Set(permissions);
  const roleCodes = Array.isArray(roles)
    ? roles.map((r: any) => (typeof r === 'string' ? r.toUpperCase() : (r.code || '').toUpperCase()))
    : [];
  if (permSet.has('*') || permSet.has('admin') || roleCodes.includes('ADMIN')) return { label: 'System Administrator', color: 'bg-purple-100 text-purple-800 border-purple-200' };
  if (permSet.has('company.view') || roleCodes.includes('CEO')) return { label: 'Business Head', color: 'bg-amber-100 text-amber-800 border-amber-200' };
  if (permSet.has('team.manage') || roleCodes.includes('MANAGER')) return { label: 'Manager', color: 'bg-blue-100 text-blue-800 border-blue-200' };
  return { label: 'Team Member', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
};

export const CommandCenterOverview: React.FC<CommandCenterOverviewProps> = ({
  user,
  permissions,
  activeWorkforceCount,
  pendingRegistrationsCount,
  departmentsCount,
  rolesCount,
  onNavigate,
}) => {
  const roleBadge = getRoleBadge(permissions, user.roles);
  const permSet = new Set(permissions);
  const isAdmin = permSet.has('*') || permSet.has('admin');
  const isManager = permSet.has('team.manage');

  const initials = user.fullName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="workspace-enter space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1E3A5F] to-[#2B6CB0] flex items-center justify-center text-white font-bold text-base shadow-sm flex-shrink-0">
            {initials}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Good day, {user.fullName.split(' ')[0]}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-slate-500 font-detail">{user.employeeId}</span>
              <span className="text-slate-300">·</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${roleBadge.color}`}>
                {roleBadge.label}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
          <span className="font-detail">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* KPI Summary — only shown to admins/managers with real data */}
      {(isAdmin || isManager) && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Workforce */}
          <button
            onClick={() => onNavigate('#employees')}
            className="kpi-card text-left group hover:border-blue-300 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                <Icons.Users className="w-4 h-4 text-blue-600" />
              </div>
              <Icons.ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{activeWorkforceCount}</div>
            <div className="text-[13px] font-semibold text-slate-700 mt-1">Active Workforce</div>
            <div className="text-xs text-slate-500 font-detail mt-0.5">Verified personnel</div>
          </button>

          {/* Pending Registrations */}
          <button
            onClick={() => onNavigate('#registrations')}
            className={`kpi-card text-left group transition-all ${
              pendingRegistrationsCount > 0 ? 'border-amber-200 hover:border-amber-300' : 'hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                pendingRegistrationsCount > 0 ? 'bg-amber-50 border border-amber-100' : 'bg-slate-50 border border-slate-100'
              }`}>
                <Icons.FileCheck className={`w-4 h-4 ${pendingRegistrationsCount > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
              </div>
              {pendingRegistrationsCount > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 font-mono">
                  ACTION
                </span>
              )}
            </div>
            <div className={`text-2xl font-bold font-mono tracking-tight ${pendingRegistrationsCount > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
              {pendingRegistrationsCount}
            </div>
            <div className="text-[13px] font-semibold text-slate-700 mt-1">Registration Queue</div>
            <div className="text-xs text-slate-500 font-detail mt-0.5">
              {pendingRegistrationsCount > 0 ? 'Requires review' : 'Queue cleared'}
            </div>
          </button>

          {/* Departments */}
          <div className="kpi-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                <Icons.Building className="w-4 h-4 text-slate-500" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{departmentsCount}</div>
            <div className="text-[13px] font-semibold text-slate-700 mt-1">Departments</div>
            <div className="text-xs text-slate-500 font-detail mt-0.5">Organizational units</div>
          </div>

          {/* System Roles */}
          <button
            onClick={() => onNavigate('#roles')}
            className="kpi-card text-left group hover:border-slate-300 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                <Icons.Shield className="w-4 h-4 text-slate-500" />
              </div>
              <Icons.ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{rolesCount}</div>
            <div className="text-[13px] font-semibold text-slate-700 mt-1">System Roles</div>
            <div className="text-xs text-slate-500 font-detail mt-0.5">RBAC permission tiers</div>
          </button>
        </div>
      )}

      {/* Quick Navigation Tiles */}
      <div>
        <h2 className="text-xs font-bold text-slate-600 mb-3 uppercase tracking-wider">
          Quick Navigation
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[
            {
              hash: '#clients',
              label: 'Client Accounts',
              description: 'CRM directory',
              icon: <Icons.Building className="w-5 h-5" />,
              color: 'text-blue-600 bg-blue-50 border-blue-100',
              permission: 'client.read',
            },
            {
              hash: '#opportunities',
              label: 'Deal Pipeline',
              description: 'Revenue opportunities',
              icon: <Icons.Target className="w-5 h-5" />,
              color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
              permission: 'opportunity.read',
            },
            {
              hash: '#tasks',
              label: 'My Tasks',
              description: 'Work queue',
              icon: <Icons.CheckSquare className="w-5 h-5" />,
              color: 'text-violet-600 bg-violet-50 border-violet-100',
              permission: 'task.execute',
            },
            {
              hash: '#reports',
              label: 'Daily Reports',
              description: 'Work logs',
              icon: <Icons.FileCheck className="w-5 h-5" />,
              color: 'text-orange-600 bg-orange-50 border-orange-100',
              permission: 'report.review',
            },
            {
              hash: '#projects',
              label: 'Projects',
              description: 'Milestones & delivery',
              icon: <Icons.FolderKanban className="w-5 h-5" />,
              color: 'text-teal-600 bg-teal-50 border-teal-100',
              permission: 'project.read',
            },
            {
              hash: '#invoices',
              label: 'Finance',
              description: 'Invoices & ageing',
              icon: <Icons.IndianRupee className="w-5 h-5" />,
              color: 'text-amber-600 bg-amber-50 border-amber-100',
              permission: 'finance.read',
            },
            {
              hash: '#employees',
              label: 'Workforce',
              description: 'Employee directory',
              icon: <Icons.Users className="w-5 h-5" />,
              color: 'text-slate-600 bg-slate-50 border-slate-200',
              permission: 'employee.read.company',
            },
            {
              hash: '#vendors',
              label: 'Vendors',
              description: 'Supplier directory',
              icon: <Icons.Truck className="w-5 h-5" />,
              color: 'text-rose-600 bg-rose-50 border-rose-100',
              permission: 'vendor.read',
            },
          ]
            .filter(
              (item) =>
                !item.permission ||
                permSet.has(item.permission) ||
                permSet.has('*') ||
                permSet.has('admin')
            )
            .map((item) => (
              <button
                key={item.hash}
                onClick={() => onNavigate(item.hash)}
                className="content-card p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center mb-3 ${item.color}`}>
                  {item.icon}
                </div>
                <div className="text-[15px] font-semibold text-slate-800 group-hover:text-slate-900 tracking-tight">
                  {item.label}
                </div>
                <div className="text-xs text-slate-500 font-detail mt-1 leading-normal">{item.description}</div>
              </button>
            ))}
        </div>
      </div>

      {/* System Health */}
      <div className="content-card">
        <div className="content-card-header">
          <div className="flex items-center gap-2">
            <Icons.Shield className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-800">System Health</h2>
          </div>
          <span className="text-xs text-slate-500 font-detail">POC.OPERATION v1.0.0</span>
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
            <div>
              <div className="text-[13px] font-semibold text-slate-800">D1 Database</div>
              <div className="text-xs text-slate-500 font-detail mt-0.5">Online · Local dev</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
            <div>
              <div className="text-[13px] font-semibold text-slate-800">Authentication</div>
              <div className="text-xs text-slate-500 font-detail mt-0.5">JWT · Active session</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
            <div>
              <div className="text-[13px] font-semibold text-slate-800">RBAC Engine</div>
              <div className="text-xs text-slate-500 font-detail mt-0.5">Server-authoritative</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
