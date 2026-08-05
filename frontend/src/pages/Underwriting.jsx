import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const riskStyles = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
};

function RiskBadge({ risk }) {
  const style = riskStyles[risk] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${style}`}>
      {risk} risk
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

function Underwriting() {
  const { leadId } = useParams();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ lead_id: '', monthly_income: '', existing_emi: '', cibil_score: '' });
  const [riskFilter, setRiskFilter] = useState('all');

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  const fetchReports = () => {
    setLoading(true);
    const url = leadId
      ? `http://localhost:8000/api/v1/underwriting/lead/${leadId}`
      : `http://localhost:8000/api/v1/underwriting`;

    axios
      .get(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => {
        setReports(response.data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.log('Error:', err);
        setError('Could not load underwriting reports.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    axios
      .post(
        'http://localhost:8000/api/v1/underwriting',
        {
          lead_id: leadId || form.lead_id,
          monthly_income: form.monthly_income,
          existing_emi: form.existing_emi || 0,
          cibil_score: form.cibil_score,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        setShowForm(false);
        setForm({ lead_id: '', monthly_income: '', existing_emi: '', cibil_score: '' });
        fetchReports();
      })
      .catch((err) => {
        console.log('Error:', err);
        setError('Could not create report. Please check the values entered.');
      })
      .finally(() => setSaving(false));
  };

  const filteredReports = reports.filter((report) => {
    return riskFilter === 'all' || report.risk_category === riskFilter;
  });

  // Stats calculation
  const totalReports = reports.length;
  const lowRisk = reports.filter((r) => r.risk_category === 'low').length;
  const mediumRisk = reports.filter((r) => r.risk_category === 'medium').length;
  const highRisk = reports.filter((r) => r.risk_category === 'high').length;

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 bg-gray-50 min-h-screen">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Underwriting</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {leadId ? 'Risk reports for this lead' : 'Assess risk and manage underwriting reports'}
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
            Generate Report
          </button>
        </div>

        <div className="p-8">
          {/* Stats cards */}
          {!loading && reports.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                label="Total Reports"
                value={totalReports}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                icon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                }
              />
              <StatCard
                label="Low Risk"
                value={lowRisk}
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
                label="Medium Risk"
                value={mediumRisk}
                iconBg="bg-amber-50"
                iconColor="text-amber-600"
                icon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                }
              />
              <StatCard
                label="High Risk"
                value={highRisk}
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
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
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
              <h3 className="text-base font-semibold text-gray-900 mb-2">Generate Underwriting Report</h3>

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
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income (₹)</label>
                <input
                  type="number"
                  required
                  value={form.monthly_income}
                  onChange={(e) => setForm({ ...form, monthly_income: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Existing EMI (₹)</label>
                <input
                  type="number"
                  value={form.existing_emi}
                  onChange={(e) => setForm({ ...form, existing_emi: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CIBIL Score (300–900)</label>
                <input
                  type="number"
                  required
                  min="300"
                  max="900"
                  value={form.cibil_score}
                  onChange={(e) => setForm({ ...form, cibil_score: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition disabled:opacity-50"
                >
                  {saving ? 'Calculating...' : 'Generate Report'}
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
              <p className="text-sm text-gray-500">Fetching reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {riskFilter !== 'all' ? 'No matching reports' : 'No reports yet'}
              </h3>
              <p className="text-sm text-gray-500 max-w-xs">
                {riskFilter !== 'all'
                  ? 'Try a different risk filter.'
                  : 'Generate an underwriting report to assess risk.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider border-b border-gray-100">
                    {!leadId && <th className="px-6 py-3.5 font-medium">Lead</th>}
                    <th className="px-6 py-3.5 font-medium">Monthly Income</th>
                    <th className="px-6 py-3.5 font-medium">Existing EMI</th>
                    <th className="px-6 py-3.5 font-medium">CIBIL Score</th>
                    <th className="px-6 py-3.5 font-medium">Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50 transition">
                      {!leadId && (
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {report.lead?.name || '—'}
                        </td>
                      )}
                      <td className="px-6 py-4 text-gray-900 font-medium">
                        ₹{Number(report.monthly_income).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        ₹{Number(report.existing_emi).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{report.cibil_score}</td>
                      <td className="px-6 py-4">
                        <RiskBadge risk={report.risk_category} />
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

export default Underwriting;