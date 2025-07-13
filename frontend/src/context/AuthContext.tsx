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
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [passwordExpired, setPasswordExpired] = useState<boolean>(false);

  // Restore user/token/expiry on reload
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    const storedPasswordExpired = localStorage.getItem('passwordExpired');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
      setPasswordExpired(storedPasswordExpired === 'true');
    }
  }, []);

  // Save on login
  const login = (user: User, token: string, passwordExpiredFlag?: boolean) => {
    setUser(user);
    setToken(token);
    setPasswordExpired(!!passwordExpiredFlag);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    localStorage.setItem('passwordExpired', String(!!passwordExpiredFlag));
  };

  // Explicitly set password expired (useful for manual override, or after password change)
  const handleSetPasswordExpired = (expired: boolean) => {
    setPasswordExpired(expired);
    localStorage.setItem('passwordExpired', String(expired));
  };

  // Clear on logout
  const logout = () => {
    setUser(null);
    setToken(null);
    setPasswordExpired(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('passwordExpired');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      passwordExpired,
      setPasswordExpired: handleSetPasswordExpired,   // <-- Forward this for all children
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};
