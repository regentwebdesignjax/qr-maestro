import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart2, Edit, Trash2 } from 'lucide-react';
import QRCode from 'qrcode';

const CONTENT_TYPE_LABELS = {
  business_card: 'Business Card',
  vcard: 'vCard',
  url: 'URL',
  wifi: 'WiFi',
  text: 'Text',
  pdf: 'PDF',
  social: 'Social',
  coupon: 'Coupon',
  image: 'Image',
  mp3: 'Audio',
  call: 'Call',
  sms: 'SMS',
};

function MiniQR({ qr }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const content = qr.type === 'dynamic' && qr.short_code
      ? `${window.location.origin}/r?code=${qr.short_code}`
      : (qr.content || 'preview');
    QRCode.toCanvas(canvas, content.substring(0, 200), {
      width: 64,
      margin: 1,
      color: {
        dark: qr.design_config?.foreground_color || '#000000',
        light: qr.design_config?.background_color || '#ffffff',
      },
    }).catch(() => {});
  }, [qr]);

  return <canvas ref={canvasRef} className="rounded border" style={{ width: 64, height: 64 }} />;
}

export default function QRMobileCard({ qr, isPro, onDelete }) {
  return (
    <div className="bg-white rounded-xl border border-border shadow-sm p-4 space-y-3">
      <div className="flex items-start gap-3">
        <MiniQR qr={qr} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{qr.name}</p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <Badge variant={qr.type === 'dynamic' ? 'default' : 'secondary'} className="text-xs">
              {qr.type === 'dynamic' ? 'Dynamic' : 'Static'}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {CONTENT_TYPE_LABELS[qr.content_type] || qr.content_type}
            </Badge>
          </div>
          {isPro && qr.type === 'dynamic' && (
            <p className="text-xs text-muted-foreground mt-1">{qr.scan_count || 0} scans</p>
          )}
        </div>
      </div>

      <div className="flex gap-2 pt-1 border-t border-gray-100">
        {qr.type === 'dynamic' && (
          <Link to={`/EditQR?id=${qr.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full h-10">
              <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
            </Button>
          </Link>
        )}
        <Link to={`/ViewQR?id=${qr.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full h-10">
            <BarChart2 className="w-3.5 h-3.5 mr-1.5" /> View
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          className="h-10 w-10 p-0 text-destructive hover:bg-destructive/5 border-destructive/20"
          onClick={() => onDelete(qr.id)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}