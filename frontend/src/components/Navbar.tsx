import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-blue-700 text-white px-4 py-2 flex justify-between items-center">
      <Link to="/dashboard" className="font-bold text-lg tracking-wide">WorkTrust Lite</Link>
      <div className="space-x-3">
        {user && (
          <>
            <Link to="/dashboard" className="hover:underline">Dashboard</Link>
            <Link to="/profile" className="hover:underline">Profile</Link>
            <Link to="/invoices" className="hover:underline">Invoices</Link>
            <button onClick={logout} className="bg-white text-blue-700 px-2 py-1 rounded hover:bg-gray-200 ml-2">Logout</button>
          </>
        )}
        {!user && (
          <>
            <Link to="/login" className="hover:underline">Login</Link>
            <Link to="/register" className="hover:underline">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
