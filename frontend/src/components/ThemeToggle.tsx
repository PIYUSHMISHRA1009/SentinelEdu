import React from 'react';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { useTheme } from '@/components/ThemeProvider';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
  className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-400 focus-visible:ring-offset-0 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <SunIcon
        className={`h-5 w-5 transition-opacity ${isDark ? 'opacity-0 -rotate-90' : 'opacity-100 rotate-0'}`}
        aria-hidden={isDark}
      />
      <MoonIcon
        className={`absolute h-5 w-5 transition-opacity ${isDark ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'}`}
        aria-hidden={!isDark}
      />
    </button>
  );
};
