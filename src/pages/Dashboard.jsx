import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Download, Eye, QrCode as QrCodeIcon, Lock } from 'lucide-react';
import QRCodeList from '../components/qr/QRCodeList';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
        try {
          const currentUser = await base44.auth.me();
          // Redirect admins to admin dashboard
          if (currentUser.role === 'admin') {
            window.location.href = '/AdminDashboard';
            return;
          }
          setUser(currentUser);
        } catch (error) {
          base44.auth.redirectToLogin('/Dashboard');
        }
      };
      fetchUser();
    }, []);

    const handleManageSubscription = async () => {
      try {
        const response = await base44.functions.invoke('createPortalSession');
        console.log('Portal response:', response);
        if (response.data && response.data.url) {
          window.location.href = response.data.url;
        } else {
          console.error('No URL in response:', response);
          alert('Unable to open billing portal. Please contact support.');
        }
      } catch (error) {
        console.error('Billing portal error:', error);
        if (error.response?.data?.error) {
          alert(`Error: ${error.response.data.error}`);
        } else {
          alert('Failed to open billing portal. Please try again.');
        }
      }
    };

  const { data: qrCodes = [], isLoading } = useQuery({
    queryKey: ['qr-codes'],
    queryFn: () => base44.entities.QRCode.filter({ created_by: user?.email }),
    enabled: !!user,
  });

  const deleteQRMutation = useMutation({
    mutationFn: (id) => base44.entities.QRCode.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes'] });
    },
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isPro = user.role === 'admin' || (user.subscription_tier === 'pro' && user.subscription_status === 'active');
  const staticCount = qrCodes.filter(qr => qr.type === 'static').length;
  const canCreateStatic = isPro || staticCount < 3;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">
              Welcome back, {user.full_name || user.email}
            </p>
          </div>
          <div className="flex gap-3">
            {isPro ? (
              <Button variant="outline" onClick={handleManageSubscription}>
                Manage Subscription
              </Button>
            ) : (
              <Link to="/Pricing">
                <Button variant="outline">
                  Upgrade to Pro
                </Button>
              </Link>
            )}
            <Link to="/CreateQR">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create QR Code
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={isPro ? 'default' : 'secondary'} className="text-lg">
                {isPro ? 'Pro' : 'Free'}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total QR Codes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{qrCodes.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Static Codes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {staticCount}
                {!isPro && <span className="text-lg text-gray-500"> / 3</span>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Tracked Scans
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isPro ? (
                <div className="text-3xl font-bold">
                  {qrCodes.reduce((sum, qr) => sum + (qr.scan_count || 0), 0)}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold">0</div>
                  <Lock className="w-5 h-5 text-gray-400" />
                  <Link to="/Pricing" className="text-sm text-primary hover:underline">
                    Upgrade to unlock analytics
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Free Tier Warning */}
        {!isPro && !canCreateStatic && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <p className="text-orange-800">
                You've reached the free tier limit of 3 static QR codes.{' '}
                <Link to="/Pricing" className="font-semibold underline">
                  Upgrade to Pro
                </Link>{' '}
                for unlimited QR codes, dynamic codes, and analytics.
              </p>
            </CardContent>
          </Card>
        )}

        {/* QR Codes List */}
        <Card>
          <CardHeader>
            <CardTitle>Your QR Codes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : qrCodes.length === 0 ? (
              <div className="text-center py-12">
                <QrCodeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No QR codes yet</h3>
                <p className="text-gray-600 mb-6">Create your first QR code to get started</p>
                <Link to="/CreateQR">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create QR Code
                  </Button>
                </Link>
              </div>
            ) : (
              <QRCodeList 
                qrCodes={qrCodes} 
                isPro={isPro}
                onDelete={(id) => deleteQRMutation.mutate(id)}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}