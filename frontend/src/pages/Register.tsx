import React, { useState } from "react";
import api from "../api/axios";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { 
  PASSWORD_CONFIG, 
  USER_ROLES, 
  API_ENDPOINTS, 
  VALIDATION_MESSAGES, 
  UI_CONFIG 
} from "../utils/constants";

interface FormData {
  name: string;
  email: string;
  password: string;
  role: string;
}

interface TouchedFields {
  password: boolean;
  confirm: boolean;
}

const Register: React.FC = () => {
  const [form, setForm] = useState<FormData>({ 
    name: "", 
    email: "", 
    password: "", 
    role: USER_ROLES.CLIENT 
  });
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState<TouchedFields>({ password: false, confirm: false });
  const [showPwdWarning, setShowPwdWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Validation functions
  const isPasswordValid = 
    form.password.length >= PASSWORD_CONFIG.MIN_LENGTH &&
    form.password.length <= PASSWORD_CONFIG.MAX_LENGTH &&
    PASSWORD_CONFIG.PATTERN.test(form.password);
  
  const doPasswordsMatch = form.password === confirm && confirm.length > 0;
  
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  
  const isFormValid = 
    form.name.trim().length > 0 && 
    isEmailValid && 
    isPasswordValid && 
    doPasswordsMatch;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, password: e.target.value }));
    if (!showPwdWarning) setShowPwdWarning(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) return;
    
    // Final validation
    if (!isFormValid) {
      if (!isPasswordValid) {
        toast.error(VALIDATION_MESSAGES.PASSWORD_TOO_WEAK);
        return;
      }
      if (!doPasswordsMatch) {
        toast.error(VALIDATION_MESSAGES.PASSWORDS_NO_MATCH);
        return;
      }
      if (!isEmailValid) {
        toast.error(VALIDATION_MESSAGES.INVALID_EMAIL);
        return;
      }
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare clean form data
      const registrationData = {
        ...form,
        name: form.name.trim(),
        email: form.email.toLowerCase().trim()
      };
      
      await api.post(API_ENDPOINTS.AUTH.REGISTER, registrationData);
      toast.success(VALIDATION_MESSAGES.REGISTRATION_SUCCESS);
      
      setTimeout(() => navigate("/login"), UI_CONFIG.REDIRECT_DELAY);
      
    } catch (error: unknown) {
      const err = error as { response?: { data?: { msg?: string } } };
      toast.error(err.response?.data?.msg || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
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
                <option value={USER_ROLES.CLIENT}>Client</option>
                <option value={USER_ROLES.FREELANCER}>Freelancer</option>
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
                onChange={handlePasswordChange}
                onBlur={() => { setTouched(prev => ({ ...prev, password: true })); setShowPwdWarning(true); }}
                className={`block w-full rounded-lg border border-gray-200 bg-white px-4 pt-6 pb-2 text-base focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition placeholder-transparent ${showPwdWarning && !isPasswordValid && form.password ? "border-red-400" : ""}`}
                autoComplete="new-password"
                placeholder=" "
                minLength={PASSWORD_CONFIG.MIN_LENGTH}
                maxLength={PASSWORD_CONFIG.MAX_LENGTH}
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
              <ul className="text-xs mt-2 text-emerald-600 space-y-1">
                <li className={`flex items-center gap-1 transition-all duration-200 ${form.password.length >= PASSWORD_CONFIG.MIN_LENGTH ? "text-green-600 animate-pulse" : "text-emerald-600"}`}>
                  {form.password.length >= PASSWORD_CONFIG.MIN_LENGTH ? 
                    <FaCheckCircle className="inline text-green-500" /> : 
                    <FaTimesCircle className="inline text-red-400" />
                  }• At least {PASSWORD_CONFIG.MIN_LENGTH} characters
                </li>
                <li className={`flex items-center gap-1 transition-all duration-200 ${(form.password.length <= PASSWORD_CONFIG.MAX_LENGTH && form.password.length > 0) ? "text-green-600 animate-pulse" : "text-emerald-600"}`}>
                  {(form.password.length <= PASSWORD_CONFIG.MAX_LENGTH && form.password.length > 0) ? 
                    <FaCheckCircle className="inline text-green-500" /> : 
                    <FaTimesCircle className="inline text-red-400" />
                  }• No more than {PASSWORD_CONFIG.MAX_LENGTH} characters
                </li>
                <li className={`flex items-center gap-1 transition-all duration-200 ${PASSWORD_CONFIG.PATTERN.test(form.password) ? "text-green-600 animate-pulse" : "text-emerald-600"}`}>
                  {PASSWORD_CONFIG.PATTERN.test(form.password) ? 
                    <FaCheckCircle className="inline text-green-500" /> : 
                    <FaTimesCircle className="inline text-red-400" />
                  }• Uppercase, lowercase, number, symbol
                </li>
              </ul>
              {showPwdWarning && form.password && !isPasswordValid && (
                <div className="text-xs text-red-500 mt-2 animate-shake">Password does not meet all requirements.</div>
              )}
              <div className="text-xs text-emerald-400 mt-1">Password reuse is prevented and expiry is enforced for your security.</div>
            </div>
            {/* Confirm Password */}
            <div className="relative">
              <input
                type="password"
                id="confirm"
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onBlur={() => setTouched(prev => ({ ...prev, confirm: true }))}
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
              {touched.confirm && !doPasswordsMatch && (
                <div className="text-xs text-red-500 mt-1">{VALIDATION_MESSAGES.PASSWORDS_NO_MATCH}</div>
              )}
            </div>

            <button
              className={`w-full font-bold py-2 rounded-lg shadow-md transition focus:outline-none focus:ring-2 focus:ring-emerald-200 ${
                isFormValid && !isSubmitting
                  ? 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-xl active:scale-98 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              type="submit"
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? 'Creating Account...' : 'Register'}
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
