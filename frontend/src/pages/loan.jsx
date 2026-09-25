import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { formatCurrency } from '../utils/format';
import { LOAN_STATUS } from '../constants/status';

/* ============================================================
 * Helpers
 * ============================================================ */
function normalizeArray(response) {
  const payload = response?.data;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;

  return [];
}

function StatusBadge({ status }) {
  const config = LOAN_STATUS[status] || {
    label: status || '—',
    badge: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10.5px] font-semibold capitalize ${config.badge}`}
    >
      {config.label}
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

/* ============================================================
 * Loan Page
 * ============================================================ */
function Loan() {
  const { leadId } = useParams();
  const navigate = useNavigate();

  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState({
    lead_id: '',
    approval_id: '',
    loan_product_id: '',
    principal_amount: '',
    interest_rate: '',
    tenure_months: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  /* ------------------------------------------------------------
   * Fetch loans
   * ------------------------------------------------------------ */
  const fetchLoans = async () => {
    setLoading(true);
    setError('');

    try {
      const url = leadId ? `/loans/${leadId}` : '/loans';
      const response = await api.get(url);

      setLoans(normalizeArray(response));
    } catch (err) {
      console.error('Loans fetch error:', err);
      setError(err.response?.data?.message || 'Unable to load loans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  /* ------------------------------------------------------------
   * Filtered loans
   * ------------------------------------------------------------ */
  const filteredLoans = useMemo(() => {
    const safeLoans = Array.isArray(loans) ? loans : [];

    return safeLoans.filter((loan) => {
      return statusFilter === 'all' || loan.status === statusFilter;
    });
  }, [loans, statusFilter]);

  /* ------------------------------------------------------------
   * Summary
   * ------------------------------------------------------------ */
  const summary = useMemo(() => {
    const safeLoans = Array.isArray(loans) ? loans : [];

    const total = safeLoans.length;
    const sanctioned = safeLoans.filter((l) => l.status === 'sanctioned').length;

    const disbursedActive = safeLoans.filter(
      (l) => l.status === 'disbursed' || l.status === 'active'
    ).length;

    const totalDisbursedAmount = safeLoans
      .filter(
        (l) =>
          l.status === 'disbursed' ||
          l.status === 'active' ||
          l.status === 'closed'
      )
      .reduce((sum, l) => sum + Number(l.principal_amount || 0), 0);

    return { total, sanctioned, disbursedActive, totalDisbursedAmount };
  }, [loans]);

  /* ------------------------------------------------------------
   * Drawer handlers
   * ------------------------------------------------------------ */
  const openDrawer = () => {
    setForm({
      lead_id: leadId || '',
      approval_id: '',
      loan_product_id: '',
      principal_amount: '',
      interest_rate: '',
      tenure_months: '',
    });
    setFormError('');
    setSuccess('');
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    if (saving) return;

    setDrawerOpen(false);
    setForm({
      lead_id: '',
      approval_id: '',
      loan_product_id: '',
      principal_amount: '',
      interest_rate: '',
      tenure_months: '',
    });
    setFormError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setSuccess('');
    setSaving(true);

    try {
      await api.post('/loans', {
        lead_id: leadId || form.lead_id,
        approval_id: form.approval_id,
        loan_product_id: form.loan_product_id,
        principal_amount: form.principal_amount,
        interest_rate: form.interest_rate,
        tenure_months: form.tenure_months,
      });

      setDrawerOpen(false);
      setForm({
        lead_id: '',
        approval_id: '',
        loan_product_id: '',
        principal_amount: '',
        interest_rate: '',
        tenure_months: '',
      });
      setSuccess('Loan sanctioned successfully.');
      await fetchLoans();
    } catch (err) {
      console.error('Loan sanction error:', err);

      const validationErrors = err.response?.data?.errors;
      const firstError = validationErrors
        ? Object.values(validationErrors)[0]?.[0]
        : null;

      setFormError(
        firstError ||
          err.response?.data?.message ||
          'Could not sanction loan. Please check the values entered.'
      );
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------------------------------------
   * Disburse loan
   * ------------------------------------------------------------ */
  const handleDisburse = async (id) => {
    setActionLoadingId(id);
    setError('');
    setSuccess('');

    try {
      await api.patch(`/loans/${id}/disburse`);
      setSuccess('Loan disbursed successfully. Generate EMI schedule from EMI page.');
      await fetchLoans();
    } catch (err) {
      console.error('Disburse error:', err);
      setError(err.response?.data?.message || 'Could not disburse loan.');
    } finally {
      setActionLoadingId(null);
    }
  };

  /* ------------------------------------------------------------
   * Close loan
   * ------------------------------------------------------------ */
  const handleClose = async (id) => {
    setActionLoadingId(id);
    setError('');
    setSuccess('');

    try {
      await api.patch(`/loans/${id}/close`);
      setSuccess('Loan closed successfully.');
      await fetchLoans();
    } catch (err) {
      console.error('Close loan error:', err);
      setError(err.response?.data?.message || 'Could not close loan.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const hasFilters = statusFilter !== 'all';

  /* ============================================================
   * RENDER
   * ============================================================ */
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
                <span className="text-slate-600">Loans</span>
              </div>

              <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950">
                Loans
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                {leadId
                  ? 'Loans for this applicant.'
                  : 'Manage sanctioned, disbursed and closed loans.'}
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
              Sanction loan
            </button>
          </div>
        </header>

        <div className="p-8">
          {/* Summary */}
          <section className="mb-6 rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <div className="grid grid-cols-2 gap-y-5 sm:grid-cols-4 sm:divide-x sm:divide-slate-100">
              <div className="sm:pr-6">
                <SummaryItem label="Total loans" value={summary.total} />
              </div>
              <div className="sm:px-6">
                <SummaryItem
                  label="Sanctioned"
                  value={summary.sanctioned}
                  color="text-blue-700"
                />
              </div>
              <div className="sm:px-6">
                <SummaryItem
                  label="Disbursed / Active"
                  value={summary.disbursedActive}
                  color="text-emerald-700"
                />
              </div>
              <div className="sm:pl-6">
                <SummaryItem
                  label="Total disbursed"
                  value={formatCurrency(summary.totalDisbursedAmount, { compact: true })}
                  color="text-violet-700"
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
                  Loan portfolio
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  {loading
                    ? 'Loading loans...'
                    : `${filteredLoans.length} of ${loans.length} loans shown`}
                </p>
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-blue-600"
              >
                <option value="all">All statuses</option>
                <option value="sanctioned">Sanctioned</option>
                <option value="disbursed">Disbursed</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {loading ? (
              <div className="flex min-h-[340px] flex-col items-center justify-center">
                <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600" />
                <p className="mt-3 text-xs text-slate-500">Loading loans...</p>
              </div>
            ) : filteredLoans.length === 0 ? (
              <div className="flex min-h-[340px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-100 bg-blue-50">
                  <svg
                    className="h-6 w-6 text-blue-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>

                <h3 className="mt-4 text-sm font-semibold text-slate-900">
                  {hasFilters ? 'No loans match this filter' : 'No loans yet'}
                </h3>

                <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                  {hasFilters
                    ? 'Change your filter to view other loans.'
                    : 'Sanction a loan once an approval request is approved.'}
                </p>

                {!hasFilters && (
                  <button
                    type="button"
                    onClick={openDrawer}
                    className="mt-5 text-xs font-semibold text-blue-700 hover:text-blue-800"
                  >
                    Sanction first loan →
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70">
                      {!leadId && (
                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                          Applicant
                        </th>
                      )}
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Product
                      </th>
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Principal
                      </th>
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Interest
                      </th>
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Tenure
                      </th>
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Status
                      </th>
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredLoans.map((loan) => (
                      <tr
                        key={loan.id}
                        className="transition hover:bg-slate-50/60"
                      >
                        {!leadId && (
                          <td className="px-5 py-4">
                            <p className="text-[13px] font-semibold text-slate-900">
                              {loan.lead?.name || '—'}
                            </p>
                            <p className="mt-0.5 text-[10.5px] text-slate-400">
                              Lead #{loan.lead_id}
                            </p>
                          </td>
                        )}

                        <td className="px-5 py-4 text-[12.5px] text-slate-700">
                          {loan.loan_product?.name ||
                            loan.loanProduct?.name ||
                            '—'}
                        </td>

                        <td className="px-5 py-4 text-[12.5px] font-semibold text-slate-900">
                          {formatCurrency(loan.principal_amount)}
                        </td>

                        <td className="px-5 py-4 text-[12.5px] text-slate-700">
                          {loan.interest_rate}%
                        </td>

                        <td className="px-5 py-4 text-[12.5px] text-slate-700">
                          {loan.tenure_months} months
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={loan.status} />
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            {loan.status === 'sanctioned' && (
                              <button
                                type="button"
                                disabled={actionLoadingId === loan.id}
                                onClick={() => handleDisburse(loan.id)}
                                className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-50"
                              >
                                {actionLoadingId === loan.id
                                  ? 'Disbursing...'
                                  : 'Disburse'}
                              </button>
                            )}

                            {(loan.status === 'disbursed' ||
                              loan.status === 'active') && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => navigate(`/emi/${loan.id}`)}
                                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                                >
                                  View EMI
                                </button>

                                <button
                                  type="button"
                                  disabled={actionLoadingId === loan.id}
                                  onClick={() => handleClose(loan.id)}
                                  className="rounded-lg bg-slate-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
                                >
                                  {actionLoadingId === loan.id
                                    ? 'Closing...'
                                    : 'Close loan'}
                                </button>
                              </>
                            )}

                            {loan.status === 'closed' && (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </div>
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

      {/* Sanction loan drawer */}
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-[520px] transform bg-white shadow-[-20px_0_50px_-30px_rgba(15,23,42,0.35)] transition-transform duration-300 ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-700">
                Loan origination
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Sanction new loan
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Create a loan against an approved approval request.
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
                    Lead ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={form.lead_id}
                    onChange={(event) =>
                      setForm({ ...form, lead_id: event.target.value })
                    }
                    className="h-11 w-full rounded-lg border border-slate-300 px-3.5 text-[13px] outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10"
                    placeholder="e.g. 1"
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Approval ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={form.approval_id}
                  onChange={(event) =>
                    setForm({ ...form, approval_id: event.target.value })
                  }
                  className="h-11 w-full rounded-lg border border-slate-300 px-3.5 text-[13px] outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10"
                  placeholder="ID of the approved approval request"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Loan Product ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={form.loan_product_id}
                  onChange={(event) =>
                    setForm({ ...form, loan_product_id: event.target.value })
                  }
                  className="h-11 w-full rounded-lg border border-slate-300 px-3.5 text-[13px] outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10"
                  placeholder="e.g. 1"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Principal amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={form.principal_amount}
                  onChange={(event) =>
                    setForm({ ...form, principal_amount: event.target.value })
                  }
                  className="h-11 w-full rounded-lg border border-slate-300 px-3.5 text-[13px] outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10"
                  placeholder="e.g. 500000"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Interest rate (% per annum){' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={form.interest_rate}
                  onChange={(event) =>
                    setForm({ ...form, interest_rate: event.target.value })
                  }
                  className="h-11 w-full rounded-lg border border-slate-300 px-3.5 text-[13px] outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10"
                  placeholder="e.g. 12.5"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Tenure (months) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={form.tenure_months}
                  onChange={(event) =>
                    setForm({ ...form, tenure_months: event.target.value })
                  }
                  className="h-11 w-full rounded-lg border border-slate-300 px-3.5 text-[13px] outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10"
                  placeholder="e.g. 24"
                />
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
                  Sanctioning...
                </>
              ) : (
                'Sanction loan'
              )}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

export default Loan;