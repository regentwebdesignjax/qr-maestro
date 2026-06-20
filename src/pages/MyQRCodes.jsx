import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Lock, QrCode as QrCodeIcon, FolderOpen, Layers, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import QRCodeList from '../components/qr/QRCodeList';
import FoldersSidebar from '../components/qr/FoldersSidebar';
import QRMobileCard from '../components/qr/QRMobileCard';

const PAGE_SIZE_KEY = 'qr_codes_page_size';
const PAGE_SIZE_OPTIONS = [25, 50, 75, 100];

export default function MyQRCodes() {
  const [user, setUser] = useState(null);
  const [activeFolder, setActiveFolder] = useState('all');
  const [showFolders, setShowFolders] = useState(false);
  const [customDomainBase, setCustomDomainBase] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem(PAGE_SIZE_KEY);
    return saved ? parseInt(saved, 10) : 25;
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        // Fetch active custom domain so QR thumbnails encode the branded URL
        const domainRes = await base44.functions.invoke('checkDomainStatus', {}).catch(() => null);
        const domain = domainRes?.data?.customDomain;
        if (domain?.status === 'active' && domain?.hostname) {
          const customDomainBase = `https://${domain.hostname}`;
          setCustomDomainBase(customDomainBase);

          // Auto-update any old dynamic QRs that don't have redirect_base_url set.
          // This ensures old QRs created before custom domain support get the domain injected
          // for proper rendering and downloads. Note: their yellow camera badges will still
          // show qr-sensei.com (encoding from creation time), but downloads/previews will be correct.
          try {
            // Find all user's dynamic QRs without redirect_base_url
            const qrCodes = await base44.entities.QRCode.filter({ created_by: currentUser.email });
            const oldQRs = qrCodes.filter(
              qr => qr.type === 'dynamic' && !qr.redirect_base_url
            );

            if (oldQRs.length > 0) {
              console.log(`[MyQRCodes] Found ${oldQRs.length} old QRs without custom domain, updating them`);
              // Update all old QRs with the custom domain
              await Promise.all(
                oldQRs.map(qr =>
                  base44.entities.QRCode.update(qr.id, { redirect_base_url: customDomainBase })
                    .catch(err => console.warn(`[MyQRCodes] Failed to update QR ${qr.id}:`, err))
                )
              );
              console.log(`[MyQRCodes] Updated ${oldQRs.length} old QRs with custom domain`);
              // Trigger a refetch of QR codes to reflect the updates
              queryClient.invalidateQueries({ queryKey: ['qr-codes'] });
            }
          } catch (err) {
            console.warn('[MyQRCodes] Error auto-updating old QRs:', err);
            // This is not critical — the injection in components handles the display
          }
        }
      } catch {
        base44.auth.redirectToLogin('/MyQRCodes');
      }
    };
    fetchUser();
  }, [queryClient]);

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

  const isPro = user ? (user.role === 'admin' || (user.subscription_tier === 'pro' && user.subscription_status === 'active')) : false;
  const subActive = user ? (user.role === 'admin' || user.subscription_tier !== 'pro' || user.subscription_status === 'active') : false;
  const staticCount = qrCodes.filter(qr => qr.type === 'static').length;
  const dynamicCount = qrCodes.filter(qr => qr.type === 'dynamic').length;
  const canCreateStatic = isPro || staticCount < 10;

  const filteredQrCodes = (() => {
    let result = activeFolder === 'all'
      ? qrCodes
      : qrCodes.filter(qr => qrFolderMap[qr.id] === activeFolder);

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(qr => qr.name.toLowerCase().includes(term));
    }

    return result;
  })();

  const handleSort = (column) => {
    if (sortColumn !== column) {
      setSortColumn(column);
      setSortDirection('asc');
    } else if (sortDirection === 'asc') {
      setSortDirection('desc');
    } else {
      setSortColumn(null);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const sortedQrCodes = useMemo(() => {
    if (!sortColumn) return filteredQrCodes;
    return [...filteredQrCodes].sort((a, b) => {
      let aVal, bVal;
      switch (sortColumn) {
        case 'name':
          aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); break;
        case 'type':
          aVal = a.type; bVal = b.type; break;
        case 'content_type':
          aVal = a.content_type; bVal = b.content_type; break;
        case 'folder': {
          const aFolder = folders.find(f => f.id === qrFolderMap[a.id]);
          const bFolder = folders.find(f => f.id === qrFolderMap[b.id]);
          aVal = (aFolder?.name || '').toLowerCase();
          bVal = (bFolder?.name || '').toLowerCase();
          break;
        }
        case 'scans':
          aVal = a.scan_count || 0; bVal = b.scan_count || 0; break;
        case 'created':
          aVal = new Date(a.created_date); bVal = new Date(b.created_date); break;
        default: return 0;
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredQrCodes, sortColumn, sortDirection, folders, qrFolderMap]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(sortedQrCodes.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const visibleQrCodes = sortedQrCodes.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handlePageSizeChange = (val) => {
    const newSize = parseInt(val, 10);
    localStorage.setItem(PAGE_SIZE_KEY, String(newSize));
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFolderChange = (folder) => {
    setActiveFolder(folder);
    setCurrentPage(1);
  };

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
      <div className="w-full mx-auto px-4 sm:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My QR Codes</h1>
              <Badge variant={isPro ? 'default' : 'secondary'} className="text-sm">
                {isPro ? 'Black Belt' : 'White Belt'}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">Manage all your QR codes</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="w-full sm:w-80">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search QR codes..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 pr-8 h-10 rounded-xl"
                />
                {searchTerm && (
                  <button
                    onClick={() => handleSearchChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
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
              {canCreateStatic ? (
                <Link to="/CreateQR">
                  <Button className="h-11">
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Create New</span>
                    <span className="sm:hidden">New</span>
                  </Button>
                </Link>
              ) : (
                <Link to="/Pricing">
                  <Button className="h-11 bg-gray-400 hover:bg-gray-400 cursor-not-allowed" disabled>
                    <Lock className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Limit Reached — Upgrade</span>
                    <span className="sm:hidden">Upgrade</span>
                  </Button>
                </Link>
              )}
            </div>
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
                {!isPro && <span className="text-sm text-gray-500"> / 10</span>}
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
                onFolderChange={(f) => { handleFolderChange(f); setShowFolders(false); }}
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
              onFolderChange={handleFolderChange}
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
                  <>
                    <QRCodeList
                      qrCodes={visibleQrCodes}
                      isPro={isPro}
                      subActive={subActive}
                      folders={folders}
                      qrFolderMap={qrFolderMap}
                      onDelete={(id) => deleteQRMutation.mutate(id)}
                      onMoveToFolder={handleMoveToFolder}
                      customDomainBase={customDomainBase}
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    {sortedQrCodes.length > 25 && (
                      <div className="flex items-center justify-between pt-4 mt-2 border-t">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>Show</span>
                          <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                            <SelectTrigger className="h-8 w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PAGE_SIZE_OPTIONS.map(s => (
                                <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span>per page</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            Page {safePage} of {totalPages}
                          </span>
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
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
                <>
                  {visibleQrCodes.map(qr => (
                    <QRMobileCard
                      key={qr.id}
                      qr={qr}
                      isPro={isPro}
                      onDelete={(id) => deleteQRMutation.mutate(id)}
                      customDomainBase={customDomainBase}
                    />
                  ))}
                  {sortedQrCodes.length > 25 && (
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                          <SelectTrigger className="h-8 w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PAGE_SIZE_OPTIONS.map(s => (
                              <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span>per page</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{safePage}/{totalPages}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}