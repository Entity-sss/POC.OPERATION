import React, { useState, useEffect } from 'react';
import { Icons } from '../ui/Icons';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Alert } from '../ui/Alert';

type ManagerTab = 'attention' | 'tasks' | 'team' | 'reports' | 'pipeline' | 'delays';

interface ManagerOperationsCenterProps {
  user: {
    id: string;
    employeeId: string;
    fullName: string;
    email: string;
    isActive: boolean;
    roles?: any;
  };
  permissions?: string[];
  initialTab?: ManagerTab;
}

interface ManagerData {
  manager: {
    fullName: string;
    employeeId: string;
    departmentName: string | null;
    designationName: string | null;
    teamSize: number;
  };
  teamHealth: {
    totalMembers: number;
    activeTasks: number;
    overdueTasks: number;
    pendingVerificationTasks: number;
    reportsAwaitingReview: number;
    pendingDelayRequests?: number;
    activeOpportunities: number;
    pipelineValue: number;
  };
  requiresAttention: Array<{
    type: 'VERIFICATION_REQUIRED' | 'REPORT_REVIEW' | 'DELAY_REQUEST' | 'OVERDUE_TASK';
    id: string;
    title: string;
    severity: 'CRITICAL' | 'WARNING' | 'INFO';
    assignee: string;
    evidence?: string | null;
    due?: number | null;
  }>;
  teamMembers: Array<{
    id: string;
    employeeId: string;
    fullName: string;
    email: string;
    mobile: string;
    designationName: string | null;
    activeTasksCount: number;
    overdueTasksCount: number;
    pendingVerificationCount: number;
    opportunitiesCount: number;
    pipelineValue: number;
    targetAmount: number;
    achievedAmount: number;
    achievementPercentage: number;
  }>;
  teamTasks: Array<{
    id: string;
    title: string;
    description: string | null;
    priority: 'P1' | 'P2' | 'P3';
    status: 'TODO' | 'IN_PROGRESS' | 'PENDING_VERIFICATION' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
    originalDueDate: number;
    currentDueDate: number;
    evidence: string | null;
    evidenceType: string | null;
    makerNotes: string | null;
    checkerNotes: string | null;
    assignedToEmployeeId: string;
    assigneeName: string;
    assigneeEmpId: string;
    clientId: string | null;
    clientCompany: string | null;
    createdAt: number;
  }>;
  reportsQueue: Array<{
    id: string;
    employeeId: string;
    employeeName: string;
    employeeCode: string;
    reportDate: string;
    status: string;
    callsCount: number;
    meetingsCount: number;
    followUpsCount: number;
    dealsSummary: string | null;
    completedTasksSummary: string | null;
    pendingTasksSummary: string | null;
    notes: string | null;
    submittedAt: number;
  }>;
  delayRequests: Array<{
    id: string;
    taskId: string;
    taskTitle: string;
    taskPriority: string;
    requesterName: string;
    requesterEmpId: string;
    originalDueDate: number;
    requestedDueDate: number;
    reason: string;
    businessImpact: string | null;
    status: string;
    createdAt: number;
  }>;
  teamClients: Array<{
    id: string;
    name: string;
    companyName: string;
    email: string | null;
    phone: string | null;
    status: string;
    assignedEmployeeName: string;
    assignedEmployeeCode: string;
  }>;
  teamOpportunities: Array<{
    id: string;
    title: string;
    stage: string;
    estimatedValue: number;
    probability: number | null;
    expectedCloseDate: number | null;
    nextAction: string | null;
    clientCompany: string;
    ownerName: string;
    ownerCode: string;
  }>;
}

export const ManagerOperationsCenter: React.FC<ManagerOperationsCenterProps> = ({ user: _user, initialTab = 'attention' }) => {
  const [data, setData] = useState<ManagerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ManagerTab>(initialTab);
  const [submitting, setSubmitting] = useState(false);

  // Sync internal tab when initialTab prop changes (hash navigation)
  const prevInitialTab = React.useRef(initialTab);
  React.useEffect(() => {
    if (initialTab !== prevInitialTab.current) {
      setActiveTab(initialTab);
      prevInitialTab.current = initialTab;
    }
  }, [initialTab]);

  // Assign Task Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    title: '',
    description: '',
    assignedToEmployeeId: '',
    clientId: '',
    priority: 'P2' as 'P1' | 'P2' | 'P3',
    dueDate: '',
  });

  // Verify Task Modal
  const [activeVerifyTask, setActiveVerifyTask] = useState<any | null>(null);
  const [checkerNotes, setCheckerNotes] = useState('');

  // Review Report Modal
  const [activeReviewReport, setActiveReviewReport] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Review Delay Modal
  const [activeReviewDelay, setActiveReviewDelay] = useState<any | null>(null);
  const [delayRemarks, setDelayRemarks] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/manager/overview');
      if (!res.ok) {
        const errJson: any = await res.json().catch(() => ({}));
        throw new Error(errJson?.error || 'Failed to load manager operations');
      }
      const json: any = await res.json();
      setData(json.data || json);
    } catch (err: unknown) {
      setError((err as any)?.message || 'Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Action: Assign Task
  const handleAssignTask = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!assignForm.assignedToEmployeeId || !assignForm.title.trim() || !assignForm.dueDate) {
      alert('Please select a team member, enter a title, and select a due date.');
      return;
    }

    try {
      setSubmitting(true);
      const dueTimestamp = new Date(assignForm.dueDate).getTime();
      const res = await fetch('/api/manager/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: assignForm.title.trim(),
          description: assignForm.description.trim() || undefined,
          assignedToEmployeeId: assignForm.assignedToEmployeeId,
          clientId: assignForm.clientId || undefined,
          priority: assignForm.priority,
          dueDate: dueTimestamp,
        }),
      });

      if (!res.ok) {
        const err: any = await res.json();
        throw new Error(err?.error || 'Failed to assign task');
      }

      setShowAssignModal(false);
      setAssignForm({
        title: '',
        description: '',
        assignedToEmployeeId: '',
        clientId: '',
        priority: 'P2',
        dueDate: '',
      });
      await loadData();
    } catch (err: unknown) {
      alert((err as any)?.message || 'Error assigning task');
    } finally {
      setSubmitting(false);
    }
  };

  // Action: Verify Task (Maker-Checker Sign-off)
  const handleVerifyTask = async (approved: boolean) => {
    if (!activeVerifyTask) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/manager/tasks/${activeVerifyTask.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved,
          checkerNotes: checkerNotes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err: any = await res.json();
        throw new Error(err?.error || 'Failed to verify task');
      }

      setActiveVerifyTask(null);
      setCheckerNotes('');
      await loadData();
    } catch (err: unknown) {
      alert((err as any)?.message || 'Error verifying task');
    } finally {
      setSubmitting(false);
    }
  };

  // Action: Review Daily Report
  const handleReviewReport = async (action: 'APPROVE' | 'REJECT') => {
    if (!activeReviewReport) return;
    if (action === 'REJECT' && !rejectionReason.trim()) {
      alert('A rejection reason is mandatory when returning a report for revision.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/manager/reports/${activeReviewReport.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          rejectionReason: action === 'REJECT' ? rejectionReason.trim() : undefined,
        }),
      });

      if (!res.ok) {
        const err: any = await res.json();
        throw new Error(err?.error || 'Failed to review daily report');
      }

      setActiveReviewReport(null);
      setRejectionReason('');
      await loadData();
    } catch (err: unknown) {
      alert((err as any)?.message || 'Error reviewing report');
    } finally {
      setSubmitting(false);
    }
  };

  // Action: Review Delay Request
  const handleReviewDelay = async (action: 'APPROVE' | 'REJECT') => {
    if (!activeReviewDelay) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/manager/delays/${activeReviewDelay.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reviewRemarks: delayRemarks.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err: any = await res.json();
        throw new Error(err?.error || 'Failed to process delay request');
      }

      setActiveReviewDelay(null);
      setDelayRemarks('');
      await loadData();
    } catch (err: unknown) {
      alert((err as any)?.message || 'Error updating delay request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-xs text-text-secondary font-mono">Loading Team Operations Center...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <Alert variant="error" title="Operations Center Error">
          {error || 'Unable to load manager scope.'}
        </Alert>
        <Button className="mt-4" onClick={loadData} variant="secondary" size="sm">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="workspace-enter space-y-5">
      {/* 1. Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <Icons.Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Team Operations</h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                {data.manager.employeeId}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 border border-blue-200">
                Manager
              </span>
            </div>
            <p className="text-xs text-slate-500 font-detail mt-0.5">
              {data.manager.designationName || 'Operations Manager'} &middot; {data.manager.departmentName || 'Operations'} &middot; {data.manager.teamSize} direct report{data.manager.teamSize === 1 ? '' : 's'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAssignModal(true)}
          >
            + Delegate Task
          </Button>
          <button
            onClick={loadData}
            title="Refresh"
            className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <Icons.Clock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Team Health KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="kpi-card">
          <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{data.teamHealth.totalMembers}</div>
          <div className="text-[13px] font-semibold text-slate-700 mt-1">Team Members</div>
          <div className="text-xs text-slate-500 font-detail mt-0.5">Supervised</div>
        </div>

        <div className="kpi-card">
          <div className="text-2xl font-bold text-blue-700 font-mono tracking-tight">{data.teamHealth.activeTasks}</div>
          <div className="text-[13px] font-semibold text-slate-700 mt-1">Active Tasks</div>
          <div className="text-xs text-slate-500 font-detail mt-0.5">In progress</div>
        </div>

        <div className={`kpi-card ${data.teamHealth.overdueTasks > 0 ? 'border-red-200' : ''}`}>
          <div className={`text-2xl font-bold font-mono tracking-tight ${data.teamHealth.overdueTasks > 0 ? 'text-red-600' : 'text-slate-900'}`}>
            {data.teamHealth.overdueTasks}
          </div>
          <div className="text-[13px] font-semibold text-slate-700 mt-1">Overdue</div>
          <div className="text-xs text-slate-500 font-detail mt-0.5">SLA breach risk</div>
        </div>

        <div className={`kpi-card ${data.teamHealth.pendingVerificationTasks > 0 ? 'border-violet-200' : ''}`}>
          <div className={`text-2xl font-bold font-mono tracking-tight ${data.teamHealth.pendingVerificationTasks > 0 ? 'text-violet-700' : 'text-slate-900'}`}>
            {data.teamHealth.pendingVerificationTasks}
          </div>
          <div className="text-[13px] font-semibold text-slate-700 mt-1">Verification Queue</div>
          <div className="text-xs text-slate-500 font-detail mt-0.5">Maker-checker</div>
        </div>

        <div className={`kpi-card ${data.teamHealth.reportsAwaitingReview > 0 ? 'border-amber-200' : ''}`}>
          <div className={`text-2xl font-bold font-mono tracking-tight ${data.teamHealth.reportsAwaitingReview > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
            {data.teamHealth.reportsAwaitingReview}
          </div>
          <div className="text-[13px] font-semibold text-slate-700 mt-1">Reports Pending</div>
          <div className="text-xs text-slate-500 font-detail mt-0.5">Submitted today</div>
        </div>

        <div className="kpi-card">
          <div className="text-xl font-bold text-[#9D7D22] font-mono truncate tracking-tight">
            ₹{(data.teamHealth.pipelineValue || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[13px] font-semibold text-slate-700 mt-1">Pipeline Value</div>
          <div className="text-xs text-slate-500 font-detail mt-0.5">{data.teamHealth.activeOpportunities} active deals</div>
        </div>
      </div>

      {/* 3. Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-0 -mb-px">
        {([
          { key: 'attention', label: 'Requires Attention', icon: <Icons.AlertCircle className="w-4 h-4" />, badge: data.requiresAttention.length > 0 ? String(data.requiresAttention.length) : undefined, badgeColor: 'bg-red-100 text-red-700 border-red-200' },
          { key: 'tasks', label: 'Team Tasks', icon: <Icons.CheckCircle className="w-4 h-4" />, badge: String(data.teamTasks.length), badgeColor: 'bg-slate-100 text-slate-600 border-slate-200' },
          { key: 'team', label: 'Team Members', icon: <Icons.Users className="w-4 h-4" /> },
          { key: 'reports', label: 'Daily Reports', icon: <Icons.FileCheck className="w-4 h-4" />, badge: data.reportsQueue.length > 0 ? String(data.reportsQueue.length) : undefined, badgeColor: 'bg-amber-100 text-amber-700 border-amber-200' },
          { key: 'pipeline', label: 'Team Pipeline', icon: <Icons.Box className="w-4 h-4" /> },
          { key: 'delays', label: 'Delay Requests', icon: <Icons.AlertTriangle className="w-4 h-4" />, badge: data.delayRequests.filter((d: any) => d.status === 'PENDING').length > 0 ? String(data.delayRequests.filter((d: any) => d.status === 'PENDING').length) : undefined, badgeColor: 'bg-orange-100 text-orange-700 border-orange-200' },
        ] as { key: ManagerTab; label: string; icon: React.ReactNode; badge?: string; badgeColor?: string }[]).map((tab) => (
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
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border font-mono ${tab.badgeColor || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 4. Tab A: Requires Attention Queue */}
      {activeTab === 'attention' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary font-mono">
              Manager Operations Action Queue ({data.requiresAttention.length})
            </h3>
            <span className="text-xs font-mono text-text-tertiary">Requires manager decision</span>
          </div>

          {data.requiresAttention.length === 0 ? (
            <div className="p-8 rounded-xl border border-border-subtle bg-surface-card/30 text-center space-y-2">
              <Icons.CheckCircle className="w-8 h-8 text-status-success mx-auto opacity-50" />
              <h4 className="text-sm font-semibold text-text-primary">All Team Operations On Track</h4>
              <p className="text-xs text-text-secondary">No pending verification items, reports, or SLA delays require attention.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {data.requiresAttention.map((item) => {
                const isVerification = item.type === 'VERIFICATION_REQUIRED';
                const isReport = item.type === 'REPORT_REVIEW';
                const isDelay = item.type === 'DELAY_REQUEST';

                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      item.severity === 'CRITICAL'
                        ? 'border-status-error/40 bg-status-error/10'
                        : item.severity === 'WARNING'
                        ? 'border-brand-primary/40 bg-brand-primary/5'
                        : 'border-status-info/40 bg-status-info/5'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded ${
                            item.severity === 'CRITICAL'
                              ? 'bg-status-error text-surface-base'
                              : item.severity === 'WARNING'
                              ? 'bg-brand-primary text-surface-base'
                              : 'bg-status-info text-surface-base'
                          }`}
                        >
                          {item.type.replace('_', ' ')}
                        </span>
                        <strong className="text-sm font-semibold text-text-primary">{item.title}</strong>
                      </div>
                      <div className="text-xs text-text-secondary flex items-center gap-3">
                        <span>Assigned to: <strong className="text-text-primary">{item.assignee}</strong></span>
                        {item.due && (
                          <span className="font-mono text-text-tertiary">
                            Due: {new Date(item.due).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {isVerification && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            const found = data.teamTasks.find((t) => t.id === item.id);
                            if (found) setActiveVerifyTask(found);
                          }}
                        >
                          Review &amp; Verify Work
                        </Button>
                      )}

                      {isReport && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            const found = data.reportsQueue.find((r) => r.id === item.id);
                            if (found) setActiveReviewReport(found);
                          }}
                        >
                          Review Report
                        </Button>
                      )}

                      {isDelay && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            const found = data.delayRequests.find((d) => d.id === item.id);
                            if (found) setActiveReviewDelay(found);
                          }}
                        >
                          Review Delay
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. Tab B: Team Tasks & Verification */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary font-mono">
              Team Work Queue ({data.teamTasks.length} Tasks)
            </h3>
            <Button size="sm" variant="primary" onClick={() => setShowAssignModal(true)}>
              + Assign New Task
            </Button>
          </div>

          <div className="border border-border-subtle rounded-xl overflow-hidden bg-surface-card/30">
            <table className="w-full text-left operational-table">
              <thead className="bg-surface-elevated/70 border-b border-border-subtle text-text-secondary font-mono">
                <tr>
                  <th className="py-3 px-4 font-semibold">Priority</th>
                  <th className="py-3 px-4 font-semibold">Task</th>
                  <th className="py-3 px-4 font-semibold">Assignee</th>
                  <th className="py-3 px-4 font-semibold">Client</th>
                  <th className="py-3 px-4 font-semibold">Due Date</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {data.teamTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-elevated/30">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                          t.priority === 'P1'
                            ? 'bg-status-error/20 text-status-error'
                            : t.priority === 'P2'
                            ? 'bg-brand-primary/20 text-brand-primary'
                            : 'bg-surface-elevated text-text-secondary'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 min-w-[200px]">
                      <div className="font-semibold text-text-primary text-sm">{t.title}</div>
                      {t.makerNotes && (
                        <div className="text-xs font-mono text-purple-300 mt-1 bg-purple-400/10 p-1.5 rounded">
                          <strong>Maker Notes:</strong> {t.makerNotes}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-text-primary text-xs sm:text-sm">
                      {t.assigneeName} ({t.assigneeEmpId})
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-text-secondary text-xs">
                      {t.clientCompany || '—'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-text-secondary text-xs">
                      {new Date(t.currentDueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                          t.status === 'COMPLETED'
                            ? 'bg-status-success/20 text-status-success'
                            : t.status === 'PENDING_VERIFICATION'
                            ? 'bg-purple-400/20 text-purple-300 animate-pulse'
                            : t.status === 'IN_PROGRESS'
                            ? 'bg-brand-primary/20 text-brand-primary'
                            : 'bg-surface-elevated text-text-secondary'
                        }`}
                      >
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      {t.status === 'PENDING_VERIFICATION' ? (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => setActiveVerifyTask(t)}
                        >
                          Verify Work
                        </Button>
                      ) : t.status === 'COMPLETED' ? (
                        <span className="text-xs font-mono text-status-success font-semibold">Verified</span>
                      ) : (
                        <span className="text-text-muted font-mono text-xs">In Progress</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Tab C: Team Members Performance Matrix */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary font-mono">
            Team Member Execution &amp; Target Matrix ({data.teamMembers.length})
          </h3>

          <div className="border border-border-subtle rounded-xl overflow-hidden bg-surface-card/30">
            <table className="w-full text-left operational-table">
              <thead className="bg-surface-elevated/70 border-b border-border-subtle text-text-secondary font-mono">
                <tr>
                  <th className="py-3 px-4 font-semibold">Employee</th>
                  <th className="py-3 px-4 font-semibold">Designation</th>
                  <th className="py-3 px-4 font-semibold">Active Tasks</th>
                  <th className="py-3 px-4 font-semibold">Overdue Tasks</th>
                  <th className="py-3 px-4 font-semibold">Pending Verify</th>
                  <th className="py-3 px-4 font-semibold">Pipeline Deals</th>
                  <th className="py-3 px-4 font-semibold">Quota Achievement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {data.teamMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-surface-elevated/30">
                    <td className="py-3 px-4 font-semibold text-text-primary">
                      {m.fullName}
                      <span className="block text-xs font-mono text-brand-primary">{m.employeeId}</span>
                    </td>
                    <td className="py-3 px-4 text-text-secondary text-xs">{m.designationName || 'Specialist'}</td>
                    <td className="py-3 px-4 font-mono font-bold text-text-primary">{m.activeTasksCount}</td>
                    <td className="py-3 px-4 font-mono font-bold text-status-error">{m.overdueTasksCount}</td>
                    <td className="py-3 px-4 font-mono text-purple-300">{m.pendingVerificationCount}</td>
                    <td className="py-3 px-4 font-mono text-text-secondary text-xs">
                      {m.opportunitiesCount} (₹{m.pipelineValue.toLocaleString('en-IN')})
                    </td>
                    <td className="py-3 px-4">
                      {m.targetAmount > 0 ? (
                        <div>
                          <div className="flex items-center justify-between text-xs font-mono mb-1">
                            <span>{m.achievementPercentage}%</span>
                            <span className="text-text-tertiary">₹{m.achievedAmount.toLocaleString('en-IN')} / ₹{m.targetAmount.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="w-32 h-1.5 bg-surface-base rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-primary rounded-full"
                              style={{ width: `${m.achievementPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-text-tertiary font-mono">No target assigned</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. Tab D: Daily Reports Review Queue */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary font-mono">
            Pending Daily Reports Queue ({data.reportsQueue.length})
          </h3>

          {data.reportsQueue.length === 0 ? (
            <div className="p-8 rounded-xl border border-border-subtle bg-surface-card/30 text-center">
              <p className="text-xs text-text-secondary">No submitted reports are waiting for manager review.</p>
            </div>
          ) : (
            <div className="border border-border-subtle rounded-xl overflow-hidden bg-surface-card/30">
              <table className="w-full text-left operational-table">
                <thead className="bg-surface-elevated/70 border-b border-border-subtle text-text-secondary font-mono">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Employee</th>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Activity Metrics</th>
                    <th className="py-3 px-4 font-semibold">Summary / Progress</th>
                    <th className="py-3 px-4 font-semibold">Submitted</th>
                    <th className="py-3 px-4 font-semibold text-right">Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {data.reportsQueue.map((r) => (
                    <tr key={r.id} className="hover:bg-surface-elevated/30">
                      <td className="py-3 px-4 font-semibold text-text-primary">
                        {r.employeeName}
                        <span className="block text-xs font-mono text-brand-primary">{r.employeeCode}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-text-primary">{r.reportDate}</td>
                      <td className="py-3 px-4 font-mono text-text-secondary">
                        {r.callsCount} calls • {r.meetingsCount} mtgs • {r.followUpsCount} flws
                      </td>
                      <td className="py-3 px-4 text-text-secondary max-w-xs truncate">
                        {r.completedTasksSummary || r.dealsSummary || r.notes || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-text-tertiary">
                        {new Date(r.submittedAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right space-x-2">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => setActiveReviewReport(r)}
                        >
                          Review &amp; Decide
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 8. Tab E: Pipeline & Clients */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary font-mono">
              Team Opportunities Pipeline ({data.teamOpportunities.length})
            </h3>
            <div className="border border-border-subtle rounded-xl overflow-hidden bg-surface-card/30">
              <table className="w-full text-left operational-table">
                <thead className="bg-surface-elevated/70 border-b border-border-subtle text-text-secondary font-mono">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Opportunity</th>
                    <th className="py-3 px-4 font-semibold">Owner</th>
                    <th className="py-3 px-4 font-semibold">Client</th>
                    <th className="py-3 px-4 font-semibold">Stage</th>
                    <th className="py-3 px-4 font-semibold">Value</th>
                    <th className="py-3 px-4 font-semibold">Next Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {data.teamOpportunities.map((o) => (
                    <tr key={o.id} className="hover:bg-surface-elevated/30">
                      <td className="py-3 px-4 font-semibold text-text-primary">{o.title}</td>
                      <td className="py-3 px-4 font-medium text-brand-primary">{o.ownerName}</td>
                      <td className="py-3 px-4 text-text-secondary">{o.clientCompany}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-brand-primary/20 text-brand-primary">
                          {o.stage}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-text-primary">
                        ₹{o.estimatedValue.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-text-muted">{o.nextAction || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 9. Tab F: SLA Delay Requests */}
      {activeTab === 'delays' && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary font-mono">
            Pending Task Delay Extension Requests ({data.delayRequests.length})
          </h3>

          {data.delayRequests.length === 0 ? (
            <div className="p-8 rounded-xl border border-border-subtle bg-surface-card/30 text-center">
              <p className="text-xs text-text-secondary">No delay extension requests awaiting review.</p>
            </div>
          ) : (
            <div className="border border-border-subtle rounded-xl overflow-hidden bg-surface-card/30">
              <table className="w-full text-left operational-table">
                <thead className="bg-surface-elevated/70 border-b border-border-subtle text-text-secondary font-mono">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Task</th>
                    <th className="py-3 px-4 font-semibold">Requested By</th>
                    <th className="py-3 px-4 font-semibold">Original Due</th>
                    <th className="py-3 px-4 font-semibold">Requested Extension</th>
                    <th className="py-3 px-4 font-semibold">Reason</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {data.delayRequests.map((d) => (
                    <tr key={d.id} className="hover:bg-surface-elevated/30">
                      <td className="py-3 px-4 font-semibold text-text-primary">{d.taskTitle}</td>
                      <td className="py-3 px-4 text-brand-primary">{d.requesterName}</td>
                      <td className="py-3 px-4 font-mono text-text-secondary">
                        {new Date(d.originalDueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-brand-primary">
                        {new Date(d.requestedDueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-text-secondary max-w-xs">{d.reason}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <Button size="sm" variant="primary" onClick={() => setActiveReviewDelay(d)}>
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Assign Task */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-white/10 bg-surface-card shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 className="text-base font-bold text-text-primary">Delegate Task to Team Member</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-text-muted hover:text-text-primary cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignTask} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-text-secondary block mb-1">Assign to Team Member *</label>
                <select
                  required
                  value={assignForm.assignedToEmployeeId}
                  onChange={(e) => setAssignForm({ ...assignForm, assignedToEmployeeId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-text-primary text-xs"
                >
                  <option value="">Select an employee...</option>
                  {data.teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.employeeId}) - {m.designationName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-text-secondary block mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Conduct dispatch inspection with Marcus Vance..."
                  value={assignForm.title}
                  onChange={(e) => setAssignForm({ ...assignForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-text-primary text-xs focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-text-secondary block mb-1">Description / Instructions</label>
                <textarea
                  rows={3}
                  placeholder="Provide scope, deliverables, and required evidence..."
                  value={assignForm.description}
                  onChange={(e) => setAssignForm({ ...assignForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-text-primary text-xs focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-text-secondary block mb-1">Priority</label>
                  <select
                    value={assignForm.priority}
                    onChange={(e: any) => setAssignForm({ ...assignForm, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-text-primary text-xs"
                  >
                    <option value="P1">P1 - Critical SLA</option>
                    <option value="P2">P2 - Standard Priority</option>
                    <option value="P3">P3 - Routine Work</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-text-secondary block mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={assignForm.dueDate}
                    onChange={(e) => setAssignForm({ ...assignForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-text-primary text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-text-secondary block mb-1">Related Client Account</label>
                <select
                  value={assignForm.clientId}
                  onChange={(e) => setAssignForm({ ...assignForm, clientId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-text-primary text-xs"
                >
                  <option value="">None / Internal Task</option>
                  {data.teamClients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} ({c.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                  {submitting ? 'Assigning...' : 'Assign Task'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Verify Task (Maker-Checker Verification) */}
      {activeVerifyTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-white/10 bg-surface-card shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 className="text-base font-bold text-text-primary">Maker-Checker Task Sign-off</h3>
              <button onClick={() => setActiveVerifyTask(null)} className="text-text-muted hover:text-text-primary cursor-pointer">
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-lg bg-surface-elevated/50 border border-border-subtle space-y-2.5 text-xs">
              <div>
                <span className="text-xs font-mono uppercase text-text-tertiary block">Task Title</span>
                <strong className="text-sm sm:text-base text-text-primary">{activeVerifyTask.title}</strong>
              </div>
              <div>
                <span className="text-xs font-mono uppercase text-text-tertiary block">Completed by</span>
                <span className="text-text-primary font-medium text-xs sm:text-sm">{activeVerifyTask.assigneeName}</span>
              </div>
              {activeVerifyTask.evidence && (
                <div>
                  <span className="text-xs font-mono uppercase text-text-tertiary block">Attached Evidence</span>
                  <a
                    href={activeVerifyTask.evidence}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs text-brand-primary underline hover:text-brand-secondary break-all"
                  >
                    {activeVerifyTask.evidence}
                  </a>
                </div>
              )}
              {activeVerifyTask.makerNotes && (
                <div>
                  <span className="text-xs font-mono uppercase text-text-tertiary block">Maker Remarks</span>
                  <p className="text-text-secondary bg-surface-base p-2.5 rounded border border-border-subtle font-detail text-xs">
                    {activeVerifyTask.makerNotes}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-mono text-text-secondary block mb-1">
                Checker Verification Remarks
              </label>
              <textarea
                rows={3}
                placeholder="Notes on verification, audit record, or instructions if returned..."
                value={checkerNotes}
                onChange={(e) => setCheckerNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-text-primary text-xs focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleVerifyTask(false)}
                disabled={submitting}
              >
                Return for Revision
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleVerifyTask(true)}
                disabled={submitting}
              >
                Approve &amp; Mark Completed
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Review Daily Report */}
      {activeReviewReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-white/10 bg-surface-card shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 className="text-base sm:text-lg font-bold text-text-primary">Review Daily Work Report</h3>
              <button onClick={() => setActiveReviewReport(null)} className="text-text-muted hover:text-text-primary cursor-pointer">
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-lg bg-surface-elevated/50 border border-border-subtle space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <strong className="text-sm sm:text-base text-text-primary">{activeReviewReport.employeeName}</strong>
                  <span className="font-mono text-xs text-text-tertiary block">{activeReviewReport.employeeCode}</span>
                </div>
                <Badge variant="gold">{activeReviewReport.reportDate}</Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono text-xs bg-surface-base p-2.5 rounded">
                <div>Calls: <strong>{activeReviewReport.callsCount}</strong></div>
                <div>Meetings: <strong>{activeReviewReport.meetingsCount}</strong></div>
                <div>Follow-ups: <strong>{activeReviewReport.followUpsCount}</strong></div>
              </div>

              {activeReviewReport.completedTasksSummary && (
                <div>
                  <span className="text-xs font-mono uppercase text-text-tertiary block">Milestones Completed</span>
                  <p className="text-text-secondary mt-0.5 text-xs font-detail">{activeReviewReport.completedTasksSummary}</p>
                </div>
              )}

              {activeReviewReport.dealsSummary && (
                <div>
                  <span className="text-xs font-mono uppercase text-text-tertiary block">Pipeline / Deals</span>
                  <p className="text-text-secondary mt-0.5 text-xs font-detail">{activeReviewReport.dealsSummary}</p>
                </div>
              )}

              {activeReviewReport.notes && (
                <div>
                  <span className="text-xs font-mono uppercase text-text-tertiary block">Employee Notes</span>
                  <p className="text-text-secondary mt-0.5 text-xs font-detail">{activeReviewReport.notes}</p>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-mono text-text-secondary block mb-1">
                Rejection Reason (Required only if returning for revision)
              </label>
              <textarea
                rows={2}
                placeholder="State clearly what is missing or requires correction..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-text-primary text-xs focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleReviewReport('REJECT')}
                disabled={submitting}
              >
                Reject with Reason
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleReviewReport('APPROVE')}
                disabled={submitting}
              >
                Approve Report
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Review Delay Request */}
      {activeReviewDelay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-white/10 bg-surface-card shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 className="text-base sm:text-lg font-bold text-text-primary">Review SLA Delay Request</h3>
              <button onClick={() => setActiveReviewDelay(null)} className="text-text-muted hover:text-text-primary cursor-pointer">
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-lg bg-surface-elevated/50 border border-border-subtle space-y-2.5 text-xs">
              <strong className="text-sm sm:text-base text-text-primary">{activeReviewDelay.taskTitle}</strong>
              <div className="text-text-secondary text-xs">Requested by: <strong>{activeReviewDelay.requesterName}</strong></div>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs bg-surface-base p-2.5 rounded">
                <div>Original Due: {new Date(activeReviewDelay.originalDueDate).toLocaleDateString()}</div>
                <div>Requested Due: <strong className="text-brand-primary">{new Date(activeReviewDelay.requestedDueDate).toLocaleDateString()}</strong></div>
              </div>
              <div>
                <span className="text-xs font-mono uppercase text-text-tertiary block">Reason for Extension</span>
                <p className="text-text-secondary text-xs font-detail mt-0.5">{activeReviewDelay.reason}</p>
              </div>
              {activeReviewDelay.businessImpact && (
                <div>
                  <span className="text-xs font-mono uppercase text-text-tertiary block">Impact Assessment</span>
                  <p className="text-text-secondary text-xs font-detail mt-0.5">{activeReviewDelay.businessImpact}</p>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-mono text-text-secondary block mb-1">Remarks</label>
              <input
                type="text"
                placeholder="Approval or rejection notes..."
                value={delayRemarks}
                onChange={(e) => setDelayRemarks(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-text-primary text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleReviewDelay('REJECT')}
                disabled={submitting}
              >
                Reject Delay
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleReviewDelay('APPROVE')}
                disabled={submitting}
              >
                Approve &amp; Extend SLA
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
