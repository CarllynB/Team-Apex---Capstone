import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Calendar, MapPin, Trophy, User, Mail, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

interface Profile {
  full_name: string;
  email: string;
  points: number;
  created_at: string;
}

interface CheckInHistory {
  id: string;
  checked_in_at: string;
  events: {
    title: string;
    location: string;
    event_date: string;
  };
}

const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function Profile() {
  const { user, isAdmin } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checkInHistory, setCheckInHistory] = useState<CheckInHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchCheckInHistory();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setProfile(data);
        setFormData((prev) => ({ ...prev, fullName: data.full_name }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchCheckInHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('check_ins')
        .select(`
          id,
          checked_in_at,
          events (
            title,
            location,
            event_date
          )
        `)
        .eq('user_id', user?.id)
        .order('checked_in_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        setCheckInHistory(data as any);
      }
    } catch (error) {
      console.error('Error fetching check-in history:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setErrors({});
      updateProfileSchema.parse({ fullName: formData.fullName });
      
      setUpdating(true);

      const { error } = await supabase
        .from('profiles')
        .update({ full_name: formData.fullName })
        .eq('id', user?.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      fetchProfile();
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
        toast.error('Failed to update profile');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setErrors({});
      updatePasswordSchema.parse({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });
      
      setUpdating(true);

      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (error) throw error;

      toast.success('Password updated successfully');
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
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
        toast.error('Failed to update password');
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <Card className="animate-pulse">
          <CardHeader className="h-64 bg-muted" />
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">Profile not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Profile</h1>

      {/* Profile Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Trophy className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.points}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events Attended</CardTitle>
            <Calendar className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checkInHistory.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Since</CardTitle>
            <User className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {new Date(profile.created_at).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="info">Account Info</TabsTrigger>
          <TabsTrigger value="history">Attendance History</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>View your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-border p-4">
                <User className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{profile.full_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-border p-4">
                <Mail className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{profile.email}</p>
                </div>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-accent/5 p-4">
                  <Shield className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="font-medium text-accent">Administrator</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription>Update your profile information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, fullName: e.target.value }));
                      setErrors((prev) => ({ ...prev, fullName: '' }));
                    }}
                    disabled={updating}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName}</p>
                  )}
                </div>
                <Button type="submit" disabled={updating}>
                  {updating ? 'Updating...' : 'Update Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, currentPassword: e.target.value }));
                      setErrors((prev) => ({ ...prev, currentPassword: '' }));
                    }}
                    disabled={updating}
                  />
                  {errors.currentPassword && (
                    <p className="text-sm text-destructive">{errors.currentPassword}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, newPassword: e.target.value }));
                      setErrors((prev) => ({ ...prev, newPassword: '' }));
                    }}
                    disabled={updating}
                  />
                  {errors.newPassword && (
                    <p className="text-sm text-destructive">{errors.newPassword}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }));
                      setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                    }}
                    disabled={updating}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>

                <Button type="submit" disabled={updating}>
                  {updating ? 'Updating...' : 'Change Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Attendance History</CardTitle>
              <CardDescription>
                All events you've attended ({checkInHistory.length} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {checkInHistory.length === 0 ? (
                <div className="py-16 text-center">
                  <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-semibold text-foreground">No events attended yet</h3>
                  <p className="text-muted-foreground">Start checking in to events to build your history</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {checkInHistory.map((checkIn) => (
                    <div
                      key={checkIn.id}
                      className="flex items-start gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                        <Calendar className="h-5 w-5 text-success" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{checkIn.events.title}</h4>
                        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {checkIn.events.location}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Event date: {new Date(checkIn.events.event_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-muted-foreground">Checked in</p>
                        <p className="font-medium text-foreground">
                          {new Date(checkIn.checked_in_at).toLocaleDateString()}
                        </p>
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
