/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/useAuth';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';
import BackToDashboardButton from '../components/BackToDashboardButton';

const stripePromise = loadStripe('pk_test_51Rjk4X2edpmFd8KyKBdMWoeOkFG3XmVVlt0OWTIVdwtNFuVJH1rNgbXNxH4QdIFI2Hxd7bTg2enOLqq89yDVAbis00irPcmbe1'); // Replace with real key

interface User {
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
  dueDate?: string;
  paidAt?: string;
}

const statusBadge = (status: string) => {
  if (status === 'paid') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-semibold">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Paid
      </span>
    );
  }
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-xs font-semibold">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M8 12h4l2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs font-semibold">
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const InvoicePage: React.FC = () => {
  const { user, token } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [form, setForm] = useState({ clientId: '', amount: '', description: '', dueDate: '' });
  const [loading, setLoading] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  // Fetch clients for dropdown (for freelancers)
  useEffect(() => {
    if (!token || user?.role !== 'freelancer') return;
    api.get('/user/clients', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        // Safely handle unknown type for res.data
        let clientsData = res.data;
        if (
          clientsData &&
          typeof clientsData === 'object' &&
          clientsData !== null &&
          Object.prototype.hasOwnProperty.call(clientsData, 'clients')
        ) {
          // @ts-ignore: Index signature
          clientsData = clientsData.clients;
        }
        setClients(Array.isArray(clientsData) ? (clientsData as User[]) : []);
      })
      .catch((err) => {
        console.error('Failed to load clients:', err);
        setClients([]); // Ensure clients is always an array
        toast.error('Could not load client list.');
      });
  }, [token, user?.role]);

  // Polling for real-time invoice updates
  useEffect(() => {
    if (!token || !user) return;
    const endpoint = user.role === 'freelancer' ? '/invoice/freelancer' : '/invoice/client';
    let isMounted = true;
    const fetchInvoices = () => {
      api.get<Invoice[]>(endpoint, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => { if (isMounted) setInvoices(res.data); })
        .catch(() => { if (isMounted) toast.error('Failed to load invoices.'); });
    };
    fetchInvoices();
    const interval = setInterval(fetchInvoices, 10000); // 10 seconds
    return () => { isMounted = false; clearInterval(interval); };
  }, [token, user]);

  // Create invoice (freelancer only)
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId || !form.amount || Number(form.amount) < 1) {
      toast.error('Please select a client and enter a valid amount.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/invoice', {
        clientId: form.clientId,
        amount: Number(form.amount),
        description: form.description,
        dueDate: form.dueDate || undefined,
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Invoice created!');
      setForm({ clientId: '', amount: '', description: '', dueDate: '' });
      // Refresh invoices
      const res = await api.get<Invoice[]>('/invoice/freelancer', { headers: { Authorization: `Bearer ${token}` } });
      setInvoices(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Invoice creation failed.');
    } finally {
      setLoading(false);
    }
  };

  // Pay invoice (client only)
  const handlePay = async (invoiceId: string) => {
    setPayingId(invoiceId);
    try {
      const res = await api.post<{ sessionId: string }>(`/payment/invoice/${invoiceId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      const stripe = await stripePromise;
      await stripe?.redirectToCheckout({ sessionId: res.data.sessionId });
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Payment initiation failed.');
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-emerald-50 via-emerald-100 to-white flex flex-col items-center py-10">
      <div className="w-full max-w-3xl bg-white/95 rounded-2xl shadow-2xl border border-gray-100 p-6 sm:p-10 flex flex-col gap-8">
        <BackToDashboardButton />
        <div>
          <h2 className="text-3xl font-extrabold text-center text-emerald-800 mb-1">Invoices</h2>
          <p className="text-center text-emerald-600 mb-6">
            {user?.role === 'freelancer'
              ? 'Create and manage invoices for your clients.'
              : 'View and pay invoices sent to you by freelancers.'}
          </p>
        </div>

        {/* Create Invoice Section */}
        {user?.role === 'freelancer' && (
          <section className="bg-emerald-50/60 p-5 rounded-xl border border-emerald-100 shadow-sm">
            <h3 className="text-lg font-bold text-emerald-700 mb-3">Create New Invoice</h3>
            <form
              onSubmit={handleCreate}
              className="flex flex-col gap-3 items-stretch w-full sm:flex-row sm:flex-wrap"
              style={{ maxWidth: '100%' }}
            >
              <div className="flex-1 flex flex-col min-w-[180px] w-full max-w-full">
                <label htmlFor="clientId" className="text-xs font-semibold text-emerald-600 mb-1">Client</label>
                <select
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition text-emerald-800 w-full"
                  name="clientId"
                  id="clientId"
                  value={form.clientId}
                  onChange={e => setForm({ ...form, clientId: e.target.value })}
                  required
                  disabled={loading}
                >
                  <option value="">Select Client</option>
                  {Array.isArray(clients) && clients.map(c => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-32 flex flex-col min-w-[120px] max-w-full">
                <label htmlFor="amount" className="text-xs font-semibold text-emerald-600 mb-1">Amount</label>
                <input
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition placeholder:text-emerald-400 w-full"
                  type="number"
                  name="amount"
                  id="amount"
                  placeholder="Amount"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  min={1}
                  step={1}
                  required
                  disabled={loading}
                />
              </div>
              <div className="flex-1 flex flex-col min-w-[180px] w-full max-w-full">
                <label htmlFor="description" className="text-xs font-semibold text-emerald-600 mb-1">Description</label>
                <input
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition placeholder:text-emerald-400 w-full"
                  type="text"
                  name="description"
                  id="description"
                  placeholder="Description"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  disabled={loading}
                />
              </div>
              <div className="w-40 flex flex-col min-w-[140px] max-w-full">
                <label htmlFor="dueDate" className="text-xs font-semibold text-emerald-600 mb-1">Due Date</label>
                <input
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition placeholder:text-emerald-400 w-full"
                  type="date"
                  name="dueDate"
                  id="dueDate"
                  placeholder="Due Date"
                  value={form.dueDate}
                  onChange={e => setForm({ ...form, dueDate: e.target.value })}
                  disabled={loading}
                />
              </div>
              <button
                className="bg-gradient-to-tr from-emerald-600 to-blue-400 text-white font-bold px-6 py-2 rounded-lg shadow transition hover:from-emerald-700 hover:to-blue-500 w-full sm:w-auto mt-2 sm:mt-6"
                type="submit"
                disabled={loading}
                style={{ maxWidth: '180px' }}
              >
                {loading ? 'Processing...' : 'Create Invoice'}
              </button>
            </form>
          </section>
        )}

        {/* Invoices Table Section */}
        <section className="flex flex-col gap-4">
          <h3 className="text-lg font-bold text-emerald-700 mb-2">Your Invoices</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-t rounded-lg overflow-hidden text-sm shadow-sm">
              <thead>
                <tr className="bg-emerald-50 text-emerald-900">
                  <th className="py-2 px-3 text-left">Amount</th>
                  <th className="py-2 px-3 text-left">Description</th>
                  <th className="py-2 px-3 text-left">Status</th>
                  <th className="py-2 px-3 text-left">Client</th>
                  <th className="py-2 px-3 text-left">Freelancer</th>
                  <th className="py-2 px-3 text-left">Due Date</th>
                  <th className="py-2 px-3 text-left">Paid At</th>
                  {user?.role === 'client' && <th className="py-2 px-3 text-left">Action</th>}
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={user?.role === 'client' ? 8 : 7} className="text-center py-12 text-emerald-300">
                      <div className="flex flex-col items-center gap-2">
                        <svg width="48" height="48" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                        <span className="font-semibold">No invoices found. {user?.role === 'freelancer' && 'Create your first invoice above!'}</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv, idx) => (
                    <tr
                      key={inv._id}
                      className={`border-t text-center transition ${idx % 2 === 0 ? 'bg-white' : 'bg-emerald-50/40'} ${inv.status === 'pending' ? 'hover:bg-yellow-100/60' : 'hover:bg-emerald-100/40'}`}
                    >
                      <td className="py-2 px-3 font-semibold text-emerald-700">${inv.amount}</td>
                      <td className="py-2 px-3">{inv.description}</td>
                      <td className="py-2 px-3">{statusBadge(inv.status)}</td>
                      <td className="py-2 px-3">{inv.client?.name || '-'}</td>
                      <td className="py-2 px-3">{inv.freelancer?.name || '-'}</td>
                      <td className="py-2 px-3">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}</td>
                      <td className="py-2 px-3">{inv.paidAt ? new Date(inv.paidAt).toLocaleString() : '-'}</td>
                      {user?.role === 'client' && (
                        <td className="py-2 px-3">
                          {inv.status === 'pending' ? (
                            <button
                              className="bg-gradient-to-tr from-emerald-500 to-blue-400 text-white font-bold px-4 py-1 rounded shadow hover:from-emerald-600 hover:to-blue-500 disabled:opacity-60"
                              onClick={() => handlePay(inv._id)}
                              disabled={payingId === inv._id}
                              title="Pay this invoice with Stripe"
                            >
                              {payingId === inv._id ? 'Redirecting...' : 'Pay'}
                            </button>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      )}
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

export default InvoicePage;
