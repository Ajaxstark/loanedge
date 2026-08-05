import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const bucketStyles = {
  current: 'bg-green-100 text-green-700',
  '0-30': 'bg-blue-100 text-blue-700',
  '30-60': 'bg-amber-100 text-amber-700',
  '60-90': 'bg-orange-100 text-orange-700',
  '90+': 'bg-red-100 text-red-700',
};

const statusStyles = {
  active: 'bg-amber-100 text-amber-700',
  recovered: 'bg-green-100 text-green-700',
  legal_notice: 'bg-red-100 text-red-700',
};

function BucketBadge({ bucket }) {
  const style = bucketStyles[bucket] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${style}`}>
      {bucket}
    </span>
  );
}

function StatusBadge({ status }) {
  const style = statusStyles[status] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${style}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function Collection() {
  const { leadId } = useParams();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ lead_id: '', loan_amount: '', overdue_days: '' });
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [editMap, setEditMap] = useState({});

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  const fetchRecords = () => {
    setLoading(true);
    const url = leadId
      ? `http://localhost:8000/api/v1/collections/lead/${leadId}`
      : `http://localhost:8000/api/v1/collections`;

    axios
      .get(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => {
        setRecords(response.data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.log('Error:', err);
        setError('Could not load collection records.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    axios
      .post(
        'http://localhost:8000/api/v1/collections',
        {
          lead_id: leadId || form.lead_id,
          loan_amount: form.loan_amount,
          overdue_days: form.overdue_days,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        setShowForm(false);
        setForm({ lead_id: '', loan_amount: '', overdue_days: '' });
        fetchRecords();
      })
      .catch((err) => {
        console.log('Error:', err);
        setError('Could not create collection record.');
      })
      .finally(() => setSaving(false));
  };

  const handleUpdate = (id) => {
    setActionLoadingId(id);
    const edits = editMap[id] || {};
    axios
      .patch(
        `http://localhost:8000/api/v1/collections/${id}`,
        edits,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        fetchRecords();
        setEditMap({ ...editMap, [id]: {} });
      })
      .catch((err) => {
        console.log('Error:', err);
        setError('Could not update record.');
      })
      .finally(() => setActionLoadingId(null));
  };

  const setEditField = (id, field, value) => {
    setEditMap({ ...editMap, [id]: { ...editMap[id], [field]: value } });
  };

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 bg-gray-50 min-h-screen">
        <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Collection & Recovery</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {loading
                ? 'Loading records...'
                : `${records.length} record${records.length !== 1 ? 's' : ''}${leadId ? ' for this lead' : ' total'}`}
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
            Add Record
          </button>
        </div>

        <div className="p-8">
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
              <h3 className="text-base font-semibold text-gray-900 mb-2">Add Collection Record</h3>

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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Overdue Days</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.overdue_days}
                  onChange={(e) => setForm({ ...form, overdue_days: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <p className="text-xs text-gray-400 mt-1">
                  90+ din overdue → automatically NPA mark ho jayega
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Add Record'}
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
              <p className="text-sm text-gray-500">Fetching records...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 8v4l3 3" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">No collection records yet</h3>
              <p className="text-sm text-gray-500 max-w-xs">
                Add a record to start tracking overdue payments and recovery.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider border-b border-gray-100">
                    {!leadId && <th className="px-6 py-3.5 font-medium">Lead</th>}
                    <th className="px-6 py-3.5 font-medium">Loan Amount</th>
                    <th className="px-6 py-3.5 font-medium">Overdue Days</th>
                    <th className="px-6 py-3.5 font-medium">Bucket</th>
                    <th className="px-6 py-3.5 font-medium">NPA</th>
                    <th className="px-6 py-3.5 font-medium">Recovery Agent</th>
                    <th className="px-6 py-3.5 font-medium">Status</th>
                    <th className="px-6 py-3.5 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-gray-50 transition align-top">
                      {!leadId && (
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {rec.lead?.name || '—'}
                        </td>
                      )}
                      <td className="px-6 py-4 text-gray-900 font-medium">
                        ₹{Number(rec.loan_amount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{rec.overdue_days}</td>
                      <td className="px-6 py-4">
                        <BucketBadge bucket={rec.bucket} />
                      </td>
                      <td className="px-6 py-4">
                        {rec.is_npa ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-600 text-white">
                            NPA
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          placeholder="Assign agent"
                          defaultValue={rec.recovery_agent || ''}
                          onChange={(e) => setEditField(rec.id, 'recovery_agent', e.target.value)}
                          className="border border-gray-300 rounded-lg px-2 py-1 text-xs w-28 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <select
                          defaultValue={rec.status}
                          onChange={(e) => setEditField(rec.id, 'status', e.target.value)}
                          className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="active">Active</option>
                          <option value="legal_notice">Legal Notice</option>
                          <option value="recovered">Recovered</option>
                        </select>
                        <div className="mt-1">
                          <StatusBadge status={rec.status} />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          disabled={actionLoadingId === rec.id}
                          onClick={() => handleUpdate(rec.id)}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                        >
                          Save
                        </button>
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

export default Collection;