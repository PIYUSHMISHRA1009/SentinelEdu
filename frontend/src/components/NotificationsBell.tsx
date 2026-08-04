import React from 'react';
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline';

export type NotificationItem = { id: number; text: string; ts?: number };

export const NotificationsBell: React.FC<{
  items: NotificationItem[];
  onClear?: () => void;
}> = ({ items, onClear }) => {
  const [open, setOpen] = React.useState(false);
  const unread = items.length;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-md p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
      >
        <BellIcon className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded-full bg-red-600 text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg transition dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-slate-700">
            <div className="text-sm font-semibold text-gray-800 dark:text-slate-100">Notifications</div>
            <button onClick={() => { onClear?.(); setOpen(false); }} className="flex items-center gap-1 text-xs text-gray-500 transition hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200">
              <XMarkIcon className="w-4 h-4" /> Clear
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500 dark:text-slate-400">No notifications</div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-slate-800">
                {items.map(n => (
                  <li key={n.id} className="flex items-center justify-between px-3 py-2 text-sm text-gray-800 dark:text-slate-100">
                    <span>{n.text}</span>
                    {n.ts && <span className="ml-2 text-xs text-gray-400 dark:text-slate-400">{new Date(n.ts).toLocaleTimeString()}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
