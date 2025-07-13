import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Invoice from './pages/Invoice';
import Payment from './pages/Payment';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from "sonner";

const App: React.FC = () => (
  <BrowserRouter>
    {/* Toast notifications (modern, rich colors, always on top center) */}
    <Toaster richColors position="top-center" />
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/invoices" element={<ProtectedRoute><Invoice /></ProtectedRoute>} />
      <Route path="/payment-success" element={<Payment status="success" />} />
      <Route path="/payment-cancelled" element={<Payment status="cancelled" />} />
      <Route path="/change-password" element={<ChangePassword />} />
      
      <Route path="*" element={<Login />} />
    </Routes>
  </BrowserRouter>
);

export default App;
