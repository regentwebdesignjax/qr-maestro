import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Download, Info, Smartphone, QrCode } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

function drawEye(ctx, originX, originY, cellSize, outerShape, innerShape, eyeColor, bgColor) {
  const outerPx = cellSize * 7;
  const innerPx = cellSize * 3;
  const innerOff = cellSize * 2;
  const r = cellSize * 1.2;

  ctx.fillStyle = bgColor;
  ctx.fillRect(originX, originY, outerPx, outerPx);
  ctx.fillStyle = eyeColor;

  if (outerShape === 'circle') {
    ctx.beginPath();
    ctx.arc(originX + outerPx / 2, originY + outerPx / 2, outerPx / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.arc(originX + outerPx / 2, originY + outerPx / 2, outerPx / 2 - cellSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = eyeColor;
  } else if (outerShape === 'rounded') {
    roundRectPath(ctx, originX, originY, outerPx, outerPx, r);
    ctx.fill();
    ctx.fillStyle = bgColor;
    roundRectPath(ctx, originX + cellSize, originY + cellSize, outerPx - cellSize * 2, outerPx - cellSize * 2, r * 0.5);
    ctx.fill();
    ctx.fillStyle = eyeColor;
  } else {
    ctx.fillRect(originX, originY, outerPx, outerPx);
    ctx.fillStyle = bgColor;
    ctx.fillRect(originX + cellSize, originY + cellSize, outerPx - cellSize * 2, outerPx - cellSize * 2);
    ctx.fillStyle = eyeColor;
  }

  if (innerShape === 'circle') {
    ctx.beginPath();
    ctx.arc(originX + innerOff + innerPx / 2, originY + innerOff + innerPx / 2, innerPx / 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(originX + innerOff, originY + innerOff, innerPx, innerPx);
  }
}

async function renderQR(canvas, qrData) {
  const dc = qrData.design_config || {};
  const fgColor = dc.foreground_color || '#000000';
  const bgColor = dc.background_color || '#ffffff';
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
    content = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:${phone}\nEMAIL:${email}\nORG:${company}\nEND:VCARD`;
  } else if (qrData.content_type === 'business_card') {
    // For QR tab on business card, encode a placeholder URL
    content = `${window.location.origin}/r?code=preview`;
  }

  const qrMatrix = QRCode.create(content, { errorCorrectionLevel: 'H' });
  const modules = qrMatrix.modules;
  const size = modules.size;
  const canvasPx = 300;
  const margin = 2;
  const totalModules = size + margin * 2;
  const cellSize = canvasPx / totalModules;

  canvas.width = canvasPx;
  canvas.height = canvasPx;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvasPx, canvasPx);

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
    drawEye(ctx, px, py, cellSize, eyeOuterShape, eyeInnerShape, eyeColor, bgColor);
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
        ctx.fillStyle = bgColor;
        ctx.fillRect(lx - pad, ly - pad, drawW + pad * 2, drawH + pad * 2);
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
  const containerRef = useRef(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (!qrData?.content) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderQR(canvas, qrData)
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error('QR render error:', err));
  }, [qrData]);

  const handleDownload = async () => {
    if (!containerRef.current) return;
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(containerRef.current, { backgroundColor: null, scale: 2 });
    const link = document.createElement('a');
    link.download = `${qrData.name || 'qrcode'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const dc = qrData.design_config || {};
  const frameStyle = dc.frame_style || 'none';
  const frameText = dc.frame_text || 'Scan Me';
  const frameColor = dc.frame_color || '#000000';

  return (
    <div className="space-y-4">
      <div className="bg-white p-8 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
        <div ref={containerRef} className="relative inline-block">
          {frameStyle !== 'none' ? (
            <div className={`
              ${frameStyle === 'basic' ? 'border-4 p-4' : ''}
              ${frameStyle === 'modern' ? 'shadow-xl rounded-2xl p-6 bg-gradient-to-br from-gray-50 to-white' : ''}
              ${frameStyle === 'badge' ? 'rounded-3xl p-8 shadow-2xl' : ''}
            `} style={{
              borderColor: frameStyle === 'basic' ? frameColor : 'transparent',
              background: frameStyle === 'badge' ? `linear-gradient(135deg, ${frameColor}15, ${frameColor}05)` : undefined,
            }}>
              {frameText && (
                <div className="text-center mb-4">
                  <p className="font-bold text-lg" style={{ color: frameColor }}>{frameText}</p>
                </div>
              )}
              <canvas ref={canvasRef} />
              {frameStyle === 'modern' && (
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-500">Point your camera here</p>
                </div>
              )}
            </div>
          ) : (
            <canvas ref={canvasRef} />
          )}
        </div>
      </div>
      <Button onClick={handleDownload} variant="outline" className="w-full" disabled={!qrCodeUrl}>
        <Download className="w-4 h-4 mr-2" /> Download PNG
      </Button>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function QRCodePreview({ qrData, currentStep }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
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
    if (!qrData?.content) return;
    if (qrData.content_type === 'business_card') return; // handled separately
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderQR(canvas, qrData)
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error('QR render error:', err));
  }, [qrData]);

  const handleDownload = async () => {
    if (!containerRef.current) return;
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(containerRef.current, { backgroundColor: null, scale: 2 });
    const link = document.createElement('a');
    link.download = `${qrData.name || 'qrcode'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
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
  const frameStyle = dc.frame_style || 'none';
  const frameText = dc.frame_text || 'Scan Me';
  const frameColor = dc.frame_color || '#000000';

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

      <div className="bg-white p-8 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
        <div ref={containerRef} className="relative inline-block">
          {frameStyle !== 'none' ? (
            <div className={`
              ${frameStyle === 'basic' ? 'border-4 p-4' : ''}
              ${frameStyle === 'modern' ? 'shadow-xl rounded-2xl p-6 bg-gradient-to-br from-gray-50 to-white' : ''}
              ${frameStyle === 'badge' ? 'rounded-3xl p-8 shadow-2xl' : ''}
            `} style={{
              borderColor: frameStyle === 'basic' ? frameColor : 'transparent',
              background: frameStyle === 'badge' ? `linear-gradient(135deg, ${frameColor}15, ${frameColor}05)` : undefined,
            }}>
              {frameText && (
                <div className="text-center mb-4">
                  <p className="font-bold text-lg" style={{ color: frameColor }}>{frameText}</p>
                </div>
              )}
              <canvas ref={canvasRef} />
              {frameStyle === 'modern' && (
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-500">Point your camera here</p>
                </div>
              )}
            </div>
          ) : (
            <canvas ref={canvasRef} />
          )}
        </div>
      </div>

      <div className="space-y-1 text-sm text-gray-600">
        <p><strong>Name:</strong> {qrData.name}</p>
        <p><strong>Type:</strong> {qrData.type === 'static' ? 'Static' : 'Dynamic'}</p>
        <p><strong>Content Type:</strong> {qrData.content_type}</p>
      </div>

      <Button onClick={handleDownload} variant="outline" className="w-full" disabled={!qrCodeUrl}>
        <Download className="w-4 h-4 mr-2" /> Download PNG
      </Button>
    </div>
  );
}