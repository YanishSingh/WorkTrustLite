/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/useAuth';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { toast } from 'sonner';

interface ProfileResponse {
  name: string;
  email: string;
  bio: string;
  avatar: string;
}

const Profile: React.FC = () => {
  const { user, token, login } = useAuth();
  const [profile, setProfile] = useState<ProfileResponse>({ name: '', email: '', bio: '', avatar: '' });
  const [editing, setEditing] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [pwd, setPwd] = useState({ currentPassword: '', password: '', confirm: '' });

  // Load profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get<ProfileResponse>('/user/me', { headers: { Authorization: `Bearer ${token}` } });
        setProfile(res.data);
      } catch {
        toast.error('Could not fetch profile');
      }
    };
    fetchProfile();
  }, [token]);

  // Profile update
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put<ProfileResponse>('/user/me', profile, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Profile updated!');
      setEditing(false);
      login({ ...user!, name: profile.name }, token!); // update name in header/UI
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Update failed');
    }
  };

  // Password change
  const handlePwdChange = async (e: React.FormEvent) => {
    e.preventDefault();
    // Client validation for safety
    if (pwd.password !== pwd.confirm) return toast.error('Passwords do not match');
    if (pwd.password.length < 8) return toast.error('Password must be at least 8 characters');
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/;
    if (!pattern.test(pwd.password)) return toast.error('Must have uppercase, lowercase, number, symbol');
    try {
      await api.put('/user/me', pwd, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Password updated!');
      setChangingPwd(false);
      setPwd({ currentPassword: '', password: '', confirm: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.msg || 'Password update failed');
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-12">
      <div className="rounded-2xl shadow-2xl p-8 border border-gray-100 bg-white/90">
        <div className="flex flex-col items-center mb-4">
          {profile.avatar ? (
            <img src={profile.avatar} alt="avatar" className="w-20 h-20 rounded-full mb-2 shadow" />
          ) : (
            <span className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-blue-400 flex items-center justify-center text-white font-bold text-2xl mb-2 shadow">
              {profile.name.charAt(0) || user?.name.charAt(0) || "U"}
            </span>
          )}
          <h2 className="text-2xl font-extrabold text-emerald-800">{profile.name}</h2>
          <p className="text-emerald-500">{profile.email}</p>
        </div>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block font-semibold text-emerald-700 mb-1">Name</label>
            <input
              className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-base focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
              name="name"
              value={profile.name}
              onChange={handleChange}
              disabled={!editing}
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-emerald-700 mb-1">Email</label>
            <input
              className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-base text-gray-500"
              name="email"
              value={profile.email}
              disabled
              readOnly
            />
          </div>
          <div>
            <label className="block font-semibold text-emerald-700 mb-1">Bio</label>
            <textarea
              className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-base focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
              name="bio"
              value={profile.bio}
              onChange={handleChange}
              disabled={!editing}
              placeholder="Short bio..."
              rows={2}
            />
          </div>
          <div className="flex gap-3 mt-2">
            {!editing ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="bg-gradient-to-tr from-emerald-600 to-blue-400 text-white font-bold py-2 px-6 rounded-lg shadow hover:from-emerald-700 hover:to-blue-500"
              >
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  type="submit"
                  className="bg-gradient-to-tr from-emerald-600 to-blue-400 text-white font-bold py-2 px-6 rounded-lg shadow hover:from-emerald-700 hover:to-blue-500"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => { setEditing(false); setProfile({ ...profile }); }}
                  className="bg-gray-100 border border-gray-300 text-emerald-700 font-bold py-2 px-6 rounded-lg shadow"
                >
                  Cancel
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setChangingPwd(v => !v)}
              className="ml-auto text-emerald-700 underline font-semibold hover:text-blue-500"
            >
              {changingPwd ? "Close Password Change" : "Change Password"}
            </button>
          </div>
        </form>

        {/* Password Change */}
        {changingPwd && (
          <form onSubmit={handlePwdChange} className="space-y-4 mt-8">
            <div>
              <label className="block font-semibold text-emerald-700 mb-1">Current Password</label>
              <input
                className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-base focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
                type="password"
                name="currentPassword"
                placeholder="Current Password"
                value={pwd.currentPassword}
                onChange={e => setPwd({ ...pwd, currentPassword: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-emerald-700 mb-1">New Password</label>
              <input
                className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-base focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
                type="password"
                name="password"
                placeholder="New Password"
                value={pwd.password}
                onChange={e => setPwd({ ...pwd, password: e.target.value })}
                required
              />
              <PasswordStrengthMeter password={pwd.password} />
            </div>
            <div>
              <label className="block font-semibold text-emerald-700 mb-1">Confirm New Password</label>
              <input
                className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-base focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
                type="password"
                name="confirm"
                placeholder="Confirm New Password"
                value={pwd.confirm}
                onChange={e => setPwd({ ...pwd, confirm: e.target.value })}
                required
              />
            </div>
            <button
              className="w-full bg-gradient-to-tr from-emerald-600 to-blue-400 text-white font-bold py-2 rounded-lg shadow hover:from-emerald-700 hover:to-blue-500"
              type="submit"
            >
              Update Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;
