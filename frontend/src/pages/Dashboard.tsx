import React from 'react';
import { useAuth } from '../context/useAuth';
const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Welcome, {user?.name}!</h2>
      <p><b>Email:</b> {user?.email}</p>
      <p><b>Role:</b> {user?.role}</p>
      <div className="mt-6">
        <a href="/profile" className="text-blue-700 underline">Edit Profile</a> |{' '}
        <a href="/invoices" className="text-blue-700 underline">View Invoices</a>
      </div>
    </div>
  );
};

export default Dashboard;
