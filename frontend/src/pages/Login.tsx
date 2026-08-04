import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { GraduationCap, Shield, BarChart2, Users, Mail, Lock, Eye, EyeOff, ChevronRight } from 'lucide-react';
import api from '../api/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard';

  const loginMutation = useMutation({
    mutationFn: (credentials: { email: string; password: string }) => api.login(credentials.email, credentials.password),
    onSuccess: (data) => {
      queryClient.setQueryData(['user'], data.user);
      navigate(from, { replace: true });
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate({ email, password });
  };

  const features = [
    { icon: Shield, title: 'Enterprise Security', desc: 'JWT authentication with RBAC and audit logging' },
    { icon: BarChart2, title: 'ML Risk Analytics', desc: 'Isolation Forest anomaly detection for at-risk students' },
    { icon: Users, title: 'Role-Based Access', desc: 'Admin, Teacher, and Student portals with tailored views' },
    { icon: GraduationCap, title: 'Student Analytics', desc: 'GPA trends, attendance tracking, and risk scoring' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-sky-600/5 rounded-full blur-3xl" />
      </div>

      {/* Pattern Overlay */}
            <div
              className="absolute inset-0 opacity-50"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg%20width%3D%2760%27%20height%3D%2760%27%20viewBox%3D%270%200%2060%2060%27%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%3E%3Cg%20fill%3D%27none%27%20fill-rule%3D%27evenodd%27%3E%3Cg%20fill%3D%27%230369A1%27%20fill-opacity%3D%270.03%27%3E%3Cpath%20d%3D%27M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%27%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E")`
              }}
              aria-hidden="true"
            />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-600/20 mb-6">
            <GraduationCap className="h-9 w-9 text-sky-400" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold text-slate-50 tracking-tight">SentinelEdu</h1>
          <p className="mt-2 text-slate-400 text-lg">Enterprise IAM & Student Analytics</p>
        </div>

        {/* Login Card */}
        <Card variant="elevated" padding="lg" className="border-sky-600/20">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to access your dashboard</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" dismissible onDismiss={() => setError('')}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <Input
                label="Email Address"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                leftIcon={<Mail className="h-5 w-5" aria-hidden="true" />}
                disabled={loginMutation.isPending}
                error={error && !loginMutation.isPending ? undefined : undefined}
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                leftIcon={<Lock className="h-5 w-5" aria-hidden="true" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                }
                disabled={loginMutation.isPending}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loginMutation.isPending}
                leftIcon={loginMutation.isPending ? undefined : undefined}
              >
                {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider text-slate-500 px-4">
                <span className="bg-slate-900 px-2">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" size="md" className="min-h-[44px]">
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>
              <Button variant="outline" size="md" className="min-h-[44px]">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.438 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.37 1.23-3.21-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.28-1.545 3.285-1.23 3.285-1.23.66 1.65.24 2.82.12 3.18.765.84 1.23 1.905 1.23 3.21 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                GitHub
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pt-6 border-t border-slate-700/50">
            <div className="text-center">
              <p className="text-sm text-slate-500">
                Demo Credentials:
              </p>
              <div className="mt-3 space-y-2 text-left text-xs bg-slate-900/50 rounded-xl p-4">
                <div className="flex justify-between">
                  <span className="font-mono text-sky-400">admin@university.edu</span>
                  <span className="font-mono text-slate-500">admin123</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-mono text-green-400">priya.sharma@university.edu</span>
                  <span className="font-mono text-slate-500">faculty123</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-mono text-purple-400">rahul.sharma@student.edu</span>
                  <span className="font-mono text-slate-500">student123</span>
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>

        {/* Features */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-4 rounded-xl bg-slate-900/50 border border-slate-700/50 hover:border-sky-600/30 hover:bg-sky-600/10 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-lg bg-sky-600/20 mb-3 group-hover:bg-sky-600/30 transition-colors">
                <feature.icon className="h-5 w-5 text-sky-400 mx-auto" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-slate-100 text-sm">{feature.title}</h3>
              <p className="text-slate-500 text-xs mt-1">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-slate-500">
          © 2024 SentinelEdu. Enterprise IAM & Student Analytics Platform.
        </p>
      </div>
    </div>
  );
};

export default Login;