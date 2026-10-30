/**
 * Login page component
 * Provides authentication form with role-based login
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from './AuthProvider';
import axiosClient from '@/api/axiosClient';
import { API_ENDPOINTS } from '@/api/endpoints';
import type { ApiResponse, LoginRequest, LoginResponse } from '@/api/types';
import { FadeIn } from '@/components/Motion/FadeIn';
import { AnimatedGradient } from '@/components/Motion/AnimatedGradient';
import { GlassCard } from '@/components/Motion/GlassCard';
import { MagneticButton } from '@/components/Motion/MagneticButton';
import { AcademicCapIcon, ChartBarIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Login page with form validation and error handling
 */
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [apiStatus, setApiStatus] = useState<'checking' | 'ok' | 'fail'>('checking');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Lightweight API connectivity check to surface base URL issues early
  useEffect(() => {
    if (process.env.NODE_ENV === 'test') {
      setApiStatus('ok');
      return;
    }
    axiosClient
      .get(API_ENDPOINTS.HEALTH)
      .then(() => setApiStatus('ok'))
      .catch(() => setApiStatus('fail'));
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await axiosClient.post<ApiResponse<LoginResponse>>(
        API_ENDPOINTS.LOGIN,
        data as LoginRequest
      );

      // Check if response is successful
      if (response.data.success && response.data.data) {
        const { token, role, user } = response.data.data;

        // Convert user object if needed
        const userObj: any = typeof user === 'object' ? user : { username: data.username };

        login(token, userObj, role as any);

        // Force navigation after a brief delay to ensure state updates
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 100);
      } else {
        setErrorMessage(response.data.message || 'Login failed. Please check your credentials.');
      }
    } catch (error: any) {
      console.error('Login error:', error);

      // Better error handling
      if (error.response) {
        // Server responded with error status
        const errorMsg =
          error.response.data?.message || error.response.data?.error || 'Invalid credentials';
        setErrorMessage(errorMsg);
      } else if (error.request) {
        // Request made but no response
        const base = axiosClient.defaults.baseURL || 'http://localhost:8081/api';
        setErrorMessage(
          `Cannot connect to server at ${base}. Please ensure the backend is running and reachable.`
        );
      } else {
        // Other errors
        setErrorMessage(error.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Quick login helper for demo
  const quickLogin = (username: string, password: string) => {
    if (isLoading) return;
    const payload: LoginFormData = { username, password };
    setValue('username', username, { shouldDirty: true, shouldValidate: true });
    setValue('password', password, { shouldDirty: true, shouldValidate: true });
    void onSubmit(payload);
  };

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <AnimatedGradient />

      {/* Floating decoration elements */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>

      <FadeIn className="w-full max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left: Login Form */}
          <div className="order-2 lg:order-1">
            <GlassCard intensity="medium" className="p-8 lg:p-10">
              <div className="mb-8">
                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3">Welcome back</h1>
                <p className="text-gray-300 text-lg">Sign in to access your dashboard</p>
              </div>

              {errorMessage && (
                <div
                  className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm backdrop-blur-sm"
                  role="alert"
                >
                  {errorMessage}
                </div>
              )}

              {apiStatus === 'fail' && (
                <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/40 rounded-xl text-yellow-200 text-sm">
                  Cannot reach API at{' '}
                  <span className="font-mono">{axiosClient.defaults.baseURL || 'N/A'}</span>. Ensure
                  the backend is running and VITE_API_BASE_URL matches your server (e.g.,
                  http://localhost:8080/api). If you use a different port/host, create{' '}
                  <span className="font-mono">frontend/.env.development.local</span> with{' '}
                  <span className="font-mono">VITE_API_BASE_URL</span>.
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label
                    htmlFor="username"
                    className="text-sm font-medium text-gray-200 block mb-2"
                  >
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    className={`w-full rounded-xl bg-navy-900/50 border ${
                      errors.username ? 'border-red-500' : 'border-gray-700'
                    } px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-mint-500 focus:border-mint-500 outline-none transition-all backdrop-blur-sm`}
                    placeholder="Enter your username"
                    {...register('username')}
                    autoComplete="username"
                  />
                  {errors.username && (
                    <p className="text-xs text-red-400 mt-2">{errors.username.message}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-200 block mb-2"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    className={`w-full rounded-xl bg-navy-900/50 border ${
                      errors.password ? 'border-red-500' : 'border-gray-700'
                    } px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-mint-500 focus:border-mint-500 outline-none transition-all backdrop-blur-sm`}
                    placeholder="Enter your password"
                    {...register('password')}
                    autoComplete="current-password"
                  />
                  {errors.password && (
                    <p className="text-xs text-red-400 mt-2">{errors.password.message}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center text-sm text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-2 rounded border-gray-600 text-mint-500 focus:ring-mint-500"
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-sm text-mint-400 hover:text-mint-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                <MagneticButton
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-mint-500 to-cyan-500 text-white font-bold text-lg hover:shadow-xl hover:shadow-mint-500/30 disabled:opacity-60 transition-all"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </MagneticButton>
              </form>

              <div className="mt-8 pt-8 border-t border-gray-700/50">
                <p className="text-sm text-gray-400 text-center mb-4">Quick demo access</p>
                <div className="grid grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => quickLogin('faculty', 'faculty123')}
                    className="px-4 py-3 text-sm font-medium bg-navy-800/50 hover:bg-navy-800 text-gray-200 rounded-lg transition-all border border-gray-700 hover:border-mint-500"
                  >
                    👨‍🏫 Faculty
                  </button>
                  <button
                    type="button"
                    onClick={() => quickLogin('admin', 'admin123')}
                    className="px-4 py-3 text-sm font-medium bg-navy-800/50 hover:bg-navy-800 text-gray-200 rounded-lg transition-all border border-gray-700 hover:border-mint-500"
                  >
                    👔 Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => quickLogin('it', 'it123')}
                    className="px-4 py-3 text-sm font-medium bg-navy-800/50 hover:bg-navy-800 text-gray-200 rounded-lg transition-all border border-gray-700 hover:border-mint-500"
                  >
                    💻 IT
                  </button>
                  <button
                    type="button"
                    onClick={() => quickLogin('student', 'student123')}
                    className="px-4 py-3 text-sm font-medium bg-navy-800/50 hover:bg-navy-800 text-gray-200 rounded-lg transition-all border border-gray-700 hover:border-mint-500"
                  >
                    🎓 Student
                  </button>
                </div>
              </div>

              <div className="mt-8 text-center text-xs text-gray-500 space-y-2">
                <p>
                  Questions before you sign in?{' '}
                  <Link to="/contact" className="text-mint-400 hover:text-mint-300 font-medium">
                    Contact us
                  </Link>
                </p>
                <p>
                  By continuing you agree to our{' '}
                  <Link to="/terms" className="text-mint-400 hover:text-mint-300 font-medium">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-mint-400 hover:text-mint-300 font-medium">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>

              <p className="text-center text-xs text-gray-500 mt-8">
                InsightFlow EDU © 2025 • DBMS + SE Mini Project
              </p>
            </GlassCard>
          </div>

          {/* Right: Hero Content */}
          <div className="order-1 lg:order-2 text-white">
            <div className="space-y-8">
              <div>
                <h2 className="text-5xl lg:text-6xl font-extrabold mb-4 leading-tight">
                  Track student success
                  <br />
                  <span className="bg-gradient-to-r from-mint-400 to-cyan-400 bg-clip-text text-transparent">
                    with confidence
                  </span>
                </h2>
                <p className="text-xl text-gray-300 leading-relaxed">
                  Analytics, risk detection, and intervention tracking for educational excellence.
                </p>
              </div>

              {/* Feature highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-all">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-3">
                    <UserGroupIcon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">Student Tracking</h3>
                  <p className="text-sm text-gray-400">Monitor performance in real-time</p>
                </div>

                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-all">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-3">
                    <ChartBarIcon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">Risk Detection</h3>
                  <p className="text-sm text-gray-400">Early warning indicators</p>
                </div>

                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-all">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center mb-3">
                    <AcademicCapIcon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">Interventions</h3>
                  <p className="text-sm text-gray-400">Targeted support plans</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-4">
                <div>
                  <div className="text-4xl font-bold text-mint-400 mb-1">1,200+</div>
                  <div className="text-sm text-gray-400">Active Students</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-cyan-400 mb-1">95%</div>
                  <div className="text-sm text-gray-400">Success Rate</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-purple-400 mb-1">24/7</div>
                  <div className="text-sm text-gray-400">Monitoring</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
};
