import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const statusStyles = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const levelStyles = {
  branch_manager: 'bg-blue-50 text-blue-700 border-blue-200',
  credit_committee: 'bg-purple-50 text-purple-700 border-purple-200',
};

const levelLabels = {
  branch_manager: 'Branch Manager',
  credit_committee: 'Credit Committee',
};

function StatusBadge({ status }) {
  const style = statusStyles[status] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${style}`}>
      {status}
    </span>
  );
}

function LevelBadge({ level }) {
  const style = levelStyles[level] || 'bg-gray-50 text-gray-700 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded border text-xs font-medium ${style}`}>
      {levelLabels[level] || level}
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

function Approval() {
  const { leadId } = useParams();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ lead_id: '', loan_amount: '' });
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [remarksMap, setRemarksMap] = useState({});
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  const fetchApprovals = () => {
    setLoading(true);
    const url = leadId
      ? `http://localhost:8000/api/v1/approvals/lead/${leadId}`
      : `http://localhost:8000/api/v1/approvals`;

    axios
      .get(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => {
        setApprovals(response.data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.log('Error:', err);
        setError('Could not load approvals.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchApprovals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    axios
      .post(
        'http://localhost:8000/api/v1/approvals',
        { lead_id: leadId || form.lead_id, loan_amount: form.loan_amount },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        setShowForm(false);
        setForm({ lead_id: '', loan_amount: '' });
        fetchApprovals();
      })
      .catch((err) => {
        console.log('Error:', err);
        setError('Could not create approval request.');
      })
      .finally(() => setSaving(false));
  };

  const handleDecision = (id, status) => {
    setActionLoadingId(id);
    axios
      .patch(
        `http://localhost:8000/api/v1/approvals/${id}`,
        { status, remarks: remarksMap[id] || '' },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        fetchApprovals();
      })
      .catch((err) => {
        console.log('Error:', err);
        setError('Could not update approval status.');
      })
      .finally(() => setActionLoadingId(null));
  };

  const filteredApprovals = approvals.filter((approval) => {
    const matchesStatus = statusFilter === 'all' || approval.status === statusFilter;
    const matchesLevel = levelFilter === 'all' || approval.approver_level === levelFilter;
    return matchesStatus && matchesLevel;
  });

  // Stats calculation
  const totalApprovals = approvals.length;
  const pendingApprovals = approvals.filter((a) => a.status === 'pending').length;
  const approvedApprovals = approvals.filter((a) => a.status === 'approved').length;
  const rejectedApprovals = approvals.filter((a) => a.status === 'rejected').length;

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 bg-gray-50 min-h-screen">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Loan Approval</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {leadId ? 'Approval requests for this lead' : 'Track and manage loan approval requests'}
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
            Request Approval
          </button>
        </div>

        <div className="p-8">
          {/* Stats cards */}
          {!loading && approvals.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                label="Total Requests"
                value={totalApprovals}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                icon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M9 12l2 2 4-4" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                }
              />
              <StatCard
                label="Pending"
                value={pendingApprovals}
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
                label="Approved"
                value={approvedApprovals}
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
                label="Rejected"
                value={rejectedApprovals}
                iconBg="bg-red-50"
                iconColor="text-red-600"
                icon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                }
              />
            </div>
          )}

          {/* Filters */}
          <div className="mb-5 flex flex-col sm:flex-row gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Approver Levels</option>
              <option value="branch_manager">Branch Manager</option>
              <option value="credit_committee">Credit Committee</option>
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
              <h3 className="text-base font-semibold text-gray-900 mb-2">Request Loan Approval</h3>

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
                <label className="block text-sm font-medium text-gray-700 mb-1">Loan Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={form.loan_amount}
                  onChange={(e) => setForm({ ...form, loan_amount: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <p className="text-xs text-gray-400 mt-1">
                  ₹5 lakh se kam → Branch Manager, usse zyada → Credit Committee
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition disabled:opacity-50"
                >
                  {saving ? 'Submitting...' : 'Submit Request'}
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
              <p className="text-sm text-gray-500">Fetching approvals...</p>
            </div>
          ) : filteredApprovals.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {statusFilter !== 'all' || levelFilter !== 'all' ? 'No matching requests' : 'No approval requests yet'}
              </h3>
              <p className="text-sm text-gray-500 max-w-xs">
                {statusFilter !== 'all' || levelFilter !== 'all'
                  ? 'Try adjusting your filters.'
                  : 'Submit a loan amount to route it to the right approver.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider border-b border-gray-100">
                    {!leadId && <th className="px-6 py-3.5 font-medium">Lead</th>}
                    <th className="px-6 py-3.5 font-medium">Loan Amount</th>
                    <th className="px-6 py-3.5 font-medium">Approver Level</th>
                    <th className="px-6 py-3.5 font-medium">Status</th>
                    <th className="px-6 py-3.5 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredApprovals.map((approval) => (
                    <tr key={approval.id} className="hover:bg-gray-50 transition">
                      {!leadId && (
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {approval.lead?.name || '—'}
                        </td>
                      )}
                      <td className="px-6 py-4 text-gray-900 font-medium">
                        ₹{Number(approval.loan_amount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <LevelBadge level={approval.approver_level} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={approval.status} />
                      </td>
                      <td className="px-6 py-4">
                        {approval.status === 'pending' ? (
                          <div className="flex gap-2 items-center">
                            <input
                              type="text"
                              placeholder="Remarks (optional)"
                              value={remarksMap[approval.id] || ''}
                              onChange={(e) =>
                                setRemarksMap({ ...remarksMap, [approval.id]: e.target.value })
                              }
                              className="border border-gray-300 rounded-lg px-2 py-1 text-xs w-32 focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                            <button
                              disabled={actionLoadingId === approval.id}
                              onClick={() => handleDecision(approval.id, 'approved')}
                              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              disabled={actionLoadingId === approval.id}
                              onClick={() => handleDecision(approval.id, 'rejected')}
                              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
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
        </div>
      </div>
    </div>
  );
}

export default Approval;