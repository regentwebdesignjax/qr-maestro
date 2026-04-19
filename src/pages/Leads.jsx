import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Users, Mail, Calendar, FilterX, Trash2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

// Returns a map of email -> [all leads with that email] for emails with >1 entry
function getDupeGroups(leads) {
  const groups = {};
  leads.forEach(l => {
    const key = l.lead_email?.toLowerCase().trim();
    if (!key) return;
    if (!groups[key]) groups[key] = [];
    groups[key].push(l);
  });
  return Object.fromEntries(Object.entries(groups).filter(([, arr]) => arr.length > 1));
}

function exportToCSV(leads) {
  const header = ['Name', 'Email', 'Source Card', 'Lead Tag', 'Date'];
  const rows = leads.map(l => [
    `"${(l.lead_name || '').replace(/"/g, '""')}"`,
    `"${(l.lead_email || '').replace(/"/g, '""')}"`,
    `"${(l.qr_code_name || '').replace(/"/g, '""')}"`,
    `"${(l.lead_tag || '').replace(/"/g, '""')}"`,
    `"${l.created_date ? format(new Date(l.created_date), 'yyyy-MM-dd HH:mm') : ''}"`,
  ]);
  const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leads.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function ConfirmModal({ open, title, description, warning, confirmLabel, onConfirm, onCancel, loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-full bg-red-50 shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
            {warning && <p className="text-sm font-semibold text-red-600 mt-2">{warning}</p>}
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <Button variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DedupeModal({ open, dupeGroups, onConfirm, onCancel, loading }) {
  const [selected, setSelected] = useState({});

  // When modal opens, pre-select all duplicates except the first (oldest) in each group
  useEffect(() => {
    if (!open) return;
    const initial = {};
    Object.values(dupeGroups).forEach(group => {
      // Sort oldest first so we keep the first submission
      const sorted = [...group].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      sorted.slice(1).forEach(l => { initial[l.id] = true; });
    });
    setSelected(initial);
  }, [open, dupeGroups]);

  const selectedIds = Object.keys(selected).filter(id => selected[id]);
  const toggle = (id) => setSelected(prev => ({ ...prev, [id]: !prev[id] }));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-amber-50 shrink-0">
              <FilterX className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Review Duplicate Leads</h2>
              <p className="text-sm text-gray-500 mt-1">
                Duplicates are grouped by email. Check the entries you want to <strong>delete</strong>, then confirm.
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable groups */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {Object.entries(dupeGroups).map(([email, group]) => {
            const sorted = [...group].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
            return (
              <div key={email} className="border rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email: </span>
                  <span className="text-sm font-medium text-gray-800">{email}</span>
                  <span className="ml-2 text-xs text-gray-400">({group.length} entries)</span>
                </div>
                <div className="divide-y">
                  {sorted.map((lead, idx) => {
                    const isFirst = idx === 0;
                    const isChecked = !!selected[lead.id];
                    return (
                      <label
                        key={lead.id}
                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                          isChecked ? 'bg-red-50' : isFirst ? 'bg-green-50/50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggle(lead.id)}
                          className="mt-1 accent-red-600"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm text-gray-900">{lead.lead_name}</span>
                            {isFirst && (
                              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">Keep (oldest)</span>
                            )}
                            {isChecked && (
                              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">Will delete</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5 text-xs text-gray-400">
                            {lead.qr_code_name && <span>Card: {lead.qr_code_name}</span>}
                            {lead.lead_tag && <span>Tag: {lead.lead_tag}</span>}
                            {lead.created_date && <span>{format(new Date(lead.created_date), 'MMM d, yyyy h:mm a')}</span>}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
          {selectedIds.length > 0 && (
            <p className="text-xs text-red-600 font-medium mb-3">
              ⚠ {selectedIds.length} lead{selectedIds.length !== 1 ? 's' : ''} selected for permanent deletion. This cannot be undone.
            </p>
          )}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => onConfirm(selectedIds)}
              disabled={loading || selectedIds.length === 0}
            >
              {loading ? 'Deleting...' : `Delete ${selectedIds.length} Selected`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Leads() {
  const [user, setUser] = useState(null);
  const [hasExported, setHasExported] = useState(false);
  const [showDedupeModal, setShowDedupeModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => base44.auth.redirectToLogin('/Leads'));
  }, []);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads', user?.email],
    queryFn: () => base44.entities.Lead.filter({ user_email: user.email }, '-created_date'),
    enabled: !!user,
  });

  const isPro = user?.role === 'admin' || (user?.subscription_tier === 'pro' && user?.subscription_status === 'active');
  const dupeGroups = useMemo(() => getDupeGroups(leads), [leads]);
  const dupeEmailCount = Object.keys(dupeGroups).length;

  const handleExport = () => {
    exportToCSV(leads);
    setHasExported(true);
  };

  const handleDeleteSelected = async (ids) => {
    setDeleting(true);
    for (const id of ids) {
      await base44.entities.Lead.delete(id);
    }
    setDeleting(false);
    setShowDedupeModal(false);
    queryClient.invalidateQueries({ queryKey: ['leads', user?.email] });
  };

  const handleClearAll = async () => {
    setDeleting(true);
    for (const lead of leads) {
      await base44.entities.Lead.delete(lead.id);
    }
    setDeleting(false);
    setShowClearModal(false);
    setHasExported(false);
    queryClient.invalidateQueries({ queryKey: ['leads', user?.email] });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Lead Capture is a Pro Feature</h2>
            <p className="text-muted-foreground mb-4">Upgrade to collect leads from your Digital Business Cards.</p>
            <a href="/Pricing">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Upgrade to Pro</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DedupeModal
        open={showDedupeModal}
        dupeGroups={dupeGroups}
        onConfirm={handleDeleteSelected}
        onCancel={() => setShowDedupeModal(false)}
        loading={deleting}
      />
      <ConfirmModal
        open={showClearModal}
        title={`Clear All ${leads.length} Lead${leads.length !== 1 ? 's' : ''}?`}
        description={`This will permanently delete all ${leads.length} lead submission${leads.length !== 1 ? 's' : ''} from your account.`}
        warning="This action cannot be undone. All leads will be permanently lost."
        confirmLabel="Clear All Leads"
        onConfirm={handleClearAll}
        onCancel={() => setShowClearModal(false)}
        loading={deleting}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
            <p className="text-gray-500 mt-1">Contacts collected via your Digital Business Cards</p>
          </div>
          {leads.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {dupeEmailCount > 0 && (
                <Button variant="outline" onClick={() => setShowDedupeModal(true)}>
                  <FilterX className="w-4 h-4 mr-2" />
                  Review Dupes ({dupeEmailCount} email{dupeEmailCount !== 1 ? 's' : ''})
                </Button>
              )}
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => hasExported && setShowClearModal(true)}
                title={!hasExported ? 'Export the list first to enable this' : 'Permanently delete all leads'}
                className={hasExported
                  ? 'border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400'
                  : 'border-gray-200 text-gray-400 cursor-not-allowed'}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All {!hasExported && <span className="text-xs ml-1">(export first)</span>}
              </Button>
            </div>
          )}
        </div>

        {!hasExported && leads.length > 0 && (
          <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Export your leads first to enable the "Clear All" option.
          </p>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {leads.length} Lead{leads.length !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No leads yet</p>
                <p className="text-sm text-gray-400 mt-1">Leads appear when someone submits the "Exchange Info" form on your Digital Business Card.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium">Name</th>
                      <th className="pb-3 pr-4 font-medium">Email</th>
                      <th className="pb-3 pr-4 font-medium">Source Card</th>
                      <th className="pb-3 pr-4 font-medium">Lead Tag</th>
                      <th className="pb-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map(lead => (
                      <tr key={lead.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3 pr-4 font-medium text-gray-900">{lead.lead_name}</td>
                        <td className="py-3 pr-4">
                          <a href={`mailto:${lead.lead_email}`} className="text-primary hover:underline flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {lead.lead_email}
                          </a>
                        </td>
                        <td className="py-3 pr-4 text-gray-600">{lead.qr_code_name || '—'}</td>
                        <td className="py-3 pr-4">
                          {lead.lead_tag ? (
                            <span className="inline-block bg-secondary text-secondary-foreground text-xs font-medium px-2 py-0.5 rounded">
                              {lead.lead_tag}
                            </span>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="py-3 text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {lead.created_date ? format(new Date(lead.created_date), 'MMM d, yyyy') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}