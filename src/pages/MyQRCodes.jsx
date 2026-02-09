import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, QrCode as QrCodeIcon } from 'lucide-react';
import QRCodeList from '../components/qr/QRCodeList';

export default function MyQRCodes() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        base44.auth.redirectToLogin('/MyQRCodes');
      }
    };
    fetchUser();
  }, []);

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isPro = user.role === 'admin' || (user.subscription_tier === 'pro' && user.subscription_status === 'active');
  const staticCount = qrCodes.filter(qr => qr.type === 'static').length;
  const dynamicCount = qrCodes.filter(qr => qr.type === 'dynamic').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My QR Codes</h1>
            <p className="text-gray-600">
              Manage all your QR codes in one place
            </p>
          </div>
          <Link to="/CreateQR">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create New QR Code
            </Button>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
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
              <div className="text-3xl font-bold text-gray-700">
                {staticCount}
                {!isPro && <span className="text-lg text-gray-500"> / 3</span>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Dynamic Codes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{dynamicCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* QR Codes List */}
        <Card>
          <CardHeader>
            <CardTitle>All QR Codes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : qrCodes.length === 0 ? (
              <div className="text-center py-12">
                <QrCodeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No QR codes yet</h3>
                <p className="text-gray-600 mb-6">Create your first QR code to get started</p>
                <Link to="/CreateQR">
                  <Button className="bg-blue-600 hover:bg-blue-700">
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