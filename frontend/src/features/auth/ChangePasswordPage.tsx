import React, { useState } from 'react';
import axios from 'axios';
import axiosClient from '@/api/axiosClient';
import { API_ENDPOINTS } from '@/api/endpoints';
import type { ApiResponse, ChangePasswordRequest } from '@/api/types';
import { useAuth } from './AuthProvider';
import { MagneticButton } from '@/components/Motion/MagneticButton';

export const ChangePasswordPage: React.FC = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match');
      return;
    }

    try {
      setIsLoading(true);
      const payload: ChangePasswordRequest = {
        username: user?.username || '',
        currentPassword,
        newPassword,
      };
      const res = await axiosClient.post<ApiResponse<{ updated: number }>>(API_ENDPOINTS.CHANGE_PASSWORD, payload);
      if (res.data.success) {
        setMessage('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(res.data.error || res.data.message || 'Failed to change password');
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const apiError = err.response?.data as ApiResponse<unknown> | undefined;
        setError(apiError?.error || apiError?.message || err.message || 'Error changing password');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error changing password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Change Password</h1>
      {message && <div className="mb-3 p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">{message}</div>}
      {error && <div className="mb-3 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
        </div>
        <MagneticButton type="submit" disabled={isLoading} className="px-4 py-2 rounded-lg bg-gradient-to-r from-mint-500 to-cyan-500 text-white font-medium disabled:opacity-60">
          {isLoading ? 'Updating…' : 'Update Password'}
        </MagneticButton>
      </form>
    </div>
  );
};

export default ChangePasswordPage;
