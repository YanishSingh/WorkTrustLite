import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

interface Invoice {
  _id: string;
  amount: number;
  status: string;
}

const Dashboard: React.FC = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState({
    total: 0,
    paid: 0,
    unpaid: 0,
    earned: 0,
  });

  useEffect(() => {
    if (user?.role !== 'freelancer') return;
    api.get<Invoice[]>('/invoice/freelancer', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const invoices = res.data;
        const paid = invoices.filter(i => i.status === 'paid');
        const unpaid = invoices.filter(i => i.status !== 'paid');
        setSummary({
          total: invoices.length,
          paid: paid.length,
          unpaid: unpaid.length,
          earned: paid.reduce((sum, i) => sum + (i.amount || 0), 0),
        });
      })
      .catch(() => setSummary({ total: 0, paid: 0, unpaid: 0, earned: 0 }));
  }, [user, token]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-tr from-emerald-50 via-emerald-100 to-white">
      {/* Top navbar */}
<header className="bg-white/90 shadow backdrop-blur sticky top-0 z-20">
  <div className="max-w-6xl mx-auto flex items-center justify-between py-3 px-6">
    {/* LOGO Start */}
    <div className="flex items-center gap-3">
      <span className="inline-flex items-center justify-center bg-gradient-to-tr from-emerald-600 to-blue-400 rounded-full w-10 h-10 shadow-lg">
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" className="text-white">
          <path d="M12 21c4.97 0 9-4.03 9-9 0-4.97-4.03-9-9-9S3 7.03 3 12c0 4.97 4.03 9 9 9Zm0-3v-2m0 0a3 3 0 0 1-2.99-3.15c.14-1.65 1.48-2.65 2.99-2.65s2.85 1 2.99 2.65A3 3 0 0 1 12 16Zm0 0V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
      <span className="text-emerald-800 font-extrabold text-2xl tracking-tight ml-2 select-none">
        WorkTrust <span className="font-black text-emerald-600">Lite</span>
      </span>
    </div>
    {/* LOGO End */}
    <div className="flex items-center gap-6">
      <span className="text-emerald-700 font-medium hidden sm:inline">Hi, {user.name}</span>
      <button
        onClick={() => {
          logout();
          navigate('/login');
        }}
        className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-semibold px-4 py-1.5 rounded-lg border border-emerald-200 shadow-sm transition active:scale-95"
      >
        Log out
      </button>
    </div>
  </div>
</header>


      {/* Hero banner */}
      <section className="bg-white/90 py-10 border-b border-emerald-50">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-emerald-800 mb-2">
            Welcome, <span className="capitalize">{user.name}</span>!
          </h2>
          <p className="text-emerald-600 font-medium">Role: <em className="capitalize">{user.role}</em></p>
        </div>
      </section>

      {/* Freelancer summary cards */}
      {user.role === 'freelancer' && (
        <section className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow p-5 flex flex-col items-center border-t-4 border-emerald-400">
            <span className="text-emerald-500 mb-2">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path d="M12 21c4.97 0 9-4.03 9-9 0-4.97-4.03-9-9-9S3 7.03 3 12c0 4.97 4.03 9 9 9Z" stroke="currentColor" strokeWidth="2"/><path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </span>
            <div className="text-2xl font-bold text-emerald-700">{summary.total}</div>
            <div className="text-emerald-500 font-medium mt-1">Total Invoices</div>
          </div>
          <div className="bg-white rounded-xl shadow p-5 flex flex-col items-center border-t-4 border-green-400">
            <span className="text-green-500 mb-2">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <div className="text-2xl font-bold text-green-700">{summary.paid}</div>
            <div className="text-green-500 font-medium mt-1">Paid</div>
          </div>
          <div className="bg-white rounded-xl shadow p-5 flex flex-col items-center border-t-4 border-yellow-400">
            <span className="text-yellow-500 mb-2">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M8 12h4l2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </span>
            <div className="text-2xl font-bold text-yellow-700">{summary.unpaid}</div>
            <div className="text-yellow-500 font-medium mt-1">Unpaid</div>
          </div>
          <div className="bg-white rounded-xl shadow p-5 flex flex-col items-center border-t-4 border-blue-400">
            <span className="text-blue-500 mb-2">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path d="M12 21c4.97 0 9-4.03 9-9 0-4.97-4.03-9-9-9S3 7.03 3 12c0 4.97 4.03 9 9 9Z" stroke="currentColor" strokeWidth="2"/><path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </span>
            <div className="text-2xl font-bold text-blue-700">${summary.earned}</div>
            <div className="text-blue-500 font-medium mt-1">Total Earned</div>
          </div>
        </section>
      )}

      {/* Action buttons */}
      <section className="max-w-5xl mx-auto px-6 py-8 flex flex-wrap gap-4 justify-center">
        <button
          onClick={() => navigate('/profile')}
          className="px-5 py-2 bg-white border border-emerald-200 text-emerald-700 font-semibold rounded-lg hover:bg-emerald-50 shadow-sm transition"
        >
          Edit Profile
        </button>

        {user.role === 'client' && (
          <>
            <button
              onClick={() => navigate('/invoices')}
              className="px-5 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 shadow-sm transition"
            >
              View Invoices
            </button>
            <button
              onClick={() => navigate('/payment')}
              className="px-5 py-2 bg-sky-500 text-white font-semibold rounded-lg hover:bg-sky-600 shadow-sm transition"
            >
              Payment History
            </button>
          </>
        )}

        {user.role === 'freelancer' && (
          <>
            <button
              onClick={() => navigate('/invoices')}
              className="px-5 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 shadow-sm transition"
            >
              Create Invoice
            </button>
            <button
              onClick={() => navigate('/payment')}
              className="px-5 py-2 bg-sky-500 text-white font-semibold rounded-lg hover:bg-sky-600 shadow-sm transition"
            >
              Payment History
            </button>
          </>
        )}
      </section>

      {/* Profile Summary */}
      <section className="max-w-5xl mx-auto px-6 pb-12">
        <div className="bg-white rounded-xl shadow p-8">
          <h3 className="text-xl font-semibold text-emerald-900 mb-6">Profile Summary</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-10 gap-y-4 text-emerald-800">
            <div>
              <dt className="font-semibold text-emerald-500">Name</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt className="font-semibold text-emerald-500">Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt className="font-semibold text-emerald-500">Role</dt>
              <dd className="capitalize">{user.role}</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-emerald-600 py-7 text-base">
        Need help?{' '}
        <a
          href="mailto:support@worktrust.com"
          className="text-emerald-700 underline font-semibold hover:text-emerald-900 transition"
        >
          Contact Support
        </a>
      </footer>
    </div>
  );
};

export default Dashboard;
