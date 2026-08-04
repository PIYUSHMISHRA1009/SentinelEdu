import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/api/axiosClient';
import { API_ENDPOINTS } from '@/api/endpoints';
import type { ApiResponse, SupportTicket } from '@/api/types';
import { useAuth } from '@/features/auth/AuthProvider';
import { Loading } from '@/components/Loading';
import { useToast } from '@/components/ToastProvider';

export const SupportPage: React.FC = () => {
  const { role } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<SupportTicket[]>>(API_ENDPOINTS.SUPPORT);
      return res.data.data;
    },
  });

  const createTicket = useMutation({
    mutationFn: async () => {
      const res = await axiosClient.post<ApiResponse<any>>(API_ENDPOINTS.SUPPORT, { subject, description });
      return res.data;
    },
    onSuccess: (res) => {
      if (res.success) {
        addToast('Ticket created', 'success');
        setSubject(''); setDescription('');
        queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      } else {
        addToast(res.message || 'Failed to create ticket', 'error');
      }
    },
    onError: (e: any) => addToast(e.message || 'Failed to create ticket', 'error'),
  });

  const replyMutation = useMutation({
    mutationFn: async (args: { id: number; message: string }) => {
      const res = await axiosClient.post<ApiResponse<any>>(API_ENDPOINTS.SUPPORT_REPLY(args.id), { message: args.message });
      return res.data;
    },
    onSuccess: (res) => {
      if (res.success) {
        addToast('Reply added', 'success');
        queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      } else {
        addToast(res.message || 'Failed to reply', 'error');
      }
    },
    onError: (e: any) => addToast(e.message || 'Failed to reply', 'error'),
  });

  const resolveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await axiosClient.post<ApiResponse<any>>(API_ENDPOINTS.SUPPORT_RESOLVE(id));
      return res.data;
    },
    onSuccess: (res) => {
      if (res.success) {
        addToast('Ticket resolved', 'success');
        queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      } else {
        addToast(res.message || 'Failed to resolve', 'error');
      }
    },
    onError: (e: any) => addToast(e.message || 'Failed to resolve', 'error'),
  });

  const [replyInputs, setReplyInputs] = useState<Record<number, string>>({});

  if (isLoading) return <Loading message="Loading tickets..." />;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 dark:bg-slate-900 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">Support</h1>
        <p className="text-gray-600 dark:text-slate-400">Create a support ticket and track responses</p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Subject</label>
            <input className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700" value={subject} onChange={e=>setSubject(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Description</label>
            <textarea className="w-full px-3 py-2 border rounded dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700" rows={4} value={description} onChange={e=>setDescription(e.target.value)} />
          </div>
          <div>
            <button disabled={!subject || !description || createTicket.isPending} onClick={()=>createTicket.mutate()} className="px-4 py-2 rounded bg-gradient-to-r from-mint-500 to-cyan-500 text-white disabled:opacity-60">{createTicket.isPending ? 'Creating…' : 'Create Ticket'}</button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">{role === 'it' ? 'All Tickets' : 'My Tickets'}</h2>
            <p className="text-gray-600 dark:text-slate-400">{tickets?.length || 0} total</p>
          </div>
        </div>

        {!tickets || tickets.length === 0 ? (
          <p className="text-gray-500 dark:text-slate-400">No tickets</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase dark:text-slate-300">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase dark:text-slate-300">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase dark:text-slate-300">Created</th>
                  {role === 'it' && <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase dark:text-slate-300">Created By</th>}
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase dark:text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-slate-900 dark:divide-slate-800">
                {tickets.map(t => (
                  <tr key={t.ticket_id} className="align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-slate-100">{t.subject} {t.ticket_code && (<span className="ml-2 text-[11px] text-gray-500 dark:text-slate-400">[{t.ticket_code}]</span>)}</div>
                      <div className="text-xs text-gray-600 max-w-md whitespace-pre-wrap dark:text-slate-300">{t.description}</div>
                      <div className="mt-2">
                        <a href={`/support/${t.ticket_id}`} className="text-xs text-cyan-400 hover:underline">Open conversation →</a>
                      </div>
                      {t.responses && t.responses.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {t.responses.map(r => (
                            <div key={r.response_id} className="p-2 bg-gray-50 border rounded text-xs dark:bg-slate-800 dark:border-slate-700">
                              <div className="text-gray-700 dark:text-slate-200">{r.message}</div>
                              <div className="text-[10px] text-gray-500 dark:text-slate-400">by {r.responder} • {new Date(r.created_on).toLocaleString()}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.status === 'resolved' ? 'bg-green-100 text-green-700' : t.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{t.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400">{new Date(t.created_on).toLocaleString()}</td>
                    {role === 'it' && (
                      <td className="px-4 py-3 text-xs text-gray-700 dark:text-slate-300">{t.created_by || t.email || '-'}</td>
                    )}
                    <td className="px-4 py-3">
                      {role === 'it' ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Reply..."
                              className="px-2 py-1 border rounded w-48 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
                              value={replyInputs[t.ticket_id] || ''}
                              onChange={(e)=> setReplyInputs(prev=> ({...prev, [t.ticket_id]: e.target.value}))}
                            />
                            <button className="px-2 py-1 rounded bg-cyan-600 text-white text-xs disabled:opacity-60" disabled={!replyInputs[t.ticket_id] || replyMutation.isPending || t.status === 'resolved'} onClick={()=> replyMutation.mutate({ id: t.ticket_id, message: replyInputs[t.ticket_id] })}>Reply</button>
                            <button className="px-2 py-1 rounded bg-green-600 text-white text-xs disabled:opacity-60" disabled={resolveMutation.isPending || t.status === 'resolved'} onClick={()=> resolveMutation.mutate(t.ticket_id)}>Mark Resolved</button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-slate-400">Open conversation to reply</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportPage;
