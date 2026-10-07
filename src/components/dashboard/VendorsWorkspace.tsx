import React, { useState, useEffect } from 'react';
import { Icons } from '../ui/Icons';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Alert } from '../ui/Alert';

interface VendorsWorkspaceProps {
  user: any;
  permissions?: string[];
}

interface Vendor {
  id: string;
  vendorId: string;
  name: string;
  category: 'FABRICATION' | 'LOGISTICS' | 'PRINTING' | 'EQUIPMENT' | 'VENUE' | 'CREATIVE' | 'OTHER';
  contactPerson: string;
  phone: string | null;
  email: string | null;
  location: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  assignedEmployeeName: string | null;
  activeJobsCount: number;
}

export const VendorsWorkspace: React.FC<VendorsWorkspaceProps> = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: 'FABRICATION' as const,
    contactPerson: '',
    phone: '',
    email: '',
    location: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadVendors = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/vendors');
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error((errJson as any)?.error || 'Failed to load vendors');
      }
      const json: any = await res.json();
      setVendors(json.vendors || []);
    } catch (err: unknown) {
      setError((err as any)?.message || 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const handleCreate = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name.trim() || !form.contactPerson.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any)?.error || 'Failed to add vendor');
      }
      setShowAddModal(false);
      setForm({
        name: '',
        category: 'FABRICATION',
        contactPerson: '',
        phone: '',
        email: '',
        location: '',
      });
      await loadVendors();
    } catch (err: unknown) {
      alert((err as any)?.message || 'Failed to add vendor');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && vendors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-xs text-text-secondary font-mono">Loading Vendor Master Registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="gold" size="sm">Supply Chain</Badge>
            <span className="text-xs text-text-tertiary font-mono">VENDOR REGISTRY</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Vendor Management Directory
          </h1>
          <p className="text-xs text-text-secondary mt-1 font-detail">
            Authorized external fabrication shops, event logistics carriers, and equipment suppliers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={loadVendors} className="gap-2">
            <Icons.RotateCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)} className="gap-2">
            <Icons.Plus className="w-3.5 h-3.5" />
            <span>Add Vendor</span>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Error">
          {error}
        </Alert>
      )}

      {/* Vendors Table */}
      <div className="glass-panel rounded-2xl border border-border-subtle overflow-hidden">
        <div className="p-4 border-b border-border-subtle flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider font-mono text-text-primary">
            Partner Vendors ({vendors.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left operational-table">
            <thead>
              <tr className="border-b border-border-subtle text-text-tertiary bg-surface-subtle/40 text-xs font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Vendor ID</th>
                <th className="py-2.5 px-3">Vendor Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Contact Person</th>
                <th className="py-2.5 px-3">Phone & Email</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3">Active Jobs</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/40">
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-surface-hover/40 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-brand-primary text-xs sm:text-sm">
                    {v.vendorId}
                  </td>
                  <td className="py-3 px-3 font-semibold text-text-primary text-xs sm:text-sm">
                    {v.name}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-subtle border border-border-subtle text-text-secondary font-medium">
                      {v.category}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-detail text-xs text-text-primary">
                    {v.contactPerson}
                  </td>
                  <td className="py-3 px-3 font-detail text-xs text-text-secondary">
                    <div>{v.phone || '—'}</div>
                    <div className="text-text-tertiary text-xs">{v.email || '—'}</div>
                  </td>
                  <td className="py-3 px-3 font-detail text-xs text-text-secondary">
                    {v.location || '—'}
                  </td>
                  <td className="py-3 px-3 font-mono text-xs sm:text-sm font-bold text-text-primary">
                    {v.activeJobsCount}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Badge variant={v.status === 'ACTIVE' ? 'success' : 'neutral'} size="sm">
                      {v.status}
                    </Badge>
                  </td>
                </tr>
              ))}
              {vendors.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-tertiary font-detail">
                    No vendors registered yet. Click "Add Vendor" to onboard an operational partner.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Vendor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="vendor-modal-title" className="bg-surface-card border border-border-default rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 id="vendor-modal-title" className="text-sm font-bold uppercase tracking-wider font-mono text-text-primary">
                Register Partner Vendor
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-text-tertiary hover:text-text-primary p-1"
                aria-label="Close modal"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label htmlFor="vendor-name" className="block text-xs font-semibold text-text-secondary mb-1">
                  Vendor Name *
                </label>
                <input
                  id="vendor-name"
                  type="text"
                  required
                  placeholder="e.g. Apex Industrial Fabrications"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full text-xs bg-surface-subtle border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label htmlFor="vendor-cat" className="block text-xs font-semibold text-text-secondary mb-1">
                  Category *
                </label>
                <select
                  id="vendor-cat"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                  className="w-full text-xs bg-surface-subtle border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-primary font-mono"
                >
                  <option value="FABRICATION">FABRICATION</option>
                  <option value="LOGISTICS">LOGISTICS</option>
                  <option value="PRINTING">PRINTING</option>
                  <option value="EQUIPMENT">EQUIPMENT</option>
                  <option value="VENUE">VENUE</option>
                  <option value="CREATIVE">CREATIVE</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              <div>
                <label htmlFor="vendor-contact" className="block text-xs font-semibold text-text-secondary mb-1">
                  Contact Person *
                </label>
                <input
                  id="vendor-contact"
                  type="text"
                  required
                  placeholder="e.g. Rajesh Sharma"
                  value={form.contactPerson}
                  onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                  className="w-full text-xs bg-surface-subtle border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="vendor-phone" className="block text-xs font-semibold text-text-secondary mb-1">
                    Phone
                  </label>
                  <input
                    id="vendor-phone"
                    type="text"
                    placeholder="+91-9876543210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full text-xs bg-surface-subtle border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label htmlFor="vendor-email" className="block text-xs font-semibold text-text-secondary mb-1">
                    Email
                  </label>
                  <input
                    id="vendor-email"
                    type="email"
                    placeholder="contact@vendor.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full text-xs bg-surface-subtle border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="vendor-loc" className="block text-xs font-semibold text-text-secondary mb-1">
                  Location / Yard Address
                </label>
                <input
                  id="vendor-loc"
                  type="text"
                  placeholder="e.g. Plot 42, Industrial Area, Noida"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full text-xs bg-surface-subtle border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                  {submitting ? 'Registering...' : 'Register Vendor'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
