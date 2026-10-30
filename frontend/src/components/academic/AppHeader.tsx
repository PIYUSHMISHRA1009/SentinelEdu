import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { User } from '../../types';

interface AppHeaderProps {
  user: User | null;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    api.clearToken();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `font-sans text-xs md:text-sm font-medium py-4 px-3 border-b-2 transition-all duration-150 whitespace-nowrap ${
      isActive
        ? 'border-slate-900 text-slate-950 font-semibold'
        : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
    }`;

  const roleLabel = isAdmin
    ? 'INSTITUTIONAL GOVERNANCE'
    : isTeacher
      ? 'FACULTY ADVISOR WORKSPACE'
      : 'STUDENT PORTAL';

  return (
    <header className="bg-white border-b border-stone-200/90 shadow-xs sticky top-0 z-40">
      {/* Top Academic Strip */}
      <div className="bg-slate-950 text-slate-300 px-4 sm:px-6 lg:px-8 py-1.5 text-[11px] font-mono flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="tracking-widest uppercase text-slate-200">
            SENTINELEDU ACADEMIC INTELLIGENCE PLATFORM
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-slate-400">
          <span>{roleLabel}</span>
          <span>•</span>
          <span>UNIVERSITY ANALYTICS SYSTEM</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Branding */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 bg-slate-950 text-white rounded flex items-center justify-center font-serif font-bold text-xl tracking-tighter border border-slate-800 shadow-xs">
                S
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-lg font-bold tracking-tight text-slate-950 leading-none">
                  SentinelEdu
                </span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500 mt-0.5">
                  Academic Intelligence
                </span>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1 ml-4 border-l border-stone-200 pl-6 h-16">
              {isAdmin && (
                <>
                  <NavLink to="/admin" className={linkClass}>
                    Institutional Performance
                  </NavLink>
                  <NavLink to="/dashboard" className={linkClass}>
                    Risk Matrix
                  </NavLink>
                  <NavLink to="/data-quality" className={linkClass}>
                    Data Quality Audit
                  </NavLink>
                </>
              )}
              {isTeacher && (
                <>
                  <NavLink to="/faculty" className={linkClass}>
                    My Students & Courses
                  </NavLink>
                  <NavLink to="/dashboard" className={linkClass}>
                    Risk Matrix
                  </NavLink>
                  <NavLink to="/data-quality" className={linkClass}>
                    Data Quality Audit
                  </NavLink>
                </>
              )}
              {isStudent && (
                <NavLink to="/student" className={linkClass}>
                  My Academic Profile
                </NavLink>
              )}
            </nav>
          </div>

          {/* User Profile & Action */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="font-sans text-xs font-semibold text-slate-900">
                    {user.full_name}
                  </div>
                  <div className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">
                    {user.department || user.role}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="font-mono text-xs text-slate-700 hover:text-slate-950 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded border border-stone-300 transition-colors font-medium"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden border-t border-stone-200 py-2 flex overflow-x-auto space-x-2">
          {isAdmin && (
            <>
              <NavLink to="/admin" className={linkClass}>
                Institutional
              </NavLink>
              <NavLink to="/dashboard" className={linkClass}>
                Risk Matrix
              </NavLink>
              <NavLink to="/data-quality" className={linkClass}>
                Data Quality
              </NavLink>
            </>
          )}
          {isTeacher && (
            <>
              <NavLink to="/faculty" className={linkClass}>
                My Students
              </NavLink>
              <NavLink to="/dashboard" className={linkClass}>
                Risk Matrix
              </NavLink>
              <NavLink to="/data-quality" className={linkClass}>
                Data Quality
              </NavLink>
            </>
          )}
          {isStudent && (
            <NavLink to="/student" className={linkClass}>
              My Profile
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
};
