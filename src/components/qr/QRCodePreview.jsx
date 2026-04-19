import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Download, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import BusinessCardPreview from './BusinessCardPreview';

// ─── helpers ──────────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

// Returns a colour string interpolated between c1 and c2 at ratio t∈[0,1]
function lerpColor(c1, c2, t) {
  const [r1, g1, b1] = hexToRgb(c1);
  const [r2, g2, b2] = hexToRgb(c2);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}

// Is module (row, col) inside one of the three finder-pattern regions?
function isEyeModule(row, col, size) {
  const eyeSize = 7;
  const inTL = row < eyeSize && col < eyeSize;
  const inTR = row < eyeSize && col >= size - eyeSize;
  const inBL = row >= size - eyeSize && col < eyeSize;
  return inTL || inTR || inBL;
}

// Is this the outer ring of a finder pattern (0..6)?
function isEyeOuter(r, c, size) {
  const eyeSize = 7;
  const check = (or, oc) => {
    const lr = r - or, lc = c - oc;
    if (lr < 0 || lr >= eyeSize || lc < 0 || lc >= eyeSize) return false;
    return lr === 0 || lr === eyeSize - 1 || lc === 0 || lc === eyeSize - 1;
  };
  return check(0, 0) || check(0, size - eyeSize) || check(size - eyeSize, 0);
}

// Is this the inner dot (3x3) of a finder pattern?
function isEyeInner(r, c, size) {
  const eyeSize = 7;
  const check = (or, oc) => {
    const lr = r - or, lc = c - oc;
    if (lr < 0 || lr >= eyeSize || lc < 0 || lc >= eyeSize) return false;
    return lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4;
  };
  return check(0, 0) || check(0, size - eyeSize) || check(size - eyeSize, 0);
}

// Cross-browser rounded rectangle path helper
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

// Draw one finder-pattern eye
function drawEye(ctx, originX, originY, cellSize, outerShape, innerShape, eyeColor, bgColor) {
  const outerPx = cellSize * 7;
  const innerPx = cellSize * 3;
  const innerOff = cellSize * 2;
  const r = cellSize * 1.2; // corner radius for rounded style

  // Background fill for the full 7x7 area
  ctx.fillStyle = bgColor;
  ctx.fillRect(originX, originY, outerPx, outerPx);

  ctx.fillStyle = eyeColor;

  // Outer ring
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
    // square
    ctx.fillRect(originX, originY, outerPx, outerPx);
    ctx.fillStyle = bgColor;
    ctx.fillRect(originX + cellSize, originY + cellSize, outerPx - cellSize * 2, outerPx - cellSize * 2);
    ctx.fillStyle = eyeColor;
  }

  // Inner dot
  if (innerShape === 'circle') {
    ctx.beginPath();
    ctx.arc(originX + innerOff + innerPx / 2, originY + innerOff + innerPx / 2, innerPx / 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(originX + innerOff, originY + innerOff, innerPx, innerPx);
  }
}

// ─── main renderer ────────────────────────────────────────────────────────────

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

  // 1. Prepare content string
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
  }

  // 2. Get raw QR matrix (boolean grid)
  const qrMatrix = QRCode.create(content, { errorCorrectionLevel: 'H' });
  const modules = qrMatrix.modules;
  const size = modules.size;   // number of modules
  const canvasPx = 300;
  const margin = 2;            // modules of quiet zone
  const totalModules = size + margin * 2;
  const cellSize = canvasPx / totalModules;

  canvas.width = canvasPx;
  canvas.height = canvasPx;
  const ctx = canvas.getContext('2d');

  // 3. Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvasPx, canvasPx);

  // 4. Build gradient fill (used for non-eye modules)
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

  // 5. Draw modules (skip eye regions – we draw those manually afterwards)
  ctx.fillStyle = patternFill;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!modules.get(row, col)) continue;
      if (isEyeModule(row, col, size)) continue; // handled separately

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

  // 6. Draw the three finder-pattern eyes with custom shapes/colour
  const eyePositions = [
    { or: 0, oc: 0 },                        // top-left
    { or: 0, oc: size - 7 },                 // top-right
    { or: size - 7, oc: 0 },                 // bottom-left
  ];

  eyePositions.forEach(({ or, oc }) => {
    const px = (oc + margin) * cellSize;
    const py = (or + margin) * cellSize;
    drawEye(ctx, px, py, cellSize, eyeOuterShape, eyeInnerShape, eyeColor, bgColor);
  });

  // 7. Logo overlay
  if (dc.logo_url) {
    await new Promise((resolve) => {
      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      logo.onload = () => {
        // Preserve aspect ratio — fit within a max box of 20% of canvas
        const maxSize = canvasPx * 0.2;
        const aspect = logo.naturalWidth / logo.naturalHeight;
        let drawW, drawH;
        if (aspect >= 1) {
          drawW = maxSize;
          drawH = maxSize / aspect;
        } else {
          drawH = maxSize;
          drawW = maxSize * aspect;
        }
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

// ─── component ────────────────────────────────────────────────────────────────

export default function QRCodePreview({ qrData }) {
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

  // Business Card: show mobile card preview instead of QR matrix
  if (qrData.content_type === 'business_card') {
    let bcData = {};
    try { bcData = JSON.parse(qrData.content || '{}'); } catch {}
    return <BusinessCardPreview data={bcData} />;
  }

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