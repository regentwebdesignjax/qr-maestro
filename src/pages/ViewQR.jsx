import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ScanLine, ExternalLink } from 'lucide-react';
import ScanLocationChart from '../components/qr/ScanLocationChart';
import QRCodePreview from '../components/qr/QRCodePreview';

const CONTENT_TYPE_LABELS = {
  business_card: 'Business Card',
  vcard: 'vCard Contact',
  url: 'Website',
  wifi: 'WiFi Credentials',
  text: 'Plain Text',
  pdf: 'PDF',
  social: 'Social Media',
  coupon: 'Coupon Code',
  image: 'Image',
  mp3: 'Audio (MP3)',
  call: 'Phone Call',
  sms: 'SMS Message',
};

function getFriendlyContentType(type) {
  return CONTENT_TYPE_LABELS[type] || type;
}

// Parse and format content into readable label/value pairs
function parseContentFields(contentType, content) {
  if (!content) return null;

  if (contentType === 'business_card') {
    try {
      const d = JSON.parse(content);
      const fields = [];
      if (d.name)    fields.push({ label: 'Name',    value: d.name });
      if (d.title)   fields.push({ label: 'Title',   value: d.title });
      if (d.company) fields.push({ label: 'Company', value: d.company });
      if (d.email)   fields.push({ label: 'Email',   value: d.email });
      if (d.phone)   fields.push({ label: 'Phone',   value: d.phone });
      if (d.website) fields.push({ label: 'Website', value: d.website });
      if (d.bio)     fields.push({ label: 'Bio',     value: d.bio });
      return fields.length > 0 ? fields : null;
    } catch { return null; }
  }

  if (contentType === 'wifi') {
    const ssid = content.match(/S:([^;]+)/)?.[1];
    const pwd  = content.match(/P:([^;]+)/)?.[1];
    const enc  = content.match(/T:([^;]+)/)?.[1];
    const fields = [];
    if (ssid) fields.push({ label: 'Network (SSID)', value: ssid });
    if (enc)  fields.push({ label: 'Security',       value: enc });
    if (pwd)  fields.push({ label: 'Password',       value: pwd });
    return fields.length > 0 ? fields : null;
  }

  if (contentType === 'vcard') {
    const get = (key) => content.match(new RegExp(`${key}[^:]*:(.+)`))?.[1]?.trim();
    const fields = [];
    const fn = get('FN');
    const org = get('ORG');
    const tel = get('TEL');
    const email = get('EMAIL');
    const url = get('URL');
    if (fn)    fields.push({ label: 'Name',    value: fn });
    if (org)   fields.push({ label: 'Company', value: org });
    if (tel)   fields.push({ label: 'Phone',   value: tel });
    if (email) fields.push({ label: 'Email',   value: email });
    if (url)   fields.push({ label: 'Website', value: url });
    return fields.length > 0 ? fields : null;
  }

  // For url, text, coupon, call, sms — just show the value directly
  return null;
}

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!qrCode) return null;

  return (
    <div className="min-h-screen bg-background py-8">
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
            <CardContent className="space-y-0 divide-y divide-gray-100">
              {/* Name */}
              <div className="py-3">
                <p className="text-xs text-muted-foreground mb-0.5">Name</p>
                <p className="font-semibold text-gray-900">{qrCode.name}</p>
              </div>

              {/* Type */}
              <div className="py-3">
                <p className="text-xs text-muted-foreground mb-1">Type</p>
                <Badge variant={qrCode.type === 'dynamic' ? 'default' : 'secondary'}>
                  {qrCode.type === 'static' ? 'Static' : 'Dynamic'}
                </Badge>
              </div>

              {/* Content Type */}
              <div className="py-3">
                <p className="text-xs text-muted-foreground mb-0.5">Content Type</p>
                <p className="font-medium text-gray-800">{getFriendlyContentType(qrCode.content_type)}</p>
              </div>

              {/* Content */}
              <div className="py-3">
                <p className="text-xs text-muted-foreground mb-1.5">Content</p>
                {(() => {
                  const fields = parseContentFields(qrCode.content_type, qrCode.content);
                  if (fields) {
                    return (
                      <div className="space-y-1.5">
                        {fields.map(({ label, value }) => (
                          <div key={label} className="flex gap-2 text-sm">
                            <span className="text-muted-foreground w-20 shrink-0">{label}</span>
                            <span className="font-medium text-gray-800 break-all">{value}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return (
                    <p className="font-medium text-gray-800 break-all text-sm">{qrCode.content}</p>
                  );
                })()}
              </div>

              {/* Scan Link */}
              {qrCode.type === 'dynamic' && qrCode.short_code && (
                <div className="py-3">
                  <p className="text-xs text-muted-foreground mb-1">Scan Link</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 flex-1 truncate">
                      {window.location.origin}/r?code={qrCode.short_code}
                    </code>
                    <a
                      href={`${window.location.origin}/r?code=${qrCode.short_code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}

              {/* Total Scans */}
              <div className="py-4">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <ScanLine className="w-3.5 h-3.5" /> Total Scans
                </p>
                <p className="text-4xl font-bold text-primary">{qrCode.scan_count || 0}</p>
              </div>

              {/* Actions */}
              {qrCode.type === 'dynamic' && (
                <div className="pt-4 space-y-2">
                  <Link to={'/EditQR?id=' + qrCode.id}>
                    <Button className="w-full">Edit Dynamic QR</Button>
                  </Link>
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