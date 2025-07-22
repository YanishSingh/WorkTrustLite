import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Invoice from './pages/Invoice';
import PaymentResult from './pages/PaymentResult';
import PaymentHistory from './pages/Payment';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext'; // <-- Add this
import { Toaster } from "sonner";

const App: React.FC = () => (
  <AuthProvider>
    <BrowserRouter>
      <Toaster richColors position="top-center" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute><Invoice /></ProtectedRoute>} />
        <Route path="/payment" element={<ProtectedRoute><PaymentHistory /></ProtectedRoute>} />
        <Route path="/payment-success" element={<PaymentResult status="success" />} />
        <Route path="/payment-cancelled" element={<PaymentResult status="cancelled" />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
