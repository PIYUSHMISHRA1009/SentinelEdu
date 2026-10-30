import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import api from './api/client';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import StudentDashboard from './pages/StudentDashboard';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import RiskDashboard from './components/RiskDashboard';
import DataQualityPage from './pages/DataQualityPage';
import { AppHeader } from './components/academic/AppHeader';
import { User } from './types';

const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!api.isAuthenticated()) {
      setLoading(false);
      return;
    }
    api
      .getMe()
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        api.clearToken();
        setLoading(false);
      });
  }, []);

  if (!api.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#faf9f6]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900 mb-3" />
        <span className="font-mono text-xs text-slate-500 uppercase tracking-wider">
          Initializing Academic Workspace...
        </span>
      </div>
    );
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    if (user.role === 'student') return <Navigate to="/student" replace />;
    if (user.role === 'teacher') return <Navigate to="/faculty" replace />;
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

const RoleBasedHomeRedirect = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (api.isAuthenticated()) {
      api
        .getMe()
        .then((data) => {
          setUser(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#faf9f6]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900 mb-3" />
        <span className="font-mono text-xs text-slate-500 uppercase tracking-wider">
          Resolving Role Destination...
        </span>
      </div>
    );
  }

  if (user?.role === 'student') return <Navigate to="/student" replace />;
  if (user?.role === 'teacher') return <Navigate to="/faculty" replace />;
  return <Navigate to="/admin" replace />;
};

const Layout = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (api.isAuthenticated()) {
      api
        .getMe()
        .then((data) => setUser(data))
        .catch(() => {
          api.clearToken();
          navigate('/login');
        });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col font-sans">
      <AppHeader user={user} />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <FacultyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                <RiskDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/data-quality"
            element={
              <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                <DataQualityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                <AnalyticsDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<RoleBasedHomeRedirect />} />
        </Route>

        <Route path="*" element={<RoleBasedHomeRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
