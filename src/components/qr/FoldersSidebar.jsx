import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FolderOpen, Folder, Plus, Pencil, Trash2, Check, X } from 'lucide-react';

export default function FoldersSidebar({ folders, activeFolder, onFolderChange, onFoldersChange }) {
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const startEdit = (folder) => { setEditingId(folder.id); setEditingName(folder.name); };
  const cancelEdit = () => setEditingId(null);

  const commitEdit = (id) => {
    if (!editingName.trim()) return cancelEdit();
    onFoldersChange(folders.map(f => f.id === id ? { ...f, name: editingName.trim() } : f));
    setEditingId(null);
  };

  const deleteFolder = (id) => {
    if (activeFolder === id) onFolderChange('all');
    onFoldersChange(folders.filter(f => f.id !== id));
  };

  const commitAdd = () => {
    if (!newFolderName.trim()) return cancelAdd();
    onFoldersChange([...folders, { id: `folder_${Date.now()}`, name: newFolderName.trim(), locked: false }]);
    setNewFolderName('');
    setAddingNew(false);
  };

  const cancelAdd = () => { setNewFolderName(''); setAddingNew(false); };

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Folders</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        <nav className="space-y-0.5">
          {folders.map((folder) => {
            const isActive = activeFolder === folder.id;
            const Icon = folder.id === 'all' || isActive ? FolderOpen : Folder;

            if (editingId === folder.id) {
              return (
                <div key={folder.id} className="flex items-center gap-1 px-2 py-1">
                  <Input autoFocus value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(folder.id); if (e.key === 'Escape') cancelEdit(); }}
                    className="h-7 text-sm" />
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => commitEdit(folder.id)}>
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={cancelEdit}>
                    <X className="w-3.5 h-3.5 text-gray-400" />
                  </Button>
                </div>
              );
            }

            return (
              <div key={folder.id}
                className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                  isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => onFolderChange(folder.id)}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className="truncate flex-1">{folder.name}</span>
                {!folder.locked && (
                  <div className="hidden group-hover:flex items-center gap-0.5">
                    <button onClick={(e) => { e.stopPropagation(); startEdit(folder); }} className="p-0.5 rounded hover:text-blue-600">
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }} className="p-0.5 rounded hover:text-red-600">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {addingNew ? (
          <div className="flex items-center gap-1 px-2 mt-2">
            <Input autoFocus placeholder="Folder name" value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') commitAdd(); if (e.key === 'Escape') cancelAdd(); }}
              className="h-7 text-sm" />
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={commitAdd}>
              <Check className="w-3.5 h-3.5 text-green-600" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={cancelAdd}>
              <X className="w-3.5 h-3.5 text-gray-400" />
            </Button>
          </div>
        ) : (
          <div className="mt-3 px-3">
            <button onClick={() => setAddingNew(true)}
              className="w-full flex items-center gap-2 text-sm text-gray-400 hover:text-blue-600 transition-colors py-1">
              <Plus className="w-3.5 h-3.5" /> New Folder
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}