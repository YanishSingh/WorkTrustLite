/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import api from "../api/axios";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Register: React.FC = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "client" });
  const [confirm, setConfirm] = useState("");
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      await api.post("/auth/register", form);
      toast.success("Registration successful! Please login.");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err: any) {
      toast.error(err.response?.data?.msg || "Registration failed");
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
          <h2 className="text-3xl font-extrabold text-center text-emerald-800 mb-2">Register</h2>
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Name */}
            <div className="relative">
              <input
                type="text"
                name="name"
                id="name"
                required
                value={form.name}
                onChange={handleChange}
                className={`block w-full rounded-lg border border-gray-200 bg-white px-4 pt-6 pb-2 text-base focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition placeholder-transparent`}
                autoComplete="name"
                placeholder=" "
              />
              <label
                htmlFor="name"
                className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                  form.name
                    ? "text-xs top-1.5 text-emerald-700"
                    : "top-6 text-base text-emerald-400"
                }`}
              >
                Name
              </label>
            </div>
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
                placeholder=" "
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
            {/* Role */}
            <div className="relative">
              <select
                name="role"
                id="role"
                value={form.role}
                onChange={handleChange}
                className="block w-full rounded-lg border border-gray-200 bg-white px-4 pt-6 pb-2 text-base focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
                required
              >
                <option value="client">Client</option>
                <option value="freelancer">Freelancer</option>
              </select>
              <label
                htmlFor="role"
                className="absolute left-4 top-1.5 text-emerald-700 text-xs"
              >
                Role
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
                autoComplete="new-password"
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
              <PasswordStrengthMeter password={form.password} />
            </div>
            {/* Confirm Password */}
            <div className="relative">
              <input
                type="password"
                id="confirm"
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className={`block w-full rounded-lg border border-gray-200 bg-white px-4 pt-6 pb-2 text-base focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition placeholder-transparent`}
                autoComplete="new-password"
                placeholder=" "
              />
              <label
                htmlFor="confirm"
                className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                  confirm
                    ? "text-xs top-1.5 text-emerald-700"
                    : "top-6 text-base text-emerald-400"
                }`}
              >
                Confirm Password
              </label>
            </div>

            <button
              className="w-full bg-emerald-600 text-white font-bold py-2 rounded-lg shadow-md transition hover:bg-emerald-700 hover:shadow-xl active:scale-98 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              type="submit"
            >
              Register
            </button>
          </form>
          <p className="text-center text-emerald-700 mt-6">
            Already have an account?{" "}
            <button
              type="button"
              className="text-emerald-600 hover:underline font-semibold"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
