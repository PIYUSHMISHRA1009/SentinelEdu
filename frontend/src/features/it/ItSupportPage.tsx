/**
 * IT Support page - manage support tickets and contact messages
 */

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/api/axiosClient';
import { API_ENDPOINTS } from '@/api/endpoints';
import { FadeIn } from '@/components/Motion/FadeIn';
import { useToast } from '@/components/ToastProvider';
import type { ApiResponse, ContactMessage } from '@/api/types';

export const ItSupportPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [supportReplies, setSupportReplies] = useState<Record<number, string>>({});
  const [contactReplies, setContactReplies] = useState<Record<number, string>>({});
  const [supportPage, setSupportPage] = useState(1);
  const [contactPage, setContactPage] = useState(1);
  const pageSize = 10;

  const { data: supportTickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['support-tickets-admin'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<any[]>>(API_ENDPOINTS.SUPPORT);
      return res.data.data;
    },
  });

  const { data: contactMessages, isLoading: contactLoading } = useQuery({
    queryKey: ['contact-messages'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<ContactMessage[]>>(API_ENDPOINTS.CONTACT);
      return res.data.data;
    },
  });

  const supportReply = useMutation({
    mutationFn: async (args: { id: number; message: string }) => {
      const res = await axiosClient.post<ApiResponse<any>>(API_ENDPOINTS.SUPPORT_REPLY(args.id), { message: args.message });
      return res.data;
    },
    onSuccess: (res) => {
      if (res.success) {
        addToast('Reply sent', 'success');
        queryClient.invalidateQueries({ queryKey: ['support-tickets-admin'] });
      } else {
        addToast(res.message || 'Failed to reply', 'error');
      }
    },
    onError: (err: any) => addToast(err.message || 'Failed to reply', 'error'),
  });

  const supportResolve = useMutation({
    mutationFn: async (id: number) => {
      const res = await axiosClient.post<ApiResponse<any>>(API_ENDPOINTS.SUPPORT_RESOLVE(id));
      return res.data;
    },
    onSuccess: (res) => {
      if (res.success) {
        addToast('Ticket marked as resolved', 'success');
        queryClient.invalidateQueries({ queryKey: ['support-tickets-admin'] });
      } else {
        addToast(res.message || 'Failed to resolve', 'error');
      }
    },
    onError: (err: any) => addToast(err.message || 'Failed to resolve', 'error'),
  });

  const contactReply = useMutation({
    mutationFn: async (args: { id: number; reply: string; complete?: boolean }) => {
      const res = await axiosClient.post<ApiResponse<any>>(API_ENDPOINTS.CONTACT_REPLY(args.id), {
        reply: args.reply,
        complete: Boolean(args.complete),
      });
      return res.data;
    },
    onSuccess: (res) => {
      if (res.success) {
        addToast('Response saved', 'success');
        queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
      } else {
        addToast(res.message || 'Failed to save response', 'error');
      }
    },
    onError: (err: any) => addToast(err.message || 'Failed to save response', 'error'),
  });

  const activeTicketCount = (supportTickets || []).filter((ticket: any) => ticket.status !== 'resolved').length;

  // Sort and paginate support tickets
  const sortedSupport = (supportTickets || [])
    .slice()
    .sort((a: any, b: any) => new Date(b.created_on).getTime() - new Date(a.created_on).getTime());
  const supportTotal = sortedSupport.length;
  const supportTotalPages = Math.max(1, Math.ceil(supportTotal / pageSize));
  const supportStart = (supportPage - 1) * pageSize;
  const supportEnd = Math.min(supportStart + pageSize, supportTotal);
  const visibleSupport = sortedSupport.slice(supportStart, supportEnd);

  // Sort and paginate contact messages
  const sortedContacts = (contactMessages || [])
    .slice()
    .sort((a: any, b: any) => {
      const ad = new Date(a.created_on || a.submitted_on || 0).getTime();
      const bd = new Date(b.created_on || b.submitted_on || 0).getTime();
      return bd - ad;
    });
  const contactTotal = sortedContacts.length;
  const contactTotalPages = Math.max(1, Math.ceil(contactTotal / pageSize));
  const contactStart = (contactPage - 1) * pageSize;
  const contactEnd = Math.min(contactStart + pageSize, contactTotal);
  const visibleContacts = sortedContacts.slice(contactStart, contactEnd);

  return (
    <FadeIn className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 p-8 text-white shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">IT Support Hub</h1>
            <p className="mt-2 max-w-2xl text-sm text-primary-100/90">
              Monitor open support requests and respond to contact form enquiries from a single place.
            </p>
          </div>
          <div className="rounded-xl border border-primary-300/40 bg-primary-500/20 px-4 py-3 text-right">
            <div className="text-xs font-semibold uppercase tracking-wide text-primary-100">Active Tickets</div>
            <div className="text-3xl font-bold text-white">{activeTicketCount}</div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 grid-cols-1">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Support Tickets</h2>
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Follow up on IT support tickets and close them when resolved.
              </p>
            </div>
            <button
              type="button"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['support-tickets-admin'] })}
              className="text-sm font-semibold text-primary-600 transition hover:text-primary-700"
            >
              Refresh
            </button>
          </div>
          {ticketsLoading ? (
            <p className="text-sm text-slate-500">Loading tickets…</p>
          ) : supportTotal === 0 ? (
            <p className="text-sm text-slate-500">No support tickets right now.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-3 text-left">Subject</th>
                    <th className="px-4 py-3 text-left">Details</th>
                    <th className="px-4 py-3 text-left">Raised By</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Created</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
                  {visibleSupport.map((ticket) => (
                    <tr key={ticket.ticket_id} className="align-top hover:bg-slate-50 dark:hover:bg-slate-800">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{ticket.subject}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                        <div className="whitespace-pre-wrap break-words">{ticket.description}</div>
                        {ticket.responses?.length ? (
                          <div className="mt-3 space-y-2">
                            {ticket.responses.map((response: any) => (
                              <div
                                key={response.response_id}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                              >
                                <div className="text-slate-700 dark:text-slate-200">{response.message}</div>
                                <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                                  {response.responder} • {new Date(response.created_on).toLocaleString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                        {ticket.created_by ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="font-medium">{ticket.created_by}</span>
                            {ticket.ticket_code && (
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                {ticket.ticket_code}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2">
                            <span className="font-medium">{ticket.name || ticket.email || 'Unknown'}</span>
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
                              Guest
                            </span>
                          </span>
                        )}
                        {!ticket.created_by && ticket.email ? (
                          <div className="mt-0.5 text-xs text-primary-600 dark:text-primary-300">{ticket.email}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            ticket.status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : ticket.status === 'in_progress'
                              ? 'bg-primary-100 text-primary-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                        {new Date(ticket.created_on).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            value={supportReplies[ticket.ticket_id] || ''}
                            onChange={(event) =>
                              setSupportReplies((prev) => ({ ...prev, [ticket.ticket_id]: event.target.value }))
                            }
                            placeholder="Reply"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                          />
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                supportReply.mutate({ id: ticket.ticket_id, message: supportReplies[ticket.ticket_id] || '' })
                              }
                              disabled={!supportReplies[ticket.ticket_id] || supportReply.isPending}
                              className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-60"
                            >
                              Reply
                            </button>
                            <button
                              type="button"
                              onClick={() => supportResolve.mutate(ticket.ticket_id)}
                              disabled={supportResolve.isPending || ticket.status === 'resolved'}
                              className="rounded-lg border border-emerald-500 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-60 dark:border-emerald-400 dark:text-emerald-300 dark:hover:bg-emerald-400/10"
                            >
                              Mark Resolved
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between mt-3 text-xs text-slate-600 dark:text-slate-300">
                <span>
                  Showing {supportStart + 1}-{supportEnd} of {supportTotal}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSupportPage((p) => Math.max(1, p - 1))}
                    disabled={supportPage === 1}
                    className="rounded border px-2 py-1 disabled:opacity-40 dark:border-slate-700"
                  >
                    Previous
                  </button>
                  <span>Page {supportPage} of {supportTotalPages}</span>
                  <button
                    type="button"
                    onClick={() => setSupportPage((p) => Math.min(supportTotalPages, p + 1))}
                    disabled={supportPage === supportTotalPages}
                    className="rounded border px-2 py-1 disabled:opacity-40 dark:border-slate-700"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Contact Messages</h2>
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Respond to enquiries submitted through the public contact form.
              </p>
            </div>
            <button
              type="button"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['contact-messages'] })}
              className="text-sm font-semibold text-primary-600 transition hover:text-primary-700"
            >
              Refresh
            </button>
          </div>
          {contactLoading ? (
            <p className="text-sm text-slate-500">Loading messages…</p>
          ) : contactTotal === 0 ? (
            <p className="text-sm text-slate-500">No contact messages yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Subject</th>
                    <th className="px-4 py-3 text-left">Message</th>
                    <th className="px-4 py-3 text-left">Submitted</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
                  {visibleContacts.map((message, index) => {
                    const derivedId = Number(message.message_id ?? message.contact_id);
                    const key = Number.isFinite(derivedId) ? (derivedId as number) : index;
                    const replyValue = contactReplies[key] || '';
                    return (
                      <tr key={key} className="align-top hover:bg-slate-50 dark:hover:bg-slate-800">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{message.name}</td>
                        <td className="px-4 py-3 text-sm text-primary-600 dark:text-primary-300">{message.email}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{message.subject || '—'}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                          <div className="whitespace-pre-wrap break-words">{message.message}</div>
                          {message.reply_text ? (
                            <div className="mt-3 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs text-primary-700 dark:border-primary-700/40 dark:bg-primary-700/10 dark:text-primary-200">
                              Reply: {message.reply_text}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                          {(message.created_on || message.submitted_on)
                            ? new Date((message.created_on || message.submitted_on) as string).toLocaleString()
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              message.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-700'
                                : message.status === 'replied'
                                ? 'bg-primary-100 text-primary-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {message.status || 'open'}
                          </span>
                          {message.replied_by ? (
                            <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                              {message.replied_by}
                              {message.replied_on ? ` • ${new Date(message.replied_on).toLocaleString()}` : ''}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-2">
                            <input
                              type="text"
                              value={replyValue}
                              onChange={(event) =>
                                setContactReplies((prev) => ({ ...prev, [key]: event.target.value }))
                              }
                              placeholder="Type reply"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            />
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => contactReply.mutate({ id: key, reply: replyValue })}
                                disabled={!replyValue || contactReply.isPending}
                                className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-60"
                              >
                                Reply
                              </button>
                              <button
                                type="button"
                                onClick={() => contactReply.mutate({ id: key, reply: replyValue, complete: true })}
                                disabled={!replyValue || contactReply.isPending}
                                className="rounded-lg border border-emerald-500 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-60 dark:border-emerald-400 dark:text-emerald-300 dark:hover:bg-emerald-400/10"
                              >
                                Reply &amp; Close
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="flex items-center justify-between mt-3 text-xs text-slate-600 dark:text-slate-300">
                <span>
                  Showing {contactStart + 1}-{contactEnd} of {contactTotal}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setContactPage((p) => Math.max(1, p - 1))}
                    disabled={contactPage === 1}
                    className="rounded border px-2 py-1 disabled:opacity-40 dark:border-slate-700"
                  >
                    Previous
                  </button>
                  <span>Page {contactPage} of {contactTotalPages}</span>
                  <button
                    type="button"
                    onClick={() => setContactPage((p) => Math.min(contactTotalPages, p + 1))}
                    disabled={contactPage === contactTotalPages}
                    className="rounded border px-2 py-1 disabled:opacity-40 dark:border-slate-700"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </FadeIn>
  );
};
