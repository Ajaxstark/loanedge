import { useEffect, useState } from 'react';
import {
  useLocation,
  useNavigate,
} from 'react-router-dom';
import axios from 'axios';

const API_BASE =
  'http://localhost:8000/api/v1/customer';

const statusConfig = {
  draft: {
    label: 'In progress',
    badge:
      'border-amber-200 bg-amber-50 text-amber-700',
  },
  submitted: {
    label: 'Submitted',
    badge:
      'border-blue-200 bg-blue-50 text-blue-700',
  },
  under_review: {
    label: 'Under review',
    badge:
      'border-violet-200 bg-violet-50 text-violet-700',
  },
  approved: {
    label: 'Approved',
    badge:
      'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
  rejected: {
    label: 'Rejected',
    badge:
      'border-red-200 bg-red-50 text-red-700',
  },
  cancelled: {
    label: 'Cancelled',
    badge:
      'border-slate-200 bg-slate-50 text-slate-600',
  },
};

function formatCurrency(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
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
    return '—';
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function StatusBadge({ status }) {
  const config =
    statusConfig[status] ||
    statusConfig.draft;

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10.5px] font-semibold ${config.badge}`}
    >
      {config.label}
    </span>
  );
}

function MetricCard({ label, value, helper }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-[15px] font-semibold text-slate-900">
        {value}
      </p>

      {helper && (
        <p className="mt-1 text-[10.5px] leading-4 text-slate-400">
          {helper}
        </p>
      )}
    </div>
  );
}

function CustomerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [application, setApplication] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  /*
   * ReviewStep navigate state se ye true aa sakta hai.
   *
   * Refresh ke baad state na bhi ho,
   * backend application status still persist karega.
   */
  const [showSubmittedMessage, setShowSubmittedMessage] =
    useState(
      Boolean(
        location.state?.applicationSubmitted
      )
    );

  useEffect(() => {
    const token =
      localStorage.getItem(
        'customer_token'
      );

    const storedUser =
      localStorage.getItem(
        'customer_user'
      );

    if (!token) {
      navigate('/customer/login', {
        replace: true,
      });

      return;
    }

    if (storedUser) {
      try {
        setUser(
          JSON.parse(storedUser)
        );
      } catch {
        localStorage.removeItem(
          'customer_user'
        );
      }
    }

    /*
     * Immediate submit response agar navigation
     * state mein available hai toh pehle use kar
     * sakte hain.
     */
    if (location.state?.application) {
      setApplication(
        location.state.application
      );
    }

    const fetchApplication = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await axios.get(
          `${API_BASE}/application`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
              Accept:
                'application/json',
            },
          }
        );

        setApplication(
          response.data.data || null
        );
      } catch (err) {
        console.error(
          'Customer application fetch error:',
          err
        );

        /*
         * Token invalid/expired.
         */
        if (
          err.response?.status === 401
        ) {
          localStorage.removeItem(
            'customer_token'
          );

          localStorage.removeItem(
            'customer_user'
          );

          navigate(
            '/customer/login',
            {
              replace: true,
            }
          );

          return;
        }

        setError(
          err.response?.data?.message ||
            'We could not load your application information. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [
    navigate,
    location.state,
  ]);

  /*
   * Browser history mein submission state ko repeatedly
   * show hone se prevent karne ke liye URL same rakhte
   * hue navigation state clear kar dete hain.
   */
  useEffect(() => {
    if (
      location.state?.applicationSubmitted
    ) {
      window.history.replaceState(
        {},
        document.title
      );
    }
  }, [location.state]);

  const handleLogout = () => {
    localStorage.removeItem(
      'customer_token'
    );

    localStorage.removeItem(
      'customer_user'
    );

    navigate('/customer/login', {
      replace: true,
    });
  };

  const handleApplicationAction =
    () => {
      navigate('/customer/apply');
    };

  if (!user) {
    return null;
  }

  const status =
    application?.status;

  const isDraft =
    status === 'draft';

  const isSubmitted =
    status === 'submitted' ||
    status === 'under_review';

  const isApproved =
    status === 'approved';

  const isRejected =
    status === 'rejected';

  const completedStep = Math.min(
    Number(
      application?.current_step || 1
    ),
    6
  );

  const progressPercentage =
    isDraft
      ? Math.round(
          ((completedStep - 1) / 6) *
            100
        )
      : application
        ? 100
        : 0;

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#0a2142]">
              <svg
                className="h-[18px] w-[18px] text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 21h18" />
                <path d="M5 21V8l7-4 7 4v13" />
                <path d="M9 10h.01M12 10h.01M15 10h.01" />
                <path d="M9 14h.01M12 14h.01M15 14h.01" />
              </svg>
            </div>

            <div>
              <p className="text-[15px] font-bold leading-none tracking-[-0.02em] text-[#0a2142]">
                LoanEdge
              </p>

              <p className="mt-1 text-[9.5px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Customer Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2.5 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eaf1fb] text-xs font-bold text-[#0a2142]">
                {user.name
                  ?.charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <p className="text-[12px] font-semibold text-slate-700">
                  {user.name}
                </p>

                <p className="text-[9.5px] text-slate-400">
                  Customer
                </p>
              </div>
            </div>

            <div className="h-6 w-px bg-slate-200" />

            <button
              type="button"
              onClick={handleLogout}
              className="text-[11.5px] font-semibold text-slate-500 transition hover:text-red-600"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:py-10">
        {/* Greeting */}
        <div className="mb-7">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.11em] text-blue-700">
            Customer overview
          </p>

          <h1 className="mt-1.5 text-[26px] font-bold tracking-[-0.035em] text-[#10213a]">
            Welcome,{' '}
            {user.name?.split(' ')[0]}
          </h1>

          <p className="mt-1.5 text-[13px] text-slate-500">
            Track your loan application
            and account journey from one
            place.
          </p>
        </div>

        {/* Immediate submission message */}
        {showSubmittedMessage && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                >
                  <path d="m5 12 4 4L19 6" />
                </svg>
              </div>

              <div>
                <p className="text-[13px] font-semibold text-emerald-900">
                  Application submitted
                  successfully
                </p>

                <p className="mt-1 text-[11px] leading-5 text-emerald-700">
                  Your application has been
                  received and is now ready
                  for LoanEdge review.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowSubmittedMessage(false)
              }
              className="text-emerald-600 transition hover:text-emerald-800"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-xs text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[380px] items-center justify-center rounded-xl border border-slate-200 bg-white">
            <div className="text-center">
              <div className="mx-auto h-7 w-7 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600" />

              <p className="mt-3 text-xs text-slate-500">
                Loading your application...
              </p>
            </div>
          </div>
        ) : !application ? (
          /* No application */
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-8 p-7 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M4 7h16v13H4z" />
                    <path d="M8 7V4h8v3" />
                    <path d="M9 13h6" />
                  </svg>
                </div>

                <h2 className="text-lg font-semibold text-[#10213a]">
                  Start your loan application
                </h2>

                <p className="mt-2 max-w-xl text-[12.5px] leading-5 text-slate-500">
                  Complete a secure,
                  step-by-step application
                  to begin your LoanEdge
                  lending journey.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  handleApplicationAction
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0f2d52] px-5 text-xs font-semibold text-white transition hover:bg-[#153d6e]"
              >
                Start application

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
              </button>
            </div>
          </section>
        ) : (
          <>
            {/* Application overview */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-5 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-[16px] font-semibold text-[#10213a]">
                      {application.product
                        ?.name ||
                        'Loan Application'}
                    </h2>

                    <StatusBadge
                      status={
                        application.status
                      }
                    />
                  </div>

                  <p className="mt-1.5 text-[11px] text-slate-400">
                    Application{' '}
                    <span className="font-semibold text-slate-600">
                      {application.application_number}
                    </span>
                  </p>
                </div>

                {isDraft && (
                  <button
                    type="button"
                    onClick={
                      handleApplicationAction
                    }
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#0f2d52] px-4 text-[11.5px] font-semibold text-white transition hover:bg-[#153d6e]"
                  >
                    Resume application
                    <svg
                      className="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M5 12h14" />
                      <path d="m13 6 6 6-6 6" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Main numbers */}
              <div className="grid divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <div className="p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Requested amount
                  </p>

                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {formatCurrency(
                      application.requested_amount
                    )}
                  </p>
                </div>

                <div className="p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Requested tenure
                  </p>

                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {application.requested_tenure_months
                      ? `${application.requested_tenure_months} months`
                      : '—'}
                  </p>
                </div>

                <div className="p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Submitted on
                  </p>

                  <p className="mt-2 text-[14px] font-semibold text-slate-800">
                    {formatDate(
                      application.submitted_at
                    )}
                  </p>
                </div>
              </div>
            </section>

            {/* Draft progress */}
            {isDraft && (
              <section className="mt-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[13px] font-semibold text-slate-900">
                      Application in progress
                    </h3>

                    <p className="mt-1 text-[11px] text-slate-500">
                      Continue from where you
                      left off.
                    </p>
                  </div>

                  <p className="text-[11px] font-bold text-blue-700">
                    Step {completedStep} of 6
                  </p>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all"
                    style={{
                      width: `${progressPercentage}%`,
                    }}
                  />
                </div>
              </section>
            )}

            {/* Submitted processing timeline */}
            {!isDraft && (
              <section className="mt-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6">
                  <h3 className="text-[13px] font-semibold text-slate-900">
                    Application progress
                  </h3>

                  <p className="mt-1 text-[11px] text-slate-500">
                    Follow the progress of your
                    application through the
                    LoanEdge review process.
                  </p>
                </div>

                <div className="space-y-0">
                  {[
                    {
                      title:
                        'Application submitted',
                      description:
                        'Your loan application has been received.',
                      completed: true,
                    },
                    {
                      title:
                        'KYC verification',
                      description:
                        'Your documents will be reviewed by LoanEdge.',
                      completed: false,
                    },
                    {
                      title:
                        'Credit assessment',
                      description:
                        'Financial and eligibility assessment.',
                      completed:
                        isApproved,
                    },
                    {
                      title:
                        'Approval decision',
                      description:
                        isRejected
                          ? 'The application was not approved.'
                          : 'Final lending decision.',
                      completed:
                        isApproved ||
                        isRejected,
                    },
                    {
                      title:
                        'Loan sanction & disbursement',
                      description:
                        'Available after successful approval.',
                      completed: false,
                    },
                  ].map(
                    (
                      item,
                      index,
                      list
                    ) => (
                      <div
                        key={item.title}
                        className="flex gap-4"
                      >
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                              item.completed
                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                : 'border-slate-300 bg-white text-slate-400'
                            }`}
                          >
                            {item.completed ? (
                              <svg
                                className="h-3.5 w-3.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                              >
                                <path d="m5 12 4 4L19 6" />
                              </svg>
                            ) : (
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            )}
                          </div>

                          {index <
                            list.length -
                              1 && (
                            <div className="min-h-[44px] w-px flex-1 bg-slate-200" />
                          )}
                        </div>

                        <div className="pb-6">
                          <p className="text-[12px] font-semibold text-slate-800">
                            {item.title}
                          </p>

                          <p className="mt-1 text-[10.5px] leading-4 text-slate-500">
                            {
                              item.description
                            }
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </section>
            )}

            {/* Summary cards */}
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <MetricCard
                label="Application status"
                value={
                  statusConfig[status]
                    ?.label ||
                  status ||
                  '—'
                }
                helper={
                  isSubmitted
                    ? 'Your application is awaiting processing.'
                    : undefined
                }
              />

              <MetricCard
                label="KYC verification"
                value={
                  isSubmitted ||
                  isApproved ||
                  isRejected
                    ? 'In review'
                    : 'Pending'
                }
                helper="Document status will update after verification."
              />

              <MetricCard
                label="Next EMI due"
                value="—"
                helper="Available after loan disbursement."
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default CustomerDashboard;