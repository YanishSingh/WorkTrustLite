/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  mfaEnabled?: boolean;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  passwordExpired: boolean;
  setPasswordExpired: (expired: boolean) => void;  // <-- Add this
  login: (user: User, token: string, passwordExpired?: boolean) => void;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [passwordExpired, setPasswordExpired] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // Restore user/token/expiry on reload
  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    const storedToken = sessionStorage.getItem('token');
    const storedPasswordExpired = sessionStorage.getItem('passwordExpired');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
      setPasswordExpired(storedPasswordExpired === 'true');
    }
    setLoading(false);
  }, []);

  // Save on login
  const login = (user: User, token: string, passwordExpiredFlag?: boolean) => {
    setUser(user);
    setToken(token);
    setPasswordExpired(!!passwordExpiredFlag);
    sessionStorage.setItem('user', JSON.stringify(user));
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('passwordExpired', String(!!passwordExpiredFlag));
  };

  // Explicitly set password expired (useful for manual override, or after password change)
  const handleSetPasswordExpired = (expired: boolean) => {
    setPasswordExpired(expired);
    sessionStorage.setItem('passwordExpired', String(expired));
  };

  // Clear on logout
  const logout = () => {
    setUser(null);
    setToken(null);
    setPasswordExpired(false);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('passwordExpired');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      passwordExpired,
      setPasswordExpired: handleSetPasswordExpired,   // <-- Forward this for all children
      login,
      logout,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
