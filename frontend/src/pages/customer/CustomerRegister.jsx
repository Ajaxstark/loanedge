import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function CustomerRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      await axios.post(
        'http://localhost:8000/api/v1/customer/register',
        form
      );

      navigate('/customer/verify-otp', {
        state: {
          email: form.email,
          mode: 'register',
        },
      });
    } catch (err) {
      console.error('Customer registration error:', err);

      const validationError =
        err.response?.data?.errors?.name?.[0] ||
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.errors?.password?.[0];

      setError(
        validationError ||
          err.response?.data?.message ||
          'We could not create your account. Please review your information and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f6fa] text-slate-900">
      {/* Header */}
      <header className="h-[66px] border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link
            to="/customer/login"
            className="flex items-center gap-2.5"
          >
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
              <p className="mt-1 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Customer Portal
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-[12.5px] text-slate-500 sm:inline">
              Already registered?
            </span>

            <Link
              to="/customer/login"
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-[12.5px] font-semibold text-[#0a2142] transition hover:border-[#0a2142] hover:bg-slate-50"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* Page */}
      <main className="flex min-h-[calc(100vh-66px)] items-center justify-center px-4 py-6 sm:px-6">
        <div className="w-full max-w-[880px] overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_18px_55px_-28px_rgba(15,23,42,0.28)]">
          <div className="grid md:grid-cols-[0.82fr_1.18fr]">
            {/* Left */}
            <section className="relative hidden overflow-hidden bg-[#0a2142] p-8 text-white md:flex md:flex-col md:justify-between">
              <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full border border-white/[0.06]" />
              <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full border border-white/[0.06]" />

              <div className="relative">
                <div className="mb-8 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-300">
                    Customer registration
                  </span>
                </div>

                <h1 className="max-w-[270px] text-[27px] font-semibold leading-[1.2] tracking-[-0.035em]">
                  Start your loan journey
                  <span className="block text-blue-300">
                    with LoanEdge.
                  </span>
                </h1>

                <p className="mt-4 max-w-[270px] text-[12.5px] leading-5 text-slate-300">
                  Create your secure account to apply for a loan, complete
                  verification and track your application.
                </p>
              </div>

              <div className="relative mt-10 space-y-3">
                <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.07]">
                    <svg
                      className="h-4 w-4 text-blue-300"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="m3 7 9 6 9-6" />
                    </svg>
                  </div>

                  <div>
                    <p className="text-[11.5px] font-semibold text-white">
                      Email verification
                    </p>
                    <p className="mt-0.5 text-[10.5px] text-slate-400">
                      Your account is verified using OTP
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.07]">
                    <svg
                      className="h-4 w-4 text-blue-300"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M12 3 5 6v5c0 4.5 2.8 8.5 7 10 4.2-1.5 7-5.5 7-10V6l-7-3Z" />
                      <path d="m9.5 12 1.7 1.7 3.5-3.7" />
                    </svg>
                  </div>

                  <div>
                    <p className="text-[11.5px] font-semibold text-white">
                      Secure account access
                    </p>
                    <p className="mt-0.5 text-[10.5px] text-slate-400">
                      Your information stays protected
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Form */}
            <section className="px-6 py-7 sm:px-10 sm:py-8">
              <div className="mx-auto max-w-[355px]">
                <div className="mb-5">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.13em] text-blue-700">
                    Create account
                  </p>

                  <h2 className="text-[26px] font-bold tracking-[-0.035em] text-[#10213a]">
                    Get started
                  </h2>

                  <p className="mt-1.5 text-[12.5px] leading-5 text-slate-500">
                    Enter your details to create your customer account.
                  </p>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3"
                  >
                    <p className="text-[12px] leading-[18px] text-red-700">
                      {error}
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="customer-name"
                      className="mb-1.5 block text-[12px] font-semibold text-slate-700"
                    >
                      Full name
                    </label>

                    <div className="relative">
                      <svg
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 21a8 8 0 0 1 16 0" />
                      </svg>

                      <input
                        id="customer-name"
                        type="text"
                        required
                        autoComplete="name"
                        value={form.name}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            name: e.target.value,
                          })
                        }
                        placeholder="Enter your full name"
                        className="h-[43px] w-full rounded-lg border border-slate-300 bg-[#fbfcfe] pl-10 pr-3.5 text-[13px] outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="customer-email"
                      className="mb-1.5 block text-[12px] font-semibold text-slate-700"
                    >
                      Email address
                    </label>

                    <div className="relative">
                      <svg
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                        <path d="m3 7 9 6 9-6" />
                      </svg>

                      <input
                        id="customer-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={form.email}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            email: e.target.value,
                          })
                        }
                        placeholder="name@example.com"
                        className="h-[43px] w-full rounded-lg border border-slate-300 bg-[#fbfcfe] pl-10 pr-3.5 text-[13px] outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label
                      htmlFor="customer-password"
                      className="mb-1.5 block text-[12px] font-semibold text-slate-700"
                    >
                      Password
                    </label>

                    <div className="relative">
                      <svg
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <rect x="4" y="10" width="16" height="10" rx="2" />
                        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                      </svg>

                      <input
                        id="customer-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        autoComplete="new-password"
                        value={form.password}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            password: e.target.value,
                          })
                        }
                        placeholder="Minimum 6 characters"
                        className="h-[43px] w-full rounded-lg border border-slate-300 bg-[#fbfcfe] pl-10 pr-16 text-[13px] outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((current) => !current)
                        }
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-1 flex h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#0a2142] px-4 text-[12.5px] font-semibold text-white transition hover:bg-[#123561] focus:ring-4 focus:ring-[#0a2142]/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create account
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
                </form>

                <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/70 px-3.5 py-2.5">
                  <p className="text-[10.5px] leading-4 text-slate-600">
                    A 6-digit verification code will be sent to this email
                    address before your account is activated.
                  </p>
                </div>

                <p className="mt-4 text-center text-[10.5px] leading-4 text-slate-400">
                  By creating an account, you agree to LoanEdge's Terms of
                  Service and Privacy Policy.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CustomerRegister;