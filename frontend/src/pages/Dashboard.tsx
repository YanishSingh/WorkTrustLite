import React from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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
              My Invoices & Payments
            </button>
            <button
              onClick={() => navigate('/invoices?create=1')}
              className="px-5 py-2 bg-amber-400 text-emerald-900 font-semibold rounded-lg hover:bg-amber-500 shadow-sm transition"
            >
              Create Invoice
            </button>
          </>
        )}

        {user.role === 'freelancer' && (
          <>
            <button
              onClick={() => navigate('/invoices')}
              className="px-5 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 shadow-sm transition"
            >
              View Invoices
            </button>
            <button
              onClick={() => navigate('/invoices?history=1')}
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
