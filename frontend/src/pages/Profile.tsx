/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/useAuth';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';

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
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [changingPwd, setChangingPwd] = useState(false);
  const [pwd, setPwd] = useState({ currentPassword: '', password: '', confirm: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get<ProfileResponse>('/user/me', { headers: { Authorization: `Bearer ${token}` } });
        setProfile(res.data);
      } catch (err) {
        setError('Could not fetch profile');
      }
    };
    fetchProfile();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
    setMsg('');
    setError('');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.put<ProfileResponse>('/user/me', profile, { headers: { Authorization: `Bearer ${token}` } });
      setMsg('Profile updated!');
      setEditing(false);
      login({ ...user!, name: profile.name }, token!);
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Update failed');
    }
  };

  // Password change
  const handlePwdChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.password !== pwd.confirm) return setError('Passwords do not match');
    try {
      await api.put('/user/me', pwd, { headers: { Authorization: `Bearer ${token}` } });
      setMsg('Password updated!');
      setChangingPwd(false);
      setPwd({ currentPassword: '', password: '', confirm: '' });
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Password update failed');
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Profile</h2>
      <form onSubmit={handleUpdate} className="space-y-3">
        <input className="input" name="name" value={profile.name} onChange={handleChange} disabled={!editing} />
        <input className="input" name="email" value={profile.email} disabled readOnly />
        <textarea className="input" name="bio" value={profile.bio} onChange={handleChange} disabled={!editing} placeholder="Bio" />
        <div>
          {!editing ? (
            <button type="button" onClick={() => setEditing(true)} className="bg-blue-700 text-white py-1 px-4 rounded">Edit</button>
          ) : (
            <button type="submit" className="bg-green-600 text-white py-1 px-4 rounded">Save</button>
          )}
          <button type="button" onClick={() => setChangingPwd((v) => !v)} className="ml-3 text-blue-700 underline">Change Password</button>
        </div>
      </form>
      {msg && <div className="text-green-600 mt-2">{msg}</div>}
      {error && <div className="text-red-500 mt-2">{error}</div>}

      {/* Password Change */}
      {changingPwd && (
        <form onSubmit={handlePwdChange} className="space-y-3 mt-6">
          <input className="input" type="password" name="currentPassword" placeholder="Current Password" value={pwd.currentPassword} onChange={e => setPwd({ ...pwd, currentPassword: e.target.value })} required />
          <input className="input" type="password" name="password" placeholder="New Password" value={pwd.password} onChange={e => setPwd({ ...pwd, password: e.target.value })} required />
          <PasswordStrengthMeter password={pwd.password} />
          <input className="input" type="password" name="confirm" placeholder="Confirm New Password" value={pwd.confirm} onChange={e => setPwd({ ...pwd, confirm: e.target.value })} required />
          <button className="bg-blue-700 text-white py-1 px-4 rounded" type="submit">Update Password</button>
        </form>
      )}
    </div>
  );
};

export default Profile;
