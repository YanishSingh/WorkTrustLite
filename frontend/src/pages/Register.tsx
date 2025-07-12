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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-600 to-purple-400">
      <div className="relative z-10 w-full max-w-md">
        <div className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-2xl p-10 border border-white/40">
          <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-2">Register</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                className="peer w-full border rounded-xl px-4 pt-6 pb-2 bg-transparent text-base placeholder-transparent focus:outline-none focus:border-blue-500"
                placeholder="Name"
                autoComplete="name"
              />
              <label className="absolute left-4 top-2 text-gray-500 text-base transition-all duration-200
                peer-placeholder-shown:top-5 peer-placeholder-shown:text-base
                peer-placeholder-shown:text-gray-400
                peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-600"
              >Name</label>
            </div>
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
              <label className="absolute left-4 top-2 text-gray-500 text-base transition-all duration-200
                peer-placeholder-shown:top-5 peer-placeholder-shown:text-base
                peer-placeholder-shown:text-gray-400
                peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-600"
              >Email</label>
            </div>
            <div className="relative">
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="peer w-full border rounded-xl px-4 pt-6 pb-2 bg-transparent text-base focus:outline-none focus:border-blue-500"
                required
              >
                <option value="client">Client</option>
                <option value="freelancer">Freelancer</option>
              </select>
              <label className="absolute left-4 top-2 text-gray-500 text-base transition-all duration-200
                peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-600"
              >Role</label>
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
                autoComplete="new-password"
              />
              <label className="absolute left-4 top-2 text-gray-500 text-base transition-all duration-200
                peer-placeholder-shown:top-5 peer-placeholder-shown:text-base
                peer-placeholder-shown:text-gray-400
                peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-600"
              >Password</label>
              <PasswordStrengthMeter password={form.password} />
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="peer w-full border rounded-xl px-4 pt-6 pb-2 bg-transparent text-base placeholder-transparent focus:outline-none focus:border-blue-500"
                placeholder="Confirm Password"
                autoComplete="new-password"
              />
              <label className="absolute left-4 top-2 text-gray-500 text-base transition-all duration-200
                peer-placeholder-shown:top-5 peer-placeholder-shown:text-base
                peer-placeholder-shown:text-gray-400
                peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-600"
              >Confirm Password</label>
            </div>
            <button
              className="w-full bg-gradient-to-r from-blue-600 to-purple-500 text-white font-bold py-2 rounded-xl shadow-lg transition hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
              type="submit"
            >
              Register
            </button>
            <div className="flex items-center my-2">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="mx-2 text-gray-400 text-sm">or</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full bg-white text-blue-600 font-semibold py-2 rounded-xl shadow border border-blue-500 transition hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              Back to Login
            </button>
          </form>
          <p className="text-center text-gray-500 mt-6">
            Already have an account?{" "}
            <button
              type="button"
              className="text-blue-700 hover:underline font-semibold"
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
