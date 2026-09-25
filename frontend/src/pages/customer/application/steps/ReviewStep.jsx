import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/v1/customer';

const DOCUMENT_LABELS = {
  aadhar: 'Aadhaar Card',
  pan: 'PAN Card',
  salary_slip: 'Salary Slip',
  bank_statement: 'Bank Statement',
};

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatLabel(value) {
  if (!value) return '—';

  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ReviewRow({ label, value }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
      <dt className="text-[11px] font-medium text-slate-500">
        {label}
      </dt>

      <dd className="break-words text-[12.5px] font-medium text-slate-800">
        {value || '—'}
      </dd>
    </div>
  );
}

function ReviewSection({
  title,
  description,
  step,
  onEdit,
  children,
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="text-[13px] font-semibold text-slate-900">
            {title}
          </h3>

          {description && (
            <p className="mt-1 text-[10.5px] leading-4 text-slate-400">
              {description}
            </p>
          )}
        </div>

        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(step)}
            className="shrink-0 rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            Edit
          </button>
        )}
      </div>

      <dl className="divide-y divide-slate-100 px-5">
        {children}
      </dl>
    </section>
  );
}

function DocumentStatus({ status }) {
  const styles = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  };

  const labels = {
    pending: 'Pending verification',
    approved: 'Verified',
    rejected: 'Action required',
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
        styles[status] ||
        'border-slate-200 bg-slate-50 text-slate-600'
      }`}
    >
      {labels[status] || formatLabel(status)}
    </span>
  );
}

function ReviewStep({
  application,
  onPrevious,
  onEditStep,
}) {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);

  const [declarationAccepted, setDeclarationAccepted] =
    useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');

  const token = localStorage.getItem('customer_token');

  /*
   * Review screen khulte hi latest document statuses load.
   */
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!token) {
        setDocumentsLoading(false);
        setError(
          'Your session is unavailable. Please sign in again.'
        );
        return;
      }

      try {
        const response = await axios.get(
          `${API_BASE}/application/documents`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          }
        );

        setDocuments(response.data.data || []);
      } catch (err) {
        console.error(
          'Review document fetch error:',
          err
        );

        setError(
          err.response?.data?.message ||
            'We could not load your application documents.'
        );
      } finally {
        setDocumentsLoading(false);
      }
    };

    fetchDocuments();
  }, [token]);

  const documentMap = useMemo(() => {
    return documents.reduce((result, document) => {
      result[document.document_type] = document;
      return result;
    }, {});
  }, [documents]);

  const requiredDocumentTypes = [
    'aadhar',
    'pan',
    'salary_slip',
    'bank_statement',
  ];

  const missingDocuments = requiredDocumentTypes.filter(
    (type) => !documentMap[type]
  );

  const rejectedDocuments = documents.filter(
    (document) => document.status === 'rejected'
  );

  /*
   * Product usually application.product relation mein
   * GET /application se already available hoga.
   */
  const product = application?.product;

  const canSubmit =
    declarationAccepted &&
    !submitting &&
    !documentsLoading &&
    missingDocuments.length === 0;

  const handleSubmit = async () => {
    if (!declarationAccepted) {
      setError(
        'Please accept the declaration before submitting your application.'
      );
      return;
    }

    if (missingDocuments.length > 0) {
      setError(
        'Please upload all required documents before submitting your application.'
      );
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await axios.post(
        `${API_BASE}/application/submit`,
        {
          declaration_accepted: true,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      const submittedApplication = response.data.data;

      /*
       * Dashboard ko latest submitted state milne ke liye
       * navigation state bhi pass kar rahe hain.
       *
       * Dashboard eventually backend GET se actual state
       * load karega, navigation state sirf immediate UX hai.
       */
      navigate('/customer/dashboard', {
        replace: true,
        state: {
          applicationSubmitted: true,
          application: submittedApplication,
        },
      });
    } catch (err) {
      console.error(
        'Application submission error:',
        err
      );

      const backendErrors = err.response?.data?.errors;

      let backendMessage = null;

      if (backendErrors) {
        const firstError = Object.values(backendErrors)[0];

        if (Array.isArray(firstError)) {
          backendMessage = firstError[0];
        }
      }

      setError(
        backendMessage ||
          err.response?.data?.message ||
          'We could not submit your application. Please review your information and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!application) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
        Application information is unavailable. Please reload the
        page and try again.
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 border-b border-slate-100 pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Review your application
            </h3>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
              Please review the information below carefully before
              submitting your loan application.
            </p>
          </div>

          <div className="shrink-0 sm:text-right">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400">
              Application number
            </p>

            <p className="mt-1 text-[13px] font-bold text-[#0f2d52]">
              {application.application_number || '—'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
        >
          <svg
            className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5" />
            <path d="M12 17h.01" />
          </svg>

          <p className="text-xs leading-5 text-red-700">
            {error}
          </p>
        </div>
      )}

      {/* Application summary */}
      <div className="space-y-4">
        <ReviewSection
          title="Personal details"
          description="Applicant identity and contact information."
          step={1}
          onEdit={onEditStep}
        >
          <ReviewRow
            label="Full name"
            value={application.full_name}
          />

          <ReviewRow
            label="Email address"
            value={application.email}
          />

          <ReviewRow
            label="Mobile number"
            value={application.phone}
          />

          <ReviewRow
            label="Date of birth"
            value={formatDate(application.date_of_birth)}
          />

          <ReviewRow
            label="Marital status"
            value={formatLabel(application.marital_status)}
          />
        </ReviewSection>

        <ReviewSection
          title="Identity & address"
          description="Identity and current residential information."
          step={2}
          onEdit={onEditStep}
        >
          <ReviewRow
            label="PAN number"
            value={application.pan_number}
          />

          <ReviewRow
            label="Address"
            value={application.address_line}
          />

          <ReviewRow
            label="City"
            value={application.city}
          />

          <ReviewRow
            label="State"
            value={application.state}
          />

          <ReviewRow
            label="PIN code"
            value={application.pincode}
          />

          <ReviewRow
            label="Residence type"
            value={formatLabel(application.residence_type)}
          />
        </ReviewSection>

        <ReviewSection
          title="Employment & finances"
          description="Employment profile and declared financial information."
          step={3}
          onEdit={onEditStep}
        >
          <ReviewRow
            label="Employment type"
            value={formatLabel(application.employment_type)}
          />

          <ReviewRow
            label={
              application.employment_type === 'self_employed'
                ? 'Business name'
                : 'Employer'
            }
            value={application.employer_business_name}
          />

          <ReviewRow
            label="Monthly income"
            value={formatCurrency(application.monthly_income)}
          />

          <ReviewRow
            label="Existing EMI"
            value={formatCurrency(application.existing_emi)}
          />

          <ReviewRow
            label="Experience"
            value={
              application.work_experience_months !== null &&
              application.work_experience_months !== undefined
                ? `${application.work_experience_months} months`
                : '—'
            }
          />
        </ReviewSection>

        <ReviewSection
          title="Loan requirement"
          description="Selected product and requested borrowing terms."
          step={4}
          onEdit={onEditStep}
        >
          <ReviewRow
            label="Loan product"
            value={product?.name || '—'}
          />

          <ReviewRow
            label="Loan type"
            value={formatLabel(product?.loan_type)}
          />

          <ReviewRow
            label="Requested amount"
            value={formatCurrency(application.requested_amount)}
          />

          <ReviewRow
            label="Requested tenure"
            value={
              application.requested_tenure_months
                ? `${application.requested_tenure_months} months`
                : '—'
            }
          />

          <ReviewRow
            label="Indicative interest rate"
            value={
              product?.interest_rate !== undefined &&
              product?.interest_rate !== null
                ? `${Number(product.interest_rate).toFixed(2)}% p.a.`
                : '—'
            }
          />

          <ReviewRow
            label="Loan purpose"
            value={application.loan_purpose}
          />
        </ReviewSection>

        {/* Documents */}
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div>
              <h3 className="text-[13px] font-semibold text-slate-900">
                Supporting documents
              </h3>

              <p className="mt-1 text-[10.5px] leading-4 text-slate-400">
                Documents submitted for KYC and financial
                verification.
              </p>
            </div>

            {onEditStep && (
              <button
                type="button"
                onClick={() => onEditStep(5)}
                className="rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                Edit
              </button>
            )}
          </div>

          {documentsLoading ? (
            <div className="flex min-h-[130px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-blue-100 border-t-blue-600" />

                <p className="mt-2 text-[10.5px] text-slate-400">
                  Loading documents...
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {requiredDocumentTypes.map((type) => {
                const document = documentMap[type];

                return (
                  <div
                    key={type}
                    className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-[12px] font-semibold text-slate-800">
                        {DOCUMENT_LABELS[type]}
                      </p>

                      {!document && (
                        <p className="mt-0.5 text-[10.5px] text-red-600">
                          Document not uploaded
                        </p>
                      )}

                      {document?.status === 'rejected' &&
                        document.remarks && (
                          <p className="mt-1 max-w-lg text-[10.5px] leading-4 text-red-600">
                            {document.remarks}
                          </p>
                        )}
                    </div>

                    {document ? (
                      <DocumentStatus status={document.status} />
                    ) : (
                      <span className="text-[10.5px] font-semibold text-red-600">
                        Missing
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Rejected docs notice */}
      {rejectedDocuments.length > 0 && (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-[11.5px] font-semibold text-amber-800">
            Some documents require attention
          </p>

          <p className="mt-1 text-[10.5px] leading-4 text-amber-700">
            You may submit your application, but rejected documents
            should be replaced so the verification process can
            continue without delay.
          </p>
        </div>
      )}

      {/* Declaration */}
      <section className="mt-6 rounded-xl border border-[#d9e3f1] bg-[#f8faff] p-5">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#0f2d52]">
          Applicant declaration
        </p>

        <label className="mt-4 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={declarationAccepted}
            onChange={(event) => {
              setDeclarationAccepted(event.target.checked);

              if (event.target.checked) {
                setError('');
              }
            }}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
          />

          <span className="text-[11.5px] leading-5 text-slate-600">
            I confirm that the information and documents provided
            in this application are accurate and complete to the
            best of my knowledge. I authorize LoanEdge to process
            this information for the purpose of assessing my loan
            application.
          </span>
        </label>

        <p className="mt-3 pl-7 text-[9.5px] leading-4 text-slate-400">
          Your consent and submission time will be recorded with
          this application.
        </p>
      </section>

      {/* Submission note */}
      <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <svg
          className="mt-0.5 h-4 w-4 shrink-0 text-slate-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M12 3 5 6v5c0 4.5 2.8 8.5 7 10 4.2-1.5 7-5.5 7-10V6l-7-3Z" />
        </svg>

        <p className="text-[10.5px] leading-4 text-slate-500">
          After submission, your application will enter the
          LoanEdge review process. Important application details
          may no longer be directly editable.
        </p>
      </div>

      {/* Navigation */}
      <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onPrevious}
          disabled={submitting}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>

          Previous
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="inline-flex h-10 min-w-[180px] items-center justify-center gap-2 rounded-lg bg-[#0f2d52] px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#153d6e] focus:outline-none focus:ring-4 focus:ring-[#0f2d52]/15 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Submitting...
            </>
          ) : (
            <>
              Submit application

              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default ReviewStep;