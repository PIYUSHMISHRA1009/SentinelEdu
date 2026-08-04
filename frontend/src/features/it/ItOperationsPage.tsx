/**
 * IT Operations page - account administration & system health
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/api/axiosClient';
import { API_ENDPOINTS } from '@/api/endpoints';
import { Loading } from '@/components/Loading';
import type {
  AccountEvent,
  AdminAccount,
  ApiResponse,
  ResetPasswordRequest,
  ResetPasswordResult,
} from '@/api/types';
import { FadeIn } from '@/components/Motion/FadeIn';
import { useToast } from '@/components/ToastProvider';
import { AddStudentForm } from '@/features/admin/AddStudentForm';

export const ItOperationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [lastResetResult, setLastResetResult] = useState<ResetPasswordResult | null>(null);
  const [accountSearch, setAccountSearch] = useState('');
  const [accountPage, setAccountPage] = useState(1);
  const accountsPageSize = 10;

  const { data: adminAccounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['admin-accounts'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<AdminAccount[]>>(API_ENDPOINTS.ADMIN_ACCOUNTS);
      return res.data.data;
    },
  });

  const { data: accountEvents } = useQuery({
    queryKey: ['admin-account-events'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<AccountEvent[]>>(API_ENDPOINTS.ADMIN_ACCOUNT_EVENTS, {
        params: { limit: 40 },
      });
      return res.data.data;
    },
  });

  const { data: activity } = useQuery({
    queryKey: ['admin-activity'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<Array<{ type: string; id: number; ts?: string; summary?: string }>>>(
        '/admin/activity',
      );
      return res.data.data;
    },
  });

  const { data: dbHealth, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['health-db'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<{ status: string; tableCounts: Record<string, number>; totalRecords: number }>>(
        API_ENDPOINTS.HEALTH_DB,
      );
      return res.data.data;
    },
  });

  const totalAccounts = adminAccounts?.length ?? 0;
  const filteredAccounts = useMemo(() => {
    const term = accountSearch.trim().toLowerCase();
    if (!term) return adminAccounts || [];
    return (adminAccounts || []).filter((acct) => {
      const haystack = [
        acct.name,
        acct.username,
        acct.account_type,
        acct.department,
        acct.role,
        acct.roll_number,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());
      return haystack.some((value) => value.includes(term));
    });
  }, [adminAccounts, accountSearch]);

  useEffect(() => {
    setAccountPage(1);
  }, [accountSearch]);

  const totalAccountPages = Math.max(1, Math.ceil(filteredAccounts.length / accountsPageSize));
  useEffect(() => {
    setAccountPage((prev) => Math.min(prev, totalAccountPages));
  }, [totalAccountPages]);
  const accountSliceStart = (accountPage - 1) * accountsPageSize;
  const accountSliceEnd = accountSliceStart + accountsPageSize;
  const visibleAccounts = filteredAccounts.slice(accountSliceStart, accountSliceEnd);
  const accountRangeStart = filteredAccounts.length ? accountSliceStart + 1 : 0;
  const accountRangeEnd = filteredAccounts.length ? accountSliceStart + visibleAccounts.length : 0;
  const tablesTracked = useMemo(() => Object.keys(dbHealth?.tableCounts || {}).length, [dbHealth]);
  const recentResets = useMemo(
    () => (accountEvents || []).filter((event) => event.event_type.toLowerCase().includes('reset')).length,
    [accountEvents],
  );

  const handleReset = async () => {
    setResetMessage('');
    try {
      const trimmedUsername = resetUsername.trim();
      if (!trimmedUsername) {
        setResetMessage('Username is required');
        return;
      }
      const trimmedPassword = resetPassword.trim();
      const payload: ResetPasswordRequest = trimmedPassword
        ? { username: trimmedUsername, new_password: trimmedPassword }
        : { username: trimmedUsername };

      const res = await axiosClient.post<ApiResponse<ResetPasswordResult>>(API_ENDPOINTS.ADMIN_RESET_PASSWORD, payload);
      if (res.data.success && res.data.data) {
        const details = res.data.data;
        setLastResetResult(details);
        queryClient.invalidateQueries({ queryKey: ['admin-accounts'] });
        queryClient.invalidateQueries({ queryKey: ['admin-account-events'] });
        setResetUsername('');
        setResetPassword('');
        setResetMessage(
          details.password
            ? `Password reset for ${details.username}. Copy the new credential below.`
            : `Password reset for ${details.username}.`,
        );
      } else {
        setResetMessage(res.data.message || 'Failed to update password');
        setLastResetResult(null);
      }
    } catch (err: any) {
      setResetMessage(err.message || 'Error updating password');
      setLastResetResult(null);
    }
  };

  return (
    <FadeIn className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 p-8 text-white shadow-xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">IT Console</h1>
            <p className="mt-2 max-w-xl text-sm text-primary-100/90">
              Manage credentials, monitor data health, and review the latest account activity across InsightFlow EDU.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatBadge label="Accounts" value={totalAccounts} />
            <StatBadge label="Tables Tracked" value={tablesTracked} />
            <StatBadge label="Recent Resets" value={recentResets} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Add Student Account</h2>
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  Provision new student access with automatic credential generation.
                </p>
              </div>
              {!showAddStudent && (
                <button
                  type="button"
                  onClick={() => setShowAddStudent(true)}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
                >
                  New Student
                </button>
              )}
            </div>
            {showAddStudent ? (
              <div className="mt-6">
                <AddStudentForm onSuccess={() => setShowAddStudent(false)} onCancel={() => setShowAddStudent(false)} />
              </div>
            ) : null}
          </div>

          <BackfillCredentialsCard />

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">User Accounts</h2>
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  View the latest generated passwords and affiliation details across students and staff.
                </p>
              </div>
              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <div className="relative sm:w-64">
                  <input
                    value={accountSearch}
                    onChange={(event) => setAccountSearch(event.target.value)}
                    placeholder="Search accounts..."
                    className="w-full rounded-xl border border-slate-300 bg-white/70 px-4 py-2 text-sm text-slate-700 shadow-inner focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200 dark:focus:border-primary-400 dark:focus:ring-primary-500/40"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs uppercase text-slate-400 dark:text-slate-500">
                    {filteredAccounts.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-accounts'] })}
                  className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
                >
                  Refresh
                </button>
              </div>
            </div>
            {accountsLoading ? (
              <Loading message="Loading accounts..." />
            ) : filteredAccounts.length === 0 ? (
              <p className="text-sm text-slate-500">No accounts match your search.</p>
            ) : (
              <>
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Showing {accountRangeStart.toLocaleString()}-{accountRangeEnd.toLocaleString()} of {filteredAccounts.length.toLocaleString()} accounts
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAccountPage((prev) => Math.max(1, prev - 1))}
                      disabled={accountPage === 1}
                      className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-primary-400 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-primary-500 dark:hover:text-primary-300"
                    >
                      Previous
                    </button>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Page {accountPage} of {totalAccountPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAccountPage((prev) => Math.min(totalAccountPages, prev + 1))}
                      disabled={accountPage === totalAccountPages}
                      className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-primary-400 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-primary-500 dark:hover:text-primary-300"
                    >
                      Next
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Account</th>
                      <th className="px-4 py-3 text-left">Username</th>
                      <th className="px-4 py-3 text-left">Password</th>
                      <th className="px-4 py-3 text-left">Affiliation</th>
                      <th className="px-4 py-3 text-left">Last Reset</th>
                      <th className="px-4 py-3 text-left">Last Login</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                    <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
                    {visibleAccounts.map((acct) => {
                      const rowKey = acct.student_id
                        ? `student-${acct.student_id}`
                        : acct.faculty_id
                        ? `staff-${acct.faculty_id}`
                        : acct.username;
                      const affiliation = acct.account_type === 'student'
                        ? acct.roll_number || '—'
                        : [acct.role, acct.department].filter(Boolean).join(' • ') || '—';
                      return (
                        <tr key={rowKey} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                          <td className="px-4 py-3">
                            <div className="text-sm font-semibold text-slate-900 dark:text-white">{acct.name || acct.username}</div>
                            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{acct.account_type}</div>
                          </td>
                          <td className="px-4 py-3">
                            <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                              {acct.username}
                            </code>
                          </td>
                          <td className="px-4 py-3">
                            {acct.last_plaintext_password ? (
                              <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                                {acct.last_plaintext_password}
                              </code>
                            ) : (
                              <span className="text-xs text-slate-400">Not available</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">{affiliation}</td>
                          <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                            {acct.last_reset_on
                              ? new Date(acct.last_reset_on).toLocaleString()
                              : acct.created_on
                              ? `Created ${new Date(acct.created_on).toLocaleString()}`
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                            {acct.last_login ? new Date(acct.last_login).toLocaleString() : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => navigator.clipboard.writeText(acct.username)}
                                className="text-xs font-semibold text-primary-600 hover:underline"
                              >
                                Copy Username
                              </button>
                              {acct.last_plaintext_password ? (
                                <button
                                  type="button"
                                  onClick={() => navigator.clipboard.writeText(acct.last_plaintext_password || '')}
                                  className="text-xs font-semibold text-primary-600 hover:underline"
                                >
                                  Copy Password
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Reset Password</h2>
              <button
                type="button"
                onClick={() => {
                  setResetUsername('');
                  setResetPassword('');
                  setLastResetResult(null);
                  setResetMessage('');
                }}
                className="text-sm font-semibold text-primary-600 transition hover:text-primary-700"
              >
                Clear
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
              Reset passwords instantly or request autogenerated credentials.
            </p>
            {resetMessage && (
              <div className="mt-4 rounded-lg border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-700 dark:border-primary-700/40 dark:bg-primary-700/10 dark:text-primary-200">
                {resetMessage}
              </div>
            )}
            {lastResetResult?.password ? (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">{lastResetResult.username}</div>
                    <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {lastResetResult.account_type}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <code className="rounded bg-white px-2 py-1 text-xs text-slate-800 dark:bg-slate-900 dark:text-slate-100">
                      {lastResetResult.password}
                    </code>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(lastResetResult.password || '')}
                      className="text-xs font-semibold text-primary-600 hover:underline"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <input
                value={resetUsername}
                onChange={(event) => setResetUsername(event.target.value)}
                placeholder="Username"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <input
                type="password"
                value={resetPassword}
                onChange={(event) => setResetPassword(event.target.value)}
                placeholder="New password (optional)"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={handleReset}
                disabled={!resetUsername.trim()}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-60"
              >
                Update Password
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Passwords are hashed with BCrypt. Leave the password blank to generate a secure value automatically; the plaintext
              is only shown once above.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Data Monitor</h2>
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  Live table counts from the operational database.
                </p>
              </div>
              <button
                type="button"
                onClick={() => refetchHealth()}
                className="rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-sm font-semibold text-primary-600 transition hover:bg-primary-100 dark:border-primary-700/40 dark:bg-primary-700/10 dark:text-primary-200"
              >
                Refresh
              </button>
            </div>
            {healthLoading ? (
              <p className="text-sm text-slate-500">Loading metrics…</p>
            ) : dbHealth ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(dbHealth.tableCounts || {}).map(([name, count]) => (
                  <div
                    key={name}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {name}
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{count}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No data available.</p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Recent Activity</h2>
            {!activity || activity.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No recent events.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {activity.slice(0, 8).map((item) => (
                  <li
                    key={`${item.type}-${item.id}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {item.type}
                    </div>
                    <div className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                      {item.summary || `${item.type} #${item.id}`}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Account Events</h2>
            {!accountEvents || accountEvents.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No account events recorded.</p>
            ) : (
              <ul className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-2">
                {accountEvents.map((event) => (
                  <li
                    key={event.event_id}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <span>{event.event_type.replace(/_/g, ' ')}</span>
                      <span>{new Date(event.created_on).toLocaleString()}</span>
                    </div>
                    <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                      {event.username ? (
                        <code className="mr-2 rounded bg-white px-2 py-1 text-xs text-slate-800 dark:bg-slate-900 dark:text-slate-100">
                          {event.username}
                        </code>
                      ) : null}
                      {event.description || 'No description provided.'}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </FadeIn>
  );
};

const StatBadge: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="rounded-2xl border border-primary-500/40 bg-primary-600/30 px-4 py-3 text-center shadow-inner">
    <div className="text-[11px] font-semibold uppercase tracking-wide text-primary-100">{label}</div>
    <div className="mt-1 text-2xl font-bold text-white">{value}</div>
  </div>
);

const BackfillCredentialsCard: React.FC = () => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<
    { created: number; credentials: Array<{ student_id: number; username: string; password: string }> } | null
  >(null);

  const runBackfill = async () => {
    try {
      setRunning(true);
      const res = await axiosClient.post<ApiResponse<any>>(API_ENDPOINTS.ADMIN_BACKFILL_STUDENT_AUTH);
      if (res.data.success) {
        const data = res.data.data as any;
        setResult({ created: data.created || 0, credentials: data.credentials || [] });
        addToast(`Backfill complete. Created ${data.created || 0} accounts.`, 'success');
        queryClient.invalidateQueries({ queryKey: ['admin-accounts'] });
        queryClient.invalidateQueries({ queryKey: ['admin-account-events'] });
      } else {
        addToast(res.data.message || 'Backfill failed', 'error');
      }
    } catch (err: any) {
      addToast(err.message || 'Backfill failed', 'error');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Backfill Student Credentials</h2>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            Generate missing auth records for existing students and capture their credentials once.
          </p>
        </div>
        <button
          type="button"
          onClick={runBackfill}
          disabled={running}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-60"
        >
          {running ? 'Running…' : 'Run Backfill'}
        </button>
      </div>
      {result && (
        <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-200">
          <p>
            Created <strong>{result.created}</strong> new credential{result.created === 1 ? '' : 's'}. Copy the generated values now—they
            are only displayed once.
          </p>
          {result.credentials.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-2 text-left">Student ID</th>
                    <th className="px-4 py-2 text-left">Username</th>
                    <th className="px-4 py-2 text-left">Password</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
                  {result.credentials.map((cred) => (
                    <tr key={`${cred.student_id}-${cred.username}`} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                      <td className="px-4 py-2 font-mono text-xs text-slate-600 dark:text-slate-300">{cred.student_id}</td>
                      <td className="px-4 py-2">
                        <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                          {cred.username}
                        </code>
                      </td>
                      <td className="px-4 py-2">
                        <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                          {cred.password}
                        </code>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(`${cred.username}`)}
                            className="text-xs font-semibold text-primary-600 hover:underline"
                          >
                            Copy Username
                          </button>
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(`${cred.password}`)}
                            className="text-xs font-semibold text-primary-600 hover:underline"
                          >
                            Copy Password
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
