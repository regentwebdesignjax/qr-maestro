import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Lock, CalendarIcon } from 'lucide-react';
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import ScansOverTimeChart from '../components/analytics/ScansOverTimeChart';
import ScanMap from '../components/analytics/ScanMap';
import TimeOfDayHeatmap from '../components/analytics/TimeOfDayHeatmap';

const DEFAULT_RANGE = {
  from: subDays(new Date(), 29),
  to: new Date(),
};

export default function Analytics() {
  const [qrCode, setQrCode] = useState(null);
  const [scans, setScans] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(DEFAULT_RANGE);
  const [calOpen, setCalOpen] = useState(false);

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

        const qrCodes = await base44.entities.QRCode.filter({ id, created_by: currentUser.email });
        if (qrCodes.length === 0) { window.location.href = '/Dashboard'; return; }
        setQrCode(qrCodes[0]);

        const scanData = await base44.entities.Scan.filter({ qr_code_id: id });
        setScans(scanData);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isPro = user?.role === 'admin' || (user?.subscription_tier === 'pro' && user?.subscription_status === 'active');

  if (!isPro) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
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

  // Filter scans within selected date range
  const filteredScans = scans.filter(scan => {
    const d = new Date(scan.created_date);
    return isWithinInterval(d, {
      start: startOfDay(dateRange.from),
      end: endOfDay(dateRange.to || dateRange.from),
    });
  });

  const deviceStats = filteredScans.reduce((acc, scan) => {
    const device = scan.device_type || 'unknown';
    acc[device] = (acc[device] || 0) + 1;
    return acc;
  }, {});

  const topCountries = Object.entries(
    filteredScans.reduce((acc, scan) => {
      if (scan.country) acc[scan.country] = (acc[scan.country] || 0) + 1;
      return acc;
    }, {})
  ).sort(([, a], [, b]) => b - a).slice(0, 5);

  const effectiveRange = { from: dateRange.from, to: dateRange.to || dateRange.from };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <Link to="/Dashboard">
          <Button variant="ghost" className="mb-6"><ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard</Button>
        </Link>

        {/* Header + Date Range Picker */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Analytics</h1>
            <p className="text-gray-500">{qrCode?.name}</p>
          </div>

          <Popover open={calOpen} onOpenChange={setCalOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 min-w-[240px] justify-start font-normal">
                <CalendarIcon className="w-4 h-4 text-gray-400" />
                {dateRange.from && dateRange.to
                  ? `${format(dateRange.from, 'MMM d, yyyy')} – ${format(dateRange.to, 'MMM d, yyyy')}`
                  : dateRange.from
                  ? format(dateRange.from, 'MMM d, yyyy')
                  : 'Pick a date range'}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-0">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  if (range?.from) setDateRange(range);
                  if (range?.from && range?.to) setCalOpen(false);
                }}
                initialFocus
                disabled={{ after: new Date() }}
                numberOfMonths={2}
              />
              <div className="flex gap-2 p-3 border-t">
                {[7, 14, 30, 90].map(days => (
                  <Button key={days} size="sm" variant="outline"
                    onClick={() => { setDateRange({ from: subDays(new Date(), days - 1), to: new Date() }); setCalOpen(false); }}>
                    {days}d
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Scans (All Time)</CardTitle>
            </CardHeader>
            <CardContent><div className="text-3xl font-bold">{scans.length}</div></CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">In Range</CardTitle>
            </CardHeader>
            <CardContent><div className="text-3xl font-bold text-blue-600">{filteredScans.length}</div></CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {scans.filter(s => format(new Date(s.created_date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Countries</CardTitle>
            </CardHeader>
            <CardContent><div className="text-3xl font-bold">{topCountries.length}</div></CardContent>
          </Card>
        </div>

        {/* Scans Over Time */}
        <ScansOverTimeChart scans={filteredScans} dateRange={effectiveRange} />

        {/* World Map */}
        <ScanMap scans={filteredScans} />

        {/* Time of Day Heatmap */}
        <TimeOfDayHeatmap scans={filteredScans} />

        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Device Types</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(deviceStats).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(deviceStats)
                  .sort(([, a], [, b]) => b - a)
                  .map(([device, count]) => {
                    const pct = Math.round((count / filteredScans.length) * 100);
                    return (
                      <div key={device}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize text-gray-700">{device}</span>
                          <span className="font-semibold">{count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-gray-500">No device data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}