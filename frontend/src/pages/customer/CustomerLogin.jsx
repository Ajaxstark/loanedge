import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function CustomerLogin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setNeedsVerification(false);
    setLoading(true);

    try {
      const response = await axios.post(
        'http://localhost:8000/api/v1/customer/login',
        form
      );

      // Password verified -> backend sends login OTP
      if (response.data.otp_required) {
        navigate('/customer/verify-otp', {
          state: {
            email: form.email,
            mode: 'login',
          },
        });

        return;
      }

      // Fallback if backend directly returns token
      if (response.data.token) {
        localStorage.setItem('customer_token', response.data.token);
        localStorage.setItem(
          'customer_user',
          JSON.stringify(response.data.user)
        );

        navigate('/customer/dashboard');
      }
    } catch (err) {
      console.error('Customer login error:', err);

      if (
        err.response?.status === 403 &&
        err.response?.data?.is_verified === false
      ) {
        setNeedsVerification(true);

        setError(
          'Your email address has not been verified. Please verify your account to continue.'
        );

        return;
      }

      const validationError =
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.errors?.password?.[0];

      setError(
        validationError ||
          err.response?.data?.message ||
          'We could not sign you in. Please check your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAccount = () => {
    if (!form.email) {
      setError('Please enter your registered email address first.');
      return;
    }

    navigate('/customer/verify-otp', {
      state: {
        email: form.email,
        mode: 'register',
      },
    });
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
              Don't have an account?
            </span>

            <Link
              to="/customer/register"
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-[12.5px] font-semibold text-[#0a2142] transition hover:border-[#0a2142] hover:bg-slate-50"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex min-h-[calc(100vh-66px)] items-center justify-center px-4 py-6 sm:px-6">
        <div className="w-full max-w-[880px] overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_18px_55px_-28px_rgba(15,23,42,0.28)]">
          <div className="grid md:grid-cols-[0.82fr_1.18fr]">
            {/* Left Brand Panel */}
            <section className="relative hidden overflow-hidden bg-[#0a2142] p-8 text-white md:flex md:flex-col md:justify-between">
              {/* Decorative circles */}
              <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full border border-white/[0.06]" />
              <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full border border-white/[0.06]" />

              <div className="relative">
                <div className="mb-8 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />

                  <span className="text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-300">
                    Secure customer access
                  </span>
                </div>

                <h1 className="max-w-[265px] text-[27px] font-semibold leading-[1.2] tracking-[-0.035em]">
                  Your loan account,
                  <span className="block text-blue-300">
                    securely accessible.
                  </span>
                </h1>

                <p className="mt-4 max-w-[270px] text-[12.5px] leading-5 text-slate-300">
                  Review your application, verification progress and loan
                  account from one protected customer portal.
                </p>
              </div>

              {/* Clean bottom branding instead of feature boxes */}
              <div className="relative">
                <div className="mb-4 h-px bg-white/10" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10.5px] font-medium text-slate-300">
                      LoanEdge NBFC
                    </p>

                    <p className="mt-1 text-[9.5px] text-slate-500">
                      Customer services portal
                    </p>
                  </div>

                  <svg
                    className="h-5 w-5 text-blue-300"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <path d="M12 3 5 6v5c0 4.5 2.8 8.5 7 10 4.2-1.5 7-5.5 7-10V6l-7-3Z" />
                    <path d="m9.5 12 1.7 1.7 3.5-3.7" />
                  </svg>
                </div>
              </div>
            </section>

            {/* Login Form */}
            <section className="px-6 py-8 sm:px-10 sm:py-10">
              <div className="mx-auto max-w-[355px]">
                <div className="mb-7">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.13em] text-blue-700">
                    Customer sign in
                  </p>

                  <h2 className="text-[27px] font-bold tracking-[-0.035em] text-[#10213a]">
                    Welcome back
                  </h2>

                  <p className="mt-2 text-[12.5px] leading-5 text-slate-500">
                    Enter your registered credentials to continue.
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div
                    role="alert"
                    className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3"
                  >
                    <div className="flex items-start gap-2.5">
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 8v5" />
                        <path d="M12 16.5h.01" />
                      </svg>

                      <div>
                        <p className="text-[12px] leading-[18px] text-red-700">
                          {error}
                        </p>

                        {needsVerification && (
                          <button
                            type="button"
                            onClick={handleVerifyAccount}
                            className="mt-1 text-[12px] font-bold text-red-800 underline underline-offset-2"
                          >
                            Verify your account
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
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
                        <rect
                          x="3"
                          y="5"
                          width="18"
                          height="14"
                          rx="2"
                        />
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
                        className="h-[44px] w-full rounded-lg border border-slate-300 bg-[#fbfcfe] pl-10 pr-3.5 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label
                        htmlFor="customer-password"
                        className="text-[12px] font-semibold text-slate-700"
                      >
                        Password
                      </label>

                      <button
                        type="button"
                        className="text-[11px] font-semibold text-blue-700 transition hover:text-blue-900"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <div className="relative">
                      <svg
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <rect
                          x="4"
                          y="10"
                          width="16"
                          height="10"
                          rx="2"
                        />
                        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                      </svg>

                      <input
                        id="customer-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        value={form.password}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            password: e.target.value,
                          })
                        }
                        placeholder="Enter your password"
                        className="h-[44px] w-full rounded-lg border border-slate-300 bg-[#fbfcfe] pl-10 pr-[65px] text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((current) => !current)
                        }
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-500 transition hover:text-slate-800"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group flex h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#0a2142] px-4 text-[12.5px] font-semibold text-white transition hover:bg-[#123561] focus:outline-none focus:ring-4 focus:ring-[#0a2142]/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Verifying credentials...
                      </>
                    ) : (
                      <>
                        Continue securely

                        <svg
                          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
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

                {/* OTP Notice */}
                <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3">
                  <div className="flex items-start gap-2.5">
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.9"
                    >
                      <path d="M12 3 5 6v5c0 4.5 2.8 8.5 7 10 4.2-1.5 7-5.5 7-10V6l-7-3Z" />
                      <path d="m9.5 12 1.7 1.7 3.5-3.7" />
                    </svg>

                    <div>
                      <p className="text-[11.5px] font-semibold text-slate-700">
                        Two-step verification
                      </p>

                      <p className="mt-0.5 text-[10.5px] leading-4 text-slate-500">
                        A one-time verification code will be sent to your
                        registered email after your password is verified.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mobile register */}
                <p className="mt-5 text-center text-[12px] text-slate-500 md:hidden">
                  New to LoanEdge?{' '}
                  <Link
                    to="/customer/register"
                    className="font-semibold text-blue-700"
                  >
                    Create an account
                  </Link>
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CustomerLogin;