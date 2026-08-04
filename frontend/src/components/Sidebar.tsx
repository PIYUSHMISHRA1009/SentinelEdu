/**
 * Sidebar navigation component
 * Provides role-based navigation menu
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  HomeIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentCheckIcon,
  ChatBubbleBottomCenterTextIcon,
  CogIcon,
  LifebuoyIcon,
  EnvelopeOpenIcon,
  WrenchScrewdriverIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles?: string[];
}

const staffNav: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
  { name: 'Students', path: '/students', icon: UsersIcon },
  { name: 'Risk Panel', path: '/risk', icon: ExclamationTriangleIcon },
  { name: 'Interventions', path: '/interventions', icon: ClipboardDocumentCheckIcon },
  { name: 'Messages', path: '/messages', icon: EnvelopeOpenIcon },
  { name: 'Feedback', path: '/feedback', icon: ChatBubbleBottomCenterTextIcon },
  { name: 'Support', path: '/support', icon: LifebuoyIcon },
  { name: 'Reports', path: '/reports', icon: ClipboardDocumentCheckIcon, allowedRoles: ['academic_head', 'faculty'] },
  { name: 'Admin', path: '/admin', icon: CogIcon, allowedRoles: ['academic_head', 'it'] },
];

const itNavExtras: NavItem[] = [
  { name: 'IT Console', path: '/it/operations', icon: WrenchScrewdriverIcon, allowedRoles: ['it'] },
  { name: 'IT Support', path: '/it/support', icon: ShieldCheckIcon, allowedRoles: ['it'] },
];

const studentNav: NavItem[] = [
  { name: 'My Dashboard', path: '/student', icon: HomeIcon },
  { name: 'Feedback', path: '/feedback', icon: ChatBubbleBottomCenterTextIcon },
  { name: 'Messages', path: '/messages', icon: EnvelopeOpenIcon },
  { name: 'Support', path: '/support', icon: LifebuoyIcon },
];

export const Sidebar: React.FC = () => {
  const { role } = useAuth();

  const baseItems = role === 'student' ? studentNav : staffNav;
  let filteredItems = baseItems.filter((item) => !item.allowedRoles || item.allowedRoles.includes(role || ''));
  if (role === 'it') {
    filteredItems = filteredItems.filter((item) => item.name !== 'Feedback' && item.name !== 'Support');
    const extras = itNavExtras.filter((item) => !item.allowedRoles || item.allowedRoles.includes(role));
    filteredItems = [...filteredItems, ...extras];
  }

  return (
  <aside className="hidden lg:sticky lg:top-20 lg:flex lg:w-72 xl:w-80 flex-shrink-0 flex-col border-r border-slate-200/60 bg-gradient-to-b from-white via-slate-50 to-slate-100/80 shadow-lg shadow-slate-200/40 transition-colors duration-200 dark:border-slate-800/60 dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:shadow-none">
      <div className="flex-1 overflow-y-auto pb-16 pt-10">
        <div className="px-6 pb-6 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">Navigation</div>
        <nav className="space-y-1 px-4">
          {filteredItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all border-l-4 ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30 dark:bg-slate-800 dark:text-white dark:shadow-none dark:ring-1 dark:ring-mint-500/30 border-primary-600'
                    : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white border-transparent'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
};
