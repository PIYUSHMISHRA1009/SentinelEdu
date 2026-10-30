import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import api from '../api/client';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const from = (location.state as { from?: Location })?.from?.pathname;

  const loginMutation = useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      api.login(credentials.email, credentials.password),
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data.user);
      const target =
        from ||
        (data.user.role === 'student'
          ? '/student'
          : data.user.role === 'teacher'
            ? '/faculty'
            : '/admin');
      navigate(target, { replace: true });
    },
    onError: (err: AxiosError<{ detail?: string }>) => {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate({ email, password });
  };

  const setDemoUser = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md space-y-4 text-center">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded bg-slate-950 text-white font-serif font-bold text-2xl tracking-tighter shadow-md">
          S
        </div>
        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500 block">
            ACADEMIC INTELLIGENCE PLATFORM
          </span>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-slate-950 mt-1">
            SentinelEdu Login
          </h1>
          <p className="text-xs text-slate-600 font-sans mt-1">
            Sign in to access your role-based academic decision support workspace.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-stone-200/90 rounded-xl p-8 shadow-xs space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs font-mono text-rose-900">
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-700 font-semibold mb-1.5">
                University Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@university.edu"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded text-xs font-sans focus:outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-700 font-semibold">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="font-mono text-[10px] text-slate-500 hover:text-slate-900"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded text-xs font-sans focus:outline-none focus:border-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-mono text-xs font-semibold uppercase tracking-wider rounded shadow-xs transition-colors border border-slate-900"
            >
              {loginMutation.isPending ? 'Authenticating...' : 'Sign In to Workspace →'}
            </button>
          </form>

          {/* Quick Fill Demo Credentials */}
          <div className="pt-5 border-t border-stone-100 space-y-3">
            <span className="font-mono text-[10px] uppercase text-slate-400 font-semibold tracking-wider block text-center">
              Quick Fill Demo Accounts
            </span>
            <div className="grid grid-cols-3 gap-2 font-mono text-[10px]">
              <button
                type="button"
                onClick={() => setDemoUser('admin@university.edu', 'admin123')}
                className="p-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded text-slate-800 font-semibold text-center transition-colors"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setDemoUser('priya.sharma@university.edu', 'faculty123')}
                className="p-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded text-slate-800 font-semibold text-center transition-colors"
              >
                Faculty
              </button>
              <button
                type="button"
                onClick={() => setDemoUser('rahul.sharma@student.edu', 'student123')}
                className="p-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded text-slate-800 font-semibold text-center transition-colors"
              >
                Student
              </button>
            </div>
          </div>
        </div>

        <p className="text-center font-mono text-[11px] text-slate-400 mt-6">
          SentinelEdu • Student Performance Analytics Platform
        </p>
      </div>
    </div>
  );
};

export default Login;
