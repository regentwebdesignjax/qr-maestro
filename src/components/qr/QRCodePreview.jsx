import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Info, Smartphone, QrCode, FileImage, FileCode2, ChevronDown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { renderQR, renderQRToCanvas, downloadQRSvg } from '@/utils/qrExport';

import BusinessCardPreview from './BusinessCardPreview';

// ─── Tab Toggle for Business Card ─────────────────────────────────────────────

function PreviewToggle({ active, onChange }) {
  return (
    <div className="sticky top-0 z-10 bg-white pb-2 mb-4">
      <div className="flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
        <button
          onClick={() => onChange('landing')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-all ${
            active === 'landing'
              ? 'bg-white shadow text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          Landing Page
        </button>
        <button
          onClick={() => onChange('qr')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-all ${
            active === 'qr'
              ? 'bg-white shadow text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <QrCode className="w-4 h-4" />
          QR Code
        </button>
      </div>
    </div>
  );
}

// ─── QR Canvas sub-component ──────────────────────────────────────────────────

function QRCanvasView({ qrData }) {
  const canvasRef = useRef(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (!qrData?.content) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderQR(canvas, qrData)
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error('QR render error:', err));
  }, [qrData]);

  const dc = qrData.design_config || {};
  const transparent = dc.transparent_background === true || dc.transparent_background === 'true';

  const handleDownloadPNG = async () => {
    console.log(`Background layer detected and removed: ${transparent}`);
    const hiCanvas = await renderQRToCanvas(qrData, 1024);
    const link = document.createElement('a');
    link.download = `${qrData.name || 'qrcode'}.png`;
    link.href = hiCanvas.toDataURL('image/png');
    link.click();
  };

  const handleDownloadSVG = () => downloadQRSvg(qrData);

  return (
    <div className="space-y-4">
      {/* Checkered background when transparent so white QR codes are visible */}
      <div
        className="p-8 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center"
        style={transparent ? {
          backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
          backgroundColor: '#fff',
        } : { backgroundColor: '#fff' }}
      >
        <div className="relative inline-block">
          <canvas ref={canvasRef} />
        </div>
      </div>

      <DownloadMenu name={qrData.name} onPNG={handleDownloadPNG} onSVG={handleDownloadSVG} disabled={!qrCodeUrl} />
    </div>
  );
}

// ─── Shared Download Dropdown ─────────────────────────────────────────────────

function DownloadMenu({ name, onPNG, onSVG, disabled }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full" disabled={disabled}>
          <Download className="w-4 h-4 mr-2" />
          Download
          <ChevronDown className="w-4 h-4 ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={onPNG} className="cursor-pointer">
          <FileImage className="w-4 h-4 mr-2 text-blue-500" />
          <div>
            <p className="font-medium">PNG (High Resolution)</p>
            <p className="text-xs text-muted-foreground">1024×1024 — best for general use</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSVG} className="cursor-pointer">
          <FileCode2 className="w-4 h-4 mr-2 text-purple-500" />
          <div>
            <p className="font-medium">SVG (Vector)</p>
            <p className="text-xs text-muted-foreground">Scalable — best for print & design</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function QRCodePreview({ qrData, currentStep }) {
  const canvasRef = useRef(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [bcTab, setBcTab] = useState('landing');

  // Auto-switch tab based on step
  useEffect(() => {
    if (qrData?.content_type !== 'business_card') return;
    if (currentStep === 2) {
      setBcTab('qr');
    } else {
      setBcTab('landing');
    }
  }, [currentStep, qrData?.content_type]);

  useEffect(() => {
    const isDynamic = qrData?.type === 'dynamic' && qrData?.short_code;
    const hasContent = !!qrData?.content;
    if (!isDynamic && !hasContent) return;
    if (qrData.content_type === 'business_card') return; // handled separately
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderQR(canvas, qrData)
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error('QR render error:', err));
  }, [qrData]);

  // dc must be declared before handlers (qrData may be null; handlers guard via early return above)
  const dc = qrData?.design_config || {};

  const handleDownloadPNG = async () => {
    const transparent = dc.transparent_background === true || dc.transparent_background === 'true';
    console.log(`Background layer detected and removed: ${transparent}`);
    const hiCanvas = await renderQRToCanvas(qrData, 1024);
    const link = document.createElement('a');
    link.download = `${qrData.name || 'qrcode'}.png`;
    link.href = hiCanvas.toDataURL('image/png');
    link.click();
  };

  const handleDownloadSVG = () => downloadQRSvg(qrData);

  if (!qrData) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-gray-50 rounded-lg">
        <div className="text-center text-gray-500">
          <p className="mb-2">Fill in the form to see a live preview</p>
          <p className="text-sm">Your QR code will appear here</p>
        </div>
      </div>
    );
  }

  // ── Business Card: tabbed view ──
  if (qrData.content_type === 'business_card') {
    let bcData = {};
    try { bcData = JSON.parse(qrData.content || '{}'); } catch {}
    return (
      <div>
        <PreviewToggle active={bcTab} onChange={setBcTab} />
        {bcTab === 'landing' ? (
          <BusinessCardPreview data={{ ...bcData, design_config: qrData.design_config }} />
        ) : (
          <QRCanvasView qrData={qrData} />
        )}
      </div>
    );
  }

  // ── Standard QR preview ──
  const transparent = dc.transparent_background === true || dc.transparent_background === 'true';

  const checkerStyle = {
    backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
    backgroundSize: '16px 16px',
    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
    backgroundColor: '#fff',
  };

  // If the foreground color is white/very-light OR transparent bg is on, show checker so QR is visible
  const fgIsLight = (() => {
    const fg = (dc.foreground_color || '#000000').replace('#', '');
    if (fg.length !== 6) return false;
    const r = parseInt(fg.slice(0, 2), 16);
    const g = parseInt(fg.slice(2, 4), 16);
    const b = parseInt(fg.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.85;
  })();
  const useChecker = transparent || fgIsLight;

  return (
    <div className="space-y-4">
      {qrData.type === 'dynamic' && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This is a dynamic QR code. The destination can be changed later without updating the QR code.
          </AlertDescription>
        </Alert>
      )}

      <div
        className="p-8 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center"
        style={useChecker ? checkerStyle : { backgroundColor: '#fff' }}
      >
        <div className="relative inline-block">
          <canvas ref={canvasRef} />
        </div>
      </div>

      <div className="space-y-1 text-sm text-gray-600">
        <p><strong>Name:</strong> {qrData.name}</p>
        <p><strong>Type:</strong> {qrData.type === 'static' ? 'Static' : 'Dynamic'}</p>
        <p><strong>Content Type:</strong> {qrData.content_type}</p>
      </div>

      <DownloadMenu name={qrData.name} onPNG={handleDownloadPNG} onSVG={handleDownloadSVG} disabled={!qrCodeUrl} />
    </div>
  );
}