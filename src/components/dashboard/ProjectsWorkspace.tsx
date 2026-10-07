import React, { useState, useEffect } from 'react';
import { Icons } from '../ui/Icons';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Alert } from '../ui/Alert';

interface ProjectsWorkspaceProps {
  user: any;
  permissions?: string[];
}

interface Project {
  id: string;
  projectCode: string;
  title: string;
  status: 'FABRICATION' | 'DISPATCH' | 'SETUP' | 'LIVE' | 'DISMANTLE' | 'CLOSURE_PACK' | 'COMPLETED' | 'CANCELLED';
  budget: number;
  startDate: number | null;
  targetDate: number | null;
  clientName: string | null;
  clientCompany: string | null;
  ownerName: string | null;
  vendorName: string | null;
  milestones: Array<{
    id: string;
    title: string;
    stage: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  }>;
  progress: number;
}

export const ProjectsWorkspace: React.FC<ProjectsWorkspaceProps> = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    budget: '',
    targetDate: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/projects');
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error((errJson as any)?.error || 'Failed to load projects');
      }
      const json: any = await res.json();
      setProjects(json.projects || []);
    } catch (err: unknown) {
      setError((err as any)?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreate = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!createForm.title.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: createForm.title.trim(),
          budget: Number(createForm.budget) || 0,
          targetDate: createForm.targetDate ? new Date(createForm.targetDate).getTime() : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any)?.error || 'Failed to create project');
      }
      setShowCreateModal(false);
      setCreateForm({ title: '', budget: '', targetDate: '' });
      await loadProjects();
    } catch (err: unknown) {
      alert((err as any)?.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (projectId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any)?.error || 'Failed to update status');
      }
      await loadProjects();
    } catch (err: unknown) {
      alert((err as any)?.message || 'Failed to update status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'LIVE':
        return <Badge variant="success" size="sm">LIVE EVENT</Badge>;
      case 'COMPLETED':
        return <Badge variant="success" size="sm">COMPLETED</Badge>;
      case 'FABRICATION':
        return <Badge variant="warning" size="sm">FABRICATION</Badge>;
      case 'DISPATCH':
        return <Badge variant="info" size="sm">DISPATCH</Badge>;
      case 'SETUP':
        return <Badge variant="warning" size="sm">SETUP</Badge>;
      case 'DISMANTLE':
        return <Badge variant="info" size="sm">DISMANTLE</Badge>;
      case 'CLOSURE_PACK':
        return <Badge variant="gold" size="sm">CLOSURE PACK</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  if (loading && projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-xs text-text-secondary font-mono">Loading Projects & Execution Operations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="gold" size="sm">Delivery & Execution</Badge>
            <span className="text-xs text-text-tertiary font-mono">LIFECYCLE ENGINE</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Projects & Operations Workspace
          </h1>
          <p className="text-xs text-text-secondary mt-1 font-detail">
            Real operational tracking from fabrication to dispatch, site setup, live event, dismantle, and closure pack.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={loadProjects} className="gap-2">
            <Icons.RotateCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)} className="gap-2">
            <Icons.Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Error">
          {error}
        </Alert>
      )}

      {/* Projects Table */}
      <div className="glass-panel rounded-2xl border border-border-subtle overflow-hidden">
        <div className="p-4 border-b border-border-subtle flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider font-mono text-text-primary">
            Active Project Deployments ({projects.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left operational-table">
            <thead>
              <tr className="border-b border-border-subtle text-text-tertiary bg-surface-subtle/40 text-xs font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Project Code</th>
                <th className="py-2.5 px-3">Title & Client</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Milestones Progress</th>
                <th className="py-2.5 px-3">Vendor</th>
                <th className="py-2.5 px-3">Budget</th>
                <th className="py-2.5 px-3 text-right">Advance Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/40">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-surface-hover/40 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-brand-primary text-xs sm:text-sm">
                    {p.projectCode}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-text-primary text-xs sm:text-sm">{p.title}</div>
                    <div className="text-xs text-text-secondary font-detail mt-0.5">
                      {p.clientCompany || p.clientName || 'Direct Client'} • Owner: {p.ownerName || 'Unassigned'}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    {getStatusBadge(p.status)}
                  </td>
                  <td className="py-3 px-3 w-48">
                    <div className="flex items-center justify-between text-xs font-mono mb-1">
                      <span className="text-text-secondary font-semibold">{p.progress}%</span>
                      <span className="text-text-tertiary">{p.milestones.filter(m => m.status === 'COMPLETED').length}/{p.milestones.length}</span>
                    </div>
                    <div className="w-full bg-surface-subtle h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-brand-primary h-full transition-all duration-300"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-3 font-detail text-xs text-text-secondary">
                    {p.vendorName || 'In-House'}
                  </td>
                  <td className="py-3 px-3 font-mono text-xs sm:text-sm font-semibold text-text-primary">
                    ₹{p.budget.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <select
                      value={p.status}
                      onChange={(e) => handleUpdateStatus(p.id, e.target.value)}
                      aria-label="Advance Project Stage"
                      className="text-xs font-mono bg-surface-subtle border border-border-subtle rounded px-2.5 py-1 text-text-primary focus:outline-none focus:border-brand-primary"
                    >
                      <option value="FABRICATION">FABRICATION</option>
                      <option value="DISPATCH">DISPATCH</option>
                      <option value="SETUP">SETUP</option>
                      <option value="LIVE">LIVE</option>
                      <option value="DISMANTLE">DISMANTLE</option>
                      <option value="CLOSURE_PACK">CLOSURE PACK</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-text-tertiary font-detail">
                    No projects found. Click "New Project" to initiate an operational deployment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="proj-modal-title" className="bg-surface-card border border-border-default rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 id="proj-modal-title" className="text-sm font-bold uppercase tracking-wider font-mono text-text-primary">
                Create Operational Project
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-text-tertiary hover:text-text-primary p-1"
                aria-label="Close modal"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label htmlFor="proj-title" className="block text-xs font-semibold text-text-secondary mb-1">
                  Project Title *
                </label>
                <input
                  id="proj-title"
                  type="text"
                  required
                  placeholder="e.g. Apex Global Brand Launch - Dubai"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full text-xs bg-surface-subtle border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label htmlFor="proj-budget" className="block text-xs font-semibold text-text-secondary mb-1">
                  Project Budget (₹)
                </label>
                <input
                  id="proj-budget"
                  type="number"
                  placeholder="e.g. 500000"
                  value={createForm.budget}
                  onChange={(e) => setCreateForm({ ...createForm, budget: e.target.value })}
                  className="w-full text-xs font-mono bg-surface-subtle border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label htmlFor="proj-target" className="block text-xs font-semibold text-text-secondary mb-1">
                  Target Delivery Date
                </label>
                <input
                  id="proj-target"
                  type="date"
                  value={createForm.targetDate}
                  onChange={(e) => setCreateForm({ ...createForm, targetDate: e.target.value })}
                  className="w-full text-xs font-mono bg-surface-subtle border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Project'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
