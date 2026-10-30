import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Users,
  BookOpen,
  AlertTriangle,
  BarChart2,
  Settings,
  Shield,
  GraduationCap,
  UserCog,
  Bell,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import { Button } from './Button';
import { Badge } from './Badge';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  roles?: string[];
  badge?: string;
  badgeVariant?:
    'critical' | 'high' | 'medium' | 'low' | 'success' | 'warning' | 'info' | 'neutral';
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    path: '/dashboard',
    roles: ['admin', 'teacher', 'student'],
  },
  {
    label: 'Students',
    icon: <Users className="h-5 w-5" />,
    path: '/students',
    roles: ['admin', 'teacher'],
  },
  {
    label: 'Classes',
    icon: <BookOpen className="h-5 w-5" />,
    path: '/classes',
    roles: ['admin', 'teacher'],
  },
  {
    label: 'Risk Analytics',
    icon: <AlertTriangle className="h-5 w-5" />,
    path: '/risk',
    roles: ['admin', 'teacher'],
  },
  {
    label: 'Analytics',
    icon: <BarChart2 className="h-5 w-5" />,
    path: '/analytics',
    roles: ['admin', 'teacher'],
  },
  {
    label: 'Interventions',
    icon: <Shield className="h-5 w-5" />,
    path: '/interventions',
    roles: ['admin', 'teacher'],
  },
  {
    label: 'Settings',
    icon: <Settings className="h-5 w-5" />,
    path: '/settings',
    roles: ['admin'],
  },
];

export interface SidebarProps {
  className?: string;
}

export const Sidebar = ({ className = '' }: SidebarProps) => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) setCollapsed(saved === 'true');

    const darkSaved = localStorage.getItem('dark-mode');
    if (darkSaved !== null) setDarkMode(darkSaved === 'true');
    else setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', collapsed.toString());
  }, [collapsed]);

  useEffect(() => {
    localStorage.setItem('dark-mode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const filteredNavItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  const handleLogout = () => {
    logout();
  };

  if (typeof window !== 'undefined' && window.innerWidth < 1024 && !mobileOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile Overlay */}
      {typeof window !== 'undefined' && window.innerWidth < 1024 && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          'fixed lg:static inset-y-0 left-0 z-50 flex flex-col',
          'bg-slate-900/95 backdrop-blur-xl border-r border-slate-700',
          'transition-all duration-300 ease-out',
          collapsed ? 'w-20' : 'w-72',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          className
        )}
        aria-label="Main navigation"
      >
        {/* Logo Section */}
        <div
          className={clsx(
            'flex items-center justify-between h-16 px-4 border-b border-slate-700/50',
            collapsed && 'justify-center px-0'
          )}
        >
          {!collapsed && (
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sky-600/20">
                <GraduationCap className="h-6 w-6 text-sky-400" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-slate-50 truncate">SentinelEdu</h1>
                <p className="text-[10px] text-slate-500 truncate">Enterprise IAM & Analytics</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sky-600/20">
              <GraduationCap className="h-6 w-6 text-sky-400" aria-hidden="true" />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={clsx(
              'p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50',
              'transition-colors duration-150',
              collapsed && 'rotate-180'
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3" aria-label="Main navigation">
          <ul className="space-y-1" role="list">
            {filteredNavItems.map((item) => (
              <li key={item.path}>
                <a
                  href={item.path}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl',
                    'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50',
                    'transition-all duration-150 ease-out',
                    'min-h-[44px]',
                    !collapsed && 'group'
                  )}
                  aria-current={window.location.pathname === item.path ? 'page' : undefined}
                >
                  <span className="flex-shrink-0" aria-hidden="true">
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="font-medium text-sm truncate">{item.label}</span>
                      {item.badge && (
                        <Badge variant={item.badgeVariant || 'info'} size="sm" className="ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Section */}
        <div
          className={clsx(
            'p-3 border-t border-slate-700/50',
            collapsed && 'items-center justify-center'
          )}
        >
          {!collapsed && user && (
            <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-slate-800/50">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-sky-600/20">
                <UserCog className="h-5 w-5 text-sky-400" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-100 truncate">{user.full_name}</p>
                <p className="text-xs text-slate-500 capitalize">{user.role}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            {!collapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDarkMode(!darkMode)}
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            )}
            {!collapsed && (
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="h-5 w-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size={collapsed ? 'icon' : 'sm'}
              onClick={handleLogout}
              aria-label="Log out"
              className={clsx(
                'text-red-400 hover:text-red-300 hover:bg-red-900/20',
                !collapsed && 'flex-1 justify-start gap-2'
              )}
            >
              <LogOut className="h-5 w-5" />
              {!collapsed && <span>Logout</span>}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
