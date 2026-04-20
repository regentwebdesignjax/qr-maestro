import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, QrCode as QrCodeIcon, FolderOpen, Layers } from 'lucide-react';
import QRCodeList from '../components/qr/QRCodeList';
import FoldersSidebar from '../components/qr/FoldersSidebar';
import QRMobileCard from '../components/qr/QRMobileCard';

export default function MyQRCodes() {
  const [user, setUser] = useState(null);
  const [activeFolder, setActiveFolder] = useState('all');
  const [showFolders, setShowFolders] = useState(false);
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
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">My QR Codes</h1>
            <p className="text-sm text-gray-600">Manage all your QR codes</p>
          </div>
          <div className="flex gap-2">
            {isPro && (
              <Link to="/BulkCreate">
                <Button variant="outline" className="h-11">
                  <Layers className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Bulk Create</span>
                  <span className="sm:hidden">Bulk</span>
                </Button>
              </Link>
            )}
            <Link to="/CreateQR">
              <Button className="h-11">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Create New</span>
                <span className="sm:hidden">New</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-gray-600">Total</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold">{qrCodes.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-gray-600">Static</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold text-gray-700">
                {staticCount}
                {!isPro && <span className="text-sm text-gray-500"> / 3</span>}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-gray-600">Dynamic</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold text-primary">{dynamicCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile: Folder toggle */}
        <div className="md:hidden mb-3">
          <Button variant="outline" size="sm" className="h-10 gap-2" onClick={() => setShowFolders(v => !v)}>
            <FolderOpen className="w-4 h-4" />
            {allFolders.find(f => f.id === activeFolder)?.name || 'All QR Codes'}
          </Button>
          {showFolders && (
            <div className="mt-2 border rounded-xl overflow-hidden bg-white">
              <FoldersSidebar
                folders={allFolders}
                activeFolder={activeFolder}
                onFolderChange={(f) => { setActiveFolder(f); setShowFolders(false); }}
                onFoldersChange={handleFoldersChange}
                onFolderDelete={handleFolderDelete}
                onFolderRename={handleFolderRename}
              />
            </div>
          )}
        </div>

        {/* Main Layout: Sidebar + Content */}
        <div className="flex gap-6 items-start">
          <aside className="w-56 shrink-0 hidden md:block">
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
            {/* Desktop: Table view */}
            <Card className="hidden md:block">
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
                        <Button><Plus className="w-4 h-4 mr-2" /> Create QR Code</Button>
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

            {/* Mobile: Card list */}
            <div className="md:hidden space-y-3">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : visibleQrCodes.length === 0 ? (
                <div className="text-center py-12">
                  <QrCodeIcon className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-base font-medium text-gray-900 mb-2">No QR codes yet</h3>
                  <Link to="/CreateQR">
                    <Button className="h-11"><Plus className="w-4 h-4 mr-2" /> Create QR Code</Button>
                  </Link>
                </div>
              ) : (
                visibleQrCodes.map(qr => (
                  <QRMobileCard
                    key={qr.id}
                    qr={qr}
                    isPro={isPro}
                    onDelete={(id) => deleteQRMutation.mutate(id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}