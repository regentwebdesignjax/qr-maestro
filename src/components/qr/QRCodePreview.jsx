import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Download, Info, Smartphone, QrCode, FileImage, FileCode2, ChevronDown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import BusinessCardPreview from './BusinessCardPreview';

// ─── helpers ──────────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function isEyeModule(row, col, size) {
  const eyeSize = 7;
  const inTL = row < eyeSize && col < eyeSize;
  const inTR = row < eyeSize && col >= size - eyeSize;
  const inBL = row >= size - eyeSize && col < eyeSize;
  return inTL || inTR || inBL;
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.arcTo(x + w, y, x + w, y + rad, rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.arcTo(x + w, y + h, x + w - rad, y + h, rad);
  ctx.lineTo(x + rad, y + h);
  ctx.arcTo(x, y + h, x, y + h - rad, rad);
  ctx.lineTo(x, y + rad);
  ctx.arcTo(x, y, x + rad, y, rad);
  ctx.closePath();
}

function drawEye(ctx, originX, originY, cellSize, outerShape, innerShape, eyeColor, bgColor, transparent) {
  const outerPx = cellSize * 7;
  const innerPx = cellSize * 3;
  const innerOff = cellSize * 2;
  const r = cellSize * 1.2;

  // Clear or fill the full eye area first
  if (transparent) {
    ctx.clearRect(originX, originY, outerPx, outerPx);
  } else {
    ctx.fillStyle = bgColor;
    ctx.fillRect(originX, originY, outerPx, outerPx);
  }

  ctx.fillStyle = eyeColor;

  // Helper: erase the "gap" between outer ring and inner dot
  const clearGap = () => {
    if (transparent) {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.fillStyle = bgColor;
    }
  };
  const restoreAfterGap = () => {
    if (transparent) {
      ctx.restore();
    }
    ctx.fillStyle = eyeColor;
  };

  if (outerShape === 'circle') {
    ctx.beginPath();
    ctx.arc(originX + outerPx / 2, originY + outerPx / 2, outerPx / 2, 0, Math.PI * 2);
    ctx.fill();
    clearGap();
    ctx.beginPath();
    ctx.arc(originX + outerPx / 2, originY + outerPx / 2, outerPx / 2 - cellSize, 0, Math.PI * 2);
    ctx.fill();
    restoreAfterGap();
  } else if (outerShape === 'rounded') {
    roundRectPath(ctx, originX, originY, outerPx, outerPx, r);
    ctx.fill();
    clearGap();
    roundRectPath(ctx, originX + cellSize, originY + cellSize, outerPx - cellSize * 2, outerPx - cellSize * 2, r * 0.5);
    ctx.fill();
    restoreAfterGap();
  } else {
    ctx.fillRect(originX, originY, outerPx, outerPx);
    clearGap();
    ctx.fillRect(originX + cellSize, originY + cellSize, outerPx - cellSize * 2, outerPx - cellSize * 2);
    restoreAfterGap();
  }

  if (innerShape === 'circle') {
    ctx.beginPath();
    ctx.arc(originX + innerOff + innerPx / 2, originY + innerOff + innerPx / 2, innerPx / 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(originX + innerOff, originY + innerOff, innerPx, innerPx);
  }
}

// Renders QR at a given pixel size onto a canvas and returns it
async function renderQRToCanvas(qrData, size = 300) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  await renderQR(canvas, qrData, size);
  return canvas;
}

async function renderQR(canvas, qrData, canvasPx = 300) {
  const dc = qrData.design_config || {};
  const fgColor = dc.foreground_color || '#000000';
  const transparentBg = !!dc.transparent_background;
  const bgColor = transparentBg ? 'rgba(0,0,0,0)' : (dc.background_color || '#ffffff');
  const gradientType = dc.gradient_type || 'none';
  const gradientColor2 = dc.gradient_color2 || '#6366f1';
  const qrStyle = dc.qr_style || 'squares';
  const eyeOuterShape = dc.eye_outer_shape || 'square';
  const eyeInnerShape = dc.eye_inner_shape || 'square';
  const eyeColor = dc.eye_color || fgColor;

  let content = qrData.content;
  if (qrData.type === 'dynamic' && qrData.short_code) {
    content = `${window.location.origin}/r?code=${qrData.short_code}`;
  } else if (qrData.content_type === 'wifi') {
    const lines = qrData.content.split('\n');
    const ssid = lines.find(l => l.startsWith('SSID:'))?.split(':')[1]?.trim() || '';
    const pwd = lines.find(l => l.startsWith('Password:'))?.split(':')[1]?.trim() || '';
    const enc = lines.find(l => l.startsWith('Encryption:'))?.split(':')[1]?.trim() || 'WPA';
    content = `WIFI:T:${enc};S:${ssid};P:${pwd};;`;
  } else if (qrData.content_type === 'vcard') {
    const lines = qrData.content.split('\n');
    const name = lines.find(l => l.startsWith('Name:'))?.split(':')[1]?.trim() || '';
    const phone = lines.find(l => l.startsWith('Phone:'))?.split(':')[1]?.trim() || '';
    const email = lines.find(l => l.startsWith('Email:'))?.split(':')[1]?.trim() || '';
    const company = lines.find(l => l.startsWith('Company:'))?.split(':')[1]?.trim() || '';
    content = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nN:;${name};;;\nORG:${company}\nTEL;TYPE=CELL:${phone}\nEMAIL:${email}\nEND:VCARD`;
  } else if (qrData.content_type === 'business_card') {
    // For QR tab on business card, encode a placeholder URL
    content = `${window.location.origin}/r?code=preview`;
  }

  const qrMatrix = QRCode.create(content, { errorCorrectionLevel: 'H' });
  const modules = qrMatrix.modules;
  const size = modules.size;
  const margin = 2;
  const totalModules = size + margin * 2;
  const cellSize = canvasPx / totalModules;

  canvas.width = canvasPx;
  canvas.height = canvasPx;
  const ctx = canvas.getContext('2d');

  if (!transparentBg) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasPx, canvasPx);
  } else {
    ctx.clearRect(0, 0, canvasPx, canvasPx);
  }

  let patternFill;
  if (gradientType === 'linear') {
    const grad = ctx.createLinearGradient(0, 0, canvasPx, canvasPx);
    grad.addColorStop(0, fgColor);
    grad.addColorStop(1, gradientColor2);
    patternFill = grad;
  } else if (gradientType === 'radial') {
    const cx = canvasPx / 2, cy = canvasPx / 2;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, canvasPx / 1.5);
    grad.addColorStop(0, fgColor);
    grad.addColorStop(1, gradientColor2);
    patternFill = grad;
  } else {
    patternFill = fgColor;
  }

  ctx.fillStyle = patternFill;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!modules.get(row, col)) continue;
      if (isEyeModule(row, col, size)) continue;
      const x = (col + margin) * cellSize;
      const y = (row + margin) * cellSize;
      ctx.beginPath();
      if (qrStyle === 'dots') {
        ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize * 0.4, 0, Math.PI * 2);
      } else if (qrStyle === 'rounded') {
        ctx.roundRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1, cellSize * 0.3);
      } else {
        ctx.rect(x, y, cellSize, cellSize);
      }
      ctx.fill();
    }
  }

  const eyePositions = [
    { or: 0, oc: 0 },
    { or: 0, oc: size - 7 },
    { or: size - 7, oc: 0 },
  ];
  eyePositions.forEach(({ or, oc }) => {
    const px = (oc + margin) * cellSize;
    const py = (or + margin) * cellSize;
    drawEye(ctx, px, py, cellSize, eyeOuterShape, eyeInnerShape, eyeColor, bgColor, transparentBg);
  });

  if (dc.logo_url) {
    await new Promise((resolve) => {
      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      logo.onload = () => {
        const maxSize = canvasPx * 0.2;
        const aspect = logo.naturalWidth / logo.naturalHeight;
        let drawW, drawH;
        if (aspect >= 1) { drawW = maxSize; drawH = maxSize / aspect; }
        else { drawH = maxSize; drawW = maxSize * aspect; }
        const lx = (canvasPx - drawW) / 2;
        const ly = (canvasPx - drawH) / 2;
        const pad = 6;
        if (!transparentBg) {
          ctx.fillStyle = bgColor;
          ctx.fillRect(lx - pad, ly - pad, drawW + pad * 2, drawH + pad * 2);
        }
        ctx.drawImage(logo, lx, ly, drawW, drawH);
        resolve();
      };
      logo.onerror = resolve;
      logo.src = dc.logo_url;
    });
  }

  return canvas.toDataURL();
}

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
  const { toast } = useToast();

  useEffect(() => {
    if (!qrData?.content) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderQR(canvas, qrData)
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error('QR render error:', err));
  }, [qrData]);

  const handleDownloadPNG = async () => {
    const hiCanvas = await renderQRToCanvas(qrData, 1024);
    const link = document.createElement('a');
    link.download = `${qrData.name || 'qrcode'}.png`;
    link.href = hiCanvas.toDataURL('image/png');
    link.click();
    toast({ title: 'PNG downloaded', description: '1024×1024 high-resolution PNG saved.' });
  };

  const transparent = !!(qrData.design_config?.transparent_background);

  const handleDownloadSVG = () => {
    const svgEl = document.getElementById('qr-svg-export');
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    let svgStr = serializer.serializeToString(svgEl);

    // Post-process: strip background rect when transparency is on
    if (transparent) {
      svgStr = svgStr.replace(/<rect[^>]*fill=["'](#ffffff|white)["'][^>]*width=["']100%["'][^>]*\/?>/gi, '');
      svgStr = svgStr.replace(/<rect[^>]*width=["']100%["'][^>]*fill=["'](#ffffff|white)["'][^>]*\/?>/gi, '');
      // Also strip any leading full-size rect by matching explicit width/height equal to 512
      svgStr = svgStr.replace(/<rect[^>]*width=["']512["'][^>]*height=["']512["'][^>]*\/?>/gi, '');
      svgStr = svgStr.replace(/<rect[^>]*height=["']512["'][^>]*width=["']512["'][^>]*\/?>/gi, '');
    }

    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${qrData.name || 'qrcode'}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: 'SVG downloaded', description: 'Vector file saved — open in Illustrator or Figma.' });
  };

  // Build the QR content string for SVG export
  let svgContent = qrData.content || '';
  if (qrData.type === 'dynamic' && qrData.short_code) {
    svgContent = `${window.location.origin}/r?code=${qrData.short_code}`;
  }
  const dc = qrData.design_config || {};
  const fgColor = dc.foreground_color || '#000000';
  // Pass undefined bgColor when transparent so qrcode.react renders no background rect
  const svgBgColor = transparent ? undefined : (dc.background_color || '#ffffff');

  return (
    <div className="space-y-4">
      {/* Hidden SVG used for vector export */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <QRCodeSVG
          id="qr-svg-export"
          value={svgContent || ' '}
          size={512}
          fgColor={fgColor}
          bgColor={svgBgColor}
          includeMargin={false}
          level="H"
        />
      </div>

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
  const { toast } = useToast();

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
    if (!qrData?.content) return;
    if (qrData.content_type === 'business_card') return; // handled separately
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderQR(canvas, qrData)
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error('QR render error:', err));
  }, [qrData]);

  const handleDownloadPNG = async () => {
    const hiCanvas = await renderQRToCanvas(qrData, 1024);
    const link = document.createElement('a');
    link.download = `${qrData.name || 'qrcode'}.png`;
    link.href = hiCanvas.toDataURL('image/png');
    link.click();
    toast({ title: 'PNG downloaded', description: '1024×1024 high-resolution PNG saved.' });
  };

  const handleDownloadSVG = () => {
    const svgEl = document.getElementById('qr-svg-export-main');
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    let svgStr = serializer.serializeToString(svgEl);
    const transparent = !!(qrData.design_config?.transparent_background);
    if (transparent) {
      svgStr = svgStr.replace(/<rect[^>]*fill=["'](#ffffff|white)["'][^>]*width=["']100%["'][^>]*\/?>/gi, '');
      svgStr = svgStr.replace(/<rect[^>]*width=["']100%["'][^>]*fill=["'](#ffffff|white)["'][^>]*\/?>/gi, '');
      svgStr = svgStr.replace(/<rect[^>]*width=["']512["'][^>]*height=["']512["'][^>]*\/?>/gi, '');
      svgStr = svgStr.replace(/<rect[^>]*height=["']512["'][^>]*width=["']512["'][^>]*\/?>/gi, '');
    }
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${qrData.name || 'qrcode'}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: 'SVG downloaded', description: 'Vector file saved — open in Illustrator or Figma.' });
  };

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
          <BusinessCardPreview data={bcData} />
        ) : (
          <QRCanvasView qrData={qrData} />
        )}
      </div>
    );
  }

  // ── Standard QR preview ──
  const dc = qrData.design_config || {};
  const transparent = !!dc.transparent_background;
  const fgColor = dc.foreground_color || '#000000';
  const svgBgColor = transparent ? undefined : (dc.background_color || '#ffffff');

  // Build SVG content string
  let svgContent = qrData.content || '';
  if (qrData.type === 'dynamic' && qrData.short_code) {
    svgContent = `${window.location.origin}/r?code=${qrData.short_code}`;
  }

  const checkerStyle = {
    backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
    backgroundSize: '16px 16px',
    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
    backgroundColor: '#fff',
  };

  return (
    <div className="space-y-4">
      {/* Hidden SVG for vector export */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <QRCodeSVG
          id="qr-svg-export-main"
          value={svgContent || ' '}
          size={512}
          fgColor={fgColor}
          bgColor={svgBgColor}
          includeMargin={false}
          level="H"
        />
      </div>

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
        style={transparent ? checkerStyle : { backgroundColor: '#fff' }}
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