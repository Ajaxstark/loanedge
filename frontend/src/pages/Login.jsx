import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../api/axios';

/* ---------- Icons (same as before) ---------- */
const MailIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 1 1 8 0v4" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M9.9 9.9a3 3 0 1 0 4.2 4.2" />
    <path d="M6.6 6.6A13.5 13.5 0 0 0 2 12s3 7 10 7c1.9 0 3.5-.4 4.9-1.1" />
    <path d="M10.7 5.1A10.4 10.4 0 0 1 12 5c7 0 10 7 10 7a13 13 0 0 1-1.7 2.7" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  /* Redirect to this path after login (default: /dashboard) */
  const redirectTo = location.state?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      /* Axios instance use karo — token automatically handle hoga */
      const { data } = await api.post('/login', {
        email,
        password,
      });

      /* Token save karo (remember me ke hisaab se) */
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem('token', data.token);

      /* User info bhi save kar sakte ho (optional) */
      if (data.user) {
        storage.setItem('user', JSON.stringify(data.user));
      }

      /* Login ke baad wapas usi page par jao jahan se aaye the */
      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error('Login error:', err);

      setError(
        err.response?.data?.message ||
          err.displayMessage ||
          'Invalid email or password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col lg:flex-row">

        {/* ---------------- Left Branding Panel ---------------- */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-700 to-indigo-900 text-white flex-col justify-between p-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-lg leading-tight">LoanEdge</div>
              <div className="text-xs text-blue-200">NBFC Loan Management</div>
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold leading-tight mb-3">
              Secure &amp; Smart<br />Loan Management
            </h1>
            <p className="text-blue-100 text-sm max-w-sm">
              Access your dashboard to manage leads, loans, collections, and more.
            </p>

            <div className="mt-8 space-y-3 text-sm">
              <div className="flex items-center gap-2 text-blue-100">
                <span className="w-1.5 h-1.5 bg-blue-300 rounded-full" />
                256-bit encrypted connection
              </div>
              <div className="flex items-center gap-2 text-blue-100">
                <span className="w-1.5 h-1.5 bg-blue-300 rounded-full" />
                Role-based access control
              </div>
              <div className="flex items-center gap-2 text-blue-100">
                <span className="w-1.5 h-1.5 bg-blue-300 rounded-full" />
                Real-time data sync
              </div>
            </div>
          </div>

          <p className="text-xs text-blue-300">Version 2.0 · RBI Compliant</p>
        </div>

        {/* ---------------- Right Login Panel ---------------- */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
          <div className="w-full max-w-sm">

            <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">LE</span>
              </div>
              <span className="text-xl font-semibold text-gray-800">LoanEdge</span>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
            <p className="text-sm text-gray-500 mb-8">Sign in to your account to continue</p>

            {error && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                {error}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <MailIcon />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@loanedge.com"
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <a href="#" className="text-xs text-blue-600 hover:underline">Forgot password?</a>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <LockIcon />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full border border-gray-300 rounded-lg pl-10 pr-11 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                />
                Keep me signed in
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 active:bg-blue-800 transition shadow-sm disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-8">
              Don't have an account?{' '}
              <Link to="/customer/register" className="text-blue-600 font-medium hover:underline">
                Register as Customer
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;