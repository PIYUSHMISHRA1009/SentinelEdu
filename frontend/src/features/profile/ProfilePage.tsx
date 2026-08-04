import React, { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import axiosClient from '@/api/axiosClient';
import { API_ENDPOINTS } from '@/api/endpoints';
import { useToast } from '@/components/ToastProvider';
import { useNavigate } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user, role } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState('');
  const [pwNew, setPwNew] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
    // Fetch server profile to get latest contact number if available
    axiosClient.get('/profile').then(res => {
      const d = res.data?.data || {};
      if (d.name) setName(d.name);
      if (d.email) setEmail(d.email);
      if (d.contact_number) setContact(d.contact_number);
      if (d.department) setDepartment(d.department);
      if (typeof d.semester !== 'undefined') setSemester(Number(d.semester));
    }).catch(() => {});
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const payload: any = { name, contact_number: contact };
      // Email and department/semester are restricted unless IT; backend enforces
      await axiosClient.put('/profile', payload);
      addToast('Profile updated', 'success');
    } catch (e: any) {
      addToast(e.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    try {
      await axiosClient.post(API_ENDPOINTS.CHANGE_PASSWORD, { username: user?.username, current_password: pw, new_password: pwNew });
      addToast('Password changed', 'success');
      setPw(''); setPwNew('');
    } catch (e: any) {
      addToast(e.message || 'Failed to change password', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 dark:bg-slate-900 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">My Profile</h1>
        <p className="text-gray-600 dark:text-slate-400">View and update your basic details</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 dark:bg-slate-900 dark:border-slate-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4">Basic Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Name</label>
            <input className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700" value={name} onChange={e=>setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email</label>
            <input className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700" value={email} onChange={e=>setEmail(e.target.value)} disabled={role !== 'it'} />
            {role !== 'it' && <p className="text-xs text-gray-500 dark:text-slate-400 mt-1"><span className="px-2 py-0.5 text-[10px] rounded bg-gray-200 text-gray-700 mr-1">IT-only</span>Email changes require IT approval.</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Contact Number</label>
            <input className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700" value={contact} onChange={e=>setContact(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Department</label>
            <input className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700" value={department} disabled />
            {role !== 'it' && (
              <button onClick={()=>navigate('/contact?subject=Profile%20change%20request&message=Please%20update%20my%20department')} className="mt-1 text-xs text-cyan-400 hover:underline">Request change</button>
            )}
          </div>
          {role === 'student' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Semester</label>
              <input className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700" value={semester ?? ''} disabled />
              <button onClick={()=>navigate('/contact?subject=Profile%20change%20request&message=Please%20update%20my%20semester')} className="mt-1 text-xs text-cyan-400 hover:underline">Request change</button>
            </div>
          )}
        </div>
        <div className="mt-4">
          <button disabled={saving} onClick={saveProfile} className="px-4 py-2 rounded-lg bg-gradient-to-r from-mint-500 to-cyan-500 text-white font-medium disabled:opacity-60">{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 dark:bg-slate-900 dark:border-slate-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4">Change Password</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input type="password" placeholder="Current password" className="px-3 py-2 border rounded-lg dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700" value={pw} onChange={e=>setPw(e.target.value)} />
          <input type="password" placeholder="New password" className="px-3 py-2 border rounded-lg dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700" value={pwNew} onChange={e=>setPwNew(e.target.value)} />
          <button onClick={changePassword} className="px-4 py-2 rounded-lg bg-gradient-to-r from-mint-500 to-cyan-500 text-white font-medium">Update Password</button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;