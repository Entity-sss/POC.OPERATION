import React, { useState, useEffect } from 'react';
import { Icons } from '../ui/Icons';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { SlaBadge } from '../ui/SlaBadge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Alert } from '../ui/Alert';

interface ExecutiveWorkspaceProps {
  user: {
    id: string;
    employeeId: string;
    fullName: string;
    email: string;
    isActive: boolean;
    roles?: any;
  };
  permissions?: string[];
  onNavigateTab?: (hash: string) => void;
}

interface ExecutiveData {
  revenueModel: {
    annualTarget: number;
    actualAchieved: number;
    achievementPercentage: number;
    totalBilled: number;
    totalOutstanding: number;
    pods: Array<{
      id: string;
      name: string;
      sharePercentage: number;
      targetAmount: number;
      achievedAmount: number;
      achievementPercentage: number;
    }>;
  };
  pipeline: {
    totalActiveValue: number;
    stages: {
      OPPORTUNITY: { count: number; value: number };
      PROPOSAL: { count: number; value: number };
      CONVERSION: { count: number; value: number };
      WON: { count: number; value: number };
      LOST: { count: number; value: number };
    };
  };
  operationsRisk: {
    totalTasks: number;
    activeTasks: number;
    overdueTasksCount: number;
    pendingVerificationCount: number;
    pendingDelaysCount: number;
    pendingReportsCount: number;
  };
  projectsOverview: {
    totalProjects: number;
    stages: {
      FABRICATION: number;
      DISPATCH: number;
      SETUP: number;
      LIVE: number;
      DISMANTLE: number;
      CLOSURE_PACK: number;
      COMPLETED: number;
    };
  };
  workforce: {
    totalEmployees: number;
    activeEmployees: number;
    departmentsCount: number;
  };
  recentLogs: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    description: string;
    createdAt: number;
    actorName: string | null;
  }>;
}

function formatCurrency(amount: number): string {
  if (amount >= 10_000_000) {
    return `₹${(amount / 10_000_000).toFixed(2)} Cr`;
  }
  if (amount >= 100_000) {
    return `₹${(amount / 100_000).toFixed(2)} L`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

export const ExecutiveWorkspace: React.FC<ExecutiveWorkspaceProps> = ({
  user,
  onNavigateTab,
}) => {
  const [data, setData] = useState<ExecutiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/executive/overview');
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error((errJson as any)?.error || 'Failed to load executive center data');
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
        <p className="text-xs text-text-secondary font-mono">Loading Executive Command Center from D1...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <Alert variant="error" title="Failed to Load Executive Data">
        {error}
        <div className="mt-3">
          <Button variant="secondary" size="sm" onClick={loadData}>Retry</Button>
        </div>
      </Alert>
    );
  }

  const rm = data?.revenueModel;
  const pl = data?.pipeline;
  const ops = data?.operationsRisk;
  const prj = data?.projectsOverview;

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="gold" size="sm">Executive Workspace</Badge>
            <span className="text-xs text-text-tertiary font-mono">{user.fullName} ({user.employeeId}) • CEO / BUSINESS HEAD</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Executive Command & Revenue Architecture
          </h1>
          <p className="text-xs text-text-secondary mt-1 font-detail">
            Company-wide visibility into revenue milestones, deal velocity, operational risk radar, and project delivery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={loadData} className="gap-2">
            <Icons.RotateCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
          <SlaBadge status="ON_TRACK" score={100} label="Governance" />
        </div>
      </div>

      {/* REVENUE STRUCTURE: Distinction between BUSINESS TARGET and ACTUAL ACHIEVEMENT */}
      <div className="glass-panel p-6 rounded-2xl border border-brand-primary/30 space-y-5 shadow-gold-glow">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border-subtle pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider font-mono text-brand-primary">
                Annual Company Revenue Architecture
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded bg-brand-primary/20 text-brand-primary font-mono font-bold">
                FY 2026
              </span>
            </div>
            <h2 className="text-lg font-bold text-text-primary mt-1">
              Business Target (₹4.00 Crore) vs. Actual Cash Collected
            </h2>
          </div>
          <div className="text-right">
            <div className="text-xs text-text-secondary font-detail">Target Realization</div>
            <div className="text-2xl font-bold font-mono text-brand-primary">
              {rm?.achievementPercentage ?? 0}%
            </div>
          </div>
        </div>

        {/* Big Numbers Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-surface-card border border-border-subtle space-y-1">
            <div className="text-xs uppercase tracking-wider font-mono font-semibold text-text-tertiary">Annual Business Target</div>
            <div className="text-2xl font-bold font-mono text-text-primary">{formatCurrency(rm?.annualTarget ?? 40000000)}</div>
            <div className="text-xs text-text-secondary font-detail">Planned commercial milestone</div>
          </div>

          <div className="p-4 rounded-xl bg-surface-card border border-brand-primary/40 space-y-1">
            <div className="text-xs uppercase tracking-wider font-mono font-semibold text-brand-primary">Actual Cash Collected</div>
            <div className="text-2xl font-bold font-mono text-brand-primary">{formatCurrency(rm?.actualAchieved ?? 0)}</div>
            <div className="text-xs text-text-secondary font-detail">D1-verified payments deposited</div>
          </div>

          <div className="p-4 rounded-xl bg-surface-card border border-border-subtle space-y-1">
            <div className="text-xs uppercase tracking-wider font-mono font-semibold text-text-tertiary">Total Invoiced / Outstanding</div>
            <div className="text-2xl font-bold font-mono text-text-primary">{formatCurrency(rm?.totalOutstanding ?? 0)}</div>
            <div className="text-xs text-text-secondary font-detail">Total billed: {formatCurrency(rm?.totalBilled ?? 0)}</div>
          </div>
        </div>

        {/* Revenue Pods Breakdown */}
        <div className="space-y-3 pt-2">
          <div className="text-xs font-bold uppercase tracking-wider font-mono text-text-secondary">
            Revenue Pod Contribution Breakdown
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rm?.pods.map((pod) => (
              <div
                key={pod.id}
                onClick={() => onNavigateTab && onNavigateTab('#opportunities')}
                className="p-4 rounded-xl bg-surface-base/80 border border-border-subtle space-y-2 cursor-pointer transition-all hover:border-brand-primary/40"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-text-primary font-detail">{pod.name}</span>
                  <span className="font-mono text-brand-primary text-xs font-semibold">{pod.sharePercentage}% Target Share</span>
                </div>
                <div className="flex items-baseline justify-between font-mono text-xs">
                  <span className="text-text-secondary">Target: {formatCurrency(pod.targetAmount)}</span>
                  <span className="text-status-success font-semibold">Achieved: {formatCurrency(pod.achievedAmount)}</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-surface-subtle h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-brand-primary h-full transition-all duration-500"
                    style={{ width: `${Math.min(100, pod.achievementPercentage)}%` }}
                  />
                </div>
                <div className="text-right text-xs font-mono text-text-tertiary">
                  {pod.achievementPercentage}% of pod goal
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Operational Risk Radar & Pipeline Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Deal Pipeline Conversion */}
        <div className="lg:col-span-6 glass-panel p-5 rounded-2xl border border-border-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-text-primary">
                Commercial Pipeline Funnel
              </h3>
              <p className="text-xs text-text-secondary font-detail">
                Active opportunities across conversion lifecycle stages.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-brand-primary">
              Active: {formatCurrency(pl?.totalActiveValue ?? 0)}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-card border border-border-subtle">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <div>
                  <div className="text-sm font-semibold text-text-primary">1. Initial Opportunity</div>
                  <div className="text-xs text-text-tertiary font-detail">Discovery &amp; account qualification</div>
                </div>
              </div>
              <div className="text-right font-mono">
                <div className="text-sm font-bold text-text-primary">{formatCurrency(pl?.stages.OPPORTUNITY.value ?? 0)}</div>
                <div className="text-xs text-text-secondary">{pl?.stages.OPPORTUNITY.count ?? 0} deals</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-card border border-border-subtle">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <div>
                  <div className="text-sm font-semibold text-text-primary">2. Formal Proposal</div>
                  <div className="text-xs text-text-tertiary font-detail">Commercial quote &amp; SLA submitted</div>
                </div>
              </div>
              <div className="text-right font-mono">
                <div className="text-sm font-bold text-text-primary">{formatCurrency(pl?.stages.PROPOSAL.value ?? 0)}</div>
                <div className="text-xs text-text-secondary">{pl?.stages.PROPOSAL.count ?? 0} deals</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-card border border-border-subtle">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <div>
                  <div className="text-sm font-semibold text-text-primary">3. Final Conversion</div>
                  <div className="text-xs text-text-tertiary font-detail">Contract negotiations &amp; sign-off</div>
                </div>
              </div>
              <div className="text-right font-mono">
                <div className="text-sm font-bold text-text-primary">{formatCurrency(pl?.stages.CONVERSION.value ?? 0)}</div>
                <div className="text-xs text-text-secondary">{pl?.stages.CONVERSION.count ?? 0} deals</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-card border border-status-success/30">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-status-success" />
                <div>
                  <div className="text-sm font-semibold text-status-success">4. Closed Won</div>
                  <div className="text-xs text-text-tertiary font-detail">Converted to active delivery projects</div>
                </div>
              </div>
              <div className="text-right font-mono">
                <div className="text-sm font-bold text-status-success">{formatCurrency(pl?.stages.WON.value ?? 0)}</div>
                <div className="text-xs text-text-secondary">{pl?.stages.WON.count ?? 0} deals</div>
              </div>
            </div>
          </div>
        </div>

        {/* Operational Risk Radar */}
        <div className="lg:col-span-6 glass-panel p-5 rounded-2xl border border-border-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-text-primary">
                Operational Risk & Escalation Radar
              </h3>
              <p className="text-xs text-text-secondary font-detail">
                Live compliance flags, SLA breaches, and items awaiting checker action.
              </p>
            </div>
            <Badge variant={ops && ops.overdueTasksCount > 0 ? 'error' : 'success'} size="sm">
              {ops && ops.overdueTasksCount > 0 ? 'ATTENTION REQUIRED' : 'ON TRACK'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-surface-card border border-border-subtle space-y-1">
              <div className="text-xs font-mono uppercase font-semibold tracking-wider text-text-tertiary">Active Deliverables</div>
              <div className="text-xl font-bold font-mono text-text-primary">{ops?.activeTasks ?? 0}</div>
              <div className="text-xs text-text-secondary font-detail">Tasks in execution</div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-card border border-status-error/30 space-y-1">
              <div className="text-xs font-mono uppercase font-semibold tracking-wider text-status-error">Overdue Deliverables</div>
              <div className="text-xl font-bold font-mono text-status-error">{ops?.overdueTasksCount ?? 0}</div>
              <div className="text-xs text-text-secondary font-detail">Breached SLA deadline</div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-card border border-status-warning/30 space-y-1">
              <div className="text-xs font-mono uppercase font-semibold tracking-wider text-status-warning">Pending Verification</div>
              <div className="text-xl font-bold font-mono text-status-warning">{ops?.pendingVerificationCount ?? 0}</div>
              <div className="text-xs text-text-secondary font-detail">Awaiting maker-checker review</div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-card border border-border-subtle space-y-1">
              <div className="text-xs font-mono uppercase font-semibold tracking-wider text-text-tertiary">Pending SLA Delays</div>
              <div className="text-xl font-bold font-mono text-text-primary">{ops?.pendingDelaysCount ?? 0}</div>
              <div className="text-xs text-text-secondary font-detail">Extension requests pending</div>
            </div>
          </div>

          {/* Project Lifecycle Pulse */}
          <div className="pt-2 border-t border-border-subtle">
            <div className="text-xs font-bold uppercase tracking-wider font-mono text-text-secondary mb-2">
              Operations &amp; Event Delivery Pulse
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-surface-card border border-border-subtle">
                <div className="text-sm font-bold font-mono text-text-primary">{prj?.stages.FABRICATION ?? 0}</div>
                <div className="text-xs text-text-tertiary uppercase font-medium">Fabrication</div>
              </div>
              <div className="p-2 rounded bg-surface-card border border-border-subtle">
                <div className="text-sm font-bold font-mono text-text-primary">{prj?.stages.DISPATCH ?? 0}</div>
                <div className="text-xs text-text-tertiary uppercase font-medium">Dispatch</div>
              </div>
              <div className="p-2 rounded bg-surface-card border border-border-subtle">
                <div className="text-sm font-bold font-mono text-text-primary">{prj?.stages.SETUP ?? 0}</div>
                <div className="text-xs text-text-tertiary uppercase font-medium">Setup</div>
              </div>
              <div className="p-2 rounded bg-surface-card border border-status-success/30">
                <div className="text-sm font-bold font-mono text-status-success">{prj?.stages.LIVE ?? 0}</div>
                <div className="text-xs text-text-tertiary uppercase font-medium">Live</div>
              </div>
              <div className="p-2 rounded bg-surface-card border border-border-subtle">
                <div className="text-sm font-bold font-mono text-text-primary">{prj?.stages.DISMANTLE ?? 0}</div>
                <div className="text-xs text-text-tertiary uppercase font-medium">Dismantle</div>
              </div>
              <div className="p-2 rounded bg-surface-card border border-border-subtle">
                <div className="text-sm font-bold font-mono text-brand-primary">{prj?.stages.CLOSURE_PACK ?? 0}</div>
                <div className="text-xs text-text-tertiary uppercase font-medium">Closure</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Governance & Real-Time Audit Stream */}
      <div className="glass-panel p-5 rounded-2xl border border-border-subtle space-y-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-text-primary">
              Company-Level Governance Audit Stream
            </h3>
            <p className="text-xs text-text-secondary font-detail">
              Immutable audit events across workforce, contracts, task verification, and financial bookings.
            </p>
          </div>
          <Badge variant="info" size="sm">Live Stream</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left operational-table">
            <thead>
              <tr className="border-b border-border-subtle text-text-tertiary">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Actor</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Target Entity</th>
                <th className="py-2.5 px-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/40">
              {data?.recentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-hover/40 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-text-secondary text-xs">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-text-primary text-xs">
                    {log.actorName || 'System'}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-subtle border border-border-subtle text-text-secondary">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-xs text-text-secondary">
                    {log.entityType}
                  </td>
                  <td className="py-2.5 px-3 text-text-secondary font-detail text-xs">
                    {log.description}
                  </td>
                </tr>
              ))}
              {(!data?.recentLogs || data.recentLogs.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-tertiary font-detail">
                    No recent audit activity recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
