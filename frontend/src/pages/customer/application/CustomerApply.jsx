import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import PersonalStep from './steps/PersonalStep';
import AddressStep from './steps/AddressStep';
import EmploymentStep from './steps/EmploymentStep';
import LoanStep from './steps/LoanStep';
import DocumentsStep from './steps/DocumentsStep';
import ReviewStep from './steps/ReviewStep';

const API_BASE =
  'http://localhost:8000/api/v1/customer';

const STEPS = [
  {
    id: 1,
    title: 'Personal',
    description: 'Personal information',
  },
  {
    id: 2,
    title: 'Identity & Address',
    description: 'Identity and residence',
  },
  {
    id: 3,
    title: 'Employment',
    description: 'Employment and income',
  },
  {
    id: 4,
    title: 'Loan Details',
    description: 'Product and requirement',
  },
  {
    id: 5,
    title: 'Documents',
    description: 'Supporting documents',
  },
  {
    id: 6,
    title: 'Review',
    description: 'Review and confirm',
  },
];

function formatStatus(value) {
  if (!value) return 'Draft';

  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function StepPlaceholder({ step }) {
  return (
    <div className="flex min-h-[390px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/40 px-6 text-center">
      <div className="max-w-sm">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 bg-blue-50">
          <span className="text-sm font-bold text-blue-700">
            {step.id}
          </span>
        </div>

        <h3 className="mt-4 text-sm font-semibold text-slate-900">
          {step.title}
        </h3>

        <p className="mt-1.5 text-xs leading-5 text-slate-500">
          This section will be connected to its saved
          application data and backend endpoint next.
        </p>
      </div>
    </div>
  );
}

function CustomerApply() {
  const navigate = useNavigate();

  const [application, setApplication] =
    useState(null);

  const [activeStep, setActiveStep] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState('');

  const token =
    localStorage.getItem('customer_token');

  useEffect(() => {
    const initialiseApplication = async () => {
      if (!token) {
        navigate('/customer/login', {
          replace: true,
        });

        return;
      }

      setLoading(true);
      setError('');

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      };

      try {
        /*
         * Existing application retrieve karo.
         */
        const currentResponse =
          await axios.get(
            `${API_BASE}/application`,
            config
          );

        let currentApplication =
          currentResponse.data.data;

        /*
         * Agar application exist nahi karti,
         * backend se new draft start karo.
         */
        if (!currentApplication) {
          const startResponse =
            await axios.post(
              `${API_BASE}/application/start`,
              {},
              config
            );

          currentApplication =
            startResponse.data.data;
        }

        setApplication(currentApplication);

        const savedStep = Math.min(
          Math.max(
            Number(
              currentApplication?.current_step ||
                1
            ),
            1
          ),
          6
        );

        setActiveStep(savedStep);
      } catch (err) {
        console.error(
          'Customer application initialization error:',
          err
        );

        if (err.response?.status === 401) {
          localStorage.removeItem(
            'customer_token'
          );

          localStorage.removeItem(
            'customer_user'
          );

          navigate('/customer/login', {
            replace: true,
          });

          return;
        }

        setError(
          err.response?.data?.message ||
            'We could not load your loan application. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    initialiseApplication();
  }, [navigate, token]);

  /*
   * Child step backend se updated application
   * return karega.
   */
  const handleApplicationUpdate = (
    updatedApplication,
    nextStep
  ) => {
    setApplication(updatedApplication);

    if (nextStep) {
      setActiveStep(nextStep);
    }
  };

  /*
   * Customer reached/completed sections par
   * manually navigate kar sakta hai.
   */
  const handleStepNavigation = (stepId) => {
    const highestReachableStep = Math.min(
      Math.max(
        Number(
          application?.current_step || 1
        ),
        1
      ),
      6
    );

    if (stepId <= highestReachableStep) {
      setActiveStep(stepId);
    }
  };

  const currentStep =
    STEPS.find(
      (step) => step.id === activeStep
    ) || STEPS[0];

  const backendStep = Math.min(
    Math.max(
      Number(application?.current_step || 1),
      1
    ),
    6
  );

  /*
   * Step 1 = 0%
   * Step 2 = 20%
   * Step 3 = 40%
   * Step 4 = 60%
   * Step 5 = 80%
   * Step 6 = 100%
   */
  const progressPercentage = Math.round(
    ((backendStep - 1) /
      (STEPS.length - 1)) *
      100
  );

  const renderStep = () => {
    switch (activeStep) {
      case 1:
        return (
          <PersonalStep
            application={application}
            onApplicationUpdate={handleApplicationUpdate}
          />
        );

      case 2:
        return (
          <AddressStep
            application={application}
            onApplicationUpdate={handleApplicationUpdate}
            onPrevious={() => setActiveStep(1)}
          />
        );

      case 3:
        return (
          <EmploymentStep
            application={application}
            onApplicationUpdate={handleApplicationUpdate}
            onPrevious={() => setActiveStep(2)}
          />
        );

      case 4:
        return (
          <LoanStep
            application={application}
            onApplicationUpdate={handleApplicationUpdate}
            onPrevious={() => setActiveStep(3)}
          />
        );

      case 5:
        return (
          <DocumentsStep
            application={application}
            onApplicationUpdate={handleApplicationUpdate}
            onPrevious={() => setActiveStep(4)}
          />
        );

      case 6:
        return (
          <ReviewStep
            application={application}
            onPrevious={() => setActiveStep(5)}
            onEditStep={(step) => setActiveStep(step)}
          />
        );
        
      default:
        return (
          <StepPlaceholder step={currentStep} />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f8fb] px-6">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-[3px] border-blue-100 border-t-blue-600" />

          <p className="mt-4 text-sm font-semibold text-slate-700">
            Preparing your application
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Restoring your saved progress...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f8fb] px-5">
        <div className="w-full max-w-[430px] rounded-xl border border-slate-200 bg-white p-7 text-center shadow-sm">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-red-50">
            <svg
              className="h-5 w-5 text-red-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
              />

              <path d="M12 8v5" />
              <path d="M12 17h.01" />
            </svg>
          </div>

          <h1 className="mt-4 text-lg font-bold text-slate-900">
            Application unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error}
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() =>
                navigate(
                  '/customer/dashboard'
                )
              }
              className="h-9 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Dashboard
            </button>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              className="h-9 rounded-lg bg-[#0f2d52] px-4 text-xs font-semibold text-white transition hover:bg-[#153d6e]"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900">
      {/* Customer Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-[66px] max-w-[1320px] items-center justify-between px-5 sm:px-8">
          <button
            type="button"
            onClick={() =>
              navigate('/customer/dashboard')
            }
            className="flex items-center gap-2.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#0f2d52]">
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

            <div className="text-left">
              <p className="text-[15px] font-bold leading-none tracking-[-0.02em] text-[#0f2d52]">
                LoanEdge
              </p>

              <p className="mt-1 text-[9.5px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Customer Portal
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              navigate('/customer/dashboard')
            }
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          >
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>

            Back to dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] px-5 py-7 sm:px-8">
        {/* Page Introduction */}
        <section className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <span>Customer Portal</span>
              <span>/</span>

              <span className="text-slate-600">
                Loan Application
              </span>
            </div>

            <h1 className="mt-2 text-[26px] font-bold tracking-[-0.035em] text-slate-950">
              Complete your loan application
            </h1>

            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
              Provide the required information and
              supporting documents. Your progress
              is saved as you complete each section.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                Application reference
              </p>

              <p className="mt-1 font-mono text-[13px] font-semibold text-slate-800">
                {application
                  ?.application_number ||
                  'Pending'}
              </p>
            </div>

            <div className="h-9 w-px bg-slate-200" />

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                Status
              </p>

              <div className="mt-1 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

                <span className="text-[12px] font-semibold text-slate-700">
                  {formatStatus(
                    application?.status
                  )}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Application Workspace */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
          {/* Progress Sidebar */}
          <aside>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      Application progress
                    </p>

                    <p className="mt-1 text-[11px] text-slate-400">
                      Step {backendStep} of 6
                    </p>
                  </div>

                  <span className="text-sm font-bold text-blue-700">
                    {progressPercentage}%
                  </span>
                </div>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-300"
                    style={{
                      width: `${progressPercentage}%`,
                    }}
                  />
                </div>
              </div>

              <nav className="p-2.5">
                {STEPS.map((step) => {
                  const completed =
                    backendStep > step.id;

                  const active =
                    activeStep === step.id;

                  const accessible =
                    step.id <= backendStep;

                  return (
                    <button
                      key={step.id}
                      type="button"
                      disabled={!accessible}
                      onClick={() =>
                        handleStepNavigation(
                          step.id
                        )
                      }
                      className={`group flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition ${
                        active
                          ? 'bg-blue-50'
                          : accessible
                            ? 'hover:bg-slate-50'
                            : 'cursor-default opacity-55'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                          completed
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : active
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-300 bg-white text-slate-500'
                        }`}
                      >
                        {completed ? (
                          <svg
                            className="h-3 w-3"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.6"
                          >
                            <path d="m5 12 4 4L19 6" />
                          </svg>
                        ) : (
                          step.id
                        )}
                      </span>

                      <span className="min-w-0">
                        <span
                          className={`block text-[12px] font-semibold ${
                            active
                              ? 'text-blue-800'
                              : 'text-slate-700'
                          }`}
                        >
                          {step.title}
                        </span>

                        <span className="mt-0.5 block text-[10.5px] leading-4 text-slate-400">
                          {step.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </nav>

              <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4">
                <div className="flex items-start gap-2.5">
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M12 3 5 6v5c0 4.5 2.8 8.5 7 10 4.2-1.5 7-5.5 7-10V6l-7-3Z" />
                    <path d="m9.5 12 1.7 1.7 3.5-3.7" />
                  </svg>

                  <p className="text-[10.5px] leading-4 text-slate-500">
                    Completed sections are securely
                    saved to your account.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Step Workspace */}
          <section className="min-w-0">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {/* Step header */}
              <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-blue-700">
                      Step {activeStep}
                    </span>

                    <span className="h-1 w-1 rounded-full bg-slate-300" />

                    <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400">
                      {
                        currentStep.description
                      }
                    </span>
                  </div>

                  <h2 className="mt-1.5 text-lg font-bold text-slate-950">
                    {currentStep.title}
                  </h2>
                </div>

                {activeStep < backendStep && (
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1.5 text-[10.5px] font-semibold text-emerald-700">
                    <svg
                      className="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="m5 12 4 4L19 6" />
                    </svg>

                    Saved
                  </span>
                )}
              </div>

              {/* Actual active form */}
              <div className="p-6 sm:p-8">
                {renderStep()}
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-2 px-1 text-[10.5px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <span>
                LoanEdge uses the information you
                provide to assess and process your
                loan application.
              </span>

              <span>
                Application{' '}
                {application
                  ?.application_number || ''}
              </span>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default CustomerApply;