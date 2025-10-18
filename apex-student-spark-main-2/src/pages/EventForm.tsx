import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  eventDate: z.string().min(1, 'Date is required'),
  eventTime: z.string().min(1, 'Time is required'),
  location: z.string().min(1, 'Location is required').max(200),
});

export default function EventForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDate: '',
    eventTime: '',
    location: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }

    if (isEdit) {
      fetchEvent();
    }
  }, [isEdit, isAdmin]);

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          title: data.title,
          description: data.description || '',
          eventDate: data.event_date,
          eventTime: data.event_time,
          location: data.location,
        });
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Failed to load event');
      navigate('/events');
    }
  };

  const generateQRCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setErrors({});
      eventSchema.parse(formData);

      // Validate date is not in the past for new events
      if (!isEdit) {
        const selectedDate = new Date(formData.eventDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
          setErrors({ eventDate: 'Event date cannot be in the past' });
          return;
        }
      }

      setLoading(true);

      if (isEdit) {
        // Update existing event
        const { error } = await supabase
          .from('events')
          .update({
            title: formData.title,
            description: formData.description || null,
            event_date: formData.eventDate,
            event_time: formData.eventTime,
            location: formData.location,
          })
          .eq('id', id);

        if (error) throw error;

        toast.success('Event updated successfully');
        navigate(`/events/${id}`);
      } else {
        // Create new event
        const { data, error } = await supabase
          .from('events')
          .insert({
            title: formData.title,
            description: formData.description || null,
            event_date: formData.eventDate,
            event_time: formData.eventTime,
            location: formData.location,
            organizer_id: user?.id,
            qr_code: generateQRCode(),
          })
          .select()
          .single();

        if (error) throw error;

        toast.success('Event created successfully');
        navigate(`/events/${data.id}`);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      } else {
        console.error('Error saving event:', error);
        toast.error('Failed to save event');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button variant="ghost" asChild>
        <Link to="/events">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Edit Event' : 'Create New Event'}</CardTitle>
          <CardDescription>
            {isEdit
              ? 'Update event details below'
              : 'Fill in the details to create a new event'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Team Apex Kickoff Meeting"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                disabled={loading}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the event"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={loading}
                rows={4}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="eventDate">Event Date *</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => handleInputChange('eventDate', e.target.value)}
                  disabled={loading}
                />
                {errors.eventDate && (
                  <p className="text-sm text-destructive">{errors.eventDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventTime">Event Time *</Label>
                <Input
                  id="eventTime"
                  type="time"
                  value={formData.eventTime}
                  onChange={(e) => handleInputChange('eventTime', e.target.value)}
                  disabled={loading}
                />
                {errors.eventTime && (
                  <p className="text-sm text-destructive">{errors.eventTime}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                placeholder="e.g., Student Center Room 201"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                disabled={loading}
              />
              {errors.location && (
                <p className="text-sm text-destructive">{errors.location}</p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/events')}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Update Event' : 'Create Event'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
