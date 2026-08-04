import { useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { User } from '../types';

const ProtectedRoute: React.FC<{ allowedRoles?: ('admin' | 'teacher' | 'student')[] }> = ({ 
  allowedRoles, 
  children 
}) => {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.getMe(),
    retry: false,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
  const location = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (error && !isLoading) {
      queryClient.clear();
      api.clearToken();
    }
  }, [error, isLoading, queryClient]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

const Layout: React.FC = () => {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api.getMe(),
    staleTime: 1000 * 60 * 30,
  });

  const queryClient = useQueryClient();

  const handleLogout = () => {
    api.clearToken();
    queryClient.clear();
  };

  if (!user) return null;

  const navItems = [
    { path: '/dashboard', label: 'Risk Dashboard', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )},
    { path: '/classes', label: 'Classes', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    )},
  ];

  // Students only see dashboard
  const filteredNav = user.role === 'student' 
    ? navItems.filter(item => item.path === '/dashboard')
    : navItems;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900">InsightFlow Edu</h1>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {filteredNav.map(item => (
                <a
                  key={item.path}
                  href={item.path}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  {item.icon}
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

const PublicLayout: React.FC = () => (
  <Outlet />
);

export { ProtectedRoute, Layout, PublicLayout };
export default Layout;