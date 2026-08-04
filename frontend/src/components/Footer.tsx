import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-12 border-t border-slate-200/70 bg-white/95 transition-colors duration-200 dark:border-slate-800/60 dark:bg-slate-950/85">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
        <div className="shrink-0">© {new Date().getFullYear()} InsightFlow EDU. All rights reserved.</div>
        <div className="flex items-center gap-6">
          <Link className="font-medium transition hover:text-primary-600 dark:hover:text-primary-300" to="/privacy">Privacy</Link>
          <Link className="font-medium transition hover:text-primary-600 dark:hover:text-primary-300" to="/terms">Terms</Link>
          <Link className="font-medium transition hover:text-primary-600 dark:hover:text-primary-300" to="/contact">Contact</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
