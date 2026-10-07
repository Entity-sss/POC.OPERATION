import React, { useState, useEffect } from 'react';
import { Icons } from '../ui/Icons';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Alert } from '../ui/Alert';

interface RegistrationRequest {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  dateOfBirth?: string | null;
  currentAddress?: string | null;
  permanentAddress?: string | null;
  education?: string | null;
  priorExperience?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdEmployeeId?: string | null;
  createdAt: number;
  reviewedAt?: number | null;
  rejectionReason?: string | null;
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
  description: string | null;
}

interface RegistrationApprovalsProps {
  onCountsUpdated?: () => void;
}

export const RegistrationApprovals: React.FC<RegistrationApprovalsProps> = ({ onCountsUpdated }) => {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  // Metadata for approval dropdowns
  const [departments, setDepartments] = useState<MetaDepartment[]>([]);
  const [designations, setDesignations] = useState<MetaDesignation[]>([]);
  const [roles, setRoles] = useState<MetaRole[]>([]);

  // Modals state
  const [viewRequest, setViewRequest] = useState<RegistrationRequest | null>(null);
  const [approveRequest, setApproveRequest] = useState<RegistrationRequest | null>(null);
  const [rejectRequest, setRejectRequest] = useState<RegistrationRequest | null>(null);

  // Approval form state
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedDesig, setSelectedDesig] = useState<string>('');
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [initialPassword, setInitialPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [approvalResult, setApprovalResult] = useState<{ employeeId: string; fullName: string } | null>(null);

  // Rejection form state
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmittingRejection, setIsSubmittingRejection] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/registration-requests');
      const data: any = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to fetch registration requests');
      }
      const list = data?.data?.requests || data?.requests || [];
      setRequests(list);
      if (onCountsUpdated) onCountsUpdated();
    } catch (err: any) {
      setError(err.message || 'Error fetching requests');
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

        // Default to EMPLOYEE role if available
        const empRole = (payload.roles || []).find((r: MetaRole) => r.code === 'EMPLOYEE');
        if (empRole) {
          setSelectedRoleIds([empRole.id]);
        }
      }
    } catch {
      // Non-fatal
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchMeta();
  }, []);

  const handleOpenApprove = (req: RegistrationRequest) => {
    setApproveRequest(req);
    setApprovalResult(null);
    setSelectedDept(departments[0]?.id || '');
    setSelectedDesig('');
    setInitialPassword('');
    setConfirmPassword('');
    setApprovalError(null);
    // Default to EMPLOYEE role
    const empRole = roles.find((r) => r.code === 'EMPLOYEE');
    setSelectedRoleIds(empRole ? [empRole.id] : (roles[0] ? [roles[0].id] : []));
  };

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? (prev.length > 1 ? prev.filter((id) => id !== roleId) : prev) : [...prev, roleId]
    );
  };

  const handleApproveSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!approveRequest) return;
    if (selectedRoleIds.length === 0) {
      setApprovalError('Please select at least one initial role.');
      return;
    }
    if (!initialPassword || initialPassword.trim().length < 6) {
      setApprovalError('Initial password must be at least 6 characters long.');
      return;
    }
    if (initialPassword !== confirmPassword) {
      setApprovalError('Initial passwords do not match.');
      return;
    }

    setApprovalError(null);
    setIsSubmittingApproval(true);
    try {
      const res = await fetch(`/api/admin/registration-requests/${approveRequest.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'APPROVE',
          departmentId: selectedDept || undefined,
          designationId: selectedDesig || undefined,
          roleIds: selectedRoleIds,
          initialPassword: initialPassword.trim(),
        }),
      });

      const data: any = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to approve application');
      }

      const payload = data?.data || data;
      setApprovalResult({
        employeeId: payload.employeeId,
        fullName: approveRequest.fullName,
      });

      // Refresh list in background
      fetchRequests();
    } catch (err: any) {
      setApprovalError(err.message || 'Approval failed');
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const handleRejectSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!rejectRequest) return;
    if (!rejectionReason.trim()) {
      alert('A rejection reason is required.');
      return;
    }

    setIsSubmittingRejection(true);
    try {
      const res = await fetch(`/api/admin/registration-requests/${rejectRequest.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REJECT',
          rejectionReason: rejectionReason.trim(),
        }),
      });

      const data: any = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to reject application');
      }

      setRejectRequest(null);
      setRejectionReason('');
      fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    } finally {
      setIsSubmittingRejection(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold tracking-tight text-text-primary">
              Registration Approvals
            </h2>
            {pendingCount > 0 && (
              <Badge variant="warning" size="sm" pulse>
                {pendingCount} Pending
              </Badge>
            )}
          </div>
          <p className="text-xs text-text-secondary">
            Review onboarding applications, verify credentials, assign initial RBAC roles, and provision Employee IDs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filters */}
          <div className="flex bg-surface-card p-1 rounded-lg border border-border-default">
            {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  filterStatus === status
                    ? 'bg-brand-primary text-text-inverse shadow-sm'
                    : 'text-text-tertiary hover:text-text-primary'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <Button variant="secondary" size="sm" onClick={fetchRequests} icon={<Icons.RefreshCw className="w-3.5 h-3.5" />}>
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert type="error" title="Queue Error" message={error} />
      )}

      {/* Requests Table */}
      <div className="glass-panel rounded-xl border border-white/10 overflow-hidden shadow-lg">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <LoadingSpinner size="md" className="mx-auto text-brand-primary" />
            <p className="text-xs text-text-tertiary">Loading registration applications from D1...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-surface-subtle border border-border-subtle flex items-center justify-center mx-auto text-text-tertiary">
              <Icons.FileCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-text-primary">No registration requests found</h3>
              <p className="text-xs text-text-tertiary max-w-sm mx-auto">
                {filterStatus === 'PENDING'
                  ? 'All candidate onboarding requests have been reviewed and processed.'
                  : `No applications with status ${filterStatus} exist in the database.`}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse operational-table">
              <thead>
                <tr className="border-b border-border-subtle/80 bg-surface-card/60 text-xs font-mono uppercase tracking-wider text-text-tertiary">
                  <th className="py-3 px-4">Applicant Name</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Education</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/40 text-xs">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-surface-card/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-text-primary text-xs sm:text-sm">{req.fullName}</div>
                      <div className="text-xs font-mono text-text-tertiary mt-0.5">ID: {req.id.slice(0, 8)}...</div>
                    </td>
                    <td className="py-3.5 px-4 space-y-0.5">
                      <div className="text-text-primary font-mono text-xs sm:text-sm">{req.email}</div>
                      <div className="text-text-tertiary font-mono text-xs">{req.mobile}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-text-secondary text-xs line-clamp-1 font-detail" title={req.education || ''}>
                        {req.education || '—'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-text-tertiary">
                      {new Date(req.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      {req.status === 'PENDING' && (
                        <Badge variant="warning" size="sm" dot pulse>
                          PENDING
                        </Badge>
                      )}
                      {req.status === 'APPROVED' && (
                        <Badge variant="success" size="sm" dot>
                          APPROVED
                        </Badge>
                      )}
                      {req.status === 'REJECTED' && (
                        <Badge variant="error" size="sm">
                          REJECTED
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setViewRequest(req)}
                        className="px-2.5 py-1 text-xs rounded bg-surface-card hover:bg-surface-hover border border-border-default text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                      >
                        View
                      </button>

                      {req.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleOpenApprove(req)}
                            className="px-2.5 py-1 text-xs rounded bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary border border-brand-primary/30 font-semibold transition-colors cursor-pointer shadow-gold-glow"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setRejectRequest(req);
                              setRejectionReason('');
                            }}
                            className="px-2.5 py-1 text-xs rounded bg-status-error-bg hover:bg-status-error/20 text-status-error border border-status-error/30 transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {viewRequest && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-base border border-border-default rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <h3 className="text-base font-bold text-text-primary">Registration Application Details</h3>
                <span className="text-xs font-mono text-text-tertiary">Reference: {viewRequest.id}</span>
              </div>
              <button
                onClick={() => setViewRequest(null)}
                className="p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-card"
              >
                <Icons.X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-surface-card border border-border-subtle">
                <div>
                  <span className="text-text-tertiary uppercase font-mono text-xs">Full Name</span>
                  <div className="font-semibold text-text-primary text-xs sm:text-sm mt-0.5">{viewRequest.fullName}</div>
                </div>
                <div>
                  <span className="text-text-tertiary uppercase font-mono text-xs">Status</span>
                  <div className="mt-0.5">
                    <Badge
                      variant={
                        viewRequest.status === 'APPROVED' ? 'success' : viewRequest.status === 'REJECTED' ? 'error' : 'warning'
                      }
                      size="sm"
                    >
                      {viewRequest.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-text-tertiary uppercase font-mono text-xs">Official Email</span>
                  <div className="font-mono text-text-primary text-xs sm:text-sm mt-0.5">{viewRequest.email}</div>
                </div>
                <div>
                  <span className="text-text-tertiary uppercase font-mono text-xs">Mobile</span>
                  <div className="font-mono text-text-primary text-xs sm:text-sm mt-0.5">{viewRequest.mobile}</div>
                </div>
                <div>
                  <span className="text-text-tertiary uppercase font-mono text-xs">Date of Birth</span>
                  <div className="text-text-secondary text-xs mt-0.5">{viewRequest.dateOfBirth || 'Not specified'}</div>
                </div>
                <div>
                  <span className="text-text-tertiary uppercase font-mono text-xs">Application Date</span>
                  <div className="text-text-secondary text-xs mt-0.5">{new Date(viewRequest.createdAt).toLocaleString()}</div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-text-tertiary uppercase font-mono text-xs">Current Address</span>
                <div className="p-2.5 rounded-lg bg-surface-card border border-border-subtle text-text-secondary text-xs font-detail">
                  {viewRequest.currentAddress || '—'}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-text-tertiary uppercase font-mono text-xs">Permanent Address</span>
                <div className="p-2.5 rounded-lg bg-surface-card border border-border-subtle text-text-secondary text-xs font-detail">
                  {viewRequest.permanentAddress || '—'}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-text-tertiary uppercase font-mono text-xs">Highest Educational Credential</span>
                <div className="p-2.5 rounded-lg bg-surface-card border border-border-subtle text-text-secondary text-xs font-detail">
                  {viewRequest.education || '—'}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-text-tertiary uppercase font-mono text-xs">Prior Operational Experience</span>
                <div className="p-2.5 rounded-lg bg-surface-card border border-border-subtle text-text-secondary whitespace-pre-wrap text-xs font-detail">
                  {viewRequest.priorExperience || '—'}
                </div>
              </div>

              {viewRequest.rejectionReason && (
                <div className="p-3 rounded-lg bg-status-error-bg border border-status-error/30 text-status-error space-y-1">
                  <span className="font-bold uppercase font-mono text-xs">Rejection Reason</span>
                  <p className="text-xs">{viewRequest.rejectionReason}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-border-subtle flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setViewRequest(null)}>
                Close
              </Button>
              {viewRequest.status === 'PENDING' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const r = viewRequest;
                    setViewRequest(null);
                    handleOpenApprove(r);
                  }}
                >
                  Proceed to Approve
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approveRequest && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-base border border-border-default rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            {approvalResult ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-status-success-bg border border-status-success/30 flex items-center justify-center mx-auto text-status-success">
                  <Icons.CheckCircle className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-text-primary">Employee Provisioned Successfully</h3>
                  <p className="text-xs text-text-secondary">
                    {approvalResult.fullName} is now an active enterprise user.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-surface-card border border-brand-primary/30 inline-block space-y-1">
                  <span className="text-xs uppercase font-mono text-text-tertiary">Assigned Employee ID</span>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-brand-primary tracking-wider">
                    {approvalResult.employeeId}
                  </div>
                </div>
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setApproveRequest(null);
                      setApprovalResult(null);
                    }}
                  >
                    Done & Refresh Queue
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleApproveSubmit} className="space-y-4">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-text-primary">Approve Employee Application</h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Assign operational unit and role credentials for <strong className="text-text-primary">{approveRequest.fullName}</strong>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setApproveRequest(null)}
                    className="p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-card"
                  >
                    <Icons.X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Department */}
                  <div className="flex flex-col gap-1">
                    <label className="text-text-secondary uppercase font-mono text-xs">
                      Operational Department
                    </label>
                    <select
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
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

                  {/* Designation */}
                  <div className="flex flex-col gap-1">
                    <label className="text-text-secondary uppercase font-mono text-xs">
                      Designation / Job Title
                    </label>
                    <select
                      value={selectedDesig}
                      onChange={(e) => setSelectedDesig(e.target.value)}
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

                  {/* Roles Selection */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-text-secondary uppercase font-mono text-xs">
                      Assigned RBAC Role(s) *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {roles.map((r) => {
                        const isSelected = selectedRoleIds.includes(r.id);
                        return (
                          <div
                            key={r.id}
                            onClick={() => handleRoleToggle(r.id)}
                            className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
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

                  {/* Initial Password Assignment */}
                  <div className="space-y-2 pt-2 border-t border-border-subtle">
                    <label className="text-text-secondary uppercase font-mono text-xs block">
                      Initial Enterprise Password * (Min 6 chars)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <input
                          type="password"
                          value={initialPassword}
                          onChange={(e) => setInitialPassword(e.target.value)}
                          placeholder="Initial password"
                          required
                          className="w-full bg-surface-card border border-border-default rounded-lg px-3 py-2 text-text-primary outline-none focus:border-brand-primary text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm password"
                          required
                          className="w-full bg-surface-card border border-border-default rounded-lg px-3 py-2 text-text-primary outline-none focus:border-brand-primary text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-text-tertiary">
                      The applicant will use this password to sign in once activated. Minimum 6 characters with no arbitrary symbol constraints.
                    </p>
                  </div>
                </div>

                {approvalError && (
                  <Alert type="error" title="Approval Error" message={approvalError} />
                )}

                <div className="p-3 rounded-lg bg-surface-card/60 border border-border-subtle text-xs text-text-tertiary">
                  Approval will generate the next immutable sequential Employee ID (e.g. S1001), activate the login credentials, and write an immutable audit trail.
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-border-subtle">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setApproveRequest(null)}
                    disabled={isSubmittingApproval}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    loading={isSubmittingApproval}
                  >
                    Confirm & Activate Employee
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectRequest && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-base border border-border-default rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 className="text-base font-bold text-status-error flex items-center gap-2">
                <Icons.AlertTriangle className="w-4 h-4" />
                Reject Application
              </h3>
              <button
                onClick={() => setRejectRequest(null)}
                className="p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-card"
              >
                <Icons.X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <p className="text-xs text-text-secondary font-detail">
                Are you sure you want to decline onboarding for{' '}
                <strong className="text-text-primary">{rejectRequest.fullName}</strong>? A rejection reason must be recorded in the audit log.
              </p>

              <div className="flex flex-col gap-1">
                <label className="text-text-secondary uppercase font-mono text-xs">
                  Rejection Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="State the justification (e.g. Incomplete credentials, background check mismatch)..."
                  className="w-full bg-surface-card border border-border-default rounded-lg p-2.5 text-xs text-text-primary outline-none focus:border-status-error resize-none font-detail"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border-subtle">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setRejectRequest(null)}
                  disabled={isSubmittingRejection}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  loading={isSubmittingRejection}
                >
                  Confirm Rejection
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
