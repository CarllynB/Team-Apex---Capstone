import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Trophy, Medal, Award } from 'lucide-react';
import { toast } from 'sonner';

interface LeaderboardEntry {
  id: string;
  full_name: string;
  points: number;
  event_count: number;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'semester'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [timeFilter]);

  const fetchLeaderboard = async () => {
    try {
      // Get all profiles with points
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, points')
        .order('points', { ascending: false })
        .limit(20);

      if (profilesError) throw profilesError;

      if (profiles) {
        // Get event counts for each user
        const leaderboardData = await Promise.all(
          profiles.map(async (profile) => {
            const { count } = await supabase
              .from('check_ins')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', profile.id);

            return {
              ...profile,
              event_count: count || 0,
            };
          })
        );

        setLeaderboard(leaderboardData);

        // Find user's rank
        if (user) {
          const allProfiles = await supabase
            .from('profiles')
            .select('id, points')
            .order('points', { ascending: false });

          if (allProfiles.data) {
            const rank = allProfiles.data.findIndex((p) => p.id === user.id) + 1;
            setUserRank(rank);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Award className="h-6 w-6 text-amber-600" />;
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Leaderboard</h1>
        <Card className="animate-pulse">
          <CardHeader className="h-64 bg-muted" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leaderboard</h1>
          <p className="text-muted-foreground">Top participants ranked by points</p>
        </div>
        
        <Select value={timeFilter} onValueChange={(value: any) => setTimeFilter(value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="semester">This Semester</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User's Current Rank */}
      {userRank && (
        <Card className="border-accent bg-accent/5">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm text-muted-foreground">Your Current Rank</p>
              <p className="text-2xl font-bold text-foreground">#{userRank}</p>
            </div>
            <Trophy className="h-8 w-8 text-accent" />
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Top 20 Students</CardTitle>
          <CardDescription>
            Ranked by total points earned from event attendance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <div className="py-16 text-center">
              <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold text-foreground">No rankings yet</h3>
              <p className="text-muted-foreground">Start attending events to appear on the leaderboard!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, index) => {
                const rank = index + 1;
                const isCurrentUser = user?.id === entry.id;
                
                return (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-4 rounded-lg border p-4 transition-colors ${
                      isCurrentUser
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex w-12 items-center justify-center">
                      {getRankIcon(rank) || (
                        <span className="text-xl font-bold text-muted-foreground">#{rank}</span>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        {entry.full_name}
                        {isCurrentUser && (
                          <span className="ml-2 text-sm text-accent">(You)</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {entry.event_count} {entry.event_count === 1 ? 'event' : 'events'} attended
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-success">{entry.points}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
