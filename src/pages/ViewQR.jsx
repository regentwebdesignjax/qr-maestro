import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import ScanLocationChart from '../components/qr/ScanLocationChart';
import QRCodePreview from '../components/qr/QRCodePreview';

export default function ViewQR() {
  const [qrCode, setQrCode] = useState(null);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQRCode = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');

      if (!id) {
        window.location.href = '/Dashboard';
        return;
      }

      try {
        const qrCodes = await base44.entities.QRCode.filter({ id });
        if (qrCodes.length === 0) {
          window.location.href = '/Dashboard';
          return;
        }

        const qr = qrCodes[0];
        setQrCode(qr);

        if (qr.type === 'dynamic') {
          const scanData = await base44.entities.Scan.filter({ qr_code_id: qr.id });
          setScans(scanData);
        }
      } catch (error) {
        console.error('Error fetching QR code:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQRCode();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!qrCode) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link to="/Dashboard">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* QR Code Display — uses full rendering engine with design_config */}
          <Card>
            <CardHeader>
              <CardTitle>QR Code</CardTitle>
            </CardHeader>
            <CardContent>
              <QRCodePreview qrData={qrCode} />
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Name</p>
                <p className="font-medium">{qrCode.name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Type</p>
                <Badge variant={qrCode.type === 'dynamic' ? 'default' : 'secondary'}>
                  {qrCode.type === 'static' ? 'Static' : 'Dynamic'}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Content Type</p>
                <p className="font-medium">{qrCode.content_type}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Content</p>
                <p className="font-medium break-all">{qrCode.content}</p>
              </div>

              {qrCode.type === 'dynamic' && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Short URL</p>
                  <p className="font-medium break-all">
                    {window.location.origin}/r?code={qrCode.short_code}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600 mb-1">Total Scans</p>
                <p className="font-medium text-2xl">{qrCode.scan_count || 0}</p>
              </div>

              {qrCode.type === 'dynamic' && (
                <Link to={'/EditQR?id=' + qrCode.id}>
                  <Button className="w-full">Edit Dynamic QR</Button>
                </Link>
              )}

              {qrCode.type === 'dynamic' && (
                <div className="mt-3">
                  <Link to={'/Analytics?id=' + qrCode.id}>
                    <Button variant="outline" className="w-full">View Full Analytics</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Scan Location Chart — dynamic QR codes only */}
        {qrCode.type === 'dynamic' && (
          <div className="mt-8">
            <ScanLocationChart scans={scans} />
          </div>
        )}
      </div>
    </div>
  );
}