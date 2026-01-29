import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download } from 'lucide-react';
import QRCode from 'qrcode';

export default function ViewQR() {
  const [qrCode, setQrCode] = useState(null);
  const [qrImageUrl, setQrImageUrl] = useState('');
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

        // Generate QR code image
        let content = qr.content;
        if (qr.type === 'dynamic' && qr.short_code) {
          content = `${window.location.origin}/r/${qr.short_code}`;
        }

        const canvas = document.createElement('canvas');
        await QRCode.toCanvas(canvas, content, {
          width: 400,
          margin: 2,
          color: {
            dark: qr.design_config?.foreground_color || '#000000',
            light: qr.design_config?.background_color || '#ffffff',
          },
        });

        setQrImageUrl(canvas.toDataURL());
      } catch (error) {
        console.error('Error fetching QR code:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQRCode();
  }, []);

  const handleDownload = (format) => {
    const link = document.createElement('a');
    link.download = `${qrCode.name}.${format}`;
    link.href = qrImageUrl;
    link.click();
  };

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
          {/* QR Code Display */}
          <Card>
            <CardHeader>
              <CardTitle>QR Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white p-8 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                <img src={qrImageUrl} alt={qrCode.name} className="max-w-full" />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleDownload('png')} className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Download PNG
                </Button>
                <Button onClick={() => handleDownload('svg')} variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Download SVG
                </Button>
              </div>
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
                    {window.location.origin}/r/{qrCode.short_code}
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}