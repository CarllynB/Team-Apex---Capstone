import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Calendar, Users, TrendingUp, Download } from 'lucide-react';
import { toast } from 'sonner';

interface Event {
  id: string;
  title: string;
}

interface AttendanceRecord {
  id: string;
  checked_in_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

interface ParticipationRecord {
  id: string;
  full_name: string;
  email: string;
  points: number;
  event_count: number;
}

export default function AdminReports() {
  const { isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const initialEventId = searchParams.get('event');

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId || '');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [participationRecords, setParticipationRecords] = useState<ParticipationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchEvents();
      fetchParticipation();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (selectedEventId) {
      fetchAttendance(selectedEventId);
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title')
        .order('event_date', { ascending: false });

      if (error) throw error;
      
      if (data) {
        setEvents(data);
        if (!selectedEventId && data.length > 0) {
          setSelectedEventId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    }
  };

  const fetchAttendance = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('check_ins')
        .select(`
          id,
          checked_in_at,
          profiles (
            full_name,
            email
          )
        `)
        .eq('event_id', eventId)
        .order('checked_in_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        setAttendanceRecords(data as any);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipation = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, points')
        .order('points', { ascending: false });

      if (error) throw error;

      if (profiles) {
        const participationData = await Promise.all(
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

        setParticipationRecords(participationData);
      }
    } catch (error) {
      console.error('Error fetching participation:', error);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        headers.map((header) => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : value;
        }).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Report exported successfully');
  };

  const exportAttendance = () => {
    const csvData = attendanceRecords.map((record) => ({
      Name: record.profiles.full_name,
      Email: record.profiles.email,
      'Check-in Time': new Date(record.checked_in_at).toLocaleString(),
    }));
    exportToCSV(csvData, 'attendance-report');
  };

  const exportParticipation = () => {
    const csvData = participationRecords.map((record) => ({
      Name: record.full_name,
      Email: record.email,
      'Events Attended': record.event_count,
      'Total Points': record.points,
    }));
    exportToCSV(csvData, 'participation-report');
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Access Denied</h1>
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">You don't have permission to view this page</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reports</h1>
        <p className="text-muted-foreground">View attendance and participation analytics</p>
      </div>

      <Tabs defaultValue="attendance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="attendance">
            <Calendar className="mr-2 h-4 w-4" />
            Attendance by Event
          </TabsTrigger>
          <TabsTrigger value="participation">
            <Users className="mr-2 h-4 w-4" />
            Participation by Student
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Event Attendance</CardTitle>
                  <CardDescription>View check-ins for a specific event</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportAttendance}
                  disabled={attendanceRecords.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Event</label>
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">Loading attendance records...</p>
                </div>
              ) : attendanceRecords.length === 0 ? (
                <div className="py-8 text-center">
                  <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">No check-ins for this event yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="mb-4 rounded-lg bg-muted p-4">
                    <p className="text-sm text-muted-foreground">Total Check-ins</p>
                    <p className="text-2xl font-bold">{attendanceRecords.length}</p>
                  </div>
                  
                  {attendanceRecords.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between rounded-lg border border-border p-4"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {record.profiles.full_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {record.profiles.email}
                        </p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {new Date(record.checked_in_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participation" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Student Participation</CardTitle>
                  <CardDescription>Overview of all student activity</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportParticipation}
                  disabled={participationRecords.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {participationRecords.length === 0 ? (
                <div className="py-16 text-center">
                  <TrendingUp className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">No participation data available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {participationRecords.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between rounded-lg border border-border p-4"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{record.full_name}</p>
                        <p className="text-sm text-muted-foreground">{record.email}</p>
                      </div>
                      <div className="flex gap-6 text-right">
                        <div>
                          <p className="text-sm text-muted-foreground">Events</p>
                          <p className="text-lg font-semibold text-foreground">
                            {record.event_count}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Points</p>
                          <p className="text-lg font-semibold text-success">
                            {record.points}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
