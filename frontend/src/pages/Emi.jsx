import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { formatCurrency, formatDate } from '../utils/format';
import { EMI_STATUS } from '../constants/status';

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
  const config = EMI_STATUS[status] || {
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
 * EMI Page
 * ============================================================ */
function Emi() {
  const { loanId } = useParams();
  const navigate = useNavigate();

  const [schedule, setSchedule] = useState([]);
  const [loanInfo, setLoanInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [disbursedLoans, setDisbursedLoans] = useState([]);
  const [queueLoading, setQueueLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [generating, setGenerating] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [payDrawerOpen, setPayDrawerOpen] = useState(false);
  const [payingEmi, setPayingEmi] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    paid_amount: '',
    payment_method: 'cash',
    payment_reference: '',
    paid_at: new Date().toISOString().split('T')[0],
    remarks: '',
  });
  const [formError, setFormError] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  /* ------------------------------------------------------------
   * Fetch: EMI schedule for specific loan
   * ------------------------------------------------------------ */
  const fetchSchedule = async () => {
    if (!loanId) return;

    setLoading(true);
    setError('');

    try {
      const response = await api.get(`/emi/loan/${loanId}`);
      const data = normalizeArray(response);

      setSchedule(data);

      if (data.length > 0 && data[0].loan) {
        setLoanInfo(data[0].loan);
      } else {
        try {
          const loanRes = await api.get(`/loans/${loanId}`);
          const loanPayload = loanRes?.data;
          const loan =
            loanPayload?.data ||
            (Array.isArray(loanPayload) ? loanPayload[0] : loanPayload);

          if (loan) setLoanInfo(loan);
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.error('EMI fetch error:', err);
      setError(err.response?.data?.message || 'Unable to load EMI schedule.');
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------
   * Fetch: Disbursed loans queue
   * ------------------------------------------------------------ */
  const fetchDisbursedLoans = async () => {
    if (loanId) return;

    setQueueLoading(true);
    setError('');

    try {
      const response = await api.get('/loans');
      const all = normalizeArray(response);

      setDisbursedLoans(
        all.filter((l) => l.status === 'disbursed' || l.status === 'active')
      );
    } catch (err) {
      console.error('Disbursed loans fetch error:', err);
      setError(err.response?.data?.message || 'Unable to load disbursed loans.');
    } finally {
      setQueueLoading(false);
    }
  };

  useEffect(() => {
    if (loanId) {
      fetchSchedule();
    } else {
      fetchDisbursedLoans();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loanId]);

  /* ------------------------------------------------------------
   * Filtered schedule
   * ------------------------------------------------------------ */
  const filteredSchedule = useMemo(() => {
    const safeSchedule = Array.isArray(schedule) ? schedule : [];

    return safeSchedule.filter((item) => {
      const matchesStatus =
        statusFilter === 'all' || item.status === statusFilter;

      const matchesSearch =
        !searchQuery ||
        String(item.installment_number || '').includes(searchQuery) ||
        formatDate(item.due_date)
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [schedule, statusFilter, searchQuery]);

  /* ------------------------------------------------------------
   * Summary
   * ------------------------------------------------------------ */
  const summary = useMemo(() => {
    const safeSchedule = Array.isArray(schedule) ? schedule : [];

    const total = safeSchedule.length;
    const paid = safeSchedule.filter((s) => s.status === 'paid').length;
    const pending = safeSchedule.filter((s) => s.status === 'pending').length;
    const overdue = safeSchedule.filter((s) => s.status === 'overdue').length;

    const totalPaidAmount = safeSchedule
      .filter((s) => s.status === 'paid')
      .reduce(
        (sum, s) => sum + Number(s.paid_amount || s.emi_amount || 0),
        0
      );

    const totalPayable = safeSchedule.reduce(
      (sum, s) => sum + Number(s.emi_amount || 0),
      0
    );

    const remainingAmount = totalPayable - totalPaidAmount;

    const repaymentPercentage =
      totalPayable > 0 ? (totalPaidAmount / totalPayable) * 100 : 0;

    return {
      total,
      paid,
      pending,
      overdue,
      totalPaidAmount,
      totalPayable,
      remainingAmount,
      repaymentPercentage,
    };
  }, [schedule]);

  /* ------------------------------------------------------------
   * Generate EMI schedule
   * ------------------------------------------------------------ */
  const handleGenerate = async () => {
    if (!loanId) return;

    setGenerating(true);
    setError('');
    setSuccess('');

    try {
      await api.post(`/emi/generate/${loanId}`);
      setSuccess('EMI schedule generated successfully.');
      await fetchSchedule();
    } catch (err) {
      console.error('EMI generate error:', err);
      setError(err.response?.data?.message || 'Could not generate EMI schedule.');
    } finally {
      setGenerating(false);
    }
  };

  /* ------------------------------------------------------------
   * Payment drawer
   * ------------------------------------------------------------ */
  const openPayDrawer = (emi) => {
    setPayingEmi(emi);
    setPaymentForm({
      paid_amount: emi.emi_amount || '',
      payment_method: 'cash',
      payment_reference: '',
      paid_at: new Date().toISOString().split('T')[0],
      remarks: '',
    });
    setFormError('');
    setSuccess('');
    setPayDrawerOpen(true);
  };

  const closePayDrawer = () => {
    if (savingPayment) return;
    setPayDrawerOpen(false);
    setPayingEmi(null);
    setFormError('');
  };

  /* ------------------------------------------------------------
   * Handle Payment — FIXED: 'amount' and 'paid_date' sent
   * ------------------------------------------------------------ */
  const handlePay = async (event) => {
    event.preventDefault();
    if (!payingEmi) return;

    setFormError('');
    setSavingPayment(true);

    try {
      await api.patch(`/emi/${payingEmi.id}/pay`, {
        amount: Number(paymentForm.paid_amount),
        paid_date: paymentForm.paid_at,
        payment_method: paymentForm.payment_method,
        payment_reference: paymentForm.payment_reference,
        remarks: paymentForm.remarks,
      });

      setSuccess(
        `Installment #${payingEmi.installment_number} marked as paid.`
      );
      setPayDrawerOpen(false);
      setPayingEmi(null);
      await fetchSchedule();
    } catch (err) {
      console.error('EMI pay error:', err);

      const validationErrors = err.response?.data?.errors;
      const firstError = validationErrors
        ? Object.values(validationErrors)[0]?.[0]
        : null;

      setFormError(
        firstError ||
          err.response?.data?.message ||
          'Could not record payment.'
      );
    } finally {
      setSavingPayment(false);
    }
  };

  const hasFilters = statusFilter !== 'all' || searchQuery !== '';

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
                <span>Servicing</span>
                <span>/</span>
                <span className="text-slate-600">EMI</span>
                {loanId && (
                  <>
                    <span>/</span>
                    <span className="text-slate-600">Loan #{loanId}</span>
                  </>
                )}
              </div>

              <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950">
                {loanId ? `EMI Schedule · Loan #${loanId}` : 'EMI Schedules'}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                {loanId
                  ? 'Installment schedule for this loan.'
                  : 'Select a disbursed loan to view or generate its EMI schedule.'}
              </p>
            </div>

            {loanId && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/emi')}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M19 12H5" />
                    <path d="M12 19l-7-7 7-7" />
                  </svg>
                  All loans
                </button>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating || schedule.length > 0}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-600/15 disabled:cursor-not-allowed disabled:opacity-50"
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
                  {generating ? 'Generating...' : 'Generate schedule'}
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="p-8">
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

          {/* ============ GLOBAL VIEW ============ */}
          {!loanId && (
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Disbursed loans
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {queueLoading
                      ? 'Loading disbursed loans...'
                      : `${disbursedLoans.length} ${
                          disbursedLoans.length === 1 ? 'loan' : 'loans'
                        } available for EMI scheduling`}
                  </p>
                </div>
              </div>

              {queueLoading ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center">
                  <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600" />
                  <p className="mt-3 text-xs text-slate-500">
                    Loading disbursed loans...
                  </p>
                </div>
              ) : disbursedLoans.length === 0 ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                    <svg
                      className="h-6 w-6 text-slate-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-slate-900">
                    No disbursed loans
                  </h3>
                  <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                    Disburse a sanctioned loan first, then come back to
                    generate its EMI schedule.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/loans')}
                    className="mt-5 text-xs font-semibold text-blue-700 hover:text-blue-800"
                  >
                    Go to Loans →
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {disbursedLoans.map((loan) => (
                    <button
                      key={loan.id}
                      type="button"
                      onClick={() => navigate(`/emi/${loan.id}`)}
                      className="flex w-full items-center justify-between px-6 py-4 text-left transition hover:bg-slate-50/60"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                          <svg
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          >
                            <rect x="2" y="5" width="20" height="14" rx="2" />
                            <line x1="2" y1="10" x2="22" y2="10" />
                          </svg>
                        </div>

                        <div>
                          <p className="text-[13px] font-semibold text-slate-900">
                            {loan.lead?.name || '—'}
                          </p>
                          <p className="mt-0.5 text-[10.5px] text-slate-400">
                            Loan #{loan.id} ·{' '}
                            {formatCurrency(loan.principal_amount)} ·{' '}
                            {loan.tenure_months} months ·{' '}
                            {loan.interest_rate}% p.a.
                          </p>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                        Open schedule
                        <svg
                          className="h-3.5 w-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path d="M5 12h14" />
                          <path d="m12 5 7 7-7 7" />
                        </svg>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ============ SPECIFIC LOAN VIEW ============ */}
          {loanId && (
            <>
              {loanInfo && (
                <section className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                      Active loan
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-y-4 px-6 py-5 sm:grid-cols-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-400">
                        Applicant
                      </p>
                      <p className="mt-1 text-[13px] font-semibold text-slate-900">
                        {loanInfo.lead?.name || '—'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-400">
                        Principal
                      </p>
                      <p className="mt-1 text-[13px] font-semibold text-slate-900">
                        {formatCurrency(loanInfo.principal_amount)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-400">
                        Interest rate
                      </p>
                      <p className="mt-1 text-[13px] font-semibold text-slate-900">
                        {loanInfo.interest_rate}% p.a.
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-400">
                        Tenure
                      </p>
                      <p className="mt-1 text-[13px] font-semibold text-slate-900">
                        {loanInfo.tenure_months} months
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {!loading && schedule.length > 0 && (
                <section className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-semibold text-slate-900">
                          Repayment progress
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {summary.paid} of {summary.total} installments
                          cleared
                        </p>
                      </div>

                      <p className="text-2xl font-bold text-blue-700">
                        {summary.repaymentPercentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="px-6 py-5">
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            summary.repaymentPercentage,
                            100
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-4 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-400">
                          Total payable
                        </p>
                        <p className="mt-1 text-base font-semibold text-slate-900">
                          {formatCurrency(summary.totalPayable)}
                        </p>
                      </div>

                      <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 px-4 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-emerald-600">
                          Amount paid
                        </p>
                        <p className="mt-1 text-base font-semibold text-emerald-700">
                          {formatCurrency(summary.totalPaidAmount)}
                        </p>
                      </div>

                      <div className="rounded-lg border border-amber-100 bg-amber-50/60 px-4 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-amber-600">
                          Remaining
                        </p>
                        <p className="mt-1 text-base font-semibold text-amber-700">
                          {formatCurrency(summary.remainingAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {!loading && schedule.length > 0 && (
                <section className="mb-6 rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
                  <div className="grid grid-cols-2 gap-y-5 sm:grid-cols-4 sm:divide-x sm:divide-slate-100">
                    <div className="sm:pr-6">
                      <SummaryItem
                        label="Total installments"
                        value={summary.total}
                      />
                    </div>
                    <div className="sm:px-6">
                      <SummaryItem
                        label="Paid"
                        value={summary.paid}
                        color="text-emerald-700"
                      />
                    </div>
                    <div className="sm:px-6">
                      <SummaryItem
                        label="Pending"
                        value={summary.pending}
                        color="text-amber-700"
                      />
                    </div>
                    <div className="sm:pl-6">
                      <SummaryItem
                        label="Overdue"
                        value={summary.overdue}
                        color="text-red-700"
                      />
                    </div>
                  </div>
                </section>
              )}

              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Installment schedule
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {loading
                        ? 'Loading schedule...'
                        : `${filteredSchedule.length} of ${schedule.length} installments shown`}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(event) =>
                        setSearchQuery(event.target.value)
                      }
                      placeholder="Search by # or date..."
                      className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-600 sm:w-56"
                    />

                    <select
                      value={statusFilter}
                      onChange={(event) =>
                        setStatusFilter(event.target.value)
                      }
                      className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-blue-600"
                    >
                      <option value="all">All statuses</option>
                      <option value="pending">Pending</option>
                      <option value="partial">Partial</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </div>
                </div>

                {loading ? (
                  <div className="flex min-h-[340px] flex-col items-center justify-center">
                    <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600" />
                    <p className="mt-3 text-xs text-slate-500">
                      Loading EMI schedule...
                    </p>
                  </div>
                ) : filteredSchedule.length === 0 ? (
                  <div className="flex min-h-[340px] flex-col items-center justify-center px-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-100 bg-blue-50">
                      <svg
                        className="h-6 w-6 text-blue-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      >
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>

                    <h3 className="mt-4 text-sm font-semibold text-slate-900">
                      {hasFilters
                        ? 'No installments match these filters'
                        : 'No EMI schedule yet'}
                    </h3>

                    <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                      {hasFilters
                        ? 'Change your filters to view other installments.'
                        : 'Generate the EMI schedule to create the repayment plan for this loan.'}
                    </p>

                    {!hasFilters && schedule.length === 0 && (
                      <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={generating}
                        className="mt-5 text-xs font-semibold text-blue-700 hover:text-blue-800"
                      >
                        {generating
                          ? 'Generating...'
                          : 'Generate schedule →'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/70">
                          <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                            #
                          </th>
                          <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                            Due date
                          </th>
                          <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                            EMI amount
                          </th>
                          <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                            Principal
                          </th>
                          <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                            Interest
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
                        {filteredSchedule.map((item) => (
                          <tr
                            key={item.id}
                            className="transition hover:bg-slate-50/60"
                          >
                            <td className="px-5 py-4 text-[12.5px] font-medium text-slate-700">
                              {item.installment_number}
                            </td>

                            <td className="px-5 py-4 text-[12.5px] text-slate-700">
                              {formatDate(item.due_date)}
                            </td>

                            <td className="px-5 py-4 text-[12.5px] font-semibold text-slate-900">
                              {formatCurrency(item.emi_amount)}
                            </td>

                            <td className="px-5 py-4 text-[12.5px] text-slate-700">
                              {formatCurrency(item.principal_component)}
                            </td>

                            <td className="px-5 py-4 text-[12.5px] text-slate-700">
                              {formatCurrency(item.interest_component)}
                            </td>

                            <td className="px-5 py-4">
                              <StatusBadge status={item.status} />
                            </td>

                            <td className="px-5 py-4">
                              {item.status !== 'paid' ? (
                                <button
                                  type="button"
                                  disabled={actionLoadingId === item.id}
                                  onClick={() => openPayDrawer(item)}
                                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                                >
                                  {actionLoadingId === item.id
                                    ? 'Recording...'
                                    : 'Record payment'}
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>

      {payDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[1px]"
          onClick={closePayDrawer}
        />
      )}

      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-[520px] transform bg-white shadow-[-20px_0_50px_-30px_rgba(15,23,42,0.35)] transition-transform duration-300 ${
          payDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <form onSubmit={handlePay} className="flex h-full flex-col">
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                Payment record
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Record EMI payment
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {payingEmi
                  ? `Installment #${payingEmi.installment_number} · Due ${formatDate(payingEmi.due_date)}`
                  : 'Mark this installment as paid.'}
              </p>
            </div>

            <button
              type="button"
              onClick={closePayDrawer}
              disabled={savingPayment}
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

            {payingEmi && (
              <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-blue-600">
                      EMI due
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {formatCurrency(payingEmi.emi_amount)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-blue-600">
                      Due date
                    </p>
                    <p className="mt-1 text-[13px] font-semibold text-slate-900">
                      {formatDate(payingEmi.due_date)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Paid amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={paymentForm.paid_amount}
                  onChange={(event) =>
                    setPaymentForm({
                      ...paymentForm,
                      paid_amount: event.target.value,
                    })
                  }
                  className="h-11 w-full rounded-lg border border-slate-300 px-3.5 text-[13px] outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10"
                  placeholder="e.g. 23500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Payment method <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={paymentForm.payment_method}
                  onChange={(event) =>
                    setPaymentForm({
                      ...paymentForm,
                      payment_method: event.target.value,
                    })
                  }
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-[13px] outline-none transition focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="netbanking">Net banking</option>
                  <option value="nach">NACH auto-debit</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Payment reference
                </label>
                <input
                  type="text"
                  value={paymentForm.payment_reference}
                  onChange={(event) =>
                    setPaymentForm({
                      ...paymentForm,
                      payment_reference: event.target.value,
                    })
                  }
                  className="h-11 w-full rounded-lg border border-slate-300 px-3.5 text-[13px] outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10"
                  placeholder="e.g. UPI/TXN123456"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Paid on <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={paymentForm.paid_at}
                  onChange={(event) =>
                    setPaymentForm({
                      ...paymentForm,
                      paid_at: event.target.value,
                    })
                  }
                  className="h-11 w-full rounded-lg border border-slate-300 px-3.5 text-[13px] outline-none transition focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Remarks
                </label>
                <textarea
                  rows="3"
                  value={paymentForm.remarks}
                  onChange={(event) =>
                    setPaymentForm({
                      ...paymentForm,
                      remarks: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-[13px] outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10"
                  placeholder="Optional notes about this payment..."
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 bg-slate-50/60 px-6 py-4">
            <button
              type="button"
              onClick={closePayDrawer}
              disabled={savingPayment}
              className="h-9 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={savingPayment}
              className="flex h-9 min-w-[140px] items-center justify-center rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingPayment ? (
                <>
                  <span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Recording...
                </>
              ) : (
                'Record payment'
              )}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

export default Emi;