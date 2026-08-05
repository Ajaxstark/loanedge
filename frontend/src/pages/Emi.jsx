import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const statusStyles = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
};

function StatusBadge({ status }) {
  const style = statusStyles[status] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${style}`}>
      {status}
    </span>
  );
}

function StatCard({ label, value, icon, iconBg, iconColor }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${iconBg}`}>
        <div className={iconColor}>{icon}</div>
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function Emi() {
  const { loanId } = useParams();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [generating, setGenerating] = useState(false);

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  const fetchSchedule = () => {
    setLoading(true);
    const url = loanId
      ? `http://localhost:8000/api/v1/emi/loan/${loanId}`
      : `http://localhost:8000/api/v1/emi`;

    axios
      .get(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => {
        setSchedule(response.data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.log('Error:', err);
        setError('Could not load EMI schedule.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loanId]);

  const handleGenerate = () => {
    if (!loanId) return;
    setGenerating(true);
    axios
      .post(
        `http://localhost:8000/api/v1/emi/generate/${loanId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        fetchSchedule();
      })
      .catch((err) => {
        console.log('Error:', err);
        setError(err.response?.data?.message || 'Could not generate EMI schedule.');
      })
      .finally(() => setGenerating(false));
  };

  const handlePay = (id) => {
    setActionLoadingId(id);
    axios
      .patch(
        `http://localhost:8000/api/v1/emi/${id}/pay`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        fetchSchedule();
      })
      .catch((err) => {
        console.log('Error:', err);
        setError('Could not record payment.');
      })
      .finally(() => setActionLoadingId(null));
  };

  const filteredSchedule = schedule.filter((item) => {
    return statusFilter === 'all' || item.status === statusFilter;
  });

  // Stats calculation
  const totalInstallments = schedule.length;
  const paidInstallments = schedule.filter((s) => s.status === 'paid').length;
  const pendingInstallments = schedule.filter((s) => s.status === 'pending').length;
  const overdueInstallments = schedule.filter((s) => s.status === 'overdue').length;
  const totalPaidAmount = schedule
    .filter((s) => s.status === 'paid')
    .reduce((sum, s) => sum + Number(s.paid_amount || s.emi_amount || 0), 0);

  const formatCurrency = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 bg-gray-50 min-h-screen">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">EMI Schedule</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {loanId ? 'Installment schedule for this loan' : 'Track all EMI installments'}
            </p>
          </div>
          {loanId && (
            <button
              onClick={handleGenerate}
              disabled={generating || schedule.length > 0}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {generating ? 'Generating...' : 'Generate Schedule'}
            </button>
          )}
        </div>

        <div className="p-8">
          {/* Stats cards */}
          {!loading && schedule.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                label="Total Installments"
                value={totalInstallments}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                icon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                }
              />
              <StatCard
                label="Paid"
                value={paidInstallments}
                iconBg="bg-green-50"
                iconColor="text-green-600"
                icon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M9 12l2 2 4-4" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                }
              />
              <StatCard
                label="Pending"
                value={pendingInstallments}
                iconBg="bg-amber-50"
                iconColor="text-amber-600"
                icon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4l3 3" />
                  </svg>
                }
              />
              <StatCard
                label="Overdue"
                value={overdueInstallments}
                iconBg="bg-red-50"
                iconColor="text-red-600"
                icon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                }
              />
            </div>
          )}

          {/* Filter */}
          <div className="mb-5 flex flex-col sm:flex-row gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
              <p className="text-sm text-gray-500">Fetching EMI schedule...</p>
            </div>
          ) : filteredSchedule.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {statusFilter !== 'all' ? 'No matching installments' : 'No EMI schedule yet'}
              </h3>
              <p className="text-sm text-gray-500 max-w-xs">
                {statusFilter !== 'all'
                  ? 'Try a different status filter.'
                  : loanId
                  ? 'Click "Generate Schedule" to create the EMI plan for this loan.'
                  : 'No installments found across any loans.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider border-b border-gray-100">
                    {!loanId && <th className="px-6 py-3.5 font-medium">Lead</th>}
                    <th className="px-6 py-3.5 font-medium">#</th>
                    <th className="px-6 py-3.5 font-medium">Due Date</th>
                    <th className="px-6 py-3.5 font-medium">EMI Amount</th>
                    <th className="px-6 py-3.5 font-medium">Principal</th>
                    <th className="px-6 py-3.5 font-medium">Interest</th>
                    <th className="px-6 py-3.5 font-medium">Status</th>
                    <th className="px-6 py-3.5 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSchedule.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      {!loanId && (
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {item.loan?.lead?.name || '—'}
                        </td>
                      )}
                      <td className="px-6 py-4 text-gray-600">{item.installment_number}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {item.due_date ? new Date(item.due_date).toLocaleDateString('en-IN') : '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-900 font-medium">
                        ₹{Number(item.emi_amount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        ₹{Number(item.principal_component).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        ₹{Number(item.interest_component).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-6 py-4">
                        {item.status !== 'paid' ? (
                          <button
                            disabled={actionLoadingId === item.id}
                            onClick={() => handlePay(item.id)}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50"
                          >
                            Mark as Paid
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Summary footer */}
          {!loading && schedule.length > 0 && (
            <div className="mt-4 text-sm text-gray-500 flex justify-end">
              Total Paid: <span className="font-semibold text-gray-900 ml-1">{formatCurrency(totalPaidAmount)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Emi;