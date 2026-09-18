import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

const API_BASE = 'http://localhost:8000/api/v1';
const STORAGE_BASE = 'http://localhost:8000/storage/';

const documentLabels = {
  aadhar: 'Aadhaar',
  pan: 'PAN',
  salary_slip: 'Salary Slip',
  bank_statement: 'Bank Statement',
};

const documentStyles = {
  aadhar: 'border-cyan-100 bg-cyan-50 text-cyan-700',
  pan: 'border-indigo-100 bg-indigo-50 text-indigo-700',
  salary_slip: 'border-pink-100 bg-pink-50 text-pink-700',
  bank_statement:
    'border-orange-100 bg-orange-50 text-orange-700',
};

const initialUploadForm = {
  lead_id: '',
  document_type: 'aadhar',
  file: null,
};

function formatDate(value) {
  if (!value) return '—';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function DocumentBadge({ type }) {
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-1 text-[11px] font-semibold ${
        documentStyles[type] ||
        'border-slate-200 bg-slate-50 text-slate-600'
      }`}
    >
      {documentLabels[type] || type || '—'}
    </span>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-amber-500',
    approved: 'bg-emerald-500',
    rejected: 'bg-red-500',
  };

  const textStyles = {
    pending: 'text-amber-700',
    approved: 'text-emerald-700',
    rejected: 'text-red-700',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
        textStyles[status] || 'text-slate-600'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          styles[status] || 'bg-slate-400'
        }`}
      />
      <span className="capitalize">{status || 'Unknown'}</span>
    </span>
  );
}

function SummaryItem({ label, value, color = 'text-slate-900' }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-400">
        {label}
      </p>

      <p className={`mt-1 text-lg font-semibold ${color}`}>
        {value}
      </p>
    </div>
  );
}

function KYC() {
  const { leadId } = useParams();

  const [documents, setDocuments] = useState([]);
  const [leads, setLeads] = useState([]);

  const [loading, setLoading] = useState(true);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] =
    useState(initialUploadForm);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [reviewDocument, setReviewDocument] = useState(null);
  const [decision, setDecision] = useState('');
  const [remarks, setRemarks] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const token =
    localStorage.getItem('token') ||
    sessionStorage.getItem('token');

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  };

  const fetchDocuments = async () => {
    setLoading(true);
    setError('');

    try {
      const url = leadId
        ? `${API_BASE}/kyc/lead/${leadId}`
        : `${API_BASE}/kyc`;

      const response = await axios.get(url, authConfig);

      setDocuments(response.data.data || []);
    } catch (err) {
      console.error('KYC fetch error:', err);

      setError(
        err.response?.data?.message ||
          'Unable to load KYC documents. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    if (leadId || leads.length > 0) return;

    setLeadsLoading(true);

    try {
      const response = await axios.get(
        `${API_BASE}/leads`,
        authConfig
      );

      setLeads(
        response.data.data ||
          response.data.leads ||
          []
      );
    } catch (err) {
      console.error('Lead fetch error:', err);
      setUploadError(
        'Unable to load the lead list. Please try again.'
      );
    } finally {
      setLeadsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  const summary = useMemo(
    () => ({
      total: documents.length,

      pending: documents.filter(
        (document) => document.status === 'pending'
      ).length,

      approved: documents.filter(
        (document) => document.status === 'approved'
      ).length,

      rejected: documents.filter(
        (document) => document.status === 'rejected'
      ).length,
    }),
    [documents]
  );

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return documents.filter((document) => {
      const leadName =
        document.lead?.name?.toLowerCase() || '';

      const leadEmail =
        document.lead?.email?.toLowerCase() || '';

      const matchesSearch =
        !query ||
        leadName.includes(query) ||
        leadEmail.includes(query) ||
        documentLabels[document.document_type]
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === 'all' ||
        document.status === statusFilter;

      const matchesType =
        typeFilter === 'all' ||
        document.document_type === typeFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType
      );
    });
  }, [
    documents,
    search,
    statusFilter,
    typeFilter,
  ]);

  const openUpload = async () => {
    setSuccess('');
    setUploadError('');
    setUploadForm({
      ...initialUploadForm,
      lead_id: leadId || '',
    });

    setUploadOpen(true);

    await fetchLeads();
  };

  const closeUpload = () => {
    if (uploading) return;

    setUploadOpen(false);
    setUploadForm(initialUploadForm);
    setUploadError('');
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    setUploadError('');
    setSuccess('');

    if (!uploadForm.lead_id) {
      setUploadError('Please select a lead.');
      return;
    }

    if (!uploadForm.file) {
      setUploadError('Please select a document to upload.');
      return;
    }

    if (uploadForm.file.size > 5 * 1024 * 1024) {
      setUploadError(
        'The selected file must not exceed 5 MB.'
      );
      return;
    }

    const formData = new FormData();

    formData.append(
      'lead_id',
      uploadForm.lead_id
    );

    formData.append(
      'document_type',
      uploadForm.document_type
    );

    formData.append('file', uploadForm.file);

    setUploading(true);

    try {
      await axios.post(
        `${API_BASE}/kyc`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      setUploadOpen(false);
      setUploadForm(initialUploadForm);

      setSuccess(
        'KYC document uploaded successfully.'
      );

      await fetchDocuments();
    } catch (err) {
      console.error('KYC upload error:', err);

      const validationErrors =
        err.response?.data?.errors;

      const firstValidationError =
        validationErrors
          ? Object.values(validationErrors)[0]?.[0]
          : null;

      setUploadError(
        firstValidationError ||
          err.response?.data?.message ||
          'Unable to upload the document. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  const openReview = (document) => {
    setSuccess('');
    setReviewError('');
    setDecision(
      document.status === 'pending'
        ? ''
        : document.status
    );
    setRemarks(document.remarks || '');
    setReviewDocument(document);
  };

  const closeReview = () => {
    if (reviewSaving) return;

    setReviewDocument(null);
    setDecision('');
    setRemarks('');
    setReviewError('');
  };

  const handleDecision = async () => {
    if (!reviewDocument) return;

    if (!decision) {
      setReviewError(
        'Please select a verification decision.'
      );
      return;
    }

    if (
      decision === 'rejected' &&
      !remarks.trim()
    ) {
      setReviewError(
        'Please provide a reason for rejecting this document.'
      );
      return;
    }

    setReviewSaving(true);
    setReviewError('');
    setSuccess('');

    try {
      await axios.patch(
        `${API_BASE}/kyc/${reviewDocument.id}/status`,
        {
          status: decision,
          remarks:
            decision === 'rejected'
              ? remarks.trim()
              : null,
        },
        authConfig
      );

      setReviewDocument(null);
      setDecision('');
      setRemarks('');

      setSuccess(
        decision === 'approved'
          ? 'Document approved successfully.'
          : 'Document rejected successfully.'
      );

      await fetchDocuments();
    } catch (err) {
      console.error(
        'KYC status update error:',
        err
      );

      setReviewError(
        err.response?.data?.message ||
          'Unable to update the verification status.'
      );
    } finally {
      setReviewSaving(false);
    }
  };

  const handleDelete = async (document) => {
    const confirmed = window.confirm(
      `Delete the ${
        documentLabels[document.document_type] ||
        'selected'
      } document? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(document.id);
    setError('');
    setSuccess('');

    try {
      await axios.delete(
        `${API_BASE}/kyc/${document.id}`,
        authConfig
      );

      setDocuments((current) =>
        current.filter(
          (item) => item.id !== document.id
        )
      );

      setSuccess(
        'Document deleted successfully.'
      );
    } catch (err) {
      console.error('KYC delete error:', err);

      setError(
        err.response?.data?.message ||
          'Unable to delete the document.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  const hasFilters =
    search ||
    statusFilter !== 'all' ||
    typeFilter !== 'all';

  const drawerOpen =
    uploadOpen || Boolean(reviewDocument);

  return (
    <div className="flex min-h-screen bg-[#f6f8fb]">
      <Sidebar />

      <main className="min-w-0 flex-1">
        {/* Page Header */}
        <header className="border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between px-8 py-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <span>Operations</span>
                <span>/</span>
                <span className="text-slate-600">
                  KYC Verification
                </span>
              </div>

              <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-950">
                KYC Documents
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                {leadId
                  ? 'Review and manage documents for this lead.'
                  : 'Review identity, financial and supporting customer documents.'}
              </p>
            </div>

            <button
              type="button"
              onClick={openUpload}
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

              Upload document
            </button>
          </div>
        </header>

        <div className="p-8">
          {/* Summary */}
          <section className="mb-6 rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <div className="grid grid-cols-2 gap-y-5 sm:grid-cols-4 sm:divide-x sm:divide-slate-100">
              <div className="sm:pr-6">
                <SummaryItem
                  label="Total documents"
                  value={summary.total}
                />
              </div>

              <div className="sm:px-6">
                <SummaryItem
                  label="Pending review"
                  value={summary.pending}
                  color="text-amber-700"
                />
              </div>

              <div className="sm:px-6">
                <SummaryItem
                  label="Approved"
                  value={summary.approved}
                  color="text-emerald-700"
                />
              </div>

              <div className="sm:pl-6">
                <SummaryItem
                  label="Rejected"
                  value={summary.rejected}
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

          {/* Verification workspace */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Verification queue
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  {loading
                    ? 'Loading verification queue...'
                    : `${filteredDocuments.length} of ${documents.length} documents shown`}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                {!leadId && (
                  <div className="relative sm:w-60">
                    <svg
                      className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle
                        cx="11"
                        cy="11"
                        r="7"
                      />
                      <path d="m20 20-3.5-3.5" />
                    </svg>

                    <input
                      type="search"
                      value={search}
                      onChange={(event) =>
                        setSearch(
                          event.target.value
                        )
                      }
                      placeholder="Search applicant"
                      className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10"
                    />
                  </div>
                )}

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value
                    )
                  }
                  className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-blue-600"
                >
                  <option value="all">
                    All statuses
                  </option>
                  <option value="pending">
                    Pending
                  </option>
                  <option value="approved">
                    Approved
                  </option>
                  <option value="rejected">
                    Rejected
                  </option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(event) =>
                    setTypeFilter(
                      event.target.value
                    )
                  }
                  className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-blue-600"
                >
                  <option value="all">
                    All document types
                  </option>
                  <option value="aadhar">
                    Aadhaar
                  </option>
                  <option value="pan">PAN</option>
                  <option value="salary_slip">
                    Salary Slip
                  </option>
                  <option value="bank_statement">
                    Bank Statement
                  </option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[340px] flex-col items-center justify-center">
                <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600" />
                <p className="mt-3 text-xs text-slate-500">
                  Loading KYC documents...
                </p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="flex min-h-[340px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-100 bg-blue-50">
                  <svg
                    className="h-6 w-6 text-blue-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                    <path d="M9 15l2 2 4-4" />
                  </svg>
                </div>

                <h3 className="mt-4 text-sm font-semibold text-slate-900">
                  {hasFilters
                    ? 'No documents match these filters'
                    : 'No KYC documents available'}
                </h3>

                <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                  {hasFilters
                    ? 'Change your filters to view other documents.'
                    : 'Uploaded customer documents will appear here for verification.'}
                </p>

                {!hasFilters && (
                  <button
                    type="button"
                    onClick={openUpload}
                    className="mt-5 text-xs font-semibold text-blue-700"
                  >
                    Upload first document →
                  </button>
                )}
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
                        Document
                      </th>

                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Uploaded
                      </th>

                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Verification
                      </th>

                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Remarks
                      </th>

                      <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredDocuments.map(
                      (document) => (
                        <tr
                          key={document.id}
                          className="transition hover:bg-slate-50/60"
                        >
                          {!leadId && (
                            <td className="px-5 py-4">
                              <div>
                                <p className="text-[13px] font-semibold text-slate-900">
                                  {document.lead
                                    ?.name ||
                                    'Unknown applicant'}
                                </p>

                                <p className="mt-0.5 text-[10.5px] text-slate-400">
                                  Lead #
                                  {document.lead_id}
                                </p>
                              </div>
                            </td>
                          )}

                          <td className="px-5 py-4">
                            <DocumentBadge
                              type={
                                document.document_type
                              }
                            />
                          </td>

                          <td className="px-5 py-4 text-xs text-slate-600">
                            {formatDate(
                              document.created_at
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge
                              status={document.status}
                            />
                          </td>

                          <td className="max-w-[220px] px-5 py-4">
                            <p
                              className={`truncate text-xs ${
                                document.remarks
                                  ? 'text-slate-600'
                                  : 'text-slate-400'
                              }`}
                              title={
                                document.remarks ||
                                ''
                              }
                            >
                              {document.remarks ||
                                'No remarks'}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <a
                                href={`${STORAGE_BASE}${document.file_path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700"
                              >
                                Open
                              </a>

                              <button
                                type="button"
                                onClick={() =>
                                  openReview(
                                    document
                                  )
                                }
                                className="rounded-md bg-[#0f2d52] px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#153d6e]"
                              >
                                {document.status ===
                                'pending'
                                  ? 'Review'
                                  : 'Details'}
                              </button>

                              <button
                                type="button"
                                disabled={
                                  deletingId ===
                                  document.id
                                }
                                onClick={() =>
                                  handleDelete(
                                    document
                                  )
                                }
                                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                title="Delete document"
                              >
                                <svg
                                  className="h-4 w-4"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                >
                                  <path d="M3 6h18" />
                                  <path d="M8 6V4h8v2" />
                                  <path d="M19 6l-1 14H6L5 6" />
                                  <path d="M10 11v5M14 11v5" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>

      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[1px]"
          onClick={
            uploadOpen
              ? closeUpload
              : closeReview
          }
        />
      )}

      {/* Upload Drawer */}
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-[480px] transform bg-white shadow-[-20px_0_50px_-30px_rgba(15,23,42,0.4)] transition-transform duration-300 ${
          uploadOpen
            ? 'translate-x-0'
            : 'translate-x-full'
        }`}
      >
        <form
          onSubmit={handleUpload}
          className="flex h-full flex-col"
        >
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-700">
                KYC Operations
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-950">
                Upload document
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Add a customer document for
                verification.
              </p>
            </div>

            <button
              type="button"
              onClick={closeUpload}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
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

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {uploadError && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                {uploadError}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Applicant
                </label>

                {leadId ? (
                  <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-600">
                    Lead #{leadId}
                  </div>
                ) : (
                  <select
                    required
                    value={uploadForm.lead_id}
                    disabled={leadsLoading}
                    onChange={(event) =>
                      setUploadForm(
                        (current) => ({
                          ...current,
                          lead_id:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600"
                  >
                    <option value="">
                      {leadsLoading
                        ? 'Loading applicants...'
                        : 'Select applicant'}
                    </option>

                    {leads.map((lead) => (
                      <option
                        key={lead.id}
                        value={lead.id}
                      >
                        {lead.name} — Lead #
                        {lead.id}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Document type
                </label>

                <select
                  value={
                    uploadForm.document_type
                  }
                  onChange={(event) =>
                    setUploadForm(
                      (current) => ({
                        ...current,
                        document_type:
                          event.target.value,
                      })
                    )
                  }
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600"
                >
                  <option value="aadhar">
                    Aadhaar
                  </option>
                  <option value="pan">
                    PAN
                  </option>
                  <option value="salary_slip">
                    Salary Slip
                  </option>
                  <option value="bank_statement">
                    Bank Statement
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Document file
                </label>

                <label className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center transition hover:border-blue-400 hover:bg-blue-50/40">
                  <svg
                    className="h-7 w-7 text-slate-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  >
                    <path d="M12 16V4" />
                    <path d="m7 9 5-5 5 5" />
                    <path d="M5 20h14" />
                  </svg>

                  <p className="mt-3 text-xs font-semibold text-slate-700">
                    {uploadForm.file
                      ? uploadForm.file.name
                      : 'Choose a document'}
                  </p>

                  <p className="mt-1 text-[10.5px] text-slate-400">
                    PDF, JPG, JPEG or PNG •
                    Maximum 5 MB
                  </p>

                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(event) =>
                      setUploadForm(
                        (current) => ({
                          ...current,
                          file:
                            event.target
                              .files?.[0] ||
                            null,
                        })
                      )
                    }
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={closeUpload}
              disabled={uploading}
              className="h-9 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={uploading}
              className="flex h-9 min-w-[125px] items-center justify-center rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {uploading
                ? 'Uploading...'
                : 'Upload document'}
            </button>
          </div>
        </form>
      </aside>

      {/* Review Drawer */}
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-[480px] transform bg-white shadow-[-20px_0_50px_-30px_rgba(15,23,42,0.4)] transition-transform duration-300 ${
          reviewDocument
            ? 'translate-x-0'
            : 'translate-x-full'
        }`}
      >
        {reviewDocument && (
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-700">
                  Verification review
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-950">
                  Document details
                </h2>
              </div>

              <button
                type="button"
                onClick={closeReview}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
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

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {reviewError && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                  {reviewError}
                </div>
              )}

              <div className="rounded-xl border border-slate-200">
                <div className="grid grid-cols-2 gap-5 border-b border-slate-100 p-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">
                      Applicant
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {reviewDocument.lead
                        ?.name ||
                        `Lead #${reviewDocument.lead_id}`}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">
                      Document
                    </p>

                    <div className="mt-1">
                      <DocumentBadge
                        type={
                          reviewDocument.document_type
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">
                      Uploaded
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-700">
                      {formatDate(
                        reviewDocument.created_at
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">
                      Current status
                    </p>

                    <div className="mt-1">
                      <StatusBadge
                        status={
                          reviewDocument.status
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <a
                    href={`${STORAGE_BASE}${reviewDocument.file_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                    </svg>

                    Open uploaded document
                  </a>
                </div>
              </div>

              {reviewDocument.status ===
              'pending' ? (
                <div className="mt-6">
                  <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                    Verification decision
                  </h3>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setDecision(
                          'approved'
                        )
                      }
                      className={`rounded-lg border px-4 py-3 text-left transition ${
                        decision ===
                        'approved'
                          ? 'border-emerald-400 bg-emerald-50'
                          : 'border-slate-200 hover:border-emerald-200'
                      }`}
                    >
                      <p className="text-xs font-semibold text-emerald-700">
                        Approve
                      </p>
                      <p className="mt-1 text-[10px] leading-4 text-slate-500">
                        Document is valid and
                        acceptable.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setDecision(
                          'rejected'
                        )
                      }
                      className={`rounded-lg border px-4 py-3 text-left transition ${
                        decision ===
                        'rejected'
                          ? 'border-red-400 bg-red-50'
                          : 'border-slate-200 hover:border-red-200'
                      }`}
                    >
                      <p className="text-xs font-semibold text-red-700">
                        Reject
                      </p>
                      <p className="mt-1 text-[10px] leading-4 text-slate-500">
                        Customer needs to
                        replace the document.
                      </p>
                    </button>
                  </div>

                  {decision === 'rejected' && (
                    <div className="mt-4">
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                        Rejection reason
                      </label>

                      <textarea
                        rows={4}
                        value={remarks}
                        onChange={(event) =>
                          setRemarks(
                            event.target.value
                          )
                        }
                        placeholder="Explain why this document cannot be accepted..."
                        className="w-full resize-none rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Verification outcome
                  </p>

                  <div className="mt-2">
                    <StatusBadge
                      status={
                        reviewDocument.status
                      }
                    />
                  </div>

                  {reviewDocument.remarks && (
                    <p className="mt-3 text-xs leading-5 text-slate-600">
                      {reviewDocument.remarks}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={closeReview}
                disabled={reviewSaving}
                className="h-9 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700"
              >
                Close
              </button>

              {reviewDocument.status ===
                'pending' && (
                <button
                  type="button"
                  onClick={handleDecision}
                  disabled={
                    reviewSaving || !decision
                  }
                  className="h-9 rounded-lg bg-[#0f2d52] px-4 text-xs font-semibold text-white hover:bg-[#153d6e] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {reviewSaving
                    ? 'Saving...'
                    : 'Confirm decision'}
                </button>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

export default KYC;