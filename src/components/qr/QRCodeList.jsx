import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit, Trash2, BarChart3, ExternalLink, Download, Pencil, Check, X, FolderInput, Folder } from 'lucide-react';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { downloadQRPng } from '@/utils/qrExport';

const formatContentType = (type) => ({ url: 'URL', text: 'Text', wifi: 'WiFi', vcard: 'vCard' }[type] || type);

export default function QRCodeList({ qrCodes, isPro, subActive = true, onDelete, folders = [], qrFolderMap = {}, onMoveToFolder }) {
  const [selected, setSelected] = useState(new Set());
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const queryClient = useQueryClient();

  const assignableFolders = folders.filter(f => f.id !== 'all');

  // Bulk delete
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => Promise.all(ids.map(id => base44.entities.QRCode.delete(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes'] });
      setSelected(new Set());
    },
  });

  // Inline rename
  const renameMutation = useMutation({
    mutationFn: ({ id, name }) => base44.entities.QRCode.update(id, { name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['qr-codes'] }),
  });

  const allSelected = qrCodes.length > 0 && selected.size === qrCodes.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(qrCodes.map(qr => qr.id)));
  const toggleOne = (id) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selected.size} QR code(s)?`)) bulkDeleteMutation.mutate([...selected]);
  };

  const handleBulkDownload = async () => {
    for (const id of selected) {
      const qr = qrCodes.find(q => q.id === id);
      if (!qr) continue;
      await downloadQRPng(qr);
    }
  };

  const handleDownload = async (qr) => {
    await downloadQRPng(qr);
  };

  const startEdit = (qr) => { setEditingId(qr.id); setEditingName(qr.name); };
  const commitEdit = (id) => {
    if (editingName.trim()) renameMutation.mutate({ id, name: editingName.trim() });
    setEditingId(null);
  };
  const cancelEdit = () => setEditingId(null);

  const handleBulkMove = (folderId) => {
    onMoveToFolder([...selected], folderId);
    setSelected(new Set());
  };

  const handleSingleMove = (qrId, folderId) => {
    onMoveToFolder([qrId], folderId);
  };

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Content Type</TableHead>
              <TableHead>Folder</TableHead>
              <TableHead>Scans</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {qrCodes.map((qr) => {
              const currentFolderId = qrFolderMap[qr.id];
              const currentFolder = folders.find(f => f.id === currentFolderId);

              return (
                <TableRow key={qr.id} className={selected.has(qr.id) ? 'bg-primary/5' : ''}>
                  <TableCell>
                    <Checkbox checked={selected.has(qr.id)} onCheckedChange={() => toggleOne(qr.id)} />
                  </TableCell>
                  <TableCell className="font-medium">
                    {editingId === qr.id ? (
                      <div className="flex items-center gap-1">
                        <Input autoFocus value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(qr.id); if (e.key === 'Escape') cancelEdit(); }}
                          className="h-7 text-sm" />
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => commitEdit(qr.id)}>
                          <Check className="w-3.5 h-3.5 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelEdit}>
                          <X className="w-3.5 h-3.5 text-gray-400" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 group">
                        <span>{qr.name}</span>
                        <button onClick={() => startEdit(qr)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Pencil className="w-3.5 h-3.5 text-gray-400 hover:text-gray-700" />
                        </button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant={qr.type === 'dynamic' ? 'default' : 'secondary'}>
                        {qr.type === 'static' ? 'Static' : 'Dynamic'}
                      </Badge>
                      {qr.type === 'dynamic' && !subActive && (
                        <Badge variant="destructive" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatContentType(qr.content_type)}</TableCell>

                  {/* Folder Cell */}
                  <TableCell>
                    {assignableFolders.length > 0 ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors">
                            <Folder className="w-3.5 h-3.5" />
                            <span>{currentFolder ? currentFolder.name : <span className="italic text-gray-400">None</span>}</span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuLabel>Move to folder</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {currentFolderId && (
                            <DropdownMenuItem onClick={() => handleSingleMove(qr.id, 'all')}>
                              <X className="w-4 h-4 mr-2 text-gray-400" /> Remove from folder
                            </DropdownMenuItem>
                          )}
                          {assignableFolders.map(folder => (
                            <DropdownMenuItem key={folder.id} onClick={() => handleSingleMove(qr.id, folder.id)}
                              className={currentFolderId === folder.id ? 'font-semibold text-primary' : ''}>
                              <Folder className="w-4 h-4 mr-2" /> {folder.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <span className="text-xs text-gray-400 italic">No folders</span>
                    )}
                  </TableCell>

                  <TableCell>
                    {qr.type === 'static' ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="italic text-gray-400 text-sm">Untrackable</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Static QR codes cannot be tracked. Upgrade to Pro for dynamic, trackable codes.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{qr.scan_count || 0}</span>
                        {isPro && (
                          <Link to={'/Analytics?id=' + qr.id}>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <BarChart3 className="w-3 h-3" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {format(new Date(qr.created_date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {qr.type === 'dynamic' && (
                        <Link to={'/EditQR?id=' + qr.id}>
                          <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                        </Link>
                      )}
                      <Link to={'/ViewQR?id=' + qr.id}>
                        <Button variant="ghost" size="sm"><ExternalLink className="w-4 h-4" /></Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => handleDownload(qr)} title="Download">
                        <Download className="w-4 h-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { if (confirm('Delete this QR code?')) onDelete(qr.id); }}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Floating Bulk Action Bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="w-px h-5 bg-gray-600" />

          {/* Bulk Move to Folder */}
          {assignableFolders.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="text-white hover:bg-gray-700 hover:text-white gap-2">
                  <FolderInput className="w-4 h-4" /> Move to Folder
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" side="top" className="mb-2">
                <DropdownMenuLabel>Move {selected.size} item(s) to…</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleBulkMove('all')}>
                  <X className="w-4 h-4 mr-2 text-gray-400" /> Remove from folder
                </DropdownMenuItem>
                {assignableFolders.map(folder => (
                  <DropdownMenuItem key={folder.id} onClick={() => handleBulkMove(folder.id)}>
                    <Folder className="w-4 h-4 mr-2" /> {folder.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button size="sm" variant="ghost" className="text-white hover:bg-gray-700 hover:text-white gap-2" onClick={handleBulkDownload}>
            <Download className="w-4 h-4" /> Bulk Download
          </Button>
          <Button size="sm" variant="ghost" className="text-red-400 hover:bg-gray-700 hover:text-red-300 gap-2"
            onClick={handleBulkDelete} disabled={bulkDeleteMutation.isPending}>
            <Trash2 className="w-4 h-4" />
            {bulkDeleteMutation.isPending ? 'Deleting...' : 'Bulk Delete'}
          </Button>
          <button onClick={() => setSelected(new Set())} className="ml-1 text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}