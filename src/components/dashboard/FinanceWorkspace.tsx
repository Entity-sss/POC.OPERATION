import React, { useState, useEffect } from 'react';
import { Icons } from '../ui/Icons';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { KPICard } from '../ui/KPICard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Alert } from '../ui/Alert';

interface FinanceWorkspaceProps {
  user: any;
  permissions?: string[];
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string | null;
  clientCompany: string | null;
  projectTitle: string | null;
  amount: number;
  issueDate: number;
  dueDate: number;
  status: 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  notes: string | null;
}

interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber: string | null;
  amount: number;
  paymentDate: number;
  paymentMethod: string | null;
  referenceNumber: string | null;
  notes: string | null;
}

interface FinanceData {
  invoices: Invoice[];
  payments: Payment[];
  summary: {
    totalBilled: number;
    totalCollected: number;
    totalOutstanding: number;
    ageing: {
      current: number;
      days30to60: number;
      days60to90: number;
      over90days: number;
    };
  };
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export const FinanceWorkspace: React.FC<FinanceWorkspaceProps> = () => {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'ageing'>('invoices');

  const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [invoiceForm, setInvoiceForm] = useState({
    clientId: '',
    amount: '',
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    notes: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'BANK_TRANSFER',
    referenceNumber: '',
    notes: '',
  });

  const [clientsList, setClientsList] = useState<Array<{ id: string; name: string; companyName: string }>>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [res, clientsRes] = await Promise.all([
        fetch('/api/finance/invoices'),
        fetch('/api/clients').catch(() => null),
      ]);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error((errJson as any)?.error || 'Failed to load finance data');
      }
      const json: any = await res.json();
      setData(json);

      if (clientsRes && clientsRes.ok) {
        const clientsJson: any = await clientsRes.json();
        setClientsList(clientsJson.clients || []);
      }
    } catch (err: unknown) {
      setError((err as any)?.message || 'Failed to load finance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateInvoice = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!invoiceForm.clientId || !invoiceForm.amount || !invoiceForm.issueDate || !invoiceForm.dueDate) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/finance/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: invoiceForm.clientId,
          amount: Number(invoiceForm.amount),
          issueDate: new Date(invoiceForm.issueDate).getTime(),
          dueDate: new Date(invoiceForm.dueDate).getTime(),
          notes: invoiceForm.notes || undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Failed to create invoice');

      setShowCreateInvoiceModal(false);
      setInvoiceForm({
        clientId: '',
        amount: '',
        issueDate: new Date().toISOString().slice(0, 10),
        dueDate: '',
        notes: '',
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Invoice creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPayment = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedInvoice || !paymentForm.amount) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/finance/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          amount: Number(paymentForm.amount),
          paymentDate: Date.now(),
          paymentMethod: paymentForm.paymentMethod,
          referenceNumber: paymentForm.referenceNumber,
          notes: paymentForm.notes,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any)?.error || 'Failed to record payment');
      }
      setShowRecordPaymentModal(false);
      setSelectedInvoice(null);
      setPaymentForm({ amount: '', paymentMethod: 'BANK_TRANSFER', referenceNumber: '', notes: '' });
      await loadData();
    } catch (err: unknown) {
      alert((err as any)?.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const getInvoiceBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="success" size="sm">PAID</Badge>;
      case 'PARTIALLY_PAID':
        return <Badge variant="warning" size="sm">PARTIALLY PAID</Badge>;
      case 'OVERDUE':
        return <Badge variant="error" size="sm">OVERDUE</Badge>;
      case 'ISSUED':
        return <Badge variant="info" size="sm">ISSUED</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-xs text-text-secondary font-mono">Loading Finance & Collections Center...</p>
      </div>
    );
  }

  const sum = data?.summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="gold" size="sm">Finance & Billing</Badge>
            <span className="text-xs text-text-tertiary font-mono">CASH FLOW ENGINE</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Invoices, Collections & Ageing Center
          </h1>
          <p className="text-xs text-text-secondary mt-1 font-detail">
            Verifiable billing ledger, real-time payment recordings, and accounts receivable ageing breakdown.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={loadData} className="gap-2">
            <Icons.RotateCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowCreateInvoiceModal(true)} className="gap-2">
            <Icons.Plus className="w-3.5 h-3.5" />
            <span>Create Invoice</span>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Error">
          {error}
        </Alert>
      )}

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard
          title="Total Invoiced"
          value={formatCurrency(sum?.totalBilled ?? 0)}
          subtitle="Cumulative commercial billings"
          variant="default"
          icon={<Icons.IndianRupee className="w-5 h-5" />}
        />
        <KPICard
          title="Total Cash Collected"
          value={formatCurrency(sum?.totalCollected ?? 0)}
          subtitle="Cleared bank deposits"
          variant="gold"
          icon={<Icons.CheckSquare className="w-5 h-5" />}
        />
        <KPICard
          title="Outstanding Receivables"
          value={formatCurrency(sum?.totalOutstanding ?? 0)}
          subtitle="Pending collection follow-up"
          variant={sum && sum.totalOutstanding > 0 ? 'warning' : 'default'}
          icon={<Icons.AlertTriangle className="w-5 h-5" />}
        />
      </div>

      {/* Ageing Breakdown Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-border-subtle space-y-3">
        <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider font-mono text-text-primary">
            Accounts Receivable Ageing Analysis
          </h3>
          <span className="text-xs font-mono text-text-tertiary">Real-time D1 Analysis</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-surface-card border border-border-subtle">
            <div className="text-xs font-bold font-mono uppercase text-status-success">Current (&lt; 30 Days)</div>
            <div className="text-lg sm:text-xl font-bold font-mono text-text-primary mt-1">
              {formatCurrency(sum?.ageing.current ?? 0)}
            </div>
            <div className="text-xs text-text-secondary font-detail mt-0.5">Within payment SLA</div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-card border border-border-subtle">
            <div className="text-xs font-bold font-mono uppercase text-amber-500">30 – 60 Days</div>
            <div className="text-lg sm:text-xl font-bold font-mono text-text-primary mt-1">
              {formatCurrency(sum?.ageing.days30to60 ?? 0)}
            </div>
            <div className="text-xs text-text-secondary font-detail mt-0.5">Follow-up due</div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-card border border-border-subtle">
            <div className="text-xs font-bold font-mono uppercase text-orange-500">60 – 90 Days</div>
            <div className="text-lg sm:text-xl font-bold font-mono text-text-primary mt-1">
              {formatCurrency(sum?.ageing.days60to90 ?? 0)}
            </div>
            <div className="text-xs text-text-secondary font-detail mt-0.5">Finance escalation</div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-card border border-status-error/40">
            <div className="text-xs font-bold font-mono uppercase text-status-error">Overdue (&gt; 90 Days)</div>
            <div className="text-lg sm:text-xl font-bold font-mono text-status-error mt-1">
              {formatCurrency(sum?.ageing.over90days ?? 0)}
            </div>
            <div className="text-xs text-text-secondary font-detail mt-0.5">Critical collection notice</div>
          </div>
        </div>
      </div>

      {/* Tabs for Invoices vs Payments */}
      <div className="flex gap-2 border-b border-border-subtle pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('invoices')}
          className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
            activeTab === 'invoices'
              ? 'bg-brand-primary/20 text-brand-primary font-bold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Invoices Ledger ({data?.invoices.length ?? 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
            activeTab === 'payments'
              ? 'bg-brand-primary/20 text-brand-primary font-bold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Payment Collections ({data?.payments.length ?? 0})
        </button>
      </div>

      {/* Invoices View */}
      {activeTab === 'invoices' && (
        <div className="glass-panel rounded-2xl border border-border-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left operational-table">
              <thead>
                <tr className="border-b border-border-subtle text-text-tertiary bg-surface-subtle/40 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Client Account</th>
                  <th className="py-2.5 px-3">Project Deliverable</th>
                  <th className="py-2.5 px-3">Issue Date</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/40">
                {data?.invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface-hover/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-brand-primary text-xs sm:text-sm">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-text-primary text-xs sm:text-sm">{inv.clientCompany || inv.clientName}</div>
                      <div className="text-xs text-text-secondary font-detail">{inv.clientName}</div>
                    </td>
                    <td className="py-3 px-3 font-detail text-xs text-text-secondary">
                      {inv.projectTitle || 'General Retainer / Operational'}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-text-tertiary">
                      {new Date(inv.issueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-text-secondary">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-text-primary text-xs sm:text-sm">
                      {formatCurrency(inv.amount)}
                    </td>
                    <td className="py-3 px-3">
                      {getInvoiceBadge(inv.status)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {inv.status !== 'PAID' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setPaymentForm({
                              amount: String(inv.amount),
                              paymentMethod: 'BANK_TRANSFER',
                              referenceNumber: '',
                              notes: '',
                            });
                            setShowRecordPaymentModal(true);
                          }}
                        >
                          Record Payment
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {(!data?.invoices || data.invoices.length === 0) && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-text-tertiary font-detail">
                      No invoices found. Click "Create Invoice" to bill a client account.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payments View */}
      {activeTab === 'payments' && (
        <div className="glass-panel rounded-2xl border border-border-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left operational-table">
              <thead>
                <tr className="border-b border-border-subtle text-text-tertiary bg-surface-subtle/40 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Payment Date</th>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Amount Deposited</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Reference / UTR #</th>
                  <th className="py-2.5 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/40">
                {data?.payments.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-hover/40 transition-colors">
                    <td className="py-3 px-3 font-mono text-xs text-text-tertiary">
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-brand-primary text-xs sm:text-sm">
                      {p.invoiceNumber || '—'}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-status-success text-xs sm:text-sm">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-text-secondary">
                      {p.paymentMethod || 'BANK_TRANSFER'}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-text-primary">
                      {p.referenceNumber || '—'}
                    </td>
                    <td className="py-3 px-3 font-detail text-xs text-text-secondary">
                      {p.notes || '—'}
                    </td>
                  </tr>
                ))}
                {(!data?.payments || data.payments.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-text-tertiary font-detail">
                      No payment records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="inv-modal-title" className="bg-surface-card border border-border-default rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 id="inv-modal-title" className="text-sm font-bold uppercase tracking-wider font-mono text-text-primary">
                Issue Client Invoice
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateInvoiceModal(false)}
                className="text-text-tertiary hover:text-text-primary p-1"
                aria-label="Close modal"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3">
              <div>
                <label htmlFor="inv-client" className="block text-xs font-semibold text-text-secondary mb-1">
                  Select Client Account *
                </label>
                <select
                  id="inv-client"
                  required
                  value={invoiceForm.clientId}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, clientId: e.target.value })}
                  className="w-full text-xs bg-surface-subtle border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-primary"
                >
                  <option value="">-- Choose Client --</option>
                  {clientsList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} ({c.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="inv-amount" className="block text-xs font-semibold text-text-secondary mb-1">
                  Invoice Amount (₹) *
                </label>
                <input
                  id="inv-amount"
                  type="number"
                  required
                  placeholder="e.g. 250000"
                  value={invoiceForm.amount}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                  className="w-full text-xs font-mono bg-surface-subtle border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label htmlFor="inv-issue" className="block text-xs font-semibold text-text-secondary mb-1">
                  Invoice Issue Date *
                </label>
                <input
                  id="inv-issue"
                  type="date"
                  required
                  value={invoiceForm.issueDate}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, issueDate: e.target.value })}
                  className="w-full text-xs font-mono bg-surface-subtle border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label htmlFor="inv-due" className="block text-xs font-semibold text-text-secondary mb-1">
                  Payment Due Date *
                </label>
                <input
                  id="inv-due"
                  type="date"
                  required
                  value={invoiceForm.dueDate}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                  className="w-full text-xs font-mono bg-surface-subtle border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label htmlFor="inv-notes" className="block text-xs font-semibold text-text-secondary mb-1">
                  Billing Notes / Deliverable Summary
                </label>
                <textarea
                  id="inv-notes"
                  rows={2}
                  placeholder="e.g. Milestone 1 - Initial event staging and venue advance"
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                  className="w-full text-xs bg-surface-subtle border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-primary font-detail"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowCreateInvoiceModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                  {submitting ? 'Generating...' : 'Issue Invoice'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showRecordPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="pay-modal-title" className="bg-surface-card border border-border-default rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div>
                <h3 id="pay-modal-title" className="text-sm font-bold uppercase tracking-wider font-mono text-text-primary">
                  Record Cleared Payment
                </h3>
                <p className="text-xs font-mono text-brand-primary mt-0.5">
                  Invoice {selectedInvoice.invoiceNumber} • {formatCurrency(selectedInvoice.amount)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRecordPaymentModal(false)}
                className="text-text-tertiary hover:text-text-primary p-1"
                aria-label="Close modal"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label htmlFor="pay-amount" className="block text-xs font-semibold text-text-secondary mb-1">
                  Payment Amount Deposited (₹) *
                </label>
                <input
                  id="pay-amount"
                  type="number"
                  required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full text-xs font-mono bg-surface-subtle border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label htmlFor="pay-method" className="block text-xs font-semibold text-text-secondary mb-1">
                  Payment Channel / Method
                </label>
                <select
                  id="pay-method"
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full text-xs bg-surface-subtle border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-primary font-mono"
                >
                  <option value="BANK_TRANSFER">NEFT / RTGS / IMPS (Bank Transfer)</option>
                  <option value="UPI">UPI Payment</option>
                  <option value="CHEQUE">Cheque / Demand Draft</option>
                  <option value="OTHER">Other Authorized Instrument</option>
                </select>
              </div>

              <div>
                <label htmlFor="pay-utr" className="block text-xs font-semibold text-text-secondary mb-1">
                  UTR / Reference Transaction #
                </label>
                <input
                  id="pay-utr"
                  type="text"
                  placeholder="e.g. HDFC2026091400192"
                  value={paymentForm.referenceNumber}
                  onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                  className="w-full text-xs font-mono bg-surface-subtle border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label htmlFor="pay-notes" className="block text-xs font-semibold text-text-secondary mb-1">
                  Collection Notes
                </label>
                <textarea
                  id="pay-notes"
                  rows={2}
                  placeholder="e.g. Account cleared with customs demurrage deduction"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full text-xs bg-surface-subtle border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-brand-primary font-detail"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowRecordPaymentModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={submitting}>
                  {submitting ? 'Recording...' : 'Deposit Payment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
