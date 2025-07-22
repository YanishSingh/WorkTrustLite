import React from 'react';
import { Link } from 'react-router-dom';
import BackToDashboardButton from '../components/BackToDashboardButton';

const PaymentResult: React.FC<{ status?: string }> = ({ status }) => {
  return (
    <div className="max-w-lg mx-auto mt-24">
      <div className="rounded-2xl shadow-2xl bg-white/90 border border-gray-100 px-8 py-12 text-center">
        <BackToDashboardButton />
        {status === 'success' && (
          <>
            <div className="flex justify-center mb-4">
              <span className="inline-block bg-gradient-to-tr from-emerald-600 to-blue-400 rounded-full p-4 shadow-lg">
                {/* Success icon */}
                <svg width="40" height="40" fill="none" viewBox="0 0 24 24" className="text-white">
                  <circle cx="12" cy="12" r="12" fill="#22c55e" opacity="0.18" />
                  <path d="M8.5 13.5l2 2 5-5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
            <h2 className="text-3xl font-extrabold text-emerald-800 mb-2">Payment Successful!</h2>
            <p className="text-emerald-700 mb-6">
              Thank you for your payment.<br />Your invoice has been marked as <span className="font-semibold">paid</span>.
            </p>
            <Link
              to="/invoices"
              className="inline-block bg-gradient-to-tr from-emerald-600 to-blue-400 text-white font-bold py-2 px-6 rounded-lg shadow transition hover:from-emerald-700 hover:to-blue-500"
            >
              Go to Invoice Dashboard
            </Link>
          </>
        )}
        {status === 'cancelled' && (
          <>
            <div className="flex justify-center mb-4">
              <span className="inline-block bg-gradient-to-tr from-red-500 to-yellow-400 rounded-full p-4 shadow-lg">
                {/* Cancelled icon */}
                <svg width="40" height="40" fill="none" viewBox="0 0 24 24" className="text-white">
                  <circle cx="12" cy="12" r="12" fill="#ef4444" opacity="0.18" />
                  <path d="M15 9l-6 6M9 9l6 6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
            <h2 className="text-3xl font-extrabold text-red-700 mb-2">Payment Cancelled</h2>
            <p className="text-red-600 mb-6">
              Your payment was <span className="font-semibold">not completed</span>.<br />
              You can try again from your invoice dashboard.
            </p>
            <Link
              to="/invoices"
              className="inline-block bg-gradient-to-tr from-emerald-600 to-blue-400 text-white font-bold py-2 px-6 rounded-lg shadow transition hover:from-emerald-700 hover:to-blue-500"
            >
              Back to Invoices
            </Link>
          </>
        )}
        {!status && (
          <>
            <h2 className="text-2xl font-bold text-emerald-700 mb-4">Payment Status</h2>
            <p>Return to your invoice dashboard to continue.</p>
            <Link
              to="/invoices"
              className="inline-block mt-6 bg-gradient-to-tr from-emerald-600 to-blue-400 text-white font-bold py-2 px-6 rounded-lg shadow transition hover:from-emerald-700 hover:to-blue-500"
            >
              Invoice Dashboard
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentResult; 