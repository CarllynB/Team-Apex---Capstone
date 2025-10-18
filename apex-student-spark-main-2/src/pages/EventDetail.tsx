import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Calendar, MapPin, User, QrCode, ArrowLeft, Edit, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import QRCode from 'qrcode';

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string;
  location: string;
  qr_code: string;
  status: string;
  profiles: {
    full_name: string;
  } | null;
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchEventDetail();
    }
  }, [id]);

  const fetchEventDetail = async () => {
    try {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select(`
          *,
          profiles:organizer_id (
            full_name
          )
        `)
        .eq('id', id)
        .single();

      if (eventError) throw eventError;
      
      if (eventData) {
        setEvent(eventData as any);
        
        // Generate QR code image
        const qrImage = await QRCode.toDataURL(eventData.qr_code, {
          width: 300,
          margin: 2,
        });
        setQrCodeImage(qrImage);

        // Fetch attendee count
        const { count } = await supabase
          .from('check_ins')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', id);
        
        setAttendeeCount(count || 0);

        // Check if user has checked in
        if (user) {
          const { data: checkInData } = await supabase
            .from('check_ins')
            .select('id')
            .eq('event_id', id)
            .eq('user_id', user.id)
            .maybeSingle();
          
          setHasCheckedIn(!!checkInData);
        }
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Event deleted successfully');
      navigate('/events');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link to="/events">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Link>
        </Button>
        <Card className="animate-pulse">
          <CardHeader className="h-64 bg-muted" />
        </Card>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link to="/events">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Link>
        </Button>
        <Card>
          <CardContent className="py-16 text-center">
            <h3 className="mb-2 text-lg font-semibold">Event not found</h3>
            <p className="text-muted-foreground">This event may have been deleted or doesn't exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPast = event.event_date < new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link to="/events">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Link>
        </Button>
        
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to={`/events/${id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Event</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this event? This action cannot be undone and will remove all associated check-ins and points.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete Event
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-3xl">{event.title}</CardTitle>
              {event.description && (
                <CardDescription className="mt-2 text-base">
                  {event.description}
                </CardDescription>
              )}
            </div>
            {isPast && (
              <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
                Past Event
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border border-border p-4">
              <Calendar className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Date & Time</p>
                <p className="font-medium">
                  {new Date(event.event_date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}{' '}
                  at {event.event_time}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border p-4">
              <MapPin className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">{event.location}</p>
              </div>
            </div>

            {event.profiles && (
              <div className="flex items-center gap-3 rounded-lg border border-border p-4">
                <User className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Organizer</p>
                  <p className="font-medium">{event.profiles.full_name}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 rounded-lg border border-border p-4">
              <Users className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Attendees</p>
                <p className="font-medium">{attendeeCount} checked in</p>
              </div>
            </div>
          </div>

          {/* QR Code Section (Admin or Check-in) */}
          {(isAdmin || !isPast) && (
            <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-6">
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
                <div className="text-center">
                  {qrCodeImage && (
                    <img
                      src={qrCodeImage}
                      alt="Event QR Code"
                      className="mx-auto mb-4 rounded-lg border-4 border-background bg-background shadow-lg"
                    />
                  )}
                  <p className="text-sm font-medium text-foreground">Scan to check in</p>
                  <p className="mt-1 text-xs text-muted-foreground">or use code: <span className="font-mono font-semibold">{event.qr_code}</span></p>
                </div>
                
                {!isAdmin && (
                  <div className="text-center">
                    {hasCheckedIn ? (
                      <div className="rounded-lg bg-success/10 p-4 text-success">
                        <p className="font-semibold">✓ You've checked in!</p>
                        <p className="text-sm">+10 points earned</p>
                      </div>
                    ) : (
                      <Button asChild size="lg">
                        <Link to={`/check-in?code=${event.qr_code}`}>
                          <QrCode className="mr-2 h-5 w-5" />
                          Check In Now
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">Attendance Report</p>
                  <p className="text-sm text-muted-foreground">{attendeeCount} total check-ins for this event</p>
                </div>
                <Button variant="outline" asChild>
                  <Link to={`/admin/reports?event=${id}`}>
                    View Details
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
