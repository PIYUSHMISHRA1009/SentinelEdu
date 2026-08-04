import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/api/axiosClient';
import { API_ENDPOINTS } from '@/api/endpoints';
import type { ApiResponse } from '@/api/types';
import { Loading } from '@/components/Loading';
import { ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/features/auth/AuthProvider';

export const SupportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['support-ticket', id],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<any>>(API_ENDPOINTS.SUPPORT_TICKET(parseInt(id!)));
      return res.data.data;
    },
    enabled: !!id,
    refetchInterval: 10000,
  });

  const reply = useMutation({
    mutationFn: async () => {
      const res = await axiosClient.post<ApiResponse<any>>(API_ENDPOINTS.SUPPORT_REPLY(parseInt(id!)), { message });
      return res.data;
    },
    onSuccess: (res) => {
      if (res.success) {
        setMessage('');
        queryClient.invalidateQueries({ queryKey: ['support-ticket', id] });
      }
    }
  });

  if (isLoading) return <Loading message="Loading ticket..." />;
  if (!ticket) return <div className="p-6">Ticket not found</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <button onClick={() => navigate('/support')} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-slate-100">
        <ArrowLeftIcon className="w-4 h-4" /> Back to tickets
      </button>

      <div className="bg-white border rounded-xl p-6 dark:bg-slate-900 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{ticket.subject} {ticket.ticket_code && (<span className="ml-2 text-base text-gray-500 dark:text-slate-400">[{ticket.ticket_code}]</span>)}</h1>
        <p className="text-gray-600 mt-1 dark:text-slate-300">Status: <span className="font-medium">{ticket.status}</span></p>
        <div className="mt-2 text-sm text-gray-600 dark:text-slate-400">
          <span className="font-medium">Reporter:</span>{' '}
          {ticket.created_by ? (
            <span className="inline-flex items-center gap-2">
              <span>{ticket.created_by}</span>
              {ticket.ticket_code && (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  {ticket.ticket_code}
                </span>
              )}
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <span>{ticket.name || ticket.email || 'Unknown'}</span>
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">Guest</span>
            </span>
          )}
          {!ticket.created_by && ticket.email ? (
            <span className="ml-2 text-primary-600 dark:text-primary-300">• {ticket.email}</span>
          ) : null}
          {ticket.created_on ? (
            <span className="ml-2 text-xs">• {new Date(ticket.created_on).toLocaleString()}</span>
          ) : null}
        </div>
        <div className="mt-4 p-4 rounded bg-gray-50 text-gray-800 whitespace-pre-wrap dark:bg-slate-800 dark:text-slate-200">{ticket.description}</div>
      </div>

      <div className="bg-white border rounded-xl p-6 dark:bg-slate-900 dark:border-slate-800">
        <h2 className="text-lg font-semibold mb-3 dark:text-slate-100">Conversation</h2>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {ticket.responses?.map((r: any) => (
            <div key={r.response_id} className={`p-3 rounded ${r.responder && r.responder.toLowerCase() === 'it' ? 'bg-blue-50' : 'bg-gray-50 dark:bg-slate-800'}`}>
              <div className="text-sm text-gray-800 whitespace-pre-wrap dark:text-slate-200">{r.message}</div>
              <div className="text-[10px] text-gray-500 mt-1 dark:text-slate-400">{r.responder} • {new Date(r.created_on).toLocaleString()}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            className="flex-1 px-3 py-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            placeholder="Type a reply..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button disabled={!message || reply.isPending || ticket.status === 'resolved'} onClick={()=>reply.mutate()} className="inline-flex items-center gap-2 px-4 py-2 rounded bg-gradient-to-r from-mint-500 to-cyan-500 text-white disabled:opacity-60">
            <PaperAirplaneIcon className="w-4 h-4" /> Send
          </button>
        </div>
        {ticket.status === 'resolved' && (
          <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">Replies are closed because this ticket is resolved.</p>
        )}
      </div>
    </div>
  );
};

export default SupportDetailPage;
