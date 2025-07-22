import React from "react";
import { useNavigate } from "react-router-dom";

const BackToDashboardButton: React.FC = () => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/dashboard")}
      className="mb-6 bg-gradient-to-tr from-emerald-600 to-blue-400 text-white font-bold py-2 px-5 rounded-lg shadow hover:from-emerald-700 hover:to-blue-500 transition flex items-center gap-2"
      type="button"
    >
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      Back to Dashboard
    </button>
  );
};

export default BackToDashboardButton; 