import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/useAuth';
import BackToDashboardButton from '../components/BackToDashboardButton';

interface User {
  name: string;
  email: string;
}
interface Invoice {
  _id: string;
  amount: number;
  description: string;
  client: User;
  freelancer: User;
  paidAt?: string;
  dueDate?: string;
  status: string;
}

const PaymentHistory: React.FC = () => {
  const { user, token } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !user) return;
    const endpoint = user.role === 'freelancer' ? '/invoice/freelancer' : '/invoice/client';
    api.get<Invoice[]>(endpoint, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setInvoices(res.data.filter(inv => inv && inv.amount && inv.status === 'paid'));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token, user]);

  return (
    <div className="min-h-screen bg-gradient-to-tr from-emerald-50 via-emerald-100 to-white flex flex-col items-center py-10">
      <div className="w-full max-w-3xl bg-white/95 rounded-2xl shadow-2xl border border-gray-100 p-6 sm:p-10 flex flex-col gap-8">
        <BackToDashboardButton />
        <div>
          <h2 className="text-3xl font-extrabold text-center text-emerald-800 mb-1">Payment History</h2>
          <p className="text-center text-emerald-600 mb-6">
            {user?.role === 'freelancer'
              ? 'All your paid invoices are listed below.'
              : 'All invoices you have paid are listed below.'}
          </p>
        </div>
        <section className="flex flex-col gap-4">
          <div className="overflow-x-auto">
            <table className="w-full border-t rounded-lg overflow-hidden text-sm shadow-sm">
              <thead>
                <tr className="bg-emerald-50 text-emerald-900">
                  <th className="py-2 px-3 text-left">Amount</th>
                  <th className="py-2 px-3 text-left">Description</th>
                  <th className="py-2 px-3 text-left">Client</th>
                  <th className="py-2 px-3 text-left">Freelancer</th>
                  <th className="py-2 px-3 text-left">Due Date</th>
                  <th className="py-2 px-3 text-left">Paid At</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-emerald-300">
                      <span className="font-semibold">Loading...</span>
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-emerald-300">
                      <div className="flex flex-col items-center gap-2">
                        <svg width="48" height="48" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        <span className="font-semibold">No payments found.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv, idx) => (
                    <tr
                      key={inv._id}
                      className={`border-t text-center transition ${idx % 2 === 0 ? 'bg-white' : 'bg-emerald-50/40'} hover:bg-emerald-100/40`}
                    >
                      <td className="py-2 px-3 font-semibold text-emerald-700">${inv.amount}</td>
                      <td className="py-2 px-3">{inv.description}</td>
                      <td className="py-2 px-3">{inv.client?.name || '-'}</td>
                      <td className="py-2 px-3">{inv.freelancer?.name || '-'}</td>
                      <td className="py-2 px-3">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}</td>
                      <td className="py-2 px-3">{inv.paidAt ? new Date(inv.paidAt).toLocaleString() : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PaymentHistory;
