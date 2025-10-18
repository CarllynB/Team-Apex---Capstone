import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, QrCode, Trophy, TrendingUp } from 'lucide-react';
import heroImage from '@/assets/hero-image.jpg';
import { useAuth } from '@/lib/auth';

export default function Home() {
  const { user, loading } = useAuth();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary to-accent">
        <div className="absolute inset-0 opacity-20">
          <img 
            src={heroImage} 
            alt="Students engaging in campus activities" 
            className="h-full w-full object-cover"
          />
        </div>
        
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-primary-foreground sm:text-6xl">
              Team Apex
            </h1>
            <p className="mb-4 text-2xl font-semibold text-primary-foreground/90">
              Student Organization Engagement Platform
            </p>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-primary-foreground/80">
              Track events, earn points, and climb the leaderboard. Join your campus community and make every event count.
            </p>
            
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
                <Link to="/auth?mode=register">Get Started</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 sm:w-auto">
                <Link to="/auth">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              Everything You Need to Stay Engaged
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Streamlined event management and attendance tracking designed for student organizations
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                <Calendar className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-card-foreground">Event Discovery</h3>
              <p className="text-muted-foreground">
                Browse upcoming events and never miss an opportunity to participate
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                <QrCode className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-card-foreground">Quick Check-In</h3>
              <p className="text-muted-foreground">
                Scan QR codes or enter event codes for instant attendance verification
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-success">
                <Trophy className="h-6 w-6 text-success-foreground" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-card-foreground">Points & Rewards</h3>
              <p className="text-muted-foreground">
                Earn points for every event you attend and track your progress
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                <TrendingUp className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-card-foreground">Leaderboard</h3>
              <p className="text-muted-foreground">
                Compete with peers and see where you rank among active participants
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-primary to-accent py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold text-primary-foreground">
            Ready to Get Started?
          </h2>
          <p className="mb-8 text-lg text-primary-foreground/80">
            Join your fellow students and start earning recognition for your engagement
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link to="/auth?mode=register">Create Your Account</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground">
            © 2025 Team Apex. Built for student engagement.
          </p>
        </div>
      </footer>
    </div>
  );
}
