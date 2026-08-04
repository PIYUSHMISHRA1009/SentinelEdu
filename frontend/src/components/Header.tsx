/**
 * Application header component
 * Shows different UI based on authentication state
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthProvider';
import { UserCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useMutation, useQuery } from '@tanstack/react-query';
import axiosClient from '@/api/axiosClient';
import { API_ENDPOINTS } from '@/api/endpoints';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import { NotificationsBell, type NotificationItem } from '@/components/NotificationsBell';
import { ThemeToggle } from '@/components/ThemeToggle';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, role, logout } = useAuth();
  const username = user?.username;
  const { addToast } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const { data: riskSummary } = useQuery({
    queryKey: ['risk-summary'],
    queryFn: async () => {
      const res = await axiosClient.get<{ success: boolean; data: { flaggedCount: number } }>(API_ENDPOINTS.DASHBOARD_RISK_SUMMARY.replace('/dashboard','/risk'));
      return res.data.data;
    },
    enabled: isAuthenticated && (role === 'faculty' || role === 'academic_head'),
    refetchInterval: 30000,
  });

  const navButtonClass = 'rounded-full border border-transparent px-3 py-1 text-xs font-semibold tracking-wide text-slate-600 transition hover:border-primary-500 hover:bg-primary-50 hover:text-primary-600 dark:text-slate-200 dark:hover:border-primary-400 dark:hover:bg-slate-800 dark:hover:text-white';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Optional SSE for realtime risk alerts
  const prevFlagged = useRef<number | null>(null);
  useEffect(() => {
    if (!isAuthenticated || !(role === 'faculty' || role === 'academic_head')) return;
    const base = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8080/api';
    let es: EventSource | null = null;
    try {
      es = new EventSource(`${base}/risk/stream`);
      es.addEventListener('risk-summary', (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data) as { flaggedCount?: number };
          const nextCount = payload.flaggedCount ?? 0;
          if (prevFlagged.current != null && nextCount > prevFlagged.current) {
            const increment = nextCount - (prevFlagged.current || 0);
            addToast(`New risk alerts detected (${increment}).`, 'warning');
            setNotifications((prev) => [{ id: Date.now(), text: `Risk alerts increased by ${increment}`, ts: Date.now() }, ...prev].slice(0, 20));
          }
          prevFlagged.current = nextCount;
        } catch (parseError) {
          console.warn('Unable to parse risk summary event payload', parseError);
        }
      });
    } catch (streamError) {
      console.warn('Unable to subscribe to risk summary events', streamError);
    }
    return () => {
      es?.close();
    };
  }, [addToast, isAuthenticated, role]);

  // Notifications polling for all roles
  const { data: notifData } = useQuery({
    queryKey: ['notifications', username],
    queryFn: async () => {
      const res = await axiosClient.get<{ success: boolean; data: any[] }>(API_ENDPOINTS.NOTIFICATIONS);
      return res.data.data || [];
    },
    enabled: isAuthenticated,
    refetchInterval: 20000,
  });

  // Persist seen notification IDs per user to avoid duplicate toasts on refresh
  const lastIdsRef = useRef<Set<number>>(new Set());
  const dismissedIdsRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    if (!isAuthenticated || !username) return;
    try {
      const raw = localStorage.getItem(`notif_seen:${username}`);
      if (raw) {
        const arr = JSON.parse(raw) as number[];
        lastIdsRef.current = new Set(arr);
      }
      const dismissedRaw = localStorage.getItem(`notif_dismissed:${username}`);
      if (dismissedRaw) {
        const arr = JSON.parse(dismissedRaw) as number[];
        dismissedIdsRef.current = new Set(arr);
      }
    } catch (hydrateError) {
      console.warn('Failed to restore notification cache from storage', hydrateError);
    }
  }, [isAuthenticated, username]);
  useEffect(() => {
    if (!notifData) return;
    const mapped: NotificationItem[] = notifData.map((n: any) => ({ id: n.notification_id, text: n.title || n.message, ts: n.created_on ? Date.parse(n.created_on) : undefined }));
    // Detect new notifications and show toasts only once per ID (persisted)
    const seen = lastIdsRef.current;
    const dismissed = dismissedIdsRef.current;
    const unseen = mapped.filter(m => !seen.has(m.id) && !dismissed.has(m.id));
    unseen.forEach(m => addToast(m.text || 'New notification', 'info'));
    // Update seen set and persist (cap to recent 200 ids)
    const allIds = Array.from(new Set([...Array.from(seen), ...mapped.map(m => m.id)]));
    const capped = allIds.slice(-200);
    lastIdsRef.current = new Set(capped);
    try {
      if (username) localStorage.setItem(`notif_seen:${username}`, JSON.stringify(capped));
    } catch (persistError) {
      console.warn('Failed to persist seen notification ids', persistError);
    }
    const filtered = mapped.filter(m => !dismissed.has(m.id));
    setNotifications(filtered);
  }, [notifData, addToast, username]);

  const markRead = useMutation({
    mutationFn: async (id: number) => {
      await axiosClient.post(API_ENDPOINTS.NOTIFICATION_MARK_READ(id));
    },
  });

  const initials = useMemo(() => {
    const base = user?.name || user?.username;
    if (!base) return '';
    const parts = base.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [user]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/95 shadow-sm backdrop-blur-lg transition-colors duration-200 dark:border-slate-800/60 dark:bg-slate-950/80">
      <div className="flex w-full items-center gap-4 px-6 py-3 sm:px-8 lg:px-12">
        {/* Logo */}
        <div className="flex flex-1 items-center gap-3">
          <div
            className="flex cursor-pointer items-center gap-3 rounded-full bg-white/70 px-3 py-1.5 shadow-sm ring-1 ring-slate-200/60 transition hover:shadow-md dark:bg-slate-900/60 dark:ring-white/5"
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
          >
            <img src="/logo.png" alt="InsightFlow EDU" className="h-10 w-10 object-contain" />
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">InsightFlow EDU</span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-300">Student Analytics</span>
            </div>
          </div>

          {/* Navigation - compact menu for smaller breakpoints */}
          {isAuthenticated ? (
            <nav className="ml-4 flex items-center gap-3 text-xs font-semibold uppercase text-slate-500 lg:hidden dark:text-slate-300">
              <button
                onClick={() => navigate(role === 'student' ? '/student' : '/dashboard')}
                className={navButtonClass}
              >
                {role === 'student' ? 'My Dashboard' : 'Dashboard'}
              </button>
              {role !== 'student' && (
                <>
                  <button onClick={() => navigate('/students')} className={navButtonClass}>
                    Students
                  </button>
                  <button onClick={() => navigate('/risk')} className={navButtonClass}>
                    <span className="relative inline-flex items-center">
                      Risk
                      {riskSummary?.flaggedCount ? (
                        <span className="ml-2 inline-flex items-center justify-center rounded-full bg-danger-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                          {riskSummary.flaggedCount}
                        </span>
                      ) : null}
                    </span>
                  </button>
                  <button onClick={() => navigate('/interventions')} className={navButtonClass}>
                    Interventions
                  </button>
                  <button onClick={() => navigate('/messages')} className={navButtonClass}>
                    Messages
                  </button>
                </>
              )}
              {role !== 'it' && (
                <button onClick={() => navigate('/feedback')} className={navButtonClass}>
                  Feedback
                </button>
              )}
              {(role === 'academic_head' || role === 'it') && (
                <button onClick={() => navigate('/admin')} className={navButtonClass}>
                  Admin
                </button>
              )}
              {role === 'it' && (
                <>
                  <button onClick={() => navigate('/it/operations')} className={navButtonClass}>
                    IT Console
                  </button>
                  <button onClick={() => navigate('/it/support')} className={navButtonClass}>
                    IT Support
                  </button>
                </>
              )}
              {(role === 'academic_head' || role === 'faculty') && (
                <button onClick={() => navigate('/reports')} className={navButtonClass}>
                  Reports
                </button>
              )}
            </nav>
          ) : null}
        </div>

        {/* Auth Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <div className="hidden items-center gap-2 rounded-full border border-slate-200/70 bg-white/60 px-3 py-1 text-slate-700 backdrop-blur-sm dark:border-white/10 dark:bg-white/10 dark:text-slate-200 sm:flex">
                <UserCircleIcon className="h-5 w-5 text-slate-500 dark:text-gray-300" />
                <span className="text-sm font-medium text-slate-800 dark:text-gray-100">{user?.name || user?.username}</span>
                <span className="text-[11px] text-slate-500 dark:text-gray-400">{role}</span>
              </div>
              <NotificationsBell
                items={notifications}
                onClear={() => {
                  try {
                    if (username) {
                      const clearedIds = notifications.map((n) => n.id);
                      clearedIds.forEach((id) => dismissedIdsRef.current.add(id));
                      const dismissedToStore = Array.from(dismissedIdsRef.current).slice(-200);
                      dismissedIdsRef.current = new Set(dismissedToStore);
                      const seenUnion = Array.from(new Set([...Array.from(lastIdsRef.current), ...clearedIds])).slice(-200);
                      lastIdsRef.current = new Set(seenUnion);
                      localStorage.setItem(`notif_seen:${username}`, JSON.stringify(seenUnion));
                      localStorage.setItem(`notif_dismissed:${username}`, JSON.stringify(dismissedToStore));
                    }
                  } catch (clearError) {
                    console.warn('Failed to update stored notification state', clearError);
                  }
                  notifications.slice(0, 50).forEach((n) => markRead.mutate(n.id));
                  setNotifications([]);
                }}
              />
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-800 transition hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-mint-500 to-cyan-500 text-xs font-bold text-white shadow-sm">
                  {initials || 'ME'}
                </span>
                <span>Profile</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 rounded-md bg-red-500/10 px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-500/20 dark:text-red-400"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="rounded-md px-4 py-2 text-sm text-slate-600 transition hover:text-slate-900 dark:text-gray-300 dark:hover:text-white"
              >
                Log in
              </button>
              <button
                onClick={() => navigate('/login')}
                className="rounded-md bg-gradient-to-r from-mint-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:shadow-lg"
              >
                Get started
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
