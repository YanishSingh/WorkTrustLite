import React from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navbar */}
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between py-4 px-6">
          <h1 className="text-2xl font-semibold text-gray-800">WorkTrust Lite</h1>
          <span className="text-gray-600">Hi, {user.name}</span>
        </div>
      </header>

      {/* Hero banner */}
      <section className="bg-white py-12">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-800">
            Welcome, {user.name}!
          </h2>
          <p className="text-gray-600 mt-1">Role: <em>{user.role}</em></p>
        </div>
      </section>

      {/* Action buttons */}
      <section className="max-w-5xl mx-auto px-6 py-8 flex flex-wrap gap-4 justify-center">
        <button
          onClick={() => navigate('/profile')}
          className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
        >
          Edit Profile
        </button>

        {user.role === 'client' && (
          <>
            <button
              onClick={() => navigate('/invoices')}
              className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
            >
              My Invoices & Payments
            </button>
            <button
              onClick={() => navigate('/invoices?create=1')}
              className="px-5 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition"
            >
              Create Invoice
            </button>
          </>
        )}

        {user.role === 'freelancer' && (
          <>
            <button
              onClick={() => navigate('/invoices')}
              className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              View Invoices
            </button>
            <button
              onClick={() => navigate('/invoices?history=1')}
              className="px-5 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition"
            >
              Payment History
            </button>
          </>
        )}
      </section>

      {/* Profile Summary */}
      <section className="max-w-5xl mx-auto px-6 pb-12">
        <div className="bg-white rounded-md shadow p-6">
          <h3 className="text-xl font-medium text-gray-800 mb-4">Profile Summary</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-4 text-gray-700">
            <div>
              <dt className="font-semibold">Name</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt className="font-semibold">Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt className="font-semibold">Role</dt>
              <dd>{user.role}</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-gray-500 py-6">
        Need help?
        {' '}
        <a href="mailto:support@worktrust.com" className="text-indigo-600 hover:underline">
          Contact Support
        </a>
      </footer>
    </div>
  );
};

export default Dashboard;
