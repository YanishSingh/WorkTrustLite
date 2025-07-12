/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner"; // Import sonner toast

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-600 to-purple-400 relative">
      <div className="relative z-10 w-full max-w-md">
        <div className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-2xl p-10 border border-white/40">
          <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-2">Sign in</h2>
          <p className="text-center text-gray-500 mb-6">Welcome to WorkTrust Lite</p>
          {!mfaRequired ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="peer w-full border rounded-xl px-4 pt-6 pb-2 bg-transparent text-base placeholder-transparent focus:outline-none focus:border-blue-500"
                  placeholder="Email"
                  autoComplete="email"
                />
                <label
                  className="absolute left-4 top-2 text-gray-500 text-base transition-all duration-200
                  peer-placeholder-shown:top-5 peer-placeholder-shown:text-base
                  peer-placeholder-shown:text-gray-400
                  peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-600"
                >
                  Email
                </label>
              </div>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  className="peer w-full border rounded-xl px-4 pt-6 pb-2 bg-transparent text-base placeholder-transparent focus:outline-none focus:border-blue-500"
                  placeholder="Password"
                  autoComplete="current-password"
                />
                <label
                  className="absolute left-4 top-2 text-gray-500 text-base transition-all duration-200
                  peer-placeholder-shown:top-5 peer-placeholder-shown:text-base
                  peer-placeholder-shown:text-gray-400
                  peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-600"
                >
                  Password
                </label>
              </div>
              <button
                className="w-full bg-gradient-to-r from-blue-600 to-purple-500 text-white font-bold py-2 rounded-xl shadow-lg transition hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                type="submit"
              >
                Login
              </button>
              <div className="flex items-center my-2">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="mx-2 text-gray-400 text-sm">or</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="w-full bg-white text-blue-600 font-semibold py-2 rounded-xl shadow border border-blue-500 transition hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                Register
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyMfa} className="space-y-6">
              <div className="relative">
                <input
                  type="text"
                  name="otp"
                  placeholder=" "
                  required
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  className="peer w-full border rounded-xl px-4 pt-6 pb-2 bg-transparent text-base placeholder-transparent focus:outline-none focus:border-green-500"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  maxLength={6}
                />
                <label
                  className="absolute left-4 top-2 text-gray-500 text-base transition-all duration-200
                  peer-placeholder-shown:top-5 peer-placeholder-shown:text-base
                  peer-placeholder-shown:text-gray-400
                  peer-focus:top-2 peer-focus:text-sm peer-focus:text-green-600"
                >
                  Enter 6-digit OTP
                </label>
              </div>
              <button
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold py-2 rounded-xl shadow-lg transition hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-300"
                type="submit"
              >
                Verify MFA
              </button>
              <div className="flex items-center my-2">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="mx-2 text-gray-400 text-sm">or</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="w-full bg-white text-blue-600 font-semibold py-2 rounded-xl shadow border border-blue-500 transition hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                Register
              </button>
            </form>
          )}
          <p className="text-center text-gray-500 mt-6">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              className="text-blue-700 hover:underline font-semibold"
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
