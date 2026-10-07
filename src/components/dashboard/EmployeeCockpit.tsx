import React, { useState, useEffect } from 'react';
import { Icons } from '../ui/Icons';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Alert } from '../ui/Alert';

type CockpitSection = 'tasks' | 'clients' | 'pipeline' | 'reports' | 'profile';

interface EmployeeCockpitProps {
  user: {
    id: string;
    employeeId: string;
    fullName: string;
    email: string;
    isActive: boolean;
    roles?: any;
  };
  permissions?: string[];
  initialSection?: CockpitSection;
}

interface CockpitData {
  employee: {
    id: string;
    employeeId: string;
    fullName: string;
    email: string;
    mobile: string;
    isActive: boolean;
    departmentName: string | null;
    designationName: string | null;
    managerName: string | null;
    currentAddress?: string | null;
    permanentAddress?: string | null;
    education?: string | null;
    priorExperience?: string | null;
    roles: string[];
  };
  attention: {
    tasksDueCount: number;
    overdueCount: number;
    followUpsDueCount: number;
    meetingsTodayCount: number;
    todayReportStatus: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'NOT_CREATED';
    todayReportId: string | null;
    items: Array<{
      type: 'OVERDUE_TASK' | 'TASK_DUE' | 'FOLLOW_UP' | 'MEETING';
      id: string;
      title: string;
      priority?: string;
      due: number | string;
      client?: string;
    }>;
  };
  performance: {
    hasTargets: boolean;
    periodType?: string;
    periodStart?: string;
    periodEnd?: string;
    targetAmount?: number;
    achievedAmount?: number;
    achievementPercentage?: number;
    targetCalls?: number;
    targetMeetings?: number;
    targetDeals?: number;
    message?: string;
  };
  tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    priority: 'P1' | 'P2' | 'P3';
    status: 'TODO' | 'IN_PROGRESS' | 'PENDING_VERIFICATION' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
    originalDueDate: number;
    currentDueDate: number;
    evidence: string | null;
    evidenceType: 'DOCUMENT' | 'EMAIL' | 'NOTE' | 'LINK' | null;
    makerNotes: string | null;
    checkerNotes: string | null;
    clientCompany: string | null;
    assignedByName: string | null;
    verifiedByName: string | null;
  }>;
  clients: Array<{
    id: string;
    name: string;
    companyName: string;
    email: string | null;
    phone: string | null;
    status: 'ACTIVE' | 'LEAD' | 'INACTIVE';
    createdAt: number;
  }>;
  followUps: Array<{
    id: string;
    clientId: string;
    clientName: string;
    clientCompany: string;
    date: number;
    type: 'CALL' | 'EMAIL' | 'MEETING' | 'DEMO';
    status: 'UPCOMING' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED';
    outcome: string | null;
    nextAction: string | null;
    nextFollowUpDate: number | null;
    notes: string | null;
  }>;
  meetings: Array<{
    id: string;
    clientCompany: string;
    title: string;
    scheduledAt: number;
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
    notes: string | null;
    outcome: string | null;
    nextAction: string | null;
  }>;
  opportunities: Array<{
    id: string;
    title: string;
    stage: 'OPPORTUNITY' | 'PROPOSAL' | 'CONVERSION' | 'WON' | 'LOST';
    estimatedValue: number;
    probability: number | null;
    expectedCloseDate: number | null;
    nextAction: string | null;
    clientCompany: string;
  }>;
  dailyReports: Array<{
    id: string;
    reportDate: string;
    status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
    callsCount: number;
    meetingsCount: number;
    followUpsCount: number;
    dealsSummary: string | null;
    completedTasksSummary: string | null;
    pendingTasksSummary: string | null;
    notes: string | null;
    submittedAt: number | null;
    reviewedAt: number | null;
    rejectionReason: string | null;
    reviewerName: string | null;
  }>;
  todayReport: any | null;
}

export const EmployeeCockpit: React.FC<EmployeeCockpitProps> = ({ user: _user, initialSection = 'tasks' }) => {
  const [data, setData] = useState<CockpitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<CockpitSection>(initialSection);
  const [taskFilter, setTaskFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING_VERIFICATION' | 'COMPLETED'>('ACTIVE');

  // Sync internal section when initialSection prop changes (hash navigation)
  const prevSection = React.useRef(initialSection);
  React.useEffect(() => {
    if (initialSection !== prevSection.current) {
      setActiveSection(initialSection);
      prevSection.current = initialSection;
    }
  }, [initialSection]);


  // Modals state
  const [verifyModalTask, setVerifyModalTask] = useState<any | null>(null);
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceType, setEvidenceType] = useState<'LINK' | 'DOCUMENT' | 'EMAIL' | 'NOTE'>('LINK');
  const [makerNotes, setMakerNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Delay Request Modal
  const [delayModalTask, setDelayModalTask] = useState<any | null>(null);
  const [delayDays, setDelayDays] = useState(2);
  const [delayReason, setDelayReason] = useState('');
  const [delayImpact, setDelayImpact] = useState('');

  // Daily Report Form State
  const [reportForm, setReportForm] = useState({
    callsCount: 0,
    meetingsCount: 0,
    followUpsCount: 0,
    dealsSummary: '',
    completedTasksSummary: '',
    pendingTasksSummary: '',
    notes: '',
  });

  // Follow-up outcome modal
  const [activeFollowUp, setActiveFollowUp] = useState<any | null>(null);
  const [followUpOutcome, setFollowUpOutcome] = useState('');
  const [followUpNextAction, setFollowUpNextAction] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/employee/cockpit');
      if (!res.ok) {
        const errJson: any = await res.json().catch(() => ({}));
        throw new Error(errJson?.error || 'Failed to load employee cockpit');
      }
      const resJson: any = await res.json();
      const cockpitData = resJson.data || resJson;
      setData(cockpitData);

      // Populate report form if today's report exists
      if (cockpitData.todayReport) {
        setReportForm({
          callsCount: cockpitData.todayReport.callsCount || 0,
          meetingsCount: cockpitData.todayReport.meetingsCount || 0,
          followUpsCount: cockpitData.todayReport.followUpsCount || 0,
          dealsSummary: cockpitData.todayReport.dealsSummary || '',
          completedTasksSummary: cockpitData.todayReport.completedTasksSummary || '',
          pendingTasksSummary: cockpitData.todayReport.pendingTasksSummary || '',
          notes: cockpitData.todayReport.notes || '',
        });
      }
    } catch (err: unknown) {
      setError((err as any)?.message || 'Error connecting to database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle task status update (Start Task)
  const handleStartTask = async (taskId: string) => {
    try {
      setSubmittingAction(true);
      const res = await fetch(`/api/employee/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      });
      if (!res.ok) {
        const err: any = await res.json();
        throw new Error(err?.error || 'Failed to start task');
      }
      await loadData();
    } catch (err: unknown) {
      alert((err as any)?.message || 'Error starting task');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Submit Evidence & Mark PENDING_VERIFICATION
  const handleSubmitEvidence = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!verifyModalTask) return;
    if (!evidenceUrl.trim() && !makerNotes.trim()) {
      alert('Please provide evidence link or detailed completion notes.');
      return;
    }

    try {
      setSubmittingAction(true);
      const res = await fetch(`/api/employee/tasks/${verifyModalTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PENDING_VERIFICATION',
          evidence: evidenceUrl.trim(),
          evidenceType,
          makerNotes: makerNotes.trim(),
        }),
      });

      if (!res.ok) {
        const err: any = await res.json();
        throw new Error(err?.error || 'Failed to submit verification');
      }

      setVerifyModalTask(null);
      setEvidenceUrl('');
      setMakerNotes('');
      await loadData();
    } catch (err: unknown) {
      alert((err as any)?.message || 'Error submitting evidence');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Submit Task Delay Request
  const handleSubmitDelay = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!delayModalTask) return;
    if (!delayReason.trim()) {
      alert('Please provide a reason for the delay.');
      return;
    }

    try {
      setSubmittingAction(true);
      const requestedDate = new Date(delayModalTask.currentDueDate);
      requestedDate.setDate(requestedDate.getDate() + Number(delayDays));

      const res = await fetch(`/api/employee/tasks/${delayModalTask.id}/delay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestedDueDate: requestedDate.getTime(),
          reason: delayReason.trim(),
          businessImpact: delayImpact.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err: any = await res.json();
        throw new Error(err?.error || 'Failed to submit delay request');
      }

      setDelayModalTask(null);
      setDelayReason('');
      setDelayImpact('');
      await loadData();
    } catch (err: unknown) {
      alert((err as any)?.message || 'Error requesting delay');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Submit Daily Work Report
  const handleSaveReport = async (status: 'DRAFT' | 'SUBMITTED') => {
    try {
      setSubmittingAction(true);
      const todayDateStr = new Date().toISOString().split('T')[0];
      const res = await fetch('/api/employee/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportDate: todayDateStr,
          status,
          ...reportForm,
        }),
      });

      if (!res.ok) {
        const err: any = await res.json();
        throw new Error(err?.error || 'Failed to save daily report');
      }

      await loadData();
    } catch (err: unknown) {
      alert((err as any)?.message || 'Error saving report');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Update Follow Up Outcome
  const handleSaveFollowUpOutcome = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!activeFollowUp) return;

    try {
      setSubmittingAction(true);
      const res = await fetch(`/api/employee/followups/${activeFollowUp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'COMPLETED',
          outcome: followUpOutcome.trim(),
          nextAction: followUpNextAction.trim(),
        }),
      });

      if (!res.ok) {
        const err: any = await res.json();
        throw new Error(err?.error || 'Failed to update follow-up');
      }

      setActiveFollowUp(null);
      setFollowUpOutcome('');
      setFollowUpNextAction('');
      await loadData();
    } catch (err: unknown) {
      alert((err as any)?.message || 'Error updating follow-up');
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-xs text-text-secondary font-mono">Loading Employee Cockpit from D1...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <Alert variant="error" title="Operational Data Sync Error">
          {error || 'Unable to retrieve workspace data.'}
        </Alert>
        <Button className="mt-4" onClick={loadData} variant="secondary" size="sm">
          Retry Connection
        </Button>
      </div>
    );
  }

  // Filter tasks
  const filteredTasks = data.tasks.filter((t) => {
    if (taskFilter === 'ACTIVE') return t.status === 'TODO' || t.status === 'IN_PROGRESS' || t.status === 'OVERDUE';
    if (taskFilter === 'PENDING_VERIFICATION') return t.status === 'PENDING_VERIFICATION';
    if (taskFilter === 'COMPLETED') return t.status === 'COMPLETED';
    return true;
  });

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="workspace-enter space-y-5">
      {/* 1. Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1E3A5F] to-[#2B6CB0] flex items-center justify-center text-white font-bold text-base flex-shrink-0">
            {data.employee.fullName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{data.employee.fullName}</h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                {data.employee.employeeId}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${
                data.employee.isActive ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'
              }`}>
                {data.employee.isActive ? 'Active' : 'Disabled'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-detail mt-0.5">
              {data.employee.designationName || 'Operations Specialist'} &middot; {data.employee.departmentName || 'Operations'}
              {data.employee.managerName && <> &middot; Reporting to <strong className="text-slate-700">{data.employee.managerName}</strong></>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-detail">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {todayStr}
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

      {/* 2. Today Attention Strip */}
      <div className="content-card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#B8962E]" />
            Today &amp; Action Required
          </h2>
          <span className="text-xs text-slate-400 font-detail">
            {data.attention.items.length} actionable item{data.attention.items.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button
            onClick={() => { setActiveSection('tasks'); setTaskFilter('ACTIVE'); }}
            className={`kpi-card text-left p-3.5 transition-all ${
              data.attention.overdueCount > 0 ? 'border-red-200 hover:border-red-300' : 'hover:border-slate-300'
            }`}
          >
            <div className={`text-2xl font-bold font-mono tracking-tight ${data.attention.overdueCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>
              {data.attention.overdueCount}
            </div>
            <div className="text-[13px] font-semibold text-slate-700 mt-1">Overdue Tasks</div>
          </button>

          <button
            onClick={() => { setActiveSection('tasks'); setTaskFilter('ACTIVE'); }}
            className="kpi-card text-left p-3.5 hover:border-slate-300 transition-all"
          >
            <div className="text-2xl font-bold text-[#9D7D22] font-mono tracking-tight">{data.attention.tasksDueCount}</div>
            <div className="text-[13px] font-semibold text-slate-700 mt-1">Due Today</div>
          </button>

          <button
            onClick={() => setActiveSection('clients')}
            className="kpi-card text-left p-3.5 hover:border-slate-300 transition-all"
          >
            <div className="text-2xl font-bold text-blue-700 font-mono tracking-tight">{data.attention.followUpsDueCount}</div>
            <div className="text-[13px] font-semibold text-slate-700 mt-1">Follow-ups</div>
          </button>

          <button
            onClick={() => setActiveSection('clients')}
            className="kpi-card text-left p-3.5 hover:border-slate-300 transition-all"
          >
            <div className="text-2xl font-bold text-violet-700 font-mono tracking-tight">{data.attention.meetingsTodayCount}</div>
            <div className="text-[13px] font-semibold text-slate-700 mt-1">Meetings</div>
          </button>

          <button
            onClick={() => setActiveSection('reports')}
            className="kpi-card text-left p-3.5 hover:border-slate-300 transition-all col-span-2 sm:col-span-1"
          >
            <div className="mb-1">
              {data.attention.todayReportStatus === 'APPROVED' ? (
                <span className="badge-success text-xs font-mono font-bold px-2 py-0.5 rounded">APPROVED</span>
              ) : data.attention.todayReportStatus === 'SUBMITTED' ? (
                <span className="badge-info text-xs font-mono font-bold px-2 py-0.5 rounded">SUBMITTED</span>
              ) : data.attention.todayReportStatus === 'REJECTED' ? (
                <span className="badge-error text-xs font-mono font-bold px-2 py-0.5 rounded">REJECTED</span>
              ) : data.attention.todayReportStatus === 'DRAFT' ? (
                <span className="badge-warning text-xs font-mono font-bold px-2 py-0.5 rounded">DRAFT</span>
              ) : (
                <span className="badge-neutral text-xs font-mono font-bold px-2 py-0.5 rounded">PENDING</span>
              )}
            </div>
            <div className="text-[13px] font-semibold text-slate-700 mt-1">Daily Report</div>
          </button>
        </div>
      </div>

      {/* 3. Performance Strip */}
      <div className="content-card">
        <div className="content-card-header">
          <div className="flex items-center gap-2">
            <Icons.Box className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-800">Performance &amp; Revenue Quota</h2>
          </div>
          {data.performance.hasTargets && (
            <span className="text-xs text-slate-500 font-mono font-detail">
              {data.performance.periodStart} to {data.performance.periodEnd}
            </span>
          )}
        </div>

        {data.performance.hasTargets ? (
          <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-700 font-medium">Target Achievement</span>
                <span className="font-mono font-bold text-slate-900">{data.performance.achievementPercentage}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-[#B8962E] to-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${data.performance.achievementPercentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                <span>Achieved: ₹{(data.performance.achievedAmount || 0).toLocaleString('en-IN')}</span>
                <span>Quota: ₹{(data.performance.targetAmount || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="text-xl font-bold font-mono text-slate-800">
                {data.opportunities.filter((o) => o.stage === 'WON').length} / {data.performance.targetDeals}
              </div>
              <div className="text-[13px] font-semibold text-slate-700 mt-1">Monthly Deals Quota</div>
              <div className="text-xs text-slate-500 font-detail mt-0.5">closed / required</div>
            </div>

            <div className="space-y-0.5">
              <div className="text-xl font-bold font-mono text-slate-800">
                {data.performance.targetCalls}C &middot; {data.performance.targetMeetings}M
              </div>
              <div className="text-[13px] font-semibold text-slate-700 mt-1">Call &amp; Meeting Milestones</div>
              <div className="text-xs text-slate-500 font-detail mt-0.5">Monthly targets</div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-xs text-slate-500 font-detail">
              Performance tracking will activate when targets are assigned by management.
            </p>
          </div>
        )}
      </div>

      {/* 4. Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-0 -mb-px">
        {([
          { key: 'tasks', label: 'My Tasks', icon: <Icons.CheckCircle className="w-4 h-4" />, badge: String(data.tasks.length) },
          { key: 'clients', label: 'My Clients', icon: <Icons.Users className="w-4 h-4" />, badge: String(data.clients.length) },
          { key: 'pipeline', label: 'Opportunities', icon: <Icons.Box className="w-4 h-4" />, badge: String(data.opportunities.length) },
          { key: 'reports', label: 'Daily Reports', icon: <Icons.FileCheck className="w-4 h-4" /> },
          { key: 'profile', label: 'My Profile', icon: <Icons.Shield className="w-4 h-4" /> },
        ] as { key: CockpitSection; label: string; icon: React.ReactNode; badge?: string }[]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-[13px] font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap -mb-px ${
              activeSection === tab.key
                ? 'border-[#B8962E] text-[#9D7D22]'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 5. Section A: Tasks Workspace */}
      {activeSection === 'tasks' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-text-secondary">Filter by State:</span>
              <div className="flex items-center gap-1">
                {(['ACTIVE', 'PENDING_VERIFICATION', 'COMPLETED', 'ALL'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTaskFilter(filter)}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                      taskFilter === filter
                        ? 'bg-brand-primary text-surface-base font-bold'
                        : 'bg-surface-card text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {filter === 'ALL'
                      ? 'All'
                      : filter === 'ACTIVE'
                      ? 'Active'
                      : filter === 'PENDING_VERIFICATION'
                      ? 'Verification Queue'
                      : 'Completed'}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-xs font-mono text-text-tertiary">
              Showing {filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'}
            </span>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="p-8 rounded-xl border border-border-subtle bg-surface-card/30 text-center space-y-2">
              <Icons.CheckCircle className="w-8 h-8 text-text-tertiary mx-auto opacity-40" />
              <h3 className="text-sm font-semibold text-text-primary">No tasks in this category</h3>
              <p className="text-xs text-text-secondary max-w-sm mx-auto">
                No tasks currently match the selected filter. Tasks assigned by your manager will appear here.
              </p>
            </div>
          ) : (
            <div className="border border-border-subtle rounded-xl overflow-hidden bg-surface-card/30">
              <div className="overflow-x-auto">
                <table className="w-full text-left operational-table">
                  <thead className="bg-surface-elevated/70 border-b border-border-subtle text-text-secondary font-mono">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Priority</th>
                      <th className="py-3 px-4 font-semibold">Task Details</th>
                      <th className="py-3 px-4 font-semibold">Client</th>
                      <th className="py-3 px-4 font-semibold">Due &amp; SLA</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Assigned By</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {filteredTasks.map((t) => {
                      const isOverdue =
                        t.status !== 'COMPLETED' &&
                        t.status !== 'CANCELLED' &&
                        new Date(t.currentDueDate).getTime() < Date.now();
                      const dueDateFormatted = new Date(t.currentDueDate).toLocaleDateString();

                      return (
                        <tr key={t.id} className="hover:bg-surface-elevated/30 transition-colors">
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                                t.priority === 'P1'
                                  ? 'bg-status-error/20 text-status-error border border-status-error/40'
                                  : t.priority === 'P2'
                                  ? 'bg-brand-primary/20 text-brand-primary border border-brand-primary/40'
                                  : 'bg-surface-elevated text-text-secondary border border-border-subtle'
                              }`}
                            >
                              {t.priority}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 min-w-[240px]">
                            <div className="font-semibold text-text-primary text-sm">{t.title}</div>
                            {t.description && (
                              <p className="text-text-secondary text-xs mt-0.5 line-clamp-1">{t.description}</p>
                            )}
                            {t.makerNotes && (
                              <div className="text-xs font-mono text-brand-primary mt-1 bg-brand-primary/10 p-1.5 rounded border border-brand-primary/20">
                                <strong>Your notes:</strong> {t.makerNotes}
                              </div>
                            )}
                            {t.checkerNotes && (
                              <div className="text-xs font-mono text-status-info mt-1 bg-status-info/10 p-1.5 rounded border border-status-info/20">
                                <strong>Manager remarks:</strong> {t.checkerNotes}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap text-text-secondary text-xs sm:text-sm">
                            {t.clientCompany || '—'}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs">
                            <span className={isOverdue ? 'text-status-error font-bold' : 'text-text-primary'}>
                              {dueDateFormatted}
                            </span>
                            {isOverdue && (
                              <span className="block text-xs text-status-error font-semibold uppercase">
                                Overdue
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                                t.status === 'COMPLETED'
                                  ? 'bg-status-success/20 text-status-success'
                                  : t.status === 'PENDING_VERIFICATION'
                                  ? 'bg-purple-400/20 text-purple-300'
                                  : t.status === 'IN_PROGRESS'
                                  ? 'bg-brand-primary/20 text-brand-primary'
                                  : 'bg-surface-elevated text-text-secondary'
                              }`}
                            >
                              {t.status.replace('_', ' ')}
                            </span>
                            {t.status === 'PENDING_VERIFICATION' && (
                              <span className="block text-xs text-text-tertiary mt-0.5">
                                Awaiting Mgr Sign-off
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap text-text-secondary text-xs">
                            {t.assignedByName || 'Manager'}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap text-right space-x-1.5">
                            {t.status === 'TODO' && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleStartTask(t.id)}
                                disabled={submittingAction}
                              >
                                Start Task
                              </Button>
                            )}

                            {t.status === 'IN_PROGRESS' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => setVerifyModalTask(t)}
                                  disabled={submittingAction}
                                >
                                  Submit Evidence
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setDelayModalTask(t)}
                                  disabled={submittingAction}
                                >
                                  Request Delay
                                </Button>
                              </>
                            )}

                            {t.status === 'PENDING_VERIFICATION' && (
                              <span className="text-xs font-mono text-purple-300 bg-purple-400/10 px-2.5 py-1 rounded border border-purple-400/30">
                                In Review
                              </span>
                            )}

                            {t.status === 'COMPLETED' && (
                              <span className="text-xs font-mono text-status-success flex items-center justify-end gap-1 font-semibold">
                                <Icons.CheckCircle className="w-3.5 h-3.5" />
                                Verified
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. Section B: Clients & Engagements */}
      {activeSection === 'clients' && (
        <div className="space-y-6">
          {/* Assigned Accounts Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary font-mono flex items-center gap-2">
              <Icons.Users className="w-4 h-4 text-brand-primary" />
              Assigned Corporate Accounts ({data.clients.length})
            </h3>

            {data.clients.length === 0 ? (
              <div className="p-6 rounded-xl border border-border-subtle bg-surface-card/30 text-center">
                <p className="text-xs text-text-secondary">No client accounts currently assigned to you.</p>
              </div>
            ) : (
              <div className="border border-border-subtle rounded-xl overflow-hidden bg-surface-card/30">
                <table className="w-full text-left operational-table">
                  <thead className="bg-surface-elevated/70 border-b border-border-subtle text-text-secondary font-mono">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Company Name</th>
                      <th className="py-3 px-4 font-semibold">Primary Contact</th>
                      <th className="py-3 px-4 font-semibold">Direct Email</th>
                      <th className="py-3 px-4 font-semibold">Phone</th>
                      <th className="py-3 px-4 font-semibold">Account Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {data.clients.map((c) => (
                      <tr key={c.id} className="hover:bg-surface-elevated/30">
                        <td className="py-3 px-4 font-semibold text-text-primary text-xs sm:text-sm">{c.companyName}</td>
                        <td className="py-3 px-4 text-text-secondary text-xs">{c.name}</td>
                        <td className="py-3 px-4 font-mono text-text-secondary text-xs">{c.email || '—'}</td>
                        <td className="py-3 px-4 font-mono text-text-secondary text-xs">{c.phone || '—'}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-status-success/20 text-status-success">
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Follow-ups & Meetings Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Follow-ups */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary font-mono flex items-center gap-2">
                <Icons.Clock className="w-4 h-4 text-brand-primary" />
                Scheduled Follow-ups ({data.followUps.length})
              </h3>
              <div className="space-y-2">
                {data.followUps.map((f) => (
                  <div
                    key={f.id}
                    className="p-3.5 rounded-xl border border-border-subtle bg-surface-card/40 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-brand-primary/20 text-brand-primary">
                          {f.type}
                        </span>
                        <strong className="text-xs sm:text-sm text-text-primary">{f.clientCompany}</strong>
                      </div>
                      <p className="text-xs text-text-secondary mt-1 font-detail">{f.nextAction || f.notes || 'Routine follow-up'}</p>
                      <div className="text-xs font-mono text-text-tertiary mt-1">
                        Scheduled: {new Date(f.date).toLocaleDateString()}
                      </div>
                    </div>
                    {f.status !== 'COMPLETED' ? (
                      <Button size="sm" variant="secondary" onClick={() => setActiveFollowUp(f)}>
                        Update Outcome
                      </Button>
                    ) : (
                      <span className="text-xs font-mono text-status-success bg-status-success/15 px-2 py-1 rounded font-semibold">
                        COMPLETED
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Meetings */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary font-mono flex items-center gap-2">
                <Icons.CheckSquare className="w-4 h-4 text-purple-400" />
                Client Meetings ({data.meetings.length})
              </h3>
              <div className="space-y-2">
                {data.meetings.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-xl border border-border-subtle bg-surface-card/40 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-400/20 text-purple-300">
                          {m.status}
                        </span>
                        <strong className="text-xs sm:text-sm text-text-primary">{m.title}</strong>
                      </div>
                      <p className="text-xs text-text-secondary mt-1 font-detail">{m.clientCompany}</p>
                      <div className="text-xs font-mono text-text-tertiary mt-1">
                        Time: {new Date(m.scheduledAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Section C: Opportunities Pipeline */}
      {activeSection === 'pipeline' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary font-mono flex items-center gap-2">
              <Icons.Box className="w-4 h-4 text-brand-primary" />
              Active Opportunities &amp; Conversions ({data.opportunities.length})
            </h3>
            <span className="text-xs font-mono text-brand-primary font-bold">
              Pipeline Total: ₹
              {data.opportunities.reduce((acc, curr) => acc + (curr.estimatedValue || 0), 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="border border-border-subtle rounded-xl overflow-hidden bg-surface-card/30">
            <table className="w-full text-left operational-table">
              <thead className="bg-surface-elevated/70 border-b border-border-subtle text-text-secondary font-mono">
                <tr>
                  <th className="py-3 px-4 font-semibold">Opportunity Title</th>
                  <th className="py-3 px-4 font-semibold">Client</th>
                  <th className="py-3 px-4 font-semibold">Stage</th>
                  <th className="py-3 px-4 font-semibold">Estimated Value</th>
                  <th className="py-3 px-4 font-semibold">Probability</th>
                  <th className="py-3 px-4 font-semibold">Next Step</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {data.opportunities.map((opp) => (
                  <tr key={opp.id} className="hover:bg-surface-elevated/30">
                    <td className="py-3 px-4 font-semibold text-text-primary text-xs sm:text-sm">{opp.title}</td>
                    <td className="py-3 px-4 text-text-secondary text-xs">{opp.clientCompany}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-brand-primary/20 text-brand-primary border border-brand-primary/30">
                        {opp.stage}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-text-primary text-xs sm:text-sm">
                      ₹{opp.estimatedValue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-mono text-text-secondary text-xs">{opp.probability || 50}%</td>
                    <td className="py-3 px-4 text-text-muted text-xs font-detail">{opp.nextAction || 'Ongoing evaluation'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. Section D: Daily Work Report */}
      {activeSection === 'reports' && (
        <div className="space-y-6">
          {/* Today's Report Status Banner */}
          {data.todayReport?.status === 'REJECTED' && (
            <Alert variant="error" title="Daily Report Returned for Revision">
              <strong>Manager Rejection Reason:</strong> {data.todayReport.rejectionReason}
              <p className="mt-1 text-xs">Please correct the entries below and resubmit for approval.</p>
            </Alert>
          )}

          {data.todayReport?.status === 'APPROVED' && (
            <Alert variant="success" title="Today's Report Approved">
              Your daily work report has been verified and approved by management.
            </Alert>
          )}

          {data.todayReport?.status === 'SUBMITTED' && (
            <Alert variant="info" title="Report Submitted for Manager Review">
              Your daily work report for today is queued for manager verification.
            </Alert>
          )}

          {/* Report Entry Form */}
          <div className="p-6 rounded-2xl border border-border-subtle bg-surface-card/40 space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <h3 className="text-sm font-bold text-text-primary">
                  Daily Work Report Form ({new Date().toISOString().split('T')[0]})
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Record your calls, client meetings, deals progression, and completed milestones.
                </p>
              </div>
              <Badge variant={data.todayReport?.status === 'APPROVED' ? 'success' : 'gold'}>
                {data.todayReport?.status || 'NEW REPORT'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-mono text-text-secondary block mb-1">Total Calls Conducted</label>
                <input
                  type="number"
                  min="0"
                  value={reportForm.callsCount}
                  onChange={(e) => setReportForm({ ...reportForm, callsCount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-text-primary font-mono text-xs focus:outline-none focus:border-brand-primary"
                  disabled={data.todayReport?.status === 'APPROVED'}
                />
              </div>

              <div>
                <label className="text-xs font-mono text-text-secondary block mb-1">Meetings Held</label>
                <input
                  type="number"
                  min="0"
                  value={reportForm.meetingsCount}
                  onChange={(e) => setReportForm({ ...reportForm, meetingsCount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-text-primary font-mono text-xs focus:outline-none focus:border-brand-primary"
                  disabled={data.todayReport?.status === 'APPROVED'}
                />
              </div>

              <div>
                <label className="text-xs font-mono text-text-secondary block mb-1">Follow-ups Executed</label>
                <input
                  type="number"
                  min="0"
                  value={reportForm.followUpsCount}
                  onChange={(e) => setReportForm({ ...reportForm, followUpsCount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-text-primary font-mono text-xs focus:outline-none focus:border-brand-primary"
                  disabled={data.todayReport?.status === 'APPROVED'}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono text-text-secondary block mb-1">Completed Tasks Summary</label>
                <textarea
                  rows={3}
                  value={reportForm.completedTasksSummary}
                  onChange={(e) => setReportForm({ ...reportForm, completedTasksSummary: e.target.value })}
                  placeholder="Summarize milestones achieved today..."
                  className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-text-primary text-xs focus:outline-none focus:border-brand-primary"
                  disabled={data.todayReport?.status === 'APPROVED'}
                />
              </div>

              <div>
                <label className="text-xs font-mono text-text-secondary block mb-1">Deals / Pipeline Movement</label>
                <textarea
                  rows={3}
                  value={reportForm.dealsSummary}
                  onChange={(e) => setReportForm({ ...reportForm, dealsSummary: e.target.value })}
                  placeholder="Notes on client proposals, conversions, or quotes..."
                  className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-text-primary text-xs focus:outline-none focus:border-brand-primary"
                  disabled={data.todayReport?.status === 'APPROVED'}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-text-secondary block mb-1">Additional Notes / Blockers</label>
              <textarea
                rows={2}
                value={reportForm.notes}
                onChange={(e) => setReportForm({ ...reportForm, notes: e.target.value })}
                placeholder="Any operational challenges, pending dependencies, or support needed..."
                className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-text-primary text-xs focus:outline-none focus:border-brand-primary"
                disabled={data.todayReport?.status === 'APPROVED'}
              />
            </div>

            {data.todayReport?.status !== 'APPROVED' && (
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSaveReport('DRAFT')}
                  disabled={submittingAction}
                >
                  Save as Draft
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleSaveReport('SUBMITTED')}
                  disabled={submittingAction}
                >
                  Submit for Manager Review
                </Button>
              </div>
            )}
          </div>

          {/* Historical Reports */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary font-mono">
              Report History ({data.dailyReports.length})
            </h3>
            <div className="border border-border-subtle rounded-xl overflow-hidden bg-surface-card/30">
              <table className="w-full text-left operational-table">
                <thead className="bg-surface-elevated/70 border-b border-border-subtle text-text-secondary font-mono">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Report Date</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Metrics</th>
                    <th className="py-3 px-4 font-semibold">Deals / Summary</th>
                    <th className="py-3 px-4 font-semibold">Manager Reviewer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {data.dailyReports.map((r) => (
                    <tr key={r.id} className="hover:bg-surface-elevated/30">
                      <td className="py-3 px-4 font-mono font-bold text-text-primary text-xs sm:text-sm">{r.reportDate}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                            r.status === 'APPROVED'
                              ? 'bg-status-success/20 text-status-success'
                              : r.status === 'REJECTED'
                              ? 'bg-status-error/20 text-status-error'
                              : 'bg-brand-primary/20 text-brand-primary'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-text-secondary">
                        {r.callsCount} calls • {r.meetingsCount} mtgs • {r.followUpsCount} flws
                      </td>
                      <td className="py-3 px-4 text-text-muted">{r.completedTasksSummary || r.dealsSummary || '—'}</td>
                      <td className="py-3 px-4 text-text-secondary font-mono">{r.reviewerName || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 9. Section E: Profile */}
      {activeSection === 'profile' && (
        <div className="glass-panel p-6 rounded-2xl border border-border-subtle bg-surface-card/40 space-y-6">
          <div className="border-b border-border-subtle pb-4">
            <h3 className="text-base font-bold text-text-primary">Employee Identity &amp; Organization Record</h3>
            <p className="text-xs text-text-secondary mt-0.5">Authoritative employment profile from company registry.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
            <div>
              <span className="text-text-tertiary block uppercase font-mono text-xs">Full Name</span>
              <div className="font-semibold text-text-primary text-sm mt-0.5">{data.employee.fullName}</div>
            </div>

            <div>
              <span className="text-text-tertiary block uppercase font-mono text-xs">Employee ID</span>
              <div className="font-mono font-bold text-brand-primary text-sm mt-0.5">{data.employee.employeeId}</div>
            </div>

            <div>
              <span className="text-text-tertiary block uppercase font-mono text-xs">Work Email</span>
              <div className="font-mono text-text-primary text-xs sm:text-sm mt-0.5">{data.employee.email}</div>
            </div>

            <div>
              <span className="text-text-tertiary block uppercase font-mono text-xs">Department</span>
              <div className="text-text-primary font-medium text-xs sm:text-sm mt-0.5">{data.employee.departmentName || '—'}</div>
            </div>

            <div>
              <span className="text-text-tertiary block uppercase font-mono text-xs">Designation</span>
              <div className="text-text-primary font-medium text-xs sm:text-sm mt-0.5">{data.employee.designationName || '—'}</div>
            </div>

            <div>
              <span className="text-text-tertiary block uppercase font-mono text-xs">Reporting Manager</span>
              <div className="text-text-primary font-medium text-xs sm:text-sm mt-0.5">{data.employee.managerName || 'None assigned'}</div>
            </div>

            <div>
              <span className="text-text-tertiary block uppercase font-mono text-xs">Contact Mobile</span>
              <div className="font-mono text-text-secondary text-xs sm:text-sm mt-0.5">{data.employee.mobile}</div>
            </div>

            <div>
              <span className="text-text-tertiary block uppercase font-mono text-xs">Highest Education</span>
              <div className="text-text-secondary text-xs mt-0.5 font-detail">{data.employee.education || '—'}</div>
            </div>

            <div>
              <span className="text-text-tertiary block uppercase font-mono text-xs">Prior Experience</span>
              <div className="text-text-secondary text-xs mt-0.5 font-detail">{data.employee.priorExperience || '—'}</div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Submit Evidence & Mark PENDING_VERIFICATION */}
      {verifyModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-white/10 bg-surface-card shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 className="text-base font-bold text-text-primary">Submit Task Evidence</h3>
              <button
                onClick={() => setVerifyModalTask(null)}
                className="text-text-muted hover:text-text-primary cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-lg bg-surface-elevated/50 border border-border-subtle">
              <span className="text-xs font-mono uppercase text-text-tertiary">Task Title</span>
              <div className="text-sm font-semibold text-text-primary mt-0.5">{verifyModalTask.title}</div>
            </div>

            <form onSubmit={handleSubmitEvidence} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-text-secondary block mb-1">Evidence Type</label>
                <select
                  value={evidenceType}
                  onChange={(e: any) => setEvidenceType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-text-primary text-xs sm:text-sm"
                >
                  <option value="LINK">Document / External Link</option>
                  <option value="DOCUMENT">Internal Reference Doc</option>
                  <option value="EMAIL">Client Email Confirmation</option>
                  <option value="NOTE">Detailed Completion Notes</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-text-secondary block mb-1">
                  Evidence URL / Reference Link
                </label>
                <input
                  type="text"
                  placeholder="https://docs.pinnacle.internal/..."
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-text-primary text-xs sm:text-sm focus:outline-none focus:border-brand-primary font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-text-secondary block mb-1">
                  Maker Notes &amp; Verification Context
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain what was completed and highlights for the manager verification..."
                  value={makerNotes}
                  onChange={(e) => setMakerNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-text-primary text-xs sm:text-sm focus:outline-none focus:border-brand-primary font-detail"
                />
              </div>

              <div className="p-3 rounded-lg bg-brand-primary/10 border border-brand-primary/30 text-xs text-text-secondary">
                <strong className="text-brand-primary">Maker-Checker Policy:</strong> This task will be placed in the
                manager review queue. It will only become completed once approved by management.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setVerifyModalTask(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={submittingAction}>
                  {submittingAction ? 'Submitting...' : 'Submit for Verification'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Request Delay */}
      {delayModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-white/10 bg-surface-card shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 className="text-base font-bold text-text-primary">Request Task SLA Delay</h3>
              <button
                onClick={() => setDelayModalTask(null)}
                className="text-text-muted hover:text-text-primary cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-lg bg-surface-elevated/50 border border-border-subtle text-xs">
              <div className="text-sm font-semibold text-text-primary">{delayModalTask.title}</div>
              <div className="text-text-tertiary mt-1 font-mono">
                Current Due: {new Date(delayModalTask.currentDueDate).toLocaleDateString()}
              </div>
            </div>

            <form onSubmit={handleSubmitDelay} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-text-secondary block mb-1">Requested Extension</label>
                <select
                  value={delayDays}
                  onChange={(e) => setDelayDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-text-primary text-xs"
                >
                  <option value={1}>+1 Business Day</option>
                  <option value={2}>+2 Business Days</option>
                  <option value={3}>+3 Business Days</option>
                  <option value={5}>+5 Business Days (1 Week)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-text-secondary block mb-1">Reason for Delay</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why the deadline cannot be met on the current timeline..."
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-text-primary text-xs focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-text-secondary block mb-1">Business Impact Assessment</label>
                <input
                  type="text"
                  placeholder="Any downstream milestones affected..."
                  value={delayImpact}
                  onChange={(e) => setDelayImpact(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-text-primary text-xs focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setDelayModalTask(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={submittingAction}>
                  {submittingAction ? 'Submitting...' : 'Submit Delay Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Update Follow-up Outcome */}
      {activeFollowUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-white/10 bg-surface-card shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 className="text-base font-bold text-text-primary">Record Follow-up Outcome</h3>
              <button
                onClick={() => setActiveFollowUp(null)}
                className="text-text-muted hover:text-text-primary cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-lg bg-surface-elevated/50 border border-border-subtle text-xs">
              <strong className="text-text-primary">{activeFollowUp.clientCompany}</strong>
              <div className="text-text-tertiary mt-1">Contact: {activeFollowUp.clientName}</div>
            </div>

            <form onSubmit={handleSaveFollowUpOutcome} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-text-secondary block mb-1">Outcome &amp; Key Takeaways</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Summarize client response, agreement, or decision..."
                  value={followUpOutcome}
                  onChange={(e) => setFollowUpOutcome(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-text-primary text-xs focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-text-secondary block mb-1">Next Action Item</label>
                <input
                  type="text"
                  placeholder="e.g., Send revised invoice, schedule follow-up demo..."
                  value={followUpNextAction}
                  onChange={(e) => setFollowUpNextAction(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-border-subtle text-text-primary text-xs focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setActiveFollowUp(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={submittingAction}>
                  {submittingAction ? 'Saving...' : 'Mark Completed'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
