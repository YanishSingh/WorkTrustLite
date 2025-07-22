import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, passwordExpired, loading } = useAuth();
  const location = useLocation();

  // Wait for auth context to finish loading
  if (loading) return null;

  // If not authenticated, redirect to login
  if (!user || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If password expired, redirect to change password
  // (Allow access to /change-password even if passwordExpired)
  if (
    passwordExpired &&
    location.pathname !== '/change-password'
  ) {
    return <Navigate to="/change-password" replace />;
  }

  // Otherwise, render the protected page
  return <>{children}</>;
};

export default ProtectedRoute;
