import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function CustomerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('customer_token');
    const storedUser = localStorage.getItem('customer_user');

    if (!token) {
      navigate('/customer/login');
      return;
    }

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_user');
    navigate('/customer/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-slate-950 rounded-md flex items-center justify-center">
            <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="font-semibold text-[15px] text-slate-950">LoanEdge</span>
        </div>

        <div className="flex items-center gap-5">
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[12px] font-semibold text-slate-600">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-[13.5px] text-slate-600 font-medium">{user.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-[13px] font-medium text-slate-500 hover:text-red-600 transition"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-8 py-12">
        <h1 className="text-[1.6rem] font-semibold text-slate-950 tracking-tight mb-1">
          Welcome, {user.name?.split(' ')[0]}
        </h1>
        <p className="text-[14.5px] text-slate-500 mb-10">
          Here's an overview of your loan application.
        </p>

        {/* CTA card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mb-6">
            <svg className="w-7 h-7 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M21 8v13H3V8" />
              <path d="M1 3h22v5H1z" />
              <path d="M10 12h4" />
            </svg>
          </div>
          <h2 className="text-[1.15rem] font-semibold text-slate-950 mb-2">
            You haven't started a loan application
          </h2>
          <p className="text-[14px] text-slate-500 max-w-sm mb-7 leading-relaxed">
            Complete a short application to check your eligibility and begin
            the loan process.
          </p>
          <button
            onClick={() => navigate('/customer/apply')}
            className="bg-slate-950 hover:bg-slate-800 text-white text-[14px] font-medium px-6 py-2.5 rounded-lg transition"
          >
            Start application
          </button>
        </div>

        {/* Status cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {[
            { label: 'Application status', value: 'Not started' },
            { label: 'KYC verification', value: 'Pending' },
            { label: 'Next EMI due', value: '—' },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-xl border border-slate-200 p-5">
              <p className="text-[11.5px] text-slate-400 uppercase tracking-wide font-medium mb-1.5">
                {item.label}
              </p>
              <p className="text-[14.5px] font-semibold text-slate-400">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CustomerDashboard;