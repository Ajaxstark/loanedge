import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const API_BASE = 'http://localhost:8000/api/v1';

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

const levelStyles = {
  branch_manager: 'bg-blue-50 text-blue-700 border-blue-200',
  credit_committee: 'bg-violet-50 text-violet-700 border-violet-200',
};

const levelLabels = {
  branch_manager: 'Branch Manager',
  credit_committee: 'Credit Committee',
};

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '—';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function StatusBadge({ status }) {
  const style = statusStyles[status] || 'bg-slate-50 text-slate-600 border-slate-200';

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10.5px] font-semibold capitalize ${style}`}
    >
      {status || '—'}
    </span>
  );
}

function LevelBadge({ level }) {
  const style = levelStyles[level] || 'bg-slate-50 text-slate-600 border-slate-200';

  return (
    <span
      className={`inline-flex rounded-md border px-2 py-1 text-[10.5px] font-semibold ${style}`}
    >
      {levelLabels[level] || level || '—'}
    </span>
  );
}

function SummaryItem({ label, value, color = 'text-slate-900' }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-400">
        {label}
      </p>
      <p className={`mt-1 text-lg font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function Approval() {
  const { leadId } = useParams();

  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState({ lead_id: '', loan_amount: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [remarksMap, setRemarksMap] = useState({});

  const token =
    localStorage.getItem('token') ||
    sessionStorage.getItem('token');

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  };

  const fetchApprovals = async () => {
    setLoading(true);
    setError('');

    try {
      const url = leadId
        ? `${API_BASE}/approvals/lead/${leadId}`
        : `${API_BASE}/approvals`;

      const response = await axios.get(url, authConfig);
      setApprovals(response.data.data || []);
    } catch (err) {
      console.error('Approval fetch error:', err);
      setError(
        err.response?.data?.message ||
          'Unable to load approval requests.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  const filteredApprovals = useMemo(() => {
    return approvals.filter((approval) => {
      const matchesStatus =
        statusFilter === 'all' || approval.status === statusFilter;

      const matchesLevel =
        levelFilter === 'all' || approval.approver_level === levelFilter;

      return matchesStatus && matchesLevel;
    });
  }, [approvals, statusFilter, levelFilter]);

  const summary = useMemo(
    () => ({
      total: approvals.length,
      pending: approvals.filter((a) => a.status === 'pending').length,
      approved: approvals.filter((a) => a.status === 'approved').length,
      rejected: approvals.filter((a) => a.status === 'rejected').length,
    }),
    [approvals]
  );

  const openDrawer = () => {
    setForm({ lead_id: leadId || '', loan_amount: '' });
    setFormError('');
    setSuccess('');
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    if (saving) return;
    setDrawerOpen(false);
    setForm({ lead_id: '', loan_amount: '' });
    setFormError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setSuccess('');

    setSaving(true);

    try {
      await axios.post(
        `${API_BASE}/approvals`,
        {
          lead_id: leadId || form.lead_id,
          loan_amount: Number(form.loan_amount),
        },
        authConfig
      );

      setDrawerOpen(false);
      setForm({ lead_id: '', loan_amount: '' });
      setSuccess('Approval request created successfully.');

      await fetchApprovals();
    } catch (err) {
      console.error('Approval create error:', err);

      const validationErrors = err.response?.data?.errors;
      const firstError = validationErrors
        ? Object.values(validationErrors)[0]?.[0]
        : null;

      setFormError(
        firstError ||
          err.response?.data?.message ||
          'Unable to create approval request.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDecision = async (id, status) => {
    setActionLoadingId(id);
    setError('');
    setSuccess('');

    try {
      await axios.patch(
        `${API_BASE}/approvals/${id}`,
        {
          status,
          remarks: remarksMap[id] || '',
        },
        authConfig
      );

      setSuccess(
        status === 'approved'
          ? 'Approval request approved successfully.'
          : 'Approval request rejected.'
      );

      await fetchApprovals();
    } catch (err) {
      console.error('Approval decision error:', err);
      setError(
        err.response?.data?.message ||
          'Unable to update approval status.'
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const hasFilters = statusFilter !== 'all' || levelFilter !== 'all';

  return (
    <div className="flex min-h-screen bg-[#f6f8fb]">
      <Sidebar />

      <main className="min-w-0 flex-1">
        {/* Header */}
        <header className="border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between px-8 py-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <span>Credit</span>
                <span>/</span>
                <span className="text-slate-600">Approval</span>
              </div>

              <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950">
                Loan Approval
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                {leadId
                  ? 'Approval decisions for this applicant.'
                  : 'Track and manage loan approval requests.'}
              </p>
            </div>

            <button
              type="button"
              onClick={openDrawer}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-600/15"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              Request approval
            </button>
          </div>
        </header>

        <div className="p-8">
          {/* Summary */}
          <section className="mb-6 rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <div className="grid grid-cols-2 gap-y-5 sm:grid-cols-4 sm:divide-x sm:divide-slate-100">
              <div className="sm:pr-6">
                <SummaryItem label="Total requests" value={summary.total} />
              </div>
              <div className="sm:px-6">
                <SummaryItem
                  label="Pending"
                  value={summary.pending}
                  color="text-amber-700"
                />
              </div>
              <div className="sm:px-6">
                <SummaryItem
                  label="Approved"
                  value={summary.approved}
                  color="text-emerald-700"
                />
              </div>
              <div className="sm:pl-6">
                <SummaryItem
                  label="Rejected"
                  value={summary.rejected}
                  color="text-red-700"
                />
              </div>
            </div>
          </section>

          {success && (
            <div className="mb-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700">
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m5 12 4 4L19 6" />
              </svg>
              {success}
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Workspace */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Approval queue
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  {loading
                    ? 'Loading requests...'
                    : `${filteredApprovals.length} of ${approvals.length} requests shown`}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-blue-600"
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>

                <select
                  value={levelFilter}
                  onChange={(event) => setLevelFilter(event.target.value)}
                  className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-blue-600"
                >
                  <option value="all">All approver levels</option>
                  <option value="branch_manager">Branch Manager</option>
                  <option value="credit_committee">Credit Committee</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[340px] flex-col items-center justify-center">
                <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600" />
                <p className="mt-3 text-xs text-slate-500">
                  Loading approval requests...
                </p>
              </div>
            ) : filteredApprovals.length === 0 ? (
              <div className="flex min-h-[340px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-100 bg-blue-50">
                  <svg
                    className="h-6 w-6 text-blue-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <path d="M9 12l2 2 4-4" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </div>

                <h3 className="mt-4 text-sm font-semibold text-slate-900">
                  {hasFilters
                    ? 'No requests match these filters'
                    : 'No approval requests yet'}
                </h3>

                <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                  {hasFilters
                    ? 'Change your filters to view other requests.'
                    : 'Create an approval request to route it to the correct approver.'}
                </p>

                {!hasFilters && (
                  <button
                    type="button"
                    onClick={openDrawer}
                    className="mt-5 text-xs font-semibold text-blue-700 hover:text-blue-800"
                  >
                    Create first request →
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70">
                      {!leadId && (
                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                          Applicant
                        </th>
                      )}
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Loan amount
                      </th>
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Approver level
                      </th>
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Status
                      </th>
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Decision
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredApprovals.map((approval) => (
                      <tr
                        key={approval.id}
                        className="transition hover:bg-slate-50/60 align-top"
                      >
                        {!leadId && (
                          <td className="px-5 py-4">
                            <p className="text-[13px] font-semibold text-slate-900">
                              {approval.lead?.name || 'Unknown applicant'}
                            </p>
                            <p className="mt-0.5 text-[10.5px] text-slate-400">
                              Lead #{approval.lead_id}
                            </p>
                          </td>
                        )}

                        <td className="px-5 py-4 text-[13px] font-semibold text-slate-800">
                          {formatCurrency(approval.loan_amount)}
                        </td>

                        <td className="px-5 py-4">
                          <LevelBadge level={approval.approver_level} />
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={approval.status} />
                        </td>

                        <td className="px-5 py-4">
                          {approval.status === 'pending' ? (
                            <div className="flex flex-col gap-2">
                              <input
                                type="text"
                                placeholder="Remarks (optional)"
                                value={remarksMap[approval.id] || ''}
                                onChange={(event) =>
                                  setRemarksMap({
                                    ...remarksMap,
                                    [approval.id]: event.target.value,
                                  })
                                }
                                className="h-8 w-52 rounded-lg border border-slate-300 px-2.5 text-[11px] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                              />

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  disabled={actionLoadingId === approval.id}
                                  onClick={() =>
                                    handleDecision(approval.id, 'approved')
                                  }
                                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-[11px] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                                >
                                  <svg
                                    className="h-3.5 w-3.5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                  >
                                    <path d="m5 12 4 4L19 6" />
                                  </svg>
                                  Approve
                                </button>

                                <button
                                  type="button"
                                  disabled={actionLoadingId === approval.id}
                                  onClick={() =>
                                    handleDecision(approval.id, 'rejected')
                                  }
                                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-red-600 px-3 text-[11px] font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                                >
                                  <svg
                                    className="h-3.5 w-3.5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                  >
                                    <path d="M6 6l12 12M18 6 6 18" />
                                  </svg>
                                  Reject
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="max-w-xs text-[11.5px] text-slate-500">
                              {approval.remarks || 'No remarks recorded'}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[1px]"
          onClick={closeDrawer}
        />
      )}

      {/* Request drawer */}
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-[520px] transform bg-white shadow-[-20px_0_50px_-30px_rgba(15,23,42,0.35)] transition-transform duration-300 ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-700">
                Approval routing
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Request loan approval
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                The request will be routed to the appropriate approver level
                automatically.
              </p>
            </div>

            <button
              type="button"
              onClick={closeDrawer}
              disabled={saving}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {formError && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
                {formError}
              </div>
            )}

            <div className="space-y-5">
              {!leadId && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Lead ID
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <input
                    type="number"
                    required
                    value={form.lead_id}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        lead_id: event.target.value,
                      }))
                    }
                    placeholder="Enter lead ID"
                    className="h-10 w-full rounded-lg border border-slate-300 px-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10"
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Loan amount
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                    ₹
                  </span>

                  <input
                    type="number"
                    required
                    min="1"
                    value={form.loan_amount}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        loan_amount: event.target.value,
                      }))
                    }
                    placeholder="500000"
                    className="h-10 w-full rounded-lg border border-slate-300 pl-8 pr-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3">
                <p className="text-[11px] font-semibold text-slate-700 mb-1">
                  Automatic approver routing
                </p>
                <ul className="space-y-1 text-[10.5px] leading-4 text-slate-600">
                  <li>• Up to ₹5,00,000 → Branch Manager</li>
                  <li>• Above ₹5,00,000 → Credit Committee</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 bg-slate-50/60 px-6 py-4">
            <button
              type="button"
              onClick={closeDrawer}
              disabled={saving}
              className="h-9 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex h-9 min-w-[140px] items-center justify-center rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Submitting...
                </>
              ) : (
                'Submit request'
              )}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

export default Approval;