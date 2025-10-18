import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Calendar, Trophy, CheckCircle, Plus, Users, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface Event {
  id: string;
  title: string;
  event_date: string;
  event_time: string;
  location: string;
  status: string;
}

interface CheckIn {
  id: string;
  checked_in_at: string;
  events: {
    title: string;
    location: string;
  };
}

interface DashboardStats {
  totalEvents: number;
  totalCheckIns: number;
  topEvent: string;
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch user points
      const { data: profile } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', user?.id)
        .single();
      
      if (profile) {
        setUserPoints(profile.points);
      }

      // Fetch upcoming events
      const today = new Date().toISOString().split('T')[0];
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .limit(isAdmin ? 5 : 5);
      
      if (events) {
        setUpcomingEvents(events);
      }

      // Fetch recent check-ins
      const { data: checkIns } = await supabase
        .from('check_ins')
        .select(`
          id,
          checked_in_at,
          events (
            title,
            location
          )
        `)
        .eq('user_id', user?.id)
        .order('checked_in_at', { ascending: false })
        .limit(3);
      
      if (checkIns) {
        setRecentCheckIns(checkIns as any);
      }

      // Admin stats
      if (isAdmin) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count: eventCount } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfMonth.toISOString());

        const { count: checkInCount } = await supabase
          .from('check_ins')
          .select('*', { count: 'exact', head: true })
          .gte('checked_in_at', startOfMonth.toISOString());

        const { data: topEventData } = await supabase
          .from('check_ins')
          .select(`
            event_id,
            events (
              title
            )
          `)
          .limit(1000);

        let topEvent = 'N/A';
        if (topEventData && topEventData.length > 0) {
          const eventCounts: Record<string, { title: string; count: number }> = {};
          topEventData.forEach((ci: any) => {
            const eventId = ci.event_id;
            const eventTitle = ci.events?.title || 'Unknown';
            if (!eventCounts[eventId]) {
              eventCounts[eventId] = { title: eventTitle, count: 0 };
            }
            eventCounts[eventId].count++;
          });

          const topEventEntry = Object.values(eventCounts).sort((a, b) => b.count - a.count)[0];
          if (topEventEntry) {
            topEvent = topEventEntry.title;
          }
        }

        setStats({
          totalEvents: eventCount || 0,
          totalCheckIns: checkInCount || 0,
          topEvent,
        });
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-32 bg-muted" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">
          {isAdmin ? 'Admin Dashboard' : 'Dashboard'}
        </h1>
        {isAdmin && (
          <Button asChild>
            <Link to="/events/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Link>
          </Button>
        )}
      </div>

      {/* Student View */}
      {!isAdmin && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Points</CardTitle>
              <Trophy className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userPoints}</div>
              <Link to="/leaderboard" className="text-xs text-accent hover:underline">
                View leaderboard →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Events Attended</CardTitle>
              <CheckCircle className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentCheckIns.length}</div>
              <Link to="/profile" className="text-xs text-accent hover:underline">
                View history →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingEvents.length}</div>
              <Link to="/events" className="text-xs text-accent hover:underline">
                Browse events →
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Admin View */}
      {isAdmin && stats && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Events This Month</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Check-ins This Month</CardTitle>
              <Users className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCheckIns}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Attended Event</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">{stats.topEvent}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>
            {upcomingEvents.length === 0 
              ? 'No upcoming events scheduled'
              : `Next ${upcomingEvents.length} events`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Check back later for new events
            </p>
          ) : (
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className="block rounded-lg border border-border p-4 transition-colors hover:bg-muted"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{event.title}</h3>
                      <p className="text-sm text-muted-foreground">{event.location}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium text-foreground">
                        {new Date(event.event_date).toLocaleDateString()}
                      </p>
                      <p className="text-muted-foreground">{event.event_time}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Check-ins (Student only) */}
      {!isAdmin && recentCheckIns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Check-ins</CardTitle>
            <CardDescription>Your last 3 attended events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCheckIns.map((checkIn) => (
                <div
                  key={checkIn.id}
                  className="flex items-center gap-4 rounded-lg border border-border p-3"
                >
                  <CheckCircle className="h-5 w-5 text-success" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{checkIn.events.title}</p>
                    <p className="text-sm text-muted-foreground">{checkIn.events.location}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(checkIn.checked_in_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
