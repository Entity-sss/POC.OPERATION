import React, { useState, useEffect } from 'react';
import { Icons } from '../ui/Icons';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Alert } from '../ui/Alert';

interface EmployeeItem {
  id: string;
  userId: string;
  employeeId: string;
  fullName: string;
  email: string;
  mobile: string;
  dateOfBirth?: string | null;
  departmentId: string | null;
  departmentName: string | null;
  departmentCode: string | null;
  designationId: string | null;
  designationName: string | null;
  designationCode: string | null;
  isActive: boolean;
  userStatus: string;
  lastLoginAt: number | null;
  createdAt: number;
  roles: Array<{ id: string; code: string; name: string }>;
}

interface MetaDepartment {
  id: string;
  name: string;
  code: string;
}

interface MetaDesignation {
  id: string;
  departmentId: string | null;
  name: string;
  code: string;
}

interface MetaRole {
  id: string;
  name: string;
  code: string;
}

export const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DISABLED'>('ALL');

  // Metadata
  const [departments, setDepartments] = useState<MetaDepartment[]>([]);
  const [designations, setDesignations] = useState<MetaDesignation[]>([]);
  const [roles, setRoles] = useState<MetaRole[]>([]);

  // Modals
  const [viewEmployee, setViewEmployee] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [editEmployee, setEditEmployee] = useState<EmployeeItem | null>(null);

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    mobile: '',
    departmentId: '',
    designationId: '',
    isActive: true,
    roleIds: [] as string[],
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/employees');
      const data: any = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to fetch workforce directory');
      }
      const list = data?.data?.employees || data?.employees || [];
      setEmployees(list);
    } catch (err: any) {
      setError(err.message || 'Error loading employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchMeta = async () => {
    try {
      const res = await fetch('/api/admin/meta');
      const data: any = await res.json();
      if (res.ok) {
        const payload = data?.data || data;
        setDepartments(payload.departments || []);
        setDesignations(payload.designations || []);
        setRoles(payload.roles || []);
      }
    } catch {
      // Non-fatal
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchMeta();
  }, []);

  const handleOpenDetail = async (emp: EmployeeItem) => {
    setLoadingDetail(true);
    setViewEmployee(emp);
    try {
      const res = await fetch(`/api/admin/employees/${emp.id}`);
      const data: any = await res.json();
      if (res.ok) {
        setViewEmployee(data?.data?.employee || data?.employee || emp);
      }
    } catch {
      // Fall back to basic item
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleOpenEdit = (emp: EmployeeItem) => {
    setEditEmployee(emp);
    setEditFormData({
      fullName: emp.fullName,
      mobile: emp.mobile,
      departmentId: emp.departmentId || '',
      designationId: emp.designationId || '',
      isActive: emp.isActive,
      roleIds: emp.roles.map((r) => r.id),
    });
  };

  const handleEditRoleToggle = (roleId: string) => {
    setEditFormData((prev) => {
      const exists = prev.roleIds.includes(roleId);
      if (exists) {
        if (prev.roleIds.length === 1) return prev; // Keep at least one
        return { ...prev, roleIds: prev.roleIds.filter((id) => id !== roleId) };
      } else {
        return { ...prev, roleIds: [...prev.roleIds, roleId] };
      }
    });
  };

  const handleEditSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!editEmployee) return;

    setIsSubmittingEdit(true);
    try {
      const res = await fetch(`/api/admin/employees/${editEmployee.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editFormData.fullName.trim(),
          mobile: editFormData.mobile.trim(),
          departmentId: editFormData.departmentId || null,
          designationId: editFormData.designationId || null,
          isActive: editFormData.isActive,
          roleIds: editFormData.roleIds,
        }),
      });

      const data: any = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to update employee');
      }

      setEditEmployee(null);
      fetchEmployees();
    } catch (err: any) {
      alert(err.message || 'Update failed');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleToggleStatusQuick = async (emp: EmployeeItem) => {
    const nextStatus = !emp.isActive;
    const confirmMsg = nextStatus
      ? `Re-activate account access for ${emp.fullName} (${emp.employeeId})?`
      : `Deactivate account for ${emp.fullName} (${emp.employeeId})? Active sessions will be terminated.`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/employees/${emp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextStatus }),
      });
      if (res.ok) {
        fetchEmployees();
      } else {
        const data: any = await res.json();
        alert(data?.error?.message || 'Status update failed');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchName = emp.fullName.toLowerCase().includes(q);
      const matchId = emp.employeeId.toLowerCase().includes(q);
      const matchEmail = emp.email.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchEmail) return false;
    }

    if (deptFilter !== 'ALL') {
      if (emp.departmentId !== deptFilter) return false;
    }

    if (statusFilter === 'ACTIVE' && !emp.isActive) return false;
    if (statusFilter === 'DISABLED' && emp.isActive) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold tracking-tight text-text-primary">
              Workforce Directory & RBAC
            </h2>
            <Badge variant="gold" size="sm">
              {employees.length} Personnel
            </Badge>
          </div>
          <p className="text-xs text-text-secondary">
            Manage enterprise personnel records, assign organizational departments, update system roles, and govern account access.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={fetchEmployees} icon={<Icons.RefreshCw className="w-3.5 h-3.5" />}>
            Refresh Directory
          </Button>
        </div>
      </div>

      {error && <Alert type="error" title="Directory Error" message={error} />}

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 rounded-xl bg-surface-card border border-border-subtle">
        {/* Search */}
        <div className="sm:col-span-5 relative">
          <Icons.Search className="w-4 h-4 text-text-tertiary absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, Employee ID (e.g. S1000), or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-base border border-border-default rounded-lg pl-9 pr-3 py-1.5 text-xs text-text-primary outline-none focus:border-brand-primary"
          />
        </div>

        {/* Department Filter */}
        <div className="sm:col-span-4">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full bg-surface-base border border-border-default rounded-lg px-3 py-1.5 text-xs text-text-primary outline-none focus:border-brand-primary"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full bg-surface-base border border-border-default rounded-lg px-3 py-1.5 text-xs text-text-primary outline-none focus:border-brand-primary"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Personnel</option>
            <option value="DISABLED">Deactivated Accounts</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="glass-panel rounded-xl border border-white/10 overflow-hidden shadow-lg">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <LoadingSpinner size="md" className="mx-auto text-brand-primary" />
            <p className="text-xs text-text-tertiary">Retrieving verified personnel from D1...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-surface-subtle border border-border-subtle flex items-center justify-center mx-auto text-text-tertiary">
              <Icons.Users className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-text-primary">No personnel match your search</h3>
              <p className="text-xs text-text-tertiary max-w-sm mx-auto">
                Try adjusting your search keywords, department filter, or status filter.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse operational-table">
              <thead>
                <tr className="border-b border-border-subtle/80 bg-surface-card/60 text-xs font-mono uppercase tracking-wider text-text-tertiary">
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Personnel Name</th>
                  <th className="py-3 px-4">Department & Role</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/40 text-xs">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-surface-card/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-primary text-xs sm:text-sm">
                      {emp.employeeId}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-text-primary text-xs sm:text-sm">{emp.fullName}</div>
                      <div className="text-xs text-text-tertiary font-mono mt-0.5">{emp.email}</div>
                    </td>
                    <td className="py-3.5 px-4 space-y-1">
                      <div className="text-text-secondary text-xs">
                        {emp.departmentName || 'Unassigned'} {emp.designationName ? `• ${emp.designationName}` : ''}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {emp.roles.map((r) => (
                          <span
                            key={r.id}
                            className="text-xs font-mono px-2 py-0.5 rounded bg-surface-card border border-border-subtle text-text-secondary font-medium"
                          >
                            {r.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {emp.isActive ? (
                        <Badge variant="success" size="sm" dot>
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="error" size="sm">
                          Disabled
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-text-secondary">
                      {emp.mobile}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-text-tertiary">
                      {new Date(emp.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => handleOpenDetail(emp)}
                        className="px-2 py-1 text-xs rounded bg-surface-card hover:bg-surface-hover border border-border-default text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                        title="View Full Profile"
                      >
                        Profile
                      </button>

                      <button
                        onClick={() => handleOpenEdit(emp)}
                        className="px-2 py-1 text-xs rounded bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary border border-brand-primary/30 font-semibold transition-colors cursor-pointer"
                        title="Edit Roles & Assignment"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleToggleStatusQuick(emp)}
                        className={`px-2 py-1 text-xs rounded border transition-colors cursor-pointer ${
                          emp.isActive
                            ? 'bg-status-error-bg/40 text-status-error border-status-error/30 hover:bg-status-error-bg'
                            : 'bg-status-success-bg/40 text-status-success border-status-success/30 hover:bg-status-success-bg'
                        }`}
                        title={emp.isActive ? 'Deactivate Access' : 'Activate Access'}
                      >
                        {emp.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Detail Modal / Slide-over */}
      {viewEmployee && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-base border border-border-default rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center font-mono font-bold text-brand-primary text-sm">
                  {viewEmployee.employeeId}
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">{viewEmployee.fullName}</h3>
                  <div className="text-xs text-text-tertiary font-mono">{viewEmployee.email}</div>
                </div>
              </div>
              <button
                onClick={() => setViewEmployee(null)}
                className="p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-card"
              >
                <Icons.X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="py-12 text-center">
                <LoadingSpinner size="md" className="mx-auto text-brand-primary" />
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Employment Overview */}
                <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-surface-card border border-border-subtle">
                  <div>
                    <span className="text-xs font-mono uppercase text-text-tertiary">Department</span>
                    <div className="font-semibold text-text-primary text-xs sm:text-sm mt-0.5">
                      {viewEmployee.departmentName || 'None'}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-mono uppercase text-text-tertiary">Designation</span>
                    <div className="font-semibold text-text-primary text-xs sm:text-sm mt-0.5">
                      {viewEmployee.designationName || 'General Staff'}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-mono uppercase text-text-tertiary">Account Status</span>
                    <div className="mt-0.5">
                      <Badge variant={viewEmployee.isActive ? 'success' : 'error'} size="sm">
                        {viewEmployee.isActive ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Contact & Personal */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-surface-card border border-border-subtle">
                  <div>
                    <span className="text-xs font-mono uppercase text-text-tertiary">Mobile Number</span>
                    <div className="font-mono text-text-primary text-xs sm:text-sm mt-0.5">{viewEmployee.mobile || '—'}</div>
                  </div>
                  <div>
                    <span className="text-xs font-mono uppercase text-text-tertiary">Date of Birth</span>
                    <div className="text-text-primary text-xs mt-0.5">{viewEmployee.dateOfBirth || 'Not provided'}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs font-mono uppercase text-text-tertiary">Current Address</span>
                    <div className="text-text-secondary text-xs mt-0.5 font-detail">{viewEmployee.currentAddress || '—'}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs font-mono uppercase text-text-tertiary">Permanent Address</span>
                    <div className="text-text-secondary text-xs mt-0.5 font-detail">{viewEmployee.permanentAddress || '—'}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs font-mono uppercase text-text-tertiary">Highest Education</span>
                    <div className="text-text-secondary text-xs mt-0.5 font-detail">{viewEmployee.education || '—'}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs font-mono uppercase text-text-tertiary">Prior Operational Experience</span>
                    <div className="text-text-secondary text-xs mt-0.5 whitespace-pre-wrap font-detail">{viewEmployee.priorExperience || '—'}</div>
                  </div>
                </div>

                {/* Assigned Roles */}
                <div className="space-y-1.5">
                  <span className="text-xs font-mono uppercase text-text-tertiary">Active Role Credentials</span>
                  <div className="flex flex-wrap gap-2">
                    {viewEmployee.roles?.map((r: any) => (
                      <div
                        key={r.id}
                        className="px-3 py-1.5 rounded-lg bg-surface-card border border-border-default flex items-center gap-2"
                      >
                        <Icons.Shield className="w-3.5 h-3.5 text-brand-primary" />
                        <span className="font-semibold text-text-primary text-xs">{r.name}</span>
                        <span className="text-xs font-mono text-text-tertiary">({r.code})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Audit History */}
                {viewEmployee.recentAudits && viewEmployee.recentAudits.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-xs font-mono uppercase text-text-tertiary">Recent Audit Logs</span>
                    <div className="divide-y divide-border-subtle rounded-lg bg-surface-card border border-border-subtle max-h-36 overflow-y-auto">
                      {viewEmployee.recentAudits.map((a: any) => (
                        <div key={a.id} className="p-2.5 text-xs flex items-center justify-between">
                          <div>
                            <span className="font-mono text-brand-primary font-semibold">{a.action}</span>
                            <p className="text-text-secondary text-xs">{a.description}</p>
                          </div>
                          <span className="font-mono text-xs text-text-tertiary">
                            {new Date(a.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-3 border-t border-border-subtle flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setViewEmployee(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const emp = viewEmployee;
                  setViewEmployee(null);
                  handleOpenEdit(emp);
                }}
              >
                Edit Employee
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editEmployee && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-base border border-border-default rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  Edit Personnel: {editEmployee.employeeId}
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Update department assignment, job designation, active status, and RBAC roles.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditEmployee(null)}
                className="p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-card"
              >
                <Icons.X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-text-secondary uppercase font-mono text-xs">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editFormData.fullName}
                    onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                    className="w-full bg-surface-card border border-border-default rounded-lg px-3 py-2 text-text-primary outline-none focus:border-brand-primary text-xs sm:text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-text-secondary uppercase font-mono text-xs">Mobile</label>
                  <input
                    type="text"
                    required
                    value={editFormData.mobile}
                    onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                    className="w-full bg-surface-card border border-border-default rounded-lg px-3 py-2 text-text-primary outline-none focus:border-brand-primary font-mono text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-text-secondary uppercase font-mono text-xs">Department</label>
                  <select
                    value={editFormData.departmentId}
                    onChange={(e) => setEditFormData({ ...editFormData, departmentId: e.target.value })}
                    className="w-full bg-surface-card border border-border-default rounded-lg px-3 py-2 text-text-primary outline-none focus:border-brand-primary text-xs sm:text-sm"
                  >
                    <option value="">-- None (Unassigned) --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-text-secondary uppercase font-mono text-xs">Designation</label>
                  <select
                    value={editFormData.designationId}
                    onChange={(e) => setEditFormData({ ...editFormData, designationId: e.target.value })}
                    className="w-full bg-surface-card border border-border-default rounded-lg px-3 py-2 text-text-primary outline-none focus:border-brand-primary text-xs sm:text-sm"
                  >
                    <option value="">-- None (General) --</option>
                    {designations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Toggle */}
              <div className="p-3 rounded-lg bg-surface-card border border-border-subtle flex items-center justify-between">
                <div>
                  <div className="font-semibold text-text-primary text-xs sm:text-sm">Account Access Status</div>
                  <div className="text-xs text-text-tertiary">
                    {editFormData.isActive
                      ? 'Personnel can authenticate and perform assigned workflows.'
                      : 'Account is disabled. All active sessions are terminated.'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditFormData({ ...editFormData, isActive: !editFormData.isActive })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    editFormData.isActive
                      ? 'bg-status-success-bg text-status-success border border-status-success/30'
                      : 'bg-status-error-bg text-status-error border border-status-error/30'
                  }`}
                >
                  {editFormData.isActive ? 'Active' : 'Disabled'}
                </button>
              </div>

              {/* Role Credentials */}
              <div className="space-y-1.5">
                <label className="text-text-secondary uppercase font-mono text-xs">
                  Assigned RBAC Role(s) *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {roles.map((r) => {
                    const isSelected = editFormData.roleIds.includes(r.id);
                    return (
                      <div
                        key={r.id}
                        onClick={() => handleEditRoleToggle(r.id)}
                        className={`p-2 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-brand-primary/10 border-brand-primary/40 text-brand-primary'
                            : 'bg-surface-card border-border-subtle text-text-secondary hover:border-border-default'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-xs sm:text-sm text-text-primary">{r.name}</div>
                          <span className="text-xs font-mono text-text-tertiary">{r.code}</span>
                        </div>
                        {isSelected && <Icons.CheckCircle className="w-4 h-4 text-brand-primary" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-border-subtle flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditEmployee(null)}
                  disabled={isSubmittingEdit}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" loading={isSubmittingEdit}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
