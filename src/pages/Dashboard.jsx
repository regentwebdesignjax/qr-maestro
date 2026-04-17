import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Download, Eye, QrCode as QrCodeIcon, Lock, Zap } from 'lucide-react';
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
      <div className="mx-auto px-6 md:px-8 max-w-5xl py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6 md:gap-0 mb-12 md:mb-16">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Dashboard</h1>
            <p className="text-muted-foreground text-base md:text-lg">
              Welcome back, {user.full_name || user.email}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {isPro ? (
              <Button variant="outline" onClick={handleManageSubscription} className="h-11">
                Manage Subscription
              </Button>
            ) : (
              <Link to="/Pricing" className="w-full sm:w-auto">
                <Button variant="outline" className="h-11 w-full sm:w-auto">
                  Upgrade to Pro
                </Button>
              </Link>
            )}
            <Link to="/CreateQR" className="w-full sm:w-auto">
              <Button className="h-11 w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Create QR Code
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 md:gap-6 mb-12 md:mb-16">
          <Card className="shadow-none hover:shadow-[0_4px_20px_rgba(20,32,36,0.05)] transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={isPro ? 'default' : 'secondary'} className="text-base">
                {isPro ? 'Pro' : 'Free'}
              </Badge>
            </CardContent>
          </Card>

          <Card className="shadow-none hover:shadow-[0_4px_20px_rgba(20,32,36,0.05)] transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                Total QR Codes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl md:text-4xl font-bold">{qrCodes.length}</div>
            </CardContent>
          </Card>

          <Card className="shadow-none hover:shadow-[0_4px_20px_rgba(20,32,36,0.05)] transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                Static Codes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl md:text-4xl font-bold">
                {staticCount}
                {!isPro && <span className="text-lg text-muted-foreground"> / 3</span>}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none hover:shadow-[0_4px_20px_rgba(20,32,36,0.05)] transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                Total Tracked Scans
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isPro ? (
                <div className="text-3xl md:text-4xl font-bold">
                  {qrCodes.reduce((sum, qr) => sum + (qr.scan_count || 0), 0)}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="text-3xl md:text-4xl font-bold">0</div>
                  <Lock className="w-5 h-5 text-muted-foreground" />
                  <Link to="/Pricing" className="text-xs md:text-sm text-primary hover:underline">
                    Upgrade to unlock
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upgrade Banner for Free Users */}
        {!isPro && (
          <Card className="mb-12 md:mb-16 border-primary/30 bg-primary/5 shadow-none">
            <CardContent className="pt-6 md:pt-8 pb-6 md:pb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 md:gap-6">
                <div>
                  <p className="font-semibold text-foreground text-base md:text-lg">Unlock the full power of QR Sensei</p>
                  <p className="text-sm text-muted-foreground mt-1.5 md:mt-2">Dynamic QR codes, scan analytics, custom designs & more — from $29/month.</p>
                </div>
                <Link to="/Pricing" className="w-full sm:w-auto">
                  <Button className="shrink-0 h-11 w-full sm:w-auto">
                    <Zap className="w-4 h-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Free Tier Warning */}
        {!isPro && !canCreateStatic && (
          <Card className="mb-12 md:mb-16 border-orange-200 bg-orange-50 shadow-none">
            <CardContent className="pt-6 pb-6">
              <p className="text-orange-800 text-sm md:text-base">
                You've reached the free tier limit of 3 static QR codes.{' '}
                <Link to="/Pricing" className="font-semibold underline hover:no-underline">
                  Upgrade to Pro
                </Link>{' '}
                for unlimited QR codes, dynamic codes, and analytics.
              </p>
            </CardContent>
          </Card>
        )}

        {/* QR Codes List */}
        <Card className="shadow-none border border-border">
          <CardHeader className="pb-6 border-b">
            <CardTitle className="text-2xl">Your QR Codes</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : qrCodes.length === 0 ? (
              <div className="text-center py-16">
                <QrCodeIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-40" />
                <h3 className="text-lg font-medium text-foreground mb-2">No QR codes yet</h3>
                <p className="text-muted-foreground mb-8">Create your first QR code to get started</p>
                <Link to="/CreateQR">
                  <Button className="h-11">
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