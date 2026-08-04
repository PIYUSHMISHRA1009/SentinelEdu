/**
 * Direct Messages inbox for faculty, students, and IT
 */

import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/api/axiosClient';
import { API_ENDPOINTS } from '@/api/endpoints';
import { Loading } from '@/components/Loading';
import { FadeIn } from '@/components/Motion/FadeIn';
import type { ApiResponse, DirectMessage } from '@/api/types';
import { useAuth } from '@/features/auth/AuthProvider';
import { useToast } from '@/components/ToastProvider';

const canSendRoles = new Set(['it', 'academic_head', 'faculty']);

export const MessagesPage: React.FC = () => {
  const { role, user } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [recipient, setRecipient] = useState('');
  const [body, setBody] = useState('');
  const canSend = role ? canSendRoles.has(role) : false;

  const { data: messages, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ['messages-inbox-page'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<DirectMessage[]>>(API_ENDPOINTS.MESSAGES_LIST);
      return res.data.data ?? [];
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const sanitizedRecipient = recipient.trim();
      const sanitizedBody = body.trim();
      if (!sanitizedRecipient || !sanitizedBody) {
        throw new Error('Recipient and message are required');
      }
      const res = await axiosClient.post<ApiResponse<Record<string, unknown>>>(API_ENDPOINTS.MESSAGES_SEND, {
        recipient: sanitizedRecipient,
        body: sanitizedBody,
      });
      if (!res.data.success) {
        throw new Error(res.data.error || 'Failed to send message');
      }
      return res.data;
    },
    onSuccess: () => {
      addToast('Message sent', 'success');
      setRecipient('');
      setBody('');
      queryClient.invalidateQueries({ queryKey: ['messages-inbox-page'] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to send message';
      addToast(message, 'error');
    },
  });

  const sortedMessages = useMemo(() => {
    if (!messages) return [];
    return [...messages].sort((a, b) => {
      const tsA = a.created_on ? new Date(a.created_on).getTime() : 0;
      const tsB = b.created_on ? new Date(b.created_on).getTime() : 0;
      return tsB - tsA;
    });
  }, [messages]);

  return (
    <FadeIn className="space-y-6">
      <div className="bg-gradient-to-br from-navy-900 to-navy-800 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold">Messages</h1>
            <p className="text-gray-300 mt-1">Review conversations and stay on top of student-faculty communication.</p>
          </div>
          <button
            className="px-4 py-2 rounded-lg border border-white/40 text-sm text-white/90 hover:bg-white/10 transition"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['messages-inbox-page'] })}
            disabled={isFetching}
          >
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {canSend && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 dark:bg-slate-900 dark:border-slate-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">Send a new message</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Recipient username</label>
              <input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="e.g. student123"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-mint-500 focus:border-mint-500 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Message</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type your message..."
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-mint-500 focus:border-mint-500 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
              />
            </div>
            <div className="md:col-span-1 flex items-end">
              <button
                onClick={() => sendMutation.mutate()}
                disabled={!recipient.trim() || !body.trim() || sendMutation.isPending}
                className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-mint-500 to-cyan-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendMutation.isPending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">Faculty can message students directly. Academic heads may contact both faculty and students. IT can reach any user.</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 dark:bg-slate-900 dark:border-slate-800">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">Conversation history</h2>
        {isLoading ? (
          <Loading message="Loading messages..." />
        ) : isError ? (
          <p className="text-red-600">{error instanceof Error ? error.message : 'Failed to load messages.'}</p>
        ) : !sortedMessages.length ? (
          <p className="text-gray-500 dark:text-slate-400">No messages yet. Start a conversation above.</p>
        ) : (
          <ul className="space-y-4">
            {sortedMessages.map((message) => {
              const isMine = user?.username && message.sender === user.username;
              return (
                <li key={message.message_id} className={`p-4 rounded-xl border ${isMine ? 'border-mint-200 bg-mint-50 dark:bg-emerald-900/20 dark:border-emerald-700/40' : 'border-gray-200 bg-white dark:bg-slate-800 dark:border-slate-700'}`}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-sm text-gray-700 dark:text-slate-300">
                      <span className="font-semibold text-gray-900 dark:text-slate-100">{message.sender}</span>
                      <span className="mx-2 text-gray-400 dark:text-slate-500">→</span>
                      <span className="font-medium text-gray-600 dark:text-slate-300">{message.recipient}</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-slate-400">{message.created_on ? new Date(message.created_on).toLocaleString() : ''}</span>
                  </div>
                  <p className="mt-3 text-gray-800 whitespace-pre-wrap leading-relaxed dark:text-slate-200">{message.body}</p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </FadeIn>
  );
};
