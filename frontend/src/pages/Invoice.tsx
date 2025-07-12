/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/useAuth';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_REPLACE_WITH_YOUR_PUBLISHABLE_KEY');

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
  const [form, setForm] = useState({ freelancerId: '', amount: '', description: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  // Fetch invoices
  useEffect(() => {
    api.get<Invoice[]>('/invoice', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setInvoices(res.data))
      .catch(() => setError('Failed to load invoices'));
  }, [token]);

  // Create invoice
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<InvoiceResponse>('/payment/invoice', {
        freelancerId: form.freelancerId,
        amount: Number(form.amount),
        description: form.description
      }, { headers: { Authorization: `Bearer ${token}` } });

      setMsg('Invoice created. Proceeding to payment...');
      const stripe = await stripePromise;
      await stripe?.redirectToCheckout({ sessionId: res.data.sessionId });
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Invoice creation/payment failed');
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Invoices</h2>
      {user?.role === 'client' && (
        <form onSubmit={handleCreate} className="space-y-3 mb-6">
          <input className="input" type="text" name="freelancerId" placeholder="Freelancer User ID" value={form.freelancerId} onChange={e => setForm({ ...form, freelancerId: e.target.value })} required />
          <input className="input" type="number" name="amount" placeholder="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required min={1} />
          <input className="input" type="text" name="description" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <button className="bg-blue-700 text-white py-1 px-4 rounded" type="submit">Create & Pay</button>
          {msg && <div className="text-green-600 mt-1">{msg}</div>}
          {error && <div className="text-red-500 mt-1">{error}</div>}
        </form>
      )}
      <table className="w-full mt-3">
        <thead>
          <tr>
            <th>Amount</th>
            <th>Description</th>
            <th>Status</th>
            <th>Freelancer</th>
            <th>Paid At</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map(inv => (
            <tr key={inv._id} className="border-t text-center">
              <td>${inv.amount}</td>
              <td>{inv.description}</td>
              <td className={inv.status === 'paid' ? 'text-green-600' : 'text-yellow-500'}>{inv.status}</td>
              <td>{inv.freelancer?.name}</td>
              <td>{inv.paidAt ? new Date(inv.paidAt).toLocaleString() : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvoicePage;
