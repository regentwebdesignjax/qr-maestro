import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Users, Mail, Calendar, FilterX } from 'lucide-react';
import { format } from 'date-fns';

function deduplicateLeads(leads) {
  const seen = new Set();
  return leads.filter(l => {
    const key = l.lead_email?.toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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

export default function Leads() {
  const [user, setUser] = useState(null);
  const [dedupeOnly, setDedupeOnly] = useState(false);

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
  const displayLeads = dedupeOnly ? deduplicateLeads(leads) : leads;
  const dupeCount = leads.length - deduplicateLeads(leads).length;

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
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
            <p className="text-gray-500 mt-1">Contacts collected via your Digital Business Cards</p>
          </div>
          {leads.length > 0 && (
            <div className="flex items-center gap-2">
              {dupeCount > 0 && (
                <Button
                  variant={dedupeOnly ? 'default' : 'outline'}
                  onClick={() => setDedupeOnly(v => !v)}
                  className={dedupeOnly ? 'bg-primary text-primary-foreground' : ''}
                >
                  <FilterX className="w-4 h-4 mr-2" />
                  {dedupeOnly ? `Deduped (${dupeCount} removed)` : `Deduplicate (${dupeCount} dupes)`}
                </Button>
              )}
              <Button variant="outline" onClick={() => exportToCSV(displayLeads)}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {displayLeads.length} Lead{displayLeads.length !== 1 ? 's' : ''}
              {dedupeOnly && <span className="text-xs font-normal text-muted-foreground ml-1">(deduplicated)</span>}
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
                    {displayLeads.map(lead => (
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