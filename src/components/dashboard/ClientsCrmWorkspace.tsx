import React, { useState, useEffect } from 'react';
import { Icons } from '../ui/Icons';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Alert } from '../ui/Alert';

interface ClientsCrmWorkspaceProps {
  user: any;
  permissions?: string[];
  initialView?: 'clients' | 'pipeline';
}

interface ClientAccount {
  id: string;
  name: string;
  companyName: string;
  email: string | null;
  phone: string | null;
  status: 'ACTIVE' | 'LEAD' | 'INACTIVE';
  assignedEmployeeId: string | null;
  assignedEmployeeName: string | null;
  createdAt: number;
  followUps: Array<{
    id: string;
    type: string;
    status: string;
    date: number;
    outcome: string | null;
    nextAction: string | null;
  }>;
  meetings: Array<{
    id: string;
    title: string;
    status: string;
    scheduledAt: number;
    outcome: string | null;
  }>;
  opportunities: Array<{
    id: string;
    title: string;
    stage: string;
    estimatedValue: number;
    probability: number;
  }>;
  projects: Array<{
    id: string;
    projectCode: string;
    title: string;
    status: string;
    budget: number;
  }>;
}

export const ClientsCrmWorkspace: React.FC<ClientsCrmWorkspaceProps> = ({
  initialView = 'clients',
}) => {
  const [clients, setClients] = useState<ClientAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'clients' | 'pipeline'>(initialView);

  const [selectedClient, setSelectedClient] = useState<ClientAccount | null>(null);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    status: 'ACTIVE' as const,
  });
  const [submitting, setSubmitting] = useState(false);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/clients');
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error((errJson as any)?.error || 'Failed to load client CRM data');
      }
      const json: any = await res.json();
      setClients(json.clients || []);
    } catch (err: unknown) {
      setError((err as any)?.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleCreateClient = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name.trim() || !form.companyName.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any)?.error || 'Failed to add client');
      }
      setShowAddClientModal(false);
      setForm({ name: '', companyName: '', email: '', phone: '', status: 'ACTIVE' });
      await loadClients();
    } catch (err: unknown) {
      alert((err as any)?.message || 'Failed to add client');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-xs text-text-secondary font-mono">Loading Client Accounts & CRM Pipeline...</p>
      </div>
    );
  }

  // Aggregate all opportunities for pipeline tab
  const allOpportunities = clients.flatMap((c) =>
    c.opportunities.map((o) => ({ ...o, clientCompany: c.companyName, clientName: c.name }))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="gold" size="sm">Revenue & Commercial CRM</Badge>
            <span className="text-xs text-text-tertiary font-mono">CLIENT ACCOUNTS</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Client Accounts & Deal Pipeline
          </h1>
          <p className="text-xs text-text-secondary mt-1 font-detail">
            Enterprise customer registry, linked operational touchpoints, opportunities, and projects.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={loadClients} className="gap-2">
            <Icons.RotateCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowAddClientModal(true)} className="gap-2">
            <Icons.Plus className="w-3.5 h-3.5" />
            <span>New Client Account</span>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Error">
          {error}
        </Alert>
      )}

      {/* Tabs for Clients Directory vs Opportunity Pipeline */}
      <div className="flex gap-2 border-b border-border-subtle pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('clients')}
          className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
            activeTab === 'clients'
              ? 'bg-brand-primary/20 text-brand-primary font-bold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Client Accounts Directory ({clients.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pipeline')}
          className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
            activeTab === 'pipeline'
              ? 'bg-brand-primary/20 text-brand-primary font-bold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Deal Pipeline Opportunities ({allOpportunities.length})
        </button>
      </div>

      {/* Clients Table */}
      {activeTab === 'clients' && (
        <div className="glass-panel rounded-2xl border border-border-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left operational-table">
              <thead>
                <tr className="border-b border-border-subtle text-text-tertiary bg-surface-subtle/40 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Company & Brand</th>
                  <th className="py-2.5 px-3">Primary Contact</th>
                  <th className="py-2.5 px-3">Phone & Email</th>
                  <th className="py-2.5 px-3">Relationship Lead</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Connected Entities</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/40">
                {clients.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-hover/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-text-primary text-xs sm:text-sm">{c.companyName}</div>
                      <div className="text-xs text-brand-primary font-mono mt-0.5">{c.name}</div>
                    </td>
                    <td className="py-3 px-3 font-detail text-xs text-text-primary">
                      {c.name}
                    </td>
                    <td className="py-3 px-3 font-detail text-xs text-text-secondary">
                      <div>{c.phone || '—'}</div>
                      <div className="text-text-tertiary text-xs">{c.email || '—'}</div>
                    </td>
                    <td className="py-3 px-3 font-detail text-xs text-text-secondary">
                      {c.assignedEmployeeName || 'Unassigned'}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={c.status === 'ACTIVE' ? 'success' : c.status === 'LEAD' ? 'warning' : 'neutral'} size="sm">
                        {c.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex gap-2 text-xs font-mono text-text-secondary">
                        <span title="Opportunities">Opp: {c.opportunities.length}</span>
                        <span title="Projects">Prj: {c.projects.length}</span>
                        <span title="Meetings">Mtg: {c.meetings.length}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedClient(c)}
                      >
                        View Dossier
                      </Button>
                    </td>
                  </tr>
                ))}
                {clients.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-text-tertiary font-detail">
                      No client accounts found. Click "New Client Account" to add an enterprise record.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pipeline View */}
      {activeTab === 'pipeline' && (
        <div className="glass-panel rounded-2xl border border-border-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left operational-table">
              <thead>
                <tr className="border-b border-border-subtle text-text-tertiary bg-surface-subtle/40 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Opportunity Title</th>
                  <th className="py-2.5 px-3">Client Account</th>
                  <th className="py-2.5 px-3">Stage</th>
                  <th className="py-2.5 px-3">Estimated Value</th>
                  <th className="py-2.5 px-3">Probability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/40">
                {allOpportunities.map((opp) => (
                  <tr key={opp.id} className="hover:bg-surface-hover/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-text-primary text-xs sm:text-sm">
                      {opp.title}
                    </td>
                    <td className="py-3 px-3 font-detail text-xs text-text-secondary">
                      {opp.clientCompany} ({opp.clientName})
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant="gold" size="sm">{opp.stage}</Badge>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-text-primary text-xs sm:text-sm">
                      ₹{opp.estimatedValue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-text-secondary">
                      {opp.probability}%
                    </td>
                  </tr>
                ))}
                {allOpportunities.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-text-tertiary font-detail">
                      No opportunities recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Client Dossier Drawer Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="dossier-title" className="bg-surface-card border-l border-border-default w-full max-w-lg h-full p-6 space-y-5 overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-brand-primary">Client Account Dossier</span>
                <h3 id="dossier-title" className="text-lg font-bold text-text-primary">{selectedClient.companyName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClient(null)}
                className="text-text-tertiary hover:text-text-primary p-1"
                aria-label="Close dossier"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Summary */}
            <div className="p-4 rounded-xl bg-surface-subtle/50 border border-border-subtle space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary font-detail">Primary Contact:</span>
                <span className="font-semibold text-text-primary">{selectedClient.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary font-detail">Email:</span>
                <span className="font-mono text-text-primary">{selectedClient.email || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary font-detail">Phone:</span>
                <span className="font-mono text-text-primary">{selectedClient.phone || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary font-detail">Relationship Lead:</span>
                <span className="text-text-primary font-medium">{selectedClient.assignedEmployeeName || 'Unassigned'}</span>
              </div>
            </div>

            {/* Linked Opportunities */}
            <div className="space-y-2">
              <div className="text-xs sm:text-sm font-bold uppercase tracking-wider font-mono text-text-secondary">
                Commercial Opportunities ({selectedClient.opportunities.length})
              </div>
              {selectedClient.opportunities.map((opp) => (
                <div key={opp.id} className="p-3 rounded-lg bg-surface-card border border-border-subtle flex justify-between items-center text-xs sm:text-sm">
                  <div>
                    <div className="font-semibold text-text-primary">{opp.title}</div>
                    <div className="text-xs font-mono text-brand-primary mt-0.5">{opp.stage} • {opp.probability}% prob</div>
                  </div>
                  <div className="font-mono font-bold text-text-primary">
                    ₹{opp.estimatedValue.toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
              {selectedClient.opportunities.length === 0 && (
                <div className="text-xs text-text-tertiary font-detail italic">No active opportunities.</div>
              )}
            </div>

            {/* Linked Projects */}
            <div className="space-y-2">
              <div className="text-xs sm:text-sm font-bold uppercase tracking-wider font-mono text-text-secondary">
                Execution Projects ({selectedClient.projects.length})
              </div>
              {selectedClient.projects.map((prj) => (
                <div key={prj.id} className="p-3 rounded-lg bg-surface-card border border-border-subtle flex justify-between items-center text-xs sm:text-sm">
                  <div>
                    <div className="font-mono text-xs text-brand-primary">{prj.projectCode}</div>
                    <div className="font-semibold text-text-primary">{prj.title}</div>
                  </div>
                  <Badge variant="info" size="sm">{prj.status}</Badge>
                </div>
              ))}
              {selectedClient.projects.length === 0 && (
                <div className="text-xs text-text-tertiary font-detail italic">No projects associated with this client.</div>
              )}
            </div>

            {/* Linked Touchpoints (Meetings & Follow-ups) */}
            <div className="space-y-2">
              <div className="text-xs sm:text-sm font-bold uppercase tracking-wider font-mono text-text-secondary">
                Recent Touchpoints & Follow-ups
              </div>
              {selectedClient.followUps.map((fu) => (
                <div key={fu.id} className="p-2.5 rounded-lg bg-surface-card border border-border-subtle text-xs space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-brand-primary font-semibold">{fu.type}</span>
                    <span className="text-text-tertiary">{new Date(fu.date).toLocaleDateString()}</span>
                  </div>
                  {fu.nextAction && (
                    <div className="text-xs text-text-secondary font-detail">Next: {fu.nextAction}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface-card border border-border-default rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-text-primary">
                Create Client Account
              </h3>
              <button
                type="button"
                onClick={() => setShowAddClientModal(false)}
                className="text-text-tertiary hover:text-text-primary p-1"
                aria-label="Close modal"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3">
              <div>
                <label htmlFor="client-comp" className="block text-xs font-semibold text-text-secondary mb-1">
                  Company / Brand Name *
                </label>
                <input
                  id="client-comp"
                  type="text"
                  required
                  placeholder="e.g. Zenith Global Logistics"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="w-full text-xs bg-surface-subtle border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label htmlFor="client-contact" className="block text-xs font-semibold text-text-secondary mb-1">
                  Primary Contact Name *
                </label>
                <input
                  id="client-contact"
                  type="text"
                  required
                  placeholder="e.g. Marcus Vance"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full text-xs bg-surface-subtle border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="client-phone" className="block text-xs font-semibold text-text-secondary mb-1">
                    Phone
                  </label>
                  <input
                    id="client-phone"
                    type="text"
                    placeholder="+971-50-1234567"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full text-xs bg-surface-subtle border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label htmlFor="client-email" className="block text-xs font-semibold text-text-secondary mb-1">
                    Email
                  </label>
                  <input
                    id="client-email"
                    type="email"
                    placeholder="marcus@zenith.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full text-xs bg-surface-subtle border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="client-status" className="block text-xs font-semibold text-text-secondary mb-1">
                  Account Status
                </label>
                <select
                  id="client-status"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                  className="w-full text-xs bg-surface-subtle border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-primary font-mono"
                >
                  <option value="ACTIVE">ACTIVE CLIENT</option>
                  <option value="LEAD">COMMERCIAL LEAD</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowAddClientModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Account'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
