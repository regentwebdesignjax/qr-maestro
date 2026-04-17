import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, QrCode as QrCodeIcon } from 'lucide-react';
import QRCodeList from '../components/qr/QRCodeList';
import FoldersSidebar from '../components/qr/FoldersSidebar';

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

  const { data: folders = [] } = useQuery({
    queryKey: ['folders', user?.email],
    queryFn: () => base44.entities.Folder.filter({ user_email: user?.email }),
    enabled: !!user,
  });

  const { data: qrFolders = [] } = useQuery({
    queryKey: ['qr-folders', user?.email],
    queryFn: () => base44.entities.QRFolder.filter({ user_email: user?.email }),
    enabled: !!user,
  });

  const deleteQRMutation = useMutation({
    mutationFn: (id) => base44.entities.QRCode.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['qr-codes'] }),
  });

  const createFolderMutation = useMutation({
    mutationFn: (name) => base44.entities.Folder.create({ name, user_email: user?.email }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['folders', user?.email] }),
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (folderId) => base44.entities.Folder.delete(folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', user?.email] });
      queryClient.invalidateQueries({ queryKey: ['qr-folders', user?.email] });
    },
  });

  const updateFolderMutation = useMutation({
    mutationFn: ({ folderId, name }) => base44.entities.Folder.update(folderId, { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['folders', user?.email] }),
  });

  const moveToFolderMutation = useMutation({
    mutationFn: async ({ qrIds, folderId }) => {
      if (folderId === 'all') {
        await Promise.all(qrFolders.filter(qf => qrIds.includes(qf.qr_code_id)).map(qf => base44.entities.QRFolder.delete(qf.id)));
      } else {
        const existingMap = qrFolders.reduce((acc, qf) => ({ ...acc, [qf.qr_code_id]: qf.id }), {});
        await Promise.all(qrIds.map(qrId => {
          if (existingMap[qrId]) {
            return base44.entities.QRFolder.update(existingMap[qrId], { folder_id: folderId });
          } else {
            return base44.entities.QRFolder.create({ qr_code_id: qrId, folder_id: folderId, user_email: user?.email });
          }
        }));
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['qr-folders', user?.email] }),
  });

  const buildQrFolderMap = () => {
    const map = {};
    qrFolders.forEach(qf => {
      map[qf.qr_code_id] = qf.folder_id;
    });
    return map;
  };

  const allFolders = [
    { id: 'all', name: 'All QR Codes', locked: true },
    ...folders,
  ];

  const qrFolderMap = buildQrFolderMap();

  const handleMoveToFolder = (qrIds, folderId) => {
    moveToFolderMutation.mutate({ qrIds, folderId });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isPro = user.role === 'admin' || (user.subscription_tier === 'pro' && user.subscription_status === 'active');
  const staticCount = qrCodes.filter(qr => qr.type === 'static').length;
  const dynamicCount = qrCodes.filter(qr => qr.type === 'dynamic').length;

  const visibleQrCodes = activeFolder === 'all'
    ? qrCodes
    : qrCodes.filter(qr => qrFolderMap[qr.id] === activeFolder);

  const handleFoldersChange = async (newFolders) => {
    const existingIds = new Set(folders.map(f => f.id));
    const newFoldersList = newFolders.filter(f => !f.locked && !existingIds.has(f.id));
    for (const folder of newFoldersList) {
      await createFolderMutation.mutateAsync(folder.name);
    }
  };

  const handleFolderDelete = (folderId) => {
    if (activeFolder === folderId) setActiveFolder('all');
    deleteFolderMutation.mutate(folderId);
  };

  const handleFolderRename = (folderId, newName) => {
    updateFolderMutation.mutate({ folderId, name: newName });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My QR Codes</h1>
            <p className="text-gray-600">Manage all your QR codes in one place</p>
          </div>
          <Link to="/CreateQR">
            <Button>
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
              <div className="text-3xl font-bold text-primary">{dynamicCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Layout: Sidebar + Content */}
        <div className="flex gap-6 items-start">
          <aside className="w-56 shrink-0">
            <FoldersSidebar
              folders={allFolders}
              activeFolder={activeFolder}
              onFolderChange={setActiveFolder}
              onFoldersChange={handleFoldersChange}
              onFolderDelete={handleFolderDelete}
              onFolderRename={handleFolderRename}
            />
          </aside>

          <div className="flex-1 min-w-0">
            <Card>
              <CardHeader>
                <CardTitle>{allFolders.find(f => f.id === activeFolder)?.name || 'All QR Codes'}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : visibleQrCodes.length === 0 ? (
                  <div className="text-center py-12">
                    <QrCodeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {activeFolder === 'all' ? 'No QR codes yet' : 'No QR codes in this folder'}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {activeFolder === 'all' ? 'Create your first QR code to get started' : 'Move QR codes here by selecting them and using "Move to Folder"'}
                    </p>
                    {activeFolder === 'all' && (
                      <Link to="/CreateQR">
                        <Button>
                          <Plus className="w-4 h-4 mr-2" /> Create QR Code
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <QRCodeList
                    qrCodes={visibleQrCodes}
                    isPro={isPro}
                    folders={folders}
                    qrFolderMap={qrFolderMap}
                    onDelete={(id) => deleteQRMutation.mutate(id)}
                    onMoveToFolder={handleMoveToFolder}
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