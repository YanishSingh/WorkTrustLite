/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/useAuth';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'sonner';

const stripePromise = loadStripe('pk_test_51Rjk4X2edpmFd8KyKBdMWoeOkFG3XmVVlt0OWTIVdwtNFuVJH1rNgbXNxH4QdIFI2Hxd7bTg2enOLqq89yDVAbis00irPcmbe1'); // Replace with real key

interface Freelancer {
  _id: string;
  name: string;
  email: string;
}
interface Invoice {
  _id: string;
  amount: number;
  description: string;
  status: string;
  client: { name: string; email: string };
  freelancer: { name: string; email: string };
  paidAt?: string;
}
interface InvoiceResponse {
  sessionId: string;
  invoiceId: string;
}

const InvoicePage: React.FC = () => {
  const { user, token } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [form, setForm] = useState({ freelancerId: '', amount: '', description: '' });
  const [loading, setLoading] = useState(false);

  // Fetch freelancers for dropdown
  useEffect(() => {
    if (!token) return;
    api.get<Freelancer[]>('/user/freelancers', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setFreelancers(res.data))
      .catch(() => toast.error('Could not load freelancer list.'));
  }, [token]);

  // Fetch invoices
  useEffect(() => {
    if (!token) return;
    api.get<Invoice[]>('/invoice', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setInvoices(res.data))
      .catch(() => toast.error('Failed to load invoices.'));
  }, [token]);

  // Create invoice and pay
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.freelancerId || !form.amount || Number(form.amount) < 1) {
      toast.error('Please select a freelancer and enter a valid amount.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<InvoiceResponse>('/payment/invoice', {
        freelancerId: form.freelancerId,
        amount: Number(form.amount),
        description: form.description,
      }, { headers: { Authorization: `Bearer ${token}` } });

      toast.success('Invoice created. Redirecting to payment...');
      const stripe = await stripePromise;
      await stripe?.redirectToCheckout({ sessionId: res.data.sessionId });
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Invoice creation/payment failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-8 bg-white/90 rounded-2xl shadow-2xl border border-gray-100">
      <h2 className="text-3xl font-extrabold text-center text-emerald-800 mb-2">Invoices</h2>
      <p className="text-center text-emerald-600 mb-6">
        Manage and pay your <span className="font-bold">WorkTrust Lite</span> invoices
      </p>

      {user?.role === 'client' && (
        <form onSubmit={handleCreate} className="space-y-3 mb-10">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Freelancer dropdown */}
            <select
              className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition text-emerald-800"
              name="freelancerId"
              value={form.freelancerId}
              onChange={e => setForm({ ...form, freelancerId: e.target.value })}
              required
              disabled={loading}
            >
              <option value="">Select Freelancer</option>
              {freelancers.map(f => (
                <option key={f._id} value={f._id}>
                  {f.name} ({f.email})
                </option>
              ))}
            </select>
            <input
              className="w-32 rounded-lg border border-gray-200 bg-white px-4 py-2 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition placeholder:text-emerald-400"
              type="number"
              name="amount"
              placeholder="Amount"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              min={1}
              step={1}
              required
              disabled={loading}
            />
            <input
              className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition placeholder:text-emerald-400"
              type="text"
              name="description"
              placeholder="Description"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              disabled={loading}
            />
            <button
              className="bg-gradient-to-tr from-emerald-600 to-blue-400 text-white font-bold px-6 py-2 rounded-lg shadow transition hover:from-emerald-700 hover:to-blue-500"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Create & Pay'}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-t mt-6 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-emerald-50 text-emerald-900">
              <th className="py-2 px-3 text-left">Amount</th>
              <th className="py-2 px-3 text-left">Description</th>
              <th className="py-2 px-3 text-left">Status</th>
              <th className="py-2 px-3 text-left">Freelancer</th>
              <th className="py-2 px-3 text-left">Paid At</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-emerald-400">
                  No invoices found.
                </td>
              </tr>
            ) : (
              invoices.map(inv => (
                <tr key={inv._id} className="border-t text-center hover:bg-emerald-50 transition">
                  <td className="py-2 px-3 font-semibold text-emerald-700">${inv.amount}</td>
                  <td className="py-2 px-3">{inv.description}</td>
                  <td className={`py-2 px-3 font-semibold ${inv.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                  </td>
                  <td className="py-2 px-3">{inv.freelancer?.name || '-'}</td>
                  <td className="py-2 px-3">{inv.paidAt ? new Date(inv.paidAt).toLocaleString() : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoicePage;
