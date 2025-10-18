import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { CheckCircle, QrCode, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Event {
  id: string;
  title: string;
  event_date: string;
  event_time: string;
  location: string;
}

export default function CheckIn() {
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get('code') || '';
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialCode) {
      handleLookupCode(initialCode);
    }
  }, [initialCode]);

  const handleLookupCode = async (checkInCode: string) => {
    if (!checkInCode.trim()) {
      setError('Please enter a check-in code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('qr_code', checkInCode.trim())
        .maybeSingle();

      if (eventError) throw eventError;

      if (!eventData) {
        setError('Invalid check-in code. Please try again.');
        return;
      }

      const eventDate = new Date(eventData.event_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (eventDate > today) {
        setError('This event has not started yet. Check-in will be available on the event date.');
        return;
      }

      // Check for past events (more than 1 day old)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      oneDayAgo.setHours(0, 0, 0, 0);
      
      if (eventDate < oneDayAgo) {
        setError('This event has ended and check-in is no longer available.');
        return;
      }

      // Check if already checked in
      const { data: existingCheckIn } = await supabase
        .from('check_ins')
        .select('checked_in_at')
        .eq('event_id', eventData.id)
        .eq('user_id', user?.id)
        .maybeSingle();

      if (existingCheckIn) {
        setError(`You already checked in to this event on ${new Date(existingCheckIn.checked_in_at).toLocaleString()}`);
        return;
      }

      setEvent(eventData);
      setShowConfirm(true);
    } catch (error) {
      console.error('Error looking up event:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCheckIn = async () => {
    if (!event || !user) return;

    setLoading(true);

    try {
      const { error: checkInError } = await supabase
        .from('check_ins')
        .insert({
          event_id: event.id,
          user_id: user.id,
          points_earned: 10,
        });

      if (checkInError) throw checkInError;

      toast.success('Check-in successful! +10 points earned', {
        duration: 5000,
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error: any) {
      console.error('Error checking in:', error);
      if (error.message?.includes('duplicate key')) {
        toast.error('You have already checked in to this event');
      } else {
        toast.error('Failed to check in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Event Check-In</h1>
        <p className="mt-2 text-muted-foreground">
          Enter your event code or scan the QR code to check in
        </p>
      </div>

      {!showConfirm ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Enter Check-In Code
            </CardTitle>
            <CardDescription>
              Enter the code provided at the event to confirm your attendance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Check-In Code</Label>
              <Input
                id="code"
                placeholder="Enter event code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleLookupCode(code);
                  }
                }}
                disabled={loading}
                className="text-center text-lg font-mono uppercase"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive bg-destructive/10 p-4">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              onClick={() => handleLookupCode(code)}
              disabled={loading || !code.trim()}
              className="w-full"
            >
              {loading ? 'Looking up event...' : 'Continue'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-success">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <CheckCircle className="h-5 w-5" />
              Event Found!
            </CardTitle>
            <CardDescription>
              Please confirm your check-in to this event
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-6">
              <div>
                <p className="text-sm text-muted-foreground">Event</p>
                <p className="text-xl font-semibold text-foreground">{event?.title}</p>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium text-foreground">
                    {event && new Date(event.event_date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium text-foreground">{event?.event_time}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium text-foreground">{event?.location}</p>
              </div>

              <div className="rounded-lg bg-success/10 p-4 text-center">
                <p className="text-sm text-muted-foreground">Points to be earned</p>
                <p className="text-3xl font-bold text-success">+10</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirm(false);
                  setEvent(null);
                  setCode('');
                }}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmCheckIn}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Checking in...' : 'Confirm Check-In'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
