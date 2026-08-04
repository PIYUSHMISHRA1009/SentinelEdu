import React, { useEffect, useState } from 'react';
import axiosClient from '@/api/axiosClient';
import { API_ENDPOINTS } from '@/api/endpoints';
import type { ApiResponse, CreateContactRequest, CreateContactResponse } from '@/api/types';
import { useAuth } from '@/features/auth/AuthProvider';

export const ContactPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (!name) setName(user.name || user.username);
      if (!email) setEmail(user.email || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('');
    setSubmitting(true);
    try {
      const payload: CreateContactRequest = { name, email, subject, message };
      const res = await axiosClient.post<ApiResponse<CreateContactResponse>>(API_ENDPOINTS.CONTACT, payload);
      if (res.data?.success) {
        setStatus('Submitted! Our IT team will get back to you.');
        // Optional toast replacement
        alert('Contact form submitted successfully.');
        setName(''); setEmail(''); setSubject(''); setMessage('');
      } else {
        setStatus(res.data?.message || 'Submission failed');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      setStatus(msg);
      alert('Failed to submit contact form.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-slate-100">Contact Us</h1>
      <p className="text-gray-700 mb-6 dark:text-slate-300">Have questions or need support? Send us a message and the IT team will follow up.</p>

      {status && <div className="mb-4 p-3 rounded bg-blue-50 border border-blue-200 text-blue-700 text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">{status}</div>}

      <form onSubmit={onSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 dark:bg-slate-900 dark:border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">Name</label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">Email</label>
            <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">Subject</label>
          <input className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" value={subject} onChange={e => setSubject(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">Message</label>
          <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" rows={6} value={message} onChange={e => setMessage(e.target.value)} required />
        </div>
        <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-gradient-to-r from-mint-500 to-cyan-500 text-white font-medium disabled:opacity-60">
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>

      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4 dark:bg-slate-900 dark:border-slate-800">
        <p className="text-sm text-gray-600 mb-2 dark:text-slate-400">Or reach us directly:</p>
        <ul className="text-gray-700 space-y-1 text-sm dark:text-slate-200">
          <li><strong>Email:</strong> it-support@example.edu</li>
          <li><strong>Phone:</strong> +1 (555) 010-0100</li>
          <li><strong>Office Hours:</strong> Mon–Fri, 9:00–17:00</li>
        </ul>
      </div>
    </div>
  );
};

export default ContactPage;
