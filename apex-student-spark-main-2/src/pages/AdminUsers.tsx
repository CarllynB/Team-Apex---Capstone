import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Search, Shield, User, Trophy } from 'lucide-react';
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
} from '@/components/ui/alert-dialog';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  points: number;
  created_at: string;
  is_admin: boolean;
}

export default function AdminUsers() {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [actionType, setActionType] = useState<'promote' | 'demote'>('promote');

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      if (profiles) {
        // Check admin status for each user
        const usersWithRoles = await Promise.all(
          profiles.map(async (profile) => {
            const { data: roleData } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', profile.id)
              .eq('role', 'admin')
              .maybeSingle();

            return {
              ...profile,
              is_admin: !!roleData,
            };
          })
        );

        setUsers(usersWithRoles);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(
      (user) =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const handleRoleChange = (user: UserProfile, action: 'promote' | 'demote') => {
    setSelectedUser(user);
    setActionType(action);
    setShowRoleDialog(true);
  };

  const confirmRoleChange = async () => {
    if (!selectedUser) return;

    try {
      if (actionType === 'promote') {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: selectedUser.id,
            role: 'admin',
          });

        if (error) throw error;
        toast.success(`${selectedUser.full_name} has been promoted to admin`);
      } else {
        // Remove admin role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', selectedUser.id)
          .eq('role', 'admin');

        if (error) throw error;
        toast.success(`${selectedUser.full_name} has been demoted to student`);
      }

      fetchUsers();
    } catch (error) {
      console.error('Error changing role:', error);
      toast.error('Failed to update user role');
    } finally {
      setShowRoleDialog(false);
      setSelectedUser(null);
    }
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

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        <Card className="animate-pulse">
          <CardHeader className="h-64 bg-muted" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground">Manage user roles and permissions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
          <CardDescription>View and manage student and admin accounts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredUsers.length === 0 ? (
            <div className="py-16 text-center">
              <User className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No users found matching your search' : 'No users found'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => {
                const isCurrentUser = user.id === currentUser?.id;
                const canModify = !isCurrentUser;

                return (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between rounded-lg border p-4 ${
                      isCurrentUser ? 'border-accent bg-accent/5' : 'border-border'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">
                          {user.full_name}
                          {isCurrentUser && (
                            <span className="ml-2 text-sm text-accent">(You)</span>
                          )}
                        </p>
                        {user.is_admin && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                            <Shield className="h-3 w-3" />
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Trophy className="h-3 w-3 text-success" />
                          {user.points} points
                        </span>
                        <span>
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {canModify && (
                      <div className="flex gap-2">
                        {user.is_admin ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRoleChange(user, 'demote')}
                          >
                            Demote to Student
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRoleChange(user, 'promote')}
                          >
                            Promote to Admin
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Change Confirmation Dialog */}
      <AlertDialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'promote' ? 'Promote to Admin' : 'Demote to Student'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'promote'
                ? `Are you sure you want to promote ${selectedUser?.full_name} to administrator? They will have full access to manage events, view reports, and manage users.`
                : `Are you sure you want to demote ${selectedUser?.full_name} to student? They will lose all administrative privileges.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
