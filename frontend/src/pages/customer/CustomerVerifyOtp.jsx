import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

function CustomerVerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();

  const emailFromState = location.state?.email || '';
  const mode = location.state?.mode || 'register';

  const [email, setEmail] = useState(emailFromState);
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [seconds, setSeconds] = useState(30);

  const inputsRef = useRef([]);

  const otp = digits.join('');

  useEffect(() => {
    if (seconds <= 0) return;

    const timer = setInterval(() => {
      setSeconds((current) => current - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds]);

  const handleDigitChange = (index, value) => {
    const number = value.replace(/\D/g, '').slice(-1);

    const next = [...digits];
    next[index] = number;
    setDigits(next);

    if (number && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();

    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);

    if (!pasted) return;

    const next = ['', '', '', '', '', ''];

    pasted.split('').forEach((digit, index) => {
      next[index] = digit;
    });

    setDigits(next);

    inputsRef.current[Math.min(pasted.length, 6) - 1]?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    const endpoint =
      mode === 'login'
        ? 'http://localhost:8000/api/v1/customer/verify-login-otp'
        : 'http://localhost:8000/api/v1/customer/verify-otp';

    try {
      const response = await axios.post(endpoint, {
        email,
        otp,
      });

      localStorage.setItem('customer_token', response.data.token);
      localStorage.setItem(
        'customer_user',
        JSON.stringify(response.data.user)
      );

      navigate('/customer/dashboard');
    } catch (err) {
      console.error('OTP verification error:', err);

      setError(
        err.response?.data?.errors?.otp?.[0] ||
          err.response?.data?.message ||
          'The verification code is invalid or has expired.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || seconds > 0 || resending) return;

    setError('');
    setSuccess('');
    setResending(true);

    try {
      await axios.post(
        'http://localhost:8000/api/v1/customer/resend-otp',
        { email }
      );

      setDigits(['', '', '', '', '', '']);
      setSeconds(30);
      setSuccess(
        'A new verification code has been sent to your email address.'
      );

      inputsRef.current[0]?.focus();
    } catch (err) {
      console.error('OTP resend error:', err);

      setError(
        err.response?.data?.message ||
          'We could not resend the verification code. Please try again.'
      );
    } finally {
      setResending(false);
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

          <Link
            to="/customer/login"
            className="text-[12px] font-semibold text-slate-500 transition hover:text-[#0a2142]"
          >
            Back to sign in
          </Link>
        </div>
      </header>

      {/* Main */}
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
                    Identity verification
                  </span>
                </div>

                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]">
                  <svg
                    className="h-5 w-5 text-blue-300"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>
                </div>

                <h1 className="max-w-[270px] text-[27px] font-semibold leading-[1.2] tracking-[-0.035em]">
                  {mode === 'login' ? (
                    <>
                      One more step to
                      <span className="block text-blue-300">
                        secure your sign-in.
                      </span>
                    </>
                  ) : (
                    <>
                      Verify your email to
                      <span className="block text-blue-300">
                        activate your account.
                      </span>
                    </>
                  )}
                </h1>

                <p className="mt-4 max-w-[270px] text-[12.5px] leading-5 text-slate-300">
                  {mode === 'login'
                    ? 'We use a one-time verification code to confirm that this sign-in request belongs to you.'
                    : 'Email verification helps us protect your LoanEdge account and confirm your contact details.'}
                </p>
              </div>

              <div className="relative flex items-center gap-3">
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
                  <p className="text-[11.5px] font-semibold">
                    Secure account access
                  </p>
                  <p className="mt-0.5 text-[10.5px] text-slate-400">
                    Verification codes are valid for a limited time
                  </p>
                </div>
              </div>
            </section>

            {/* OTP form */}
            <section className="px-6 py-8 sm:px-10 sm:py-10">
              <div className="mx-auto max-w-[355px]">
                <div className="mb-6">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.13em] text-blue-700">
                    Verification required
                  </p>

                  <h2 className="text-[26px] font-bold tracking-[-0.035em] text-[#10213a]">
                    Enter verification code
                  </h2>

                  <p className="mt-2 text-[12.5px] leading-5 text-slate-500">
                    We sent a 6-digit code to{' '}
                    <span className="font-semibold text-slate-700">
                      {email || 'your email address'}
                    </span>
                  </p>
                </div>

                {error && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-[12px] leading-[18px] text-red-700">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-[12px] leading-[18px] text-emerald-700">
                    {success}
                  </div>
                )}

                <form onSubmit={handleVerify}>
                  {!emailFromState && (
                    <div className="mb-4">
                      <label className="mb-1.5 block text-[12px] font-semibold text-slate-700">
                        Email address
                      </label>

                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="h-[43px] w-full rounded-lg border border-slate-300 bg-[#fbfcfe] px-3.5 text-[13px] outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                      />
                    </div>
                  )}

                  {/* Separate OTP boxes */}
                  <div
                    className="flex justify-between gap-2"
                    onPaste={handlePaste}
                  >
                    {digits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(element) => {
                          inputsRef.current[index] = element;
                        }}
                        type="text"
                        inputMode="numeric"
                        autoComplete={index === 0 ? 'one-time-code' : 'off'}
                        maxLength={1}
                        value={digit}
                        autoFocus={index === 0}
                        onChange={(e) =>
                          handleDigitChange(index, e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="h-[50px] min-w-0 flex-1 rounded-lg border border-slate-300 bg-[#fbfcfe] text-center text-[19px] font-bold text-[#10213a] outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10"
                      />
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-[10.5px] text-slate-400">
                      Code expires in 10 minutes
                    </p>

                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={seconds > 0 || resending}
                      className="text-[11px] font-semibold text-blue-700 disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                      {resending
                        ? 'Sending...'
                        : seconds > 0
                          ? `Resend in ${seconds}s`
                          : 'Resend code'}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="mt-5 flex h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#0a2142] px-4 text-[12.5px] font-semibold text-white transition hover:bg-[#123561] focus:ring-4 focus:ring-[#0a2142]/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify and continue

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

                <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3">
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
                    For your security, never share your verification code with
                    anyone. LoanEdge representatives will never ask you for
                    this code.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CustomerVerifyOtp;