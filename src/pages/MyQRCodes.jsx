import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, QrCode as QrCodeIcon, FolderOpen, Folder } from 'lucide-react';
import QRCodeList from '../components/qr/QRCodeList';

const MOCK_FOLDERS = [
  { id: 'all', name: 'All QR Codes', icon: FolderOpen },
  { id: 'marketing', name: 'Marketing Campaigns', icon: Folder },
  { id: 'storefront', name: 'Store Front', icon: Folder },
];

export default function MyQRCodes() {
  const [user, setUser] = useState(null);
  const [activeFolder, setActiveFolder] = useState('all');
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch {
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['qr-codes'] }),
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
            <p className="text-gray-600">Manage all your QR codes in one place</p>
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
              <CardTitle className="text-sm font-medium text-gray-600">Total QR Codes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{qrCodes.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Static Codes</CardTitle>
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
              <CardTitle className="text-sm font-medium text-gray-600">Dynamic Codes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{dynamicCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Layout: Sidebar + Content */}
        <div className="flex gap-6 items-start">
          {/* Folders Sidebar */}
          <aside className="w-56 shrink-0">
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Folders</CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                <nav className="space-y-0.5">
                  {MOCK_FOLDERS.map(({ id, name, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveFolder(id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                        activeFolder === id
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${activeFolder === id ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className="truncate">{name}</span>
                    </button>
                  ))}
                </nav>

                <div className="mt-4 px-3">
                  <button className="w-full flex items-center gap-2 text-sm text-gray-400 hover:text-blue-600 transition-colors py-1">
                    <Plus className="w-3.5 h-3.5" />
                    New Folder
                  </button>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* QR Codes Table */}
          <div className="flex-1 min-w-0">
            <Card>
              <CardHeader>
                <CardTitle>
                  {MOCK_FOLDERS.find(f => f.id === activeFolder)?.name || 'All QR Codes'}
                </CardTitle>
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
      </div>
    </div>
  );
}