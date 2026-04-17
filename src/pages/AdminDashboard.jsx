import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield, Crown, Users } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [subscriptionAction, setSubscriptionAction] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (currentUser?.role !== 'admin') {
          window.location.href = '/Dashboard';
          return;
        }
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin('/AdminDashboard');
      }
    };
    fetchUser();
  }, []);

  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getAllUsers', {});
      return response.data.users;
    },
    enabled: !!user,
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ userId, tier, status, trialEndDate }) => {
      await base44.functions.invoke('updateUserSubscription', {
        userId,
        subscriptionTier: tier,
        subscriptionStatus: status,
        trialEndDate,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      setSelectedUser(null);
      setSubscriptionAction('');
    },
  });

  const assignAdminMutation = useMutation({
    mutationFn: async ({ userId, role }) => {
      await base44.functions.invoke('assignAdminRole', {
        userId,
        role,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      setSelectedUser(null);
    },
  });

  const handleGrantPro = (userId) => {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 30); // 30-day trial
    updateSubscriptionMutation.mutate({
      userId,
      tier: 'pro',
      status: 'active',
      trialEndDate: trialEnd.toISOString(),
    });
  };

  const handleRevokePro = (userId) => {
    updateSubscriptionMutation.mutate({
      userId,
      tier: 'free',
      status: 'inactive',
      trialEndDate: null,
    });
  };

  const handleToggleAdmin = (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    assignAdminMutation.mutate({ userId, role: newRole });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const proUsers = allUsers.filter(u => u.subscription_tier === 'pro' && u.subscription_status === 'active');
  const freeUsers = allUsers.filter(u => u.subscription_tier !== 'pro' || u.subscription_status !== 'active');
  const adminUsers = allUsers.filter(u => u.role === 'admin');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{allUsers.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Pro Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{proUsers.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Free Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-600">{freeUsers.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Admins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{adminUsers.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Platform Users</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {u.full_name || 'N/A'}
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                          {u.role === 'admin' ? (
                            <span className="flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              Admin
                            </span>
                          ) : (
                            'User'
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={u.subscription_tier === 'pro' ? 'default' : 'outline'}
                          className={u.subscription_tier === 'pro' ? 'bg-primary text-primary-foreground' : ''}
                        >
                          {u.subscription_tier === 'pro' ? 'Pro' : 'Free'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={u.subscription_status === 'active' ? 'default' : 'secondary'}
                          className={u.subscription_status === 'active' ? 'bg-green-600' : ''}
                        >
                          {u.subscription_status || 'inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {format(new Date(u.created_date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedUser(u)}
                              >
                                Manage
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Manage User: {u.full_name || u.email}</DialogTitle>
                                <DialogDescription>
                                  Update subscription or admin status
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                {/* Admin Role Toggle */}
                                <div>
                                  <h4 className="font-semibold mb-2">Admin Role</h4>
                                  <Button
                                    onClick={() => handleToggleAdmin(u.id, u.role)}
                                    variant={u.role === 'admin' ? 'destructive' : 'default'}
                                    className="w-full"
                                  >
                                    {u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                                  </Button>
                                </div>

                                {/* Subscription Management */}
                                <div>
                                  <h4 className="font-semibold mb-2">Subscription</h4>
                                  <div className="space-y-2">
                                    {u.subscription_tier === 'pro' && u.subscription_status === 'active' ? (
                                      <Button
                                        onClick={() => handleRevokePro(u.id)}
                                        variant="outline"
                                        className="w-full"
                                      >
                                        Revoke Pro Access
                                      </Button>
                                    ) : (
                                      <Button
                                        onClick={() => handleGrantPro(u.id)}
                                        className="w-full"
                                      >
                                        Grant 30-Day Pro Trial
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {/* Trial Info */}
                                {u.trial_end_date && (
                                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                    <strong>Trial ends:</strong> {format(new Date(u.trial_end_date), 'MMM d, yyyy')}
                                  </div>
                                )}

                                {/* Stripe Customer */}
                                {u.stripe_customer_id && (
                                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                    <strong>Stripe Customer:</strong> {u.stripe_customer_id}
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}