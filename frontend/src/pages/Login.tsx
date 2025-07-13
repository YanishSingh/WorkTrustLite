/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  mfaEnabled?: boolean;
}
interface LoginResponse {
  user: User;
  token: string;
}

const Login: React.FC = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [mfaRequired, setMfaRequired] = useState(false);
  const [otp, setOtp] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<LoginResponse>("/auth/login", form);
      if (res.data.user?.mfaEnabled) {
        setMfaRequired(true);
        await api.post("/auth/request-mfa", { email: form.email });
        toast.info("Multi-factor authentication required. Check your email for the OTP.");
      } else {
        login(res.data.user, res.data.token);
        toast.success("Login successful! Redirecting...");
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.msg || "Login failed. Please check your credentials.");
    }
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<LoginResponse>("/auth/verify-mfa", { email: form.email, otp });
      login(res.data.user, res.data.token);
      toast.success("MFA verified! Logged in.");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.msg || "OTP verification failed. Try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e6fcf2]">
      <div className="w-full max-w-md">
        <div className="rounded-2xl shadow-2xl p-10 border border-gray-100 bg-white/90">
          <div className="flex justify-center mb-4">
            <span className="inline-block bg-gradient-to-tr from-emerald-600 to-blue-400 rounded-full p-3 shadow-lg">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" className="text-white">
                <path d="M12 21c4.97 0 9-4.03 9-9 0-4.97-4.03-9-9-9S3 7.03 3 12c0 4.97 4.03 9 9 9Zm0-3v-2m0 0a3 3 0 0 1-2.99-3.15c.14-1.65 1.48-2.65 2.99-2.65s2.85 1 2.99 2.65A3 3 0 0 1 12 16Zm0 0V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </div>
          <h2 className="text-3xl font-extrabold text-center text-emerald-800 mb-2">Sign in</h2>
          <p className="text-center text-emerald-600 mb-6">Welcome to <span className="font-bold">WorkTrust Lite</span></p>

          {!mfaRequired ? (
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email */}
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className={`block w-full rounded-lg border border-gray-200 bg-white px-4 pt-6 pb-2 text-base focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition placeholder-transparent`}
                  autoComplete="email"
                  placeholder=" " // Empty placeholder, only label shows
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
              {/* Password */}
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  id="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  className={`block w-full rounded-lg border border-gray-200 bg-white px-4 pt-6 pb-2 text-base focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition placeholder-transparent`}
                  autoComplete="current-password"
                  placeholder=" "
                />
                <label
                  htmlFor="password"
                  className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                    form.password
                      ? "text-xs top-1.5 text-emerald-700"
                      : "top-6 text-base text-emerald-400"
                  }`}
                >
                  Password
                </label>
              </div>
              {/* Login Button */}
              <button
                className="w-full bg-emerald-600 text-white font-bold py-2 rounded-lg shadow-md transition hover:bg-emerald-700 hover:shadow-xl active:scale-98 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                type="submit"
              >
                Login
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyMfa} className="space-y-6">
              {/* OTP */}
              <div className="relative">
                <input
                  type="text"
                  name="otp"
                  id="otp"
                  required
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  className={`block w-full rounded-lg border border-gray-200 bg-white px-4 pt-6 pb-2 text-base focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition placeholder-transparent`}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder=" "
                />
                <label
                  htmlFor="otp"
                  className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                    otp
                      ? "text-xs top-1.5 text-emerald-700"
                      : "top-6 text-base text-emerald-400"
                  }`}
                >
                  Enter 6-digit OTP
                </label>
              </div>
              <button
                className="w-full bg-emerald-600 text-white font-bold py-2 rounded-lg shadow-md transition hover:bg-emerald-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-emerald-200"
                type="submit"
              >
                Verify MFA
              </button>
            </form>
          )}
          <p className="text-center text-emerald-700 mt-6">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              className="text-emerald-600 hover:underline font-semibold"
              onClick={() => navigate('/register')}
            >
              Register
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
