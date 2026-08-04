import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute, Layout, PublicLayout } from './components/Layout';
import Login from './pages/Login';
import RiskDashboard from './components/RiskDashboard';
import queryClient from './queryClient';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/login" element={<Login />} />
          </Route>
          
          <Route element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<RiskDashboard />} />
            <Route path="/classes" element={<div className="p-4">Classes Page - Coming Soon</div>} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;