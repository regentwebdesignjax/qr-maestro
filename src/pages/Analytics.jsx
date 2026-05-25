import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Lock, CalendarIcon, ScanLine, Users, Smartphone, Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format, subDays, subMonths, isWithinInterval, startOfDay, endOfDay, startOfToday, endOfToday, startOfYesterday, endOfYesterday } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import ScansOverTimeChart from '../components/analytics/ScansOverTimeChart';
import ScanMap from '../components/analytics/ScanMap';
import ScanLocationsTable from '../components/analytics/ScanLocationsTable';
import TimeOfDayHeatmap from '../components/analytics/TimeOfDayHeatmap';

const PRESETS = [
  { value: 'today', label: 'Today', pro: false },
  { value: 'yesterday', label: 'Yesterday', pro: false },
  { value: '7d', label: 'Last 7 Days', pro: false },
  { value: '14d', label: 'Last 14 Days', pro: false },
  { value: '30d', label: 'Last 30 Days', pro: false },
  { value: '60d', label: 'Last 60 Days', pro: false },
  { value: '90d', label: 'Last 90 Days', pro: false },
  { value: '12mo', label: 'Last 12 Months', pro: true },
  { value: '24mo', label: 'Last 24 Months', pro: true },
  { value: 'lifetime', label: 'Lifetime', pro: true },
  { value: 'custom', label: 'Custom Date Range', pro: true },
];

function getDateRange(preset) {
  const now = new Date();
  switch (preset) {
    case 'today': return { from: startOfToday(), to: endOfToday() };
    case 'yesterday': return { from: startOfYesterday(), to: endOfYesterday() };
    case '7d': return { from: subDays(now, 6), to: now };
    case '14d': return { from: subDays(now, 13), to: now };
    case '30d': return { from: subDays(now, 29), to: now };
    case '60d': return { from: subDays(now, 59), to: now };
    case '90d': return { from: subDays(now, 89), to: now };
    case '12mo': return { from: subMonths(now, 12), to: now };
    case '24mo': return { from: subMonths(now, 24), to: now };
    case 'lifetime': return { from: new Date('2000-01-01'), to: now };
    default: return { from: subDays(now, 29), to: now };
  }
}

const OS_COLORS = {
  'iOS': 'bg-gray-800',
  'Android': 'bg-green-500',
  'Windows': 'bg-blue-500',
  'macOS': 'bg-purple-500',
  'Linux': 'bg-orange-500',
  'Windows Phone': 'bg-blue-400',
  'Other': 'bg-gray-400',
  'Unknown': 'bg-gray-300',
};

export default function Analytics() {
  const [qrCode, setQrCode] = useState(null);
  const [scans, setScans] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState('30d');
  const [customRange, setCustomRange] = useState(null);
  const [calOpen, setCalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');
      if (!id) { window.location.href = '/Dashboard'; return; }

      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        const isPro = currentUser.role === 'admin' ||
          (currentUser.subscription_tier === 'pro' && currentUser.subscription_status === 'active');
        if (!isPro) { setLoading(false); return; }

        const qrCodes = await base44.entities.QRCode.filter({ id });
        if (qrCodes.length === 0) { window.location.href = '/Dashboard'; return; }
        const qr = qrCodes[0];
        // Ownership: accept owner_email match, or created_by match (by email or user ID), or admin
        const isOwner = qr.owner_email === currentUser.email ||
          qr.created_by === currentUser.email ||
          qr.created_by === currentUser.id;
        if (!isOwner && currentUser.role !== 'admin') {
          window.location.href = '/MyQRCodes';
          return;
        }
        setQrCode(qr);

        console.log(`Analytics Page fetching scans for ID: ${id}`);
        const scanResponse = await base44.functions.invoke('getScans', { qr_code_id: id });
        const receivedScans = scanResponse.data?.scans || [];
        console.log(`Analytics Page received ${receivedScans.length} scans from backend for ID ${id}`, receivedScans);
        if (receivedScans.length > 0) {
          console.log('First scan sample:', JSON.stringify(receivedScans[0]));
          console.log('First scan created_date parsed:', new Date(receivedScans[0].created_date).toString());
        }
        console.log('Processed Scans Array:', receivedScans);
        setScans(receivedScans);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const isPro = user?.role === 'admin' || (user?.subscription_tier === 'pro' && user?.subscription_status === 'active');

  const dateRange = useMemo(() => {
    if (preset === 'custom' && customRange?.from) return customRange;
    return getDateRange(preset);
  }, [preset, customRange]);

  const filteredScans = useMemo(() => {
    // new Date(utcString) converts to local time automatically.
    // startOfDay/endOfDay operate in local time, so this filter is timezone-correct.
    const rangeStart = startOfDay(dateRange.from);
    const rangeEnd = endOfDay(dateRange.to || dateRange.from);

    const result = scans.filter(scan => {
      if (!scan.created_date) return false;
      // The DB returns strings like "2026-04-20T02:19:07.574000" WITHOUT a Z suffix.
      // Without Z, browsers parse this as LOCAL time instead of UTC — causing wrong results.
      // Force UTC parsing by appending Z if not already present.
      const rawDate = scan.created_date.endsWith('Z') ? scan.created_date : scan.created_date + 'Z';
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return false;
      return d >= rangeStart && d <= rangeEnd;
    });
    console.log(`Date filter [${rangeStart.toISOString()} → ${rangeEnd.toISOString()}]: ${scans.length} total → ${result.length} filtered`);
    return result;
  }, [scans, dateRange]);

  const uniqueScanners = useMemo(() => {
    // Approximate unique scanners by grouping by device_type + browser + country combo
    const seen = new Set(filteredScans.map(s => `${s.browser}|${s.device_type}|${s.country}`));
    return seen.size;
  }, [filteredScans]);

  const osStats = useMemo(() => filteredScans.reduce((acc, scan) => {
    const os = scan.os || 'Unknown';
    acc[os] = (acc[os] || 0) + 1;
    return acc;
  }, {}), [filteredScans]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/Dashboard">
            <Button variant="ghost" className="mb-6"><ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard</Button>
          </Link>
          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <Lock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics Available on Pro Plan</h2>
                <p className="text-gray-600 mb-6">Upgrade to Pro to access detailed scan analytics, location data, and insights.</p>
                <Link to="/Pricing"><Button className="bg-blue-600 hover:bg-blue-700">Upgrade to Pro</Button></Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handlePresetChange = (value) => {
    if (value === 'custom') {
      setCalOpen(true);
    }
    setPreset(value);
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const response = await base44.functions.invoke('exportAnalytics', {
        qr_code_id: qrCode.id,
        start_date: dateRange.from.toISOString(),
        end_date: (dateRange.to || dateRange.from).toISOString(),
        format,
        date_label: dateRangeLabel,
      });
      const blob = new Blob(
        [response.data],
        { type: format === 'pdf' ? 'application/pdf' : 'text/csv' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(qrCode.name || 'analytics').replace(/[^a-z0-9_\-]/gi, '_')}_analytics.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const dateRangeLabel = preset === 'custom' && customRange?.from
    ? `${format(customRange.from, 'MMM d, yyyy')}${customRange.to ? ` – ${format(customRange.to, 'MMM d, yyyy')}` : ''}`
    : PRESETS.find(p => p.value === preset)?.label;

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="w-full mx-auto px-4 pt-8">
        <Link to="/Dashboard">
          <Button variant="ghost" className="mb-6"><ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard</Button>
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-500 text-sm mt-0.5">{qrCode?.name}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 bg-white" disabled={exporting || !qrCode}>
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('pdf')} className="gap-2 cursor-pointer">
                  <FileText className="w-4 h-4 text-red-500" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')} className="gap-2 cursor-pointer">
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  Export as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Select value={preset} onValueChange={handlePresetChange}>
              <SelectTrigger className="w-[200px] bg-white">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                {PRESETS.map(p => (
                  <SelectItem key={p.value} value={p.value} disabled={p.pro && !isPro}>
                    <div className="flex items-center gap-2">
                      <span>{p.label}</span>
                      {p.pro && !isPro && <Lock className="w-3 h-3 text-gray-400" />}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Custom date range picker */}
            {preset === 'custom' && (
              <Popover open={calOpen} onOpenChange={setCalOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2 bg-white">
                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                    {customRange?.from
                      ? `${format(customRange.from, 'MMM d')}${customRange.to ? ` – ${format(customRange.to, 'MMM d')}` : ''}`
                      : 'Pick dates'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-auto p-0">
                  <Calendar
                    mode="range"
                    selected={customRange}
                    onSelect={(range) => {
                      if (!range?.from) return;
                      setCustomRange(range);
                      if (range.from && range.to) setCalOpen(false);
                    }}
                    initialFocus
                    disabled={[{ after: new Date() }]}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        {/* Summary stat cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6 pb-5">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-blue-50 rounded-xl">
                  <ScanLine className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-0.5">Total Scans</p>
                  <p className="text-3xl font-bold text-gray-900">{filteredScans.length}</p>
                  <p className="text-xs text-gray-400 mt-1">{dateRangeLabel}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6 pb-5">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-purple-50 rounded-xl">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-0.5">Unique Scanners</p>
                  <p className="text-3xl font-bold text-gray-900">{uniqueScanners}</p>
                  <p className="text-xs text-gray-400 mt-1">Estimated unique devices</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scans Over Time */}
        <div className="mb-6">
          <ScansOverTimeChart scans={filteredScans} dateRange={{ from: dateRange.from, to: dateRange.to || dateRange.from }} />
        </div>

        {/* Scans by Devices Used and Scans by Time of Day — side by side */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Scans by Devices Used */}
          <div>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-500" />
                  Scans by Devices Used
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(osStats).length > 0 ? (
                  <div className="space-y-6">
                    {/* Pie Chart */}
                    <div className="flex justify-center">
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={Object.entries(osStats).map(([os, count]) => ({ name: os, value: count }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={75}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {Object.entries(osStats).map(([os], index) => (
                              <Cell key={`cell-${index}`} fill={OS_COLORS[os]?.replace('bg-', '').replace('500', '500').replace('800', '800') === 'gray' ? '#6b7280' : OS_COLORS[os]?.split('bg-')[1]?.split(' ')[0] === 'gray' ? (OS_COLORS[os].includes('800') ? '#1f2937' : '#9ca3af') : (OS_COLORS[os].includes('blue') ? '#3b82f6' : OS_COLORS[os].includes('green') ? '#22c55e' : OS_COLORS[os].includes('purple') ? '#a855f7' : OS_COLORS[os].includes('orange') ? '#f97316' : OS_COLORS[os].includes('400') ? '#60a5fa' : '#6b7280')} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Bar Chart Data */}
                    <div className="space-y-4">
                      {Object.entries(osStats)
                        .sort(([, a], [, b]) => b - a)
                        .map(([os, count]) => {
                          const pct = Math.round((count / filteredScans.length) * 100);
                          const barColor = OS_COLORS[os] || 'bg-gray-400';
                          return (
                            <div key={os}>
                              <div className="flex items-center justify-between text-sm mb-1.5">
                                <span className="text-gray-700 font-medium">{os}</span>
                                <span className="font-semibold text-gray-800">
                                  {count} <span className="text-gray-400 font-normal text-xs">({pct}%)</span>
                                </span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2.5">
                                <div className={`${barColor} h-2.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm italic">No OS data for this period.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Scans by Time of Day */}
          <div>
            <TimeOfDayHeatmap scans={filteredScans} />
          </div>
        </div>

        {/* Scan Locations Table and Map */}
        <ScanLocationsTable scans={filteredScans} />
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Scans by Location</h2>
          <ScanMap scans={filteredScans} />
        </div>
      </div>
    </div>
  );
}