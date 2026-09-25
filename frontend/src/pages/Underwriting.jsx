import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const API_URL = 'http://localhost:8000/api/v1';

const riskStyles = {
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-red-50 text-red-700 border-red-200',
};

function RiskBadge({ risk }) {
  if (!risk) return <span className="text-xs text-slate-400">—</span>;

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10.5px] font-semibold capitalize ${
        riskStyles[risk] || 'border-slate-200 bg-slate-50 text-slate-600'
      }`}
    >
      {risk} risk
    </span>
  );
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '—';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value));
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

function Underwriting() {
  const { leadId } = useParams();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [riskFilter, setRiskFilter] = useState('all');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [prefill, setPrefill] = useState(null);
  const [prefillLoading, setPrefillLoading] = useState(false);

  const [cibilScore, setCibilScore] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const token =
    localStorage.getItem('token') ||
    sessionStorage.getItem('token');

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  };

  const fetchReports = async () => {
    setLoading(true);
    setError('');

    try {
      const url = leadId
        ? `${API_URL}/underwriting/lead/${leadId}`
        : `${API_URL}/underwriting`;

      const response = await axios.get(url, authConfig);
      setReports(response.data.data || []);
    } catch (err) {
      console.error('Underwriting fetch error:', err);
      setError(
        err.response?.data?.message ||
          'Unable to load underwriting reports.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  const filteredReports = useMemo(() => {
    if (riskFilter === 'all') return reports;
    return reports.filter((r) => r.risk_category === riskFilter);
  }, [reports, riskFilter]);

  const summary = useMemo(
    () => ({
      total: reports.length,
      low: reports.filter((r) => r.risk_category === 'low').length,
      medium: reports.filter((r) => r.risk_category === 'medium').length,
      high: reports.filter((r) => r.risk_category === 'high').length,
    }),
    [reports]
  );

  const openDrawer = async () => {
    setSuccess('');
    setFormError('');
    setCibilScore('');
    setPrefill(null);
    setDrawerOpen(true);

    if (!leadId) return;

    setPrefillLoading(true);

    try {
      const response = await axios.get(
        `${API_URL}/underwriting/prefill/${leadId}`,
        authConfig
      );

      setPrefill(response.data.data);
    } catch (err) {
      console.error('Prefill fetch error:', err);
      setFormError(
        err.response?.data?.message ||
          'Unable to load applicant data for this lead.'
      );
    } finally {
      setPrefillLoading(false);
    }
  };

  const closeDrawer = () => {
    if (saving) return;

    setDrawerOpen(false);
    setPrefill(null);
    setCibilScore('');
    setFormError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setSuccess('');

    if (!cibilScore || cibilScore < 300 || cibilScore > 900) {
      setFormError('Please enter a valid CIBIL score between 300 and 900.');
      return;
    }

    setSaving(true);

    try {
      await axios.post(
        `${API_URL}/underwriting`,
        {
          lead_id: leadId,
          cibil_score: Number(cibilScore),
        },
        authConfig
      );

      setDrawerOpen(false);
      setPrefill(null);
      setCibilScore('');

      setSuccess('Underwriting report generated successfully.');
      await fetchReports();
    } catch (err) {
      console.error('Underwriting create error:', err);

      const validationErrors = err.response?.data?.errors;
      const firstError = validationErrors
        ? Object.values(validationErrors)[0]?.[0]
        : null;

      setFormError(
        firstError ||
          err.response?.data?.message ||
          'Unable to generate underwriting report.'
      );
    } finally {
      setSaving(false);
    }
  };

  const hasFilters = riskFilter !== 'all';

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
                <span className="text-slate-600">Underwriting</span>
              </div>

              <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950">
                Underwriting
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                {leadId
                  ? 'Risk assessment for this applicant.'
                  : 'Assess risk and generate credit reports.'}
              </p>
            </div>

            {leadId && (
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
                Generate report
              </button>
            )}
          </div>
        </header>

        <div className="p-8">
          {/* Summary */}
          <section className="mb-6 rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <div className="grid grid-cols-2 gap-y-5 sm:grid-cols-4 sm:divide-x sm:divide-slate-100">
              <div className="sm:pr-6">
                <SummaryItem label="Total reports" value={summary.total} />
              </div>
              <div className="sm:px-6">
                <SummaryItem
                  label="Low risk"
                  value={summary.low}
                  color="text-emerald-700"
                />
              </div>
              <div className="sm:px-6">
                <SummaryItem
                  label="Medium risk"
                  value={summary.medium}
                  color="text-amber-700"
                />
              </div>
              <div className="sm:pl-6">
                <SummaryItem
                  label="High risk"
                  value={summary.high}
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
            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Assessment queue
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {loading
                    ? 'Loading assessments...'
                    : `${filteredReports.length} of ${reports.length} reports shown`}
                </p>
              </div>

              <select
                value={riskFilter}
                onChange={(event) => setRiskFilter(event.target.value)}
                className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-blue-600"
              >
                <option value="all">All risk levels</option>
                <option value="low">Low risk</option>
                <option value="medium">Medium risk</option>
                <option value="high">High risk</option>
              </select>
            </div>

            {loading ? (
              <div className="flex min-h-[340px] flex-col items-center justify-center">
                <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600" />
                <p className="mt-3 text-xs text-slate-500">
                  Loading underwriting reports...
                </p>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="flex min-h-[340px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-100 bg-blue-50">
                  <svg
                    className="h-6 w-6 text-blue-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                </div>

                <h3 className="mt-4 text-sm font-semibold text-slate-900">
                  {hasFilters
                    ? 'No reports match this filter'
                    : 'No underwriting reports yet'}
                </h3>

                <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                  {hasFilters
                    ? 'Change your filter to view other reports.'
                    : 'Open a lead and generate an underwriting report.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70">
                      {!leadId && (
                        <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                          Applicant
                        </th>
                      )}
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Monthly income
                      </th>
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Existing EMI
                      </th>
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        CIBIL
                      </th>
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Risk category
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredReports.map((report) => (
                      <tr
                        key={report.id}
                        className="transition hover:bg-slate-50/60"
                      >
                        {!leadId && (
                          <td className="px-5 py-4">
                            <p className="text-[13px] font-semibold text-slate-900">
                              {report.lead?.name || 'Unknown applicant'}
                            </p>
                            <p className="mt-0.5 text-[10.5px] text-slate-400">
                              Lead #{report.lead_id}
                            </p>
                          </td>
                        )}

                        <td className="px-5 py-4 text-[12.5px] font-medium text-slate-700">
                          {formatCurrency(report.monthly_income)}
                        </td>

                        <td className="px-5 py-4 text-[12.5px] font-medium text-slate-700">
                          {formatCurrency(report.existing_emi)}
                        </td>

                        <td className="px-5 py-4 text-[12.5px] font-medium text-slate-700">
                          {report.cibil_score}
                        </td>

                        <td className="px-5 py-4">
                          <RiskBadge risk={report.risk_category} />
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

      {/* Generate report drawer */}
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-[520px] transform bg-white shadow-[-20px_0_50px_-30px_rgba(15,23,42,0.35)] transition-transform duration-300 ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-700">
                Credit assessment
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                Generate underwriting report
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Applicant's financial data is pre-filled from their application.
                Only credit score is required.
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

            {prefillLoading ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto h-6 w-6 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600" />
                  <p className="mt-3 text-[11px] text-slate-500">
                    Loading applicant data...
                  </p>
                </div>
              </div>
            ) : prefill ? (
              <div className="space-y-6">
                {/* Applicant */}
                <div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                    Applicant
                  </h3>

                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">
                          Name
                        </p>
                        <p className="mt-0.5 text-[12.5px] font-semibold text-slate-900">
                          {prefill.lead.name}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">
                          Application
                        </p>
                        <p className="mt-0.5 font-mono text-[11.5px] font-semibold text-slate-800">
                          {prefill.application.application_number}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">
                          Phone
                        </p>
                        <p className="mt-0.5 text-[12px] text-slate-700">
                          {prefill.lead.phone || '—'}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">
                          Email
                        </p>
                        <p className="mt-0.5 truncate text-[12px] text-slate-700">
                          {prefill.lead.email || '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial data (read-only) */}
                <div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                    Declared financial data
                  </h3>

                  <div className="rounded-xl border border-slate-200 bg-white">
                    <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100">
                      <div className="p-4">
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">
                          Monthly income
                        </p>
                        <p className="mt-1 text-base font-bold text-slate-900">
                          {formatCurrency(prefill.application.monthly_income)}
                        </p>
                      </div>

                      <div className="p-4">
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">
                          Existing EMI
                        </p>
                        <p className="mt-1 text-base font-bold text-slate-900">
                          {formatCurrency(prefill.application.existing_emi)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 divide-x divide-slate-100">
                      <div className="p-4">
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">
                          Requested amount
                        </p>
                        <p className="mt-1 text-base font-bold text-slate-900">
                          {formatCurrency(prefill.application.requested_amount)}
                        </p>
                      </div>

                      <div className="p-4">
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">
                          Requested tenure
                        </p>
                        <p className="mt-1 text-base font-bold text-slate-900">
                          {prefill.application.requested_tenure_months || '—'}{' '}
                          months
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="mt-2 text-[10.5px] text-slate-400">
                    Auto-filled from customer application. Read-only.
                  </p>
                </div>

                {/* CIBIL score */}
                <div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                    Credit bureau input
                  </h3>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      CIBIL score (300 – 900)
                      <span className="ml-1 text-red-500">*</span>
                    </label>

                    <input
                      type="number"
                      required
                      min="300"
                      max="900"
                      autoFocus
                      value={cibilScore}
                      onChange={(event) => {
                        setCibilScore(event.target.value);
                        setFormError('');
                      }}
                      placeholder="e.g. 760"
                      className="h-11 w-full rounded-lg border border-slate-300 px-3.5 text-[13px] outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10"
                    />

                    <p className="mt-1.5 text-[10.5px] leading-4 text-slate-400">
                      In a production system, this score would be fetched
                      automatically from CRIF or TransUnion via bureau APIs.
                    </p>
                  </div>
                </div>

                {/* Info */}
                <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3">
                  <p className="text-[10.5px] leading-4 text-slate-600">
                    Risk category will be calculated automatically using CIBIL
                    score and EMI-to-income ratio.
                  </p>
                </div>
              </div>
            ) : null}
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
              disabled={saving || prefillLoading || !prefill}
              className="flex h-9 min-w-[140px] items-center justify-center rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Generating...
                </>
              ) : (
                'Generate report'
              )}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

export default Underwriting;