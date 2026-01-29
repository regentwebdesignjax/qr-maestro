import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';

export default function Analytics() {
  const [qrCode, setQrCode] = useState(null);
  const [scans, setScans] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');

      if (!id) {
        window.location.href = '/Dashboard';
        return;
      }

      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        const isPro = currentUser.subscription_tier === 'pro' && currentUser.subscription_status === 'active';
        
        if (!isPro) {
          setLoading(false);
          return;
        }

        const qrCodes = await base44.entities.QRCode.filter({ id, created_by: currentUser.email });
        
        if (qrCodes.length === 0) {
          window.location.href = '/Dashboard';
          return;
        }

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

  const isPro = user?.subscription_tier === 'pro' && user?.subscription_status === 'active';

  if (!isPro) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <Card>
            <CardContent className="py-16">
              <div className="text-center">
                <Lock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Analytics Available on Pro Plan
                </h2>
                <p className="text-gray-600 mb-6">
                  Upgrade to Pro to access detailed scan analytics, location data, and insights.
                </p>
                <Link to="/Pricing">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Upgrade to Pro
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Prepare chart data - last 7 days
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const count = scans.filter(scan => {
      const scanDate = format(new Date(scan.created_date), 'yyyy-MM-dd');
      return scanDate === dateStr;
    }).length;

    return {
      date: format(date, 'MMM dd'),
      scans: count
    };
  });

  const deviceStats = scans.reduce((acc, scan) => {
    const device = scan.device_type || 'unknown';
    acc[device] = (acc[device] || 0) + 1;
    return acc;
  }, {});

  const topCountries = Object.entries(
    scans.reduce((acc, scan) => {
      if (scan.country) {
        acc[scan.country] = (acc[scan.country] || 0) + 1;
      }
      return acc;
    }, {})
  )
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <Link to="/Dashboard">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
        <p className="text-gray-600 mb-8">{qrCode?.name}</p>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Scans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{scans.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {scans.filter(scan => 
                  format(new Date(scan.created_date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                ).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {scans.filter(scan => 
                  new Date(scan.created_date) >= subDays(new Date(), 7)
                ).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Countries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{topCountries.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Scans Over Time Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Scans Over Time (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="scans" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Device Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Device Types</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(deviceStats).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(deviceStats).map(([device, count]) => (
                    <div key={device} className="flex justify-between items-center">
                      <span className="capitalize">{device}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No device data available</p>
              )}
            </CardContent>
          </Card>

          {/* Top Countries */}
          <Card>
            <CardHeader>
              <CardTitle>Top Countries</CardTitle>
            </CardHeader>
            <CardContent>
              {topCountries.length > 0 ? (
                <div className="space-y-3">
                  {topCountries.map(([country, count]) => (
                    <div key={country} className="flex justify-between items-center">
                      <span>{country}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No location data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}