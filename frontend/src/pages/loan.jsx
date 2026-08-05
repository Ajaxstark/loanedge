import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const statusStyles = {
  sanctioned: 'bg-blue-100 text-blue-700',
  disbursed: 'bg-cyan-100 text-cyan-700',
  active: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
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

function Loan() {
  const { leadId } = useParams();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm] = useState({
    lead_id: '',
    approval_id: '',
    loan_product_id: '',
    principal_amount: '',
    interest_rate: '',
    tenure_months: '',
  });

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  const fetchLoans = () => {
    setLoading(true);
    const url = leadId
      ? `http://localhost:8000/api/v1/loans/lead/${leadId}`
      : `http://localhost:8000/api/v1/loans`;

    axios
      .get(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => {
        setLoans(response.data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.log('Error:', err);
        setError('Could not load loans.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLoans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    axios
      .post(
        'http://localhost:8000/api/v1/loans',
        {
          lead_id: leadId || form.lead_id,
          approval_id: form.approval_id,
          loan_product_id: form.loan_product_id,
          principal_amount: form.principal_amount,
          interest_rate: form.interest_rate,
          tenure_months: form.tenure_months,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        setShowForm(false);
        setForm({
          lead_id: '',
          approval_id: '',
          loan_product_id: '',
          principal_amount: '',
          interest_rate: '',
          tenure_months: '',
        });
        fetchLoans();
      })
      .catch((err) => {
        console.log('Error:', err);
        setError('Could not sanction loan. Please check the values entered.');
      })
      .finally(() => setSaving(false));
  };

  const handleDisburse = (id) => {
    setActionLoadingId(id);
    axios
      .patch(
        `http://localhost:8000/api/v1/loans/${id}/disburse`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        fetchLoans();
      })
      .catch((err) => {
        console.log('Error:', err);
        setError('Could not disburse loan.');
      })
      .finally(() => setActionLoadingId(null));
  };

  const handleClose = (id) => {
    setActionLoadingId(id);
    axios
      .patch(
        `http://localhost:8000/api/v1/loans/${id}/close`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        fetchLoans();
      })
      .catch((err) => {
        console.log('Error:', err);
        setError('Could not close loan.');
      })
      .finally(() => setActionLoadingId(null));
  };

  const filteredLoans = loans.filter((loan) => {
    return statusFilter === 'all' || loan.status === statusFilter;
  });

  // Stats calculation
  const totalLoans = loans.length;
  const sanctionedLoans = loans.filter((l) => l.status === 'sanctioned').length;
  const disbursedLoans = loans.filter((l) => l.status === 'disbursed' || l.status === 'active').length;
  const totalDisbursedAmount = loans
    .filter((l) => l.status === 'disbursed' || l.status === 'active' || l.status === 'closed')
    .reduce((sum, l) => sum + Number(l.principal_amount || 0), 0);

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
            <h1 className="text-2xl font-bold text-gray-900">Loans</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {leadId ? 'Loans for this lead' : 'Manage sanctioned and disbursed loans'}
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Sanction Loan
          </button>
        </div>

        <div className="p-8">
          {/* Stats cards */}
          {!loading && loans.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                label="Total Loans"
                value={totalLoans}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                icon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                }
              />
              <StatCard
                label="Sanctioned"
                value={sanctionedLoans}
                iconBg="bg-amber-50"
                iconColor="text-amber-600"
                icon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M9 12l2 2 4-4" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                }
              />
              <StatCard
                label="Disbursed/Active"
                value={disbursedLoans}
                iconBg="bg-green-50"
                iconColor="text-green-600"
                icon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 2v20M2 12h20" />
                  </svg>
                }
              />
              <StatCard
                label="Total Disbursed"
                value={formatCurrency(totalDisbursedAmount)}
                iconBg="bg-purple-50"
                iconColor="text-purple-600"
                icon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
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
              <option value="sanctioned">Sanctioned</option>
              <option value="disbursed">Disbursed</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4 mb-6 max-w-xl"
            >
              <h3 className="text-base font-semibold text-gray-900 mb-2">Sanction New Loan</h3>

              {!leadId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lead ID</label>
                  <input
                    type="number"
                    required
                    value={form.lead_id}
                    onChange={(e) => setForm({ ...form, lead_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Approval ID</label>
                <input
                  type="number"
                  required
                  value={form.approval_id}
                  onChange={(e) => setForm({ ...form, approval_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="ID of the approved approval request"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loan Product ID</label>
                <input
                  type="number"
                  required
                  value={form.loan_product_id}
                  onChange={(e) => setForm({ ...form, loan_product_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Principal Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={form.principal_amount}
                  onChange={(e) => setForm({ ...form, principal_amount: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (% per annum)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={form.interest_rate}
                  onChange={(e) => setForm({ ...form, interest_rate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tenure (months)</label>
                <input
                  type="number"
                  required
                  value={form.tenure_months}
                  onChange={(e) => setForm({ ...form, tenure_months: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition disabled:opacity-50"
                >
                  {saving ? 'Sanctioning...' : 'Sanction Loan'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-sm font-medium px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
              <p className="text-sm text-gray-500">Fetching loans...</p>
            </div>
          ) : filteredLoans.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {statusFilter !== 'all' ? 'No matching loans' : 'No loans yet'}
              </h3>
              <p className="text-sm text-gray-500 max-w-xs">
                {statusFilter !== 'all'
                  ? 'Try a different status filter.'
                  : 'Sanction a loan once an approval request is approved.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider border-b border-gray-100">
                    {!leadId && <th className="px-6 py-3.5 font-medium">Lead</th>}
                    <th className="px-6 py-3.5 font-medium">Product</th>
                    <th className="px-6 py-3.5 font-medium">Principal</th>
                    <th className="px-6 py-3.5 font-medium">Interest Rate</th>
                    <th className="px-6 py-3.5 font-medium">Tenure</th>
                    <th className="px-6 py-3.5 font-medium">Status</th>
                    <th className="px-6 py-3.5 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLoans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-gray-50 transition">
                      {!leadId && (
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {loan.lead?.name || '—'}
                        </td>
                      )}
                      <td className="px-6 py-4 text-gray-600">
                        {loan.loan_product?.name || '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-900 font-medium">
                        ₹{Number(loan.principal_amount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{loan.interest_rate}%</td>
                      <td className="px-6 py-4 text-gray-600">{loan.tenure_months} months</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={loan.status} />
                      </td>
                      <td className="px-6 py-4">
                        {loan.status === 'sanctioned' && (
                          <button
                            disabled={actionLoadingId === loan.id}
                            onClick={() => handleDisburse(loan.id)}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 transition disabled:opacity-50"
                          >
                            Disburse
                          </button>
                        )}
                        {(loan.status === 'disbursed' || loan.status === 'active') && (
                          <button
                            disabled={actionLoadingId === loan.id}
                            onClick={() => handleClose(loan.id)}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition disabled:opacity-50"
                          >
                            Close Loan
                          </button>
                        )}
                        {loan.status === 'closed' && (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Loan;