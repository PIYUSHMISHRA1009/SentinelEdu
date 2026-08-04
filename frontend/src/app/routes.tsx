/**
 * Application routes configuration
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { HomePage } from '@/features/home/HomePage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { StudentsListPage } from '@/features/students/StudentsListPage';
import { StudentProfilePage } from '@/features/students/StudentProfilePage';
import { RiskPanelPage } from '@/features/risk/RiskPanelPage';
import { InterventionsPage } from '@/features/interventions/InterventionsPage';
import { FeedbackPage } from '@/features/feedback/FeedbackPage';
import { AdminPage } from '@/features/admin/AdminPage';
import { ChangePasswordPage } from '@/features/auth/ChangePasswordPage';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { PrivacyPage } from '@/features/static/PrivacyPage';
import { TermsPage } from '@/features/static/TermsPage';
import { ContactPage } from '@/features/static/ContactPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import Layout from '@/components/Layout';
import { SupportPage } from '@/features/support/SupportPage';
import { SupportDetailPage } from '@/features/support/SupportDetailPage';
import { useAuth } from '@/features/auth/AuthProvider';
import { StudentDashboardPage } from '@/features/student/StudentDashboardPage';
import { MessagesPage } from '@/features/messages/MessagesPage';
import { ItOperationsPage } from '@/features/it/ItOperationsPage';
import { ItSupportPage } from '@/features/it/ItSupportPage';

const AppLayout = Layout;

const UnauthorizedPage: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-950">
    <div className="card max-w-md text-center">
      <h1 className="mb-2 text-2xl font-bold text-danger-600">Access Denied</h1>
      <p className="text-gray-600 dark:text-slate-300">You don't have permission to access this page.</p>
    </div>
  </div>
);

export const AppRoutes: React.FC = () => {
  const StudentOrStaffDashboard: React.FC = () => {
    const { role } = useAuth();
    if (role === 'student') return <Navigate to="/student" replace />;
    return (
      <ProtectedRoute>
        <AppLayout>
          <DashboardPage />
        </AppLayout>
      </ProtectedRoute>
    );
  };
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
  <Route path="/privacy" element={<AppLayout><PrivacyPage /></AppLayout>} />
  <Route path="/terms" element={<AppLayout><TermsPage /></AppLayout>} />
  <Route path="/contact" element={<AppLayout><ContactPage /></AppLayout>} />
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ChangePasswordPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ProfilePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route path="/dashboard" element={<StudentOrStaffDashboard />} />

      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <AppLayout>
              <StudentDashboardPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/students"
        element={
          <ProtectedRoute allowedRoles={['academic_head','faculty','it']}>
            <AppLayout>
              <StudentsListPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/students/:id"
        element={
          <ProtectedRoute allowedRoles={['academic_head','faculty','it']}>
            <AppLayout>
              <StudentProfilePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/risk"
        element={
          <ProtectedRoute allowedRoles={['academic_head','faculty','it']}>
            <AppLayout>
              <RiskPanelPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/interventions"
        element={
          <ProtectedRoute allowedRoles={['academic_head','faculty','it']}>
            <AppLayout>
              <InterventionsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/feedback"
        element={
          <ProtectedRoute>
            <AppLayout>
              <FeedbackPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <AppLayout>
              <MessagesPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/support"
        element={
          <ProtectedRoute allowedRoles={['academic_head','faculty','student']}>
            <AppLayout>
              <SupportPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/it/operations"
        element={
          <ProtectedRoute allowedRoles={['it']}>
            <AppLayout>
              <ItOperationsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/it/support"
        element={
          <ProtectedRoute allowedRoles={['it']}>
            <AppLayout>
              <ItSupportPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/support/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SupportDetailPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute allowedRoles={['academic_head', 'faculty']}>
            <AppLayout>
              <ReportsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['academic_head', 'it']}>
            <AppLayout>
              <AdminPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
