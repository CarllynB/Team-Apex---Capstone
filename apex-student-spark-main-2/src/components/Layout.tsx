import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { 
  LayoutDashboard, 
  Calendar, 
  Trophy, 
  User, 
  LogOut,
  Users,
  BarChart3
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, show: true },
    { name: 'Events', href: '/events', icon: Calendar, show: true },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy, show: true },
    { name: 'Profile', href: '/profile', icon: User, show: true },
    { name: 'Reports', href: '/admin/reports', icon: BarChart3, show: isAdmin },
    { name: 'Users', href: '/admin/users', icon: Users, show: isAdmin },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/dashboard" className="text-xl font-bold text-primary">
            Team Apex
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
            {isAdmin && (
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                Admin
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar */}
        <aside className="hidden w-64 border-r border-border bg-card md:block">
          <nav className="space-y-1 p-4">
            {navigation.filter(item => item.show).map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

      {/* Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-card md:hidden">
        <div className="grid grid-cols-4 gap-1 p-2">
          {navigation.filter(item => item.show).slice(0, 4).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center gap-1 rounded-lg p-2 text-xs ${
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
