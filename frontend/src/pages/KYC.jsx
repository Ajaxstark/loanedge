import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const statusStyles = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const docTypeStyles = {
  aadhar: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  pan: 'bg-purple-50 text-purple-700 border-purple-200',
  salary_slip: 'bg-pink-50 text-pink-700 border-pink-200',
  bank_statement: 'bg-orange-50 text-orange-700 border-orange-200',
};

const docTypeLabels = {
  aadhar: 'Aadhar',
  pan: 'PAN',
  salary_slip: 'Salary Slip',
  bank_statement: 'Bank Statement',
};

const STORAGE_BASE = 'http://localhost:8000/storage/';

function StatusBadge({ status }) {
  const style = statusStyles[status] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${style}`}>
      {status}
    </span>
  );
}

function DocTypeBadge({ type }) {
  const style = docTypeStyles[type] || 'bg-gray-50 text-gray-700 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${style}`}>
      {docTypeLabels[type] || type}
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

function KYC() {
  const { leadId } = useParams();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  const fetchDocuments = () => {
    setLoading(true);
    const url = leadId
      ? `http://localhost:8000/api/v1/kyc/lead/${leadId}`
      : `http://localhost:8000/api/v1/kyc`;

    axios
      .get(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setDocuments(response.data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.log('Error:', err);
        setError('Could not load KYC documents. Please try again.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  const handleStatusUpdate = (id, status) => {
    setActionLoadingId(id);
    axios
      .patch(
        `http://localhost:8000/api/v1/kyc/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        fetchDocuments();
      })
      .catch((err) => {
        console.log('Error:', err);
        setError('Could not update document status.');
      })
      .finally(() => setActionLoadingId(null));
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesType = typeFilter === 'all' || doc.document_type === typeFilter;
    return matchesStatus && matchesType;
  });

  // Stats calculation
  const totalDocs = documents.length;
  const pendingDocs = documents.filter((d) => d.status === 'pending').length;
  const approvedDocs = documents.filter((d) => d.status === 'approved').length;
  const rejectedDocs = documents.filter((d) => d.status === 'rejected').length;

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 bg-gray-50 min-h-screen">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">KYC Documents</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {leadId ? 'Documents for this lead' : 'Manage and verify all KYC documents'}
            </p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm transition flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Upload Document
          </button>
        </div>

        <div className="p-8">
          {/* Stats cards */}
          {!loading && documents.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                label="Total Documents"
                value={totalDocs}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                icon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                }
              />
              <StatCard
                label="Pending Review"
                value={pendingDocs}
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
                value={approvedDocs}
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
                value={rejectedDocs}
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
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Document Types</option>
              <option value="aadhar">Aadhar</option>
              <option value="pan">PAN</option>
              <option value="salary_slip">Salary Slip</option>
              <option value="bank_statement">Bank Statement</option>
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
              <p className="text-sm text-gray-500">Fetching documents...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {statusFilter !== 'all' || typeFilter !== 'all' ? 'No matching documents' : 'No documents yet'}
              </h3>
              <p className="text-sm text-gray-500 max-w-xs">
                {statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your filters.'
                  : 'Get started by uploading a document.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider border-b border-gray-100">
                    {!leadId && <th className="px-6 py-3.5 font-medium">Lead</th>}
                    <th className="px-6 py-3.5 font-medium">Document Type</th>
                    <th className="px-6 py-3.5 font-medium">File</th>
                    <th className="px-6 py-3.5 font-medium">Uploaded On</th>
                    <th className="px-6 py-3.5 font-medium">Status</th>
                    <th className="px-6 py-3.5 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50 transition">
                      {!leadId && (
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {doc.lead?.name || '—'}
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <DocTypeBadge type={doc.document_type} />
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={`${STORAGE_BASE}${doc.file_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm font-medium"
                        >
                          View file
                        </a>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-IN') : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={doc.status} />
                      </td>
                      <td className="px-6 py-4">
                        {doc.status === 'pending' ? (
                          <div className="flex gap-2">
                            <button
                              disabled={actionLoadingId === doc.id}
                              onClick={() => handleStatusUpdate(doc.id, 'approved')}
                              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              disabled={actionLoadingId === doc.id}
                              onClick={() => handleStatusUpdate(doc.id, 'rejected')}
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

export default KYC;