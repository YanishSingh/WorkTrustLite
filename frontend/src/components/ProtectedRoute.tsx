import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  if (!user || !token) return <Navigate to="/login" />;
  return <>{children}</>;
};

export default ProtectedRoute;
