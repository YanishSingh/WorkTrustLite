/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import api from "../api/axios";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

const ChangePassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // If redirected after login expiry, we might get email from location.state
  const emailFromState = (location.state as any)?.email || "";

  // If not coming from login expiry, block access for security
  useEffect(() => {
    if (!emailFromState) {
      toast.info("Please login to change your password.");
      navigate("/login", { replace: true });
    }
    // eslint-disable-next-line
  }, []);

  const [form, setForm] = useState({
    email: emailFromState,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (form.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    // Password policy (front-end only, backend is source of truth!)
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;
    if (!pattern.test(form.newPassword)) {
      toast.error(
        "Password must have uppercase, lowercase, number, and symbol"
      );
      return;
    }
    setLoading(true);
    try {
      // If emailFromState exists, this is an expired password flow → use public endpoint!
      if (emailFromState) {
        await api.put("/user/reset-password-expired", {
          email: form.email,
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        });
      } else {
        // Fallback: logged-in change (should not reach here if password expired)
        await api.put("/user/me", {
          email: form.email,
          currentPassword: form.currentPassword,
          password: form.newPassword,
        });
      }
      // Clear auth info in localStorage to force re-login
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      toast.success("Password updated! Please log in with your new password.");
      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err: any) {
      toast.error(
        err.response?.data?.msg ||
        err.response?.data?.error ||
        "Failed to update password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e6fcf2]">
      <div className="w-full max-w-md">
        <div className="rounded-2xl shadow-2xl p-10 border border-gray-100 bg-white/90">
          <div className="flex justify-center mb-4">
            <span className="inline-block bg-gradient-to-tr from-emerald-600 to-blue-400 rounded-full p-3 shadow-lg">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" className="text-white" aria-hidden="true">
                <path d="M12 21c4.97 0 9-4.03 9-9 0-4.97-4.03-9-9-9S3 7.03 3 12c0 4.97 4.03 9 9 9Zm0-3v-2m0 0a3 3 0 0 1-2.99-3.15c.14-1.65 1.48-2.65 2.99-2.65s2.85 1 2.99 2.65A3 3 0 0 1 12 16Zm0 0V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-center text-emerald-800 mb-2">
            Change Password
          </h2>
          <p className="text-center text-emerald-600 mb-6">
            Secure your <span className="font-bold">WorkTrust Lite</span> account
          </p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <input
                type="email"
                name="email"
                id="email"
                required
                value={form.email}
                onChange={handleChange}
                className="block w-full rounded-lg border border-gray-200 bg-white px-4 pt-6 pb-2 text-base focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition placeholder-transparent"
                autoComplete="email"
                placeholder=" "
                disabled
              />
              <label
                htmlFor="email"
                className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                  form.email
                    ? "text-xs top-1.5 text-emerald-700"
                    : "top-6 text-base text-emerald-400"
                }`}
              >
                Email
              </label>
            </div>
            {/* Current Password */}
            <div className="relative">
              <input
                type="password"
                name="currentPassword"
                id="currentPassword"
                required
                value={form.currentPassword}
                onChange={handleChange}
                className="block w-full rounded-lg border border-gray-200 bg-white px-4 pt-6 pb-2 text-base focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition placeholder-transparent"
                autoComplete="current-password"
                placeholder=" "
                disabled={loading}
              />
              <label
                htmlFor="currentPassword"
                className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                  form.currentPassword
                    ? "text-xs top-1.5 text-emerald-700"
                    : "top-6 text-base text-emerald-400"
                }`}
              >
                Current Password
              </label>
            </div>
            {/* New Password */}
            <div className="relative">
              <input
                type="password"
                name="newPassword"
                id="newPassword"
                required
                value={form.newPassword}
                onChange={handleChange}
                className="block w-full rounded-lg border border-gray-200 bg-white px-4 pt-6 pb-2 text-base focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition placeholder-transparent"
                autoComplete="new-password"
                placeholder=" "
                disabled={loading}
              />
              <label
                htmlFor="newPassword"
                className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                  form.newPassword
                    ? "text-xs top-1.5 text-emerald-700"
                    : "top-6 text-base text-emerald-400"
                }`}
              >
                New Password
              </label>
              <PasswordStrengthMeter password={form.newPassword} />
            </div>
            {/* Confirm Password */}
            <div className="relative">
              <input
                type="password"
                name="confirmPassword"
                id="confirmPassword"
                required
                value={form.confirmPassword}
                onChange={handleChange}
                className="block w-full rounded-lg border border-gray-200 bg-white px-4 pt-6 pb-2 text-base focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition placeholder-transparent"
                autoComplete="new-password"
                placeholder=" "
                disabled={loading}
              />
              <label
                htmlFor="confirmPassword"
                className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                  form.confirmPassword
                    ? "text-xs top-1.5 text-emerald-700"
                    : "top-6 text-base text-emerald-400"
                }`}
              >
                Confirm New Password
              </label>
            </div>
            <button
              className="w-full bg-emerald-600 text-white font-bold py-2 rounded-lg shadow-md transition hover:bg-emerald-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-200"
              type="submit"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
          <p className="text-center text-emerald-700 mt-6">
            Back to{" "}
            <button
              type="button"
              className="text-emerald-600 hover:underline font-semibold"
              onClick={() => navigate("/login")}
              disabled={loading}
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
