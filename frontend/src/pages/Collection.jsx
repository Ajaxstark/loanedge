import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const API_BASE = 'http://localhost:8000/api/v1';

const bucketStyles = {
  current: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '0-30': 'bg-blue-50 text-blue-700 border-blue-200',
  '30-60': 'bg-amber-50 text-amber-700 border-amber-200',
  '60-90': 'bg-orange-50 text-orange-700 border-orange-200',
  '90+': 'bg-red-50 text-red-700 border-red-200',
};

const statusStyles = {
  active: 'bg-amber-50 text-amber-700 border-amber-200',
  recovered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  legal_notice: 'bg-red-50 text-red-700 border-red-200',
};

function BucketBadge({ bucket }) {
  const style =
    bucketStyles[bucket] || 'bg-slate-50 text-slate-600 border-slate-200';

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10.5px] font-semibold ${style}`}
    >
      {bucket || '—'}
    </span>
  );
}

function StatusBadge({ status }) {
  const style =
    statusStyles[status] || 'bg-slate-50 text-slate-600 border-slate-200';

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10.5px] font-semibold capitalize ${style}`}
    >
      {status ? status.replace('_', ' ') : '—'}
    </span>
  );
}

function NpaBadge({ isNpa }) {
  if (!isNpa) return <span className="text-xs text-slate-400">—</span>;

  return (
    <span className="inline-flex rounded-full border border-red-200 bg-red-600 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-white">
      NPA
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

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '—';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function Collection() {
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [recalculating, setRecalculating] = useState(false);

  const [bucketFilter, setBucketFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [editMap, setEditMap] = useState({});

  const token =
    localStorage.getItem('token') || sessionStorage.getItem('token');

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  };

  const fetchRecords = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`${API_BASE}/collections`, authConfig);
      setRecords(response.data.data || []);
    } catch (err) {
      console.error('Collection fetch error:', err);
      setError(
        err.response?.data?.message || 'Unable to load collection records.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRecalculate = async () => {
    setRecalculating(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(
        `${API_BASE}/collections/recalculate`,
        {},
        authConfig
      );

      setSuccess(
        response.data?.message || 'Collection records recalculated.'
      );
      await fetchRecords();
    } catch (err) {
      console.error('Recalculate error:', err);
      setError(
        err.response?.data?.message || 'Could not recalculate collections.'
      );
    } finally {
      setRecalculating(false);
    }
  };

  const handleUpdate = async (id) => {
    setActionLoadingId(id);
    setError('');
    setSuccess('');

    const edits = editMap[id] || {};

    try {
      await axios.patch(`${API_BASE}/collections/${id}`, edits, authConfig);
      setSuccess('Collection record updated successfully.');
      setEditMap({ ...editMap, [id]: {} });
      await fetchRecords();
    } catch (err) {
      console.error('Collection update error:', err);
      setError(err.response?.data?.message || 'Could not update record.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const setEditField = (id, field, value) => {
    setEditMap({ ...editMap, [id]: { ...editMap[id], [field]: value } });
  };

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const matchesBucket =
        bucketFilter === 'all' || rec.bucket === bucketFilter;

      const matchesStatus =
        statusFilter === 'all' || rec.status === statusFilter;

      const matchesSearch =
        !searchQuery ||
        (rec.loan?.lead?.name || '')
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (rec.recovery_agent || '')
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      return matchesBucket && matchesStatus && matchesSearch;
    });
  }, [records, bucketFilter, statusFilter, searchQuery]);

  const summary = useMemo(() => {
    const total = records.length;
    const npa = records.filter((r) => r.is_npa).length;
    const recovered = records.filter((r) => r.status === 'recovered').length;
    const legalNotice = records.filter(
      (r) => r.status === 'legal_notice'
    ).length;

    const totalOverdue = records.reduce((sum, r) => {
      // loan_amount backend se loan.principal_amount se aata hai
      return sum + Number(r.loan?.principal_amount || 0);
    }, 0);

    return { total, npa, recovered, legalNotice, totalOverdue };
  }, [records]);

  const hasFilters =
    bucketFilter !== 'all' || statusFilter !== 'all' || searchQuery !== '';

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
                <span className="text-slate-600">Collection & Recovery</span>
              </div>

              <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950">
                Collection & Recovery
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Track overdue payments, NPA accounts and recovery.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRecalculate}
              disabled={recalculating}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-600/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg
                className={`h-4 w-4 ${recalculating ? 'animate-spin' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                <path d="M21 3v6h-6" />
              </svg>
              {recalculating ? 'Recalculating...' : 'Recalculate'}
            </button>
          </div>
        </header>

        <div className="p-8">
          {/* Summary */}
          {!loading && records.length > 0 && (
            <section className="mb-6 rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
              <div className="grid grid-cols-2 gap-y-5 sm:grid-cols-4 sm:divide-x sm:divide-slate-100">
                <div className="sm:pr-6">
                  <SummaryItem label="Total records" value={summary.total} />
                </div>
                <div className="sm:px-6">
                  <SummaryItem
                    label="NPA accounts"
                    value={summary.npa}
                    color="text-red-700"
                  />
                </div>
                <div className="sm:px-6">
                  <SummaryItem
                    label="Legal notices"
                    value={summary.legalNotice}
                    color="text-orange-700"
                  />
                </div>
                <div className="sm:pl-6">
                  <SummaryItem
                    label="Recovered"
                    value={summary.recovered}
                    color="text-emerald-700"
                  />
                </div>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-400">
                    Total portfolio value
                  </p>
                  <p className="text-lg font-semibold text-slate-900">
                    {formatCurrency(summary.totalOverdue)}
                  </p>
                </div>
              </div>
            </section>
          )}

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
                  Collection records
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  {loading
                    ? 'Loading records...'
                    : `${filteredRecords.length} of ${records.length} records shown`}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by applicant or agent..."
                  className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-600 sm:w-56"
                />

                <select
                  value={bucketFilter}
                  onChange={(event) => setBucketFilter(event.target.value)}
                  className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-blue-600"
                >
                  <option value="all">All buckets</option>
                  <option value="current">Current</option>
                  <option value="0-30">0-30 days</option>
                  <option value="30-60">30-60 days</option>
                  <option value="60-90">60-90 days</option>
                  <option value="90+">90+ days</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-blue-600"
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="legal_notice">Legal notice</option>
                  <option value="recovered">Recovered</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[340px] flex-col items-center justify-center">
                <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600" />
                <p className="mt-3 text-xs text-slate-500">
                  Loading collection records...
                </p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="flex min-h-[340px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-100 bg-blue-50">
                  <svg
                    className="h-6 w-6 text-blue-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <path d="M12 8v4l3 3" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </div>

                <h3 className="mt-4 text-sm font-semibold text-slate-900">
                  {hasFilters
                    ? 'No records match these filters'
                    : 'No collection records yet'}
                </h3>

                <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                  {hasFilters
                    ? 'Change your filters to view other records.'
                    : 'Click Recalculate to scan all active loans and generate collection records from overdue EMIs.'}
                </p>

                {!hasFilters && (
                  <button
                    type="button"
                    onClick={handleRecalculate}
                    disabled={recalculating}
                    className="mt-5 text-xs font-semibold text-blue-700 hover:text-blue-800"
                  >
                    {recalculating ? 'Recalculating...' : 'Recalculate now →'}
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70">
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Applicant
                      </th>
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Loan amount
                      </th>
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Overdue days
                      </th>
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Bucket
                      </th>
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        NPA
                      </th>
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Recovery agent
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
                    {filteredRecords.map((rec) => (
                      <tr
                        key={rec.id}
                        className="align-top transition hover:bg-slate-50/60"
                      >
                        <td className="px-5 py-4">
                          <p className="text-[13px] font-semibold text-slate-900">
                            {rec.loan?.lead?.name || '—'}
                          </p>
                          <p className="mt-0.5 text-[10.5px] text-slate-400">
                            Loan #{rec.loan_id}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-[12.5px] font-semibold text-slate-900">
                          {formatCurrency(rec.loan?.principal_amount)}
                        </td>

                        <td className="px-5 py-4 text-[12.5px] text-slate-700">
                          {rec.overdue_days} days
                        </td>

                        <td className="px-5 py-4">
                          <BucketBadge bucket={rec.bucket} />
                        </td>

                        <td className="px-5 py-4">
                          <NpaBadge isNpa={rec.is_npa} />
                        </td>

                        <td className="px-5 py-4">
                          <input
                            type="text"
                            placeholder="Assign agent"
                            defaultValue={rec.recovery_agent || ''}
                            onChange={(event) =>
                              setEditField(
                                rec.id,
                                'recovery_agent',
                                event.target.value
                              )
                            }
                            className="h-9 w-32 rounded-lg border border-slate-300 px-2.5 text-[11.5px] outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10"
                          />
                        </td>

                        <td className="px-5 py-4">
                          <select
                            defaultValue={rec.status}
                            onChange={(event) =>
                              setEditField(
                                rec.id,
                                'status',
                                event.target.value
                              )
                            }
                            className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-[11.5px] outline-none transition focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10"
                          >
                            <option value="active">Active</option>
                            <option value="legal_notice">Legal notice</option>
                            <option value="recovered">Recovered</option>
                          </select>

                          <div className="mt-1.5">
                            <StatusBadge status={rec.status} />
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <button
                            type="button"
                            disabled={actionLoadingId === rec.id}
                            onClick={() => handleUpdate(rec.id)}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                          >
                            {actionLoadingId === rec.id
                              ? 'Saving...'
                              : 'Save'}
                          </button>
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
    </div>
  );
}

export default Collection;