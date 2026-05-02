import QRCode from 'qrcode';

// ─── Rendering helpers ────────────────────────────────────────────────────────

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

  if (transparent) {
    ctx.clearRect(originX, originY, outerPx, outerPx);
  } else {
    ctx.fillStyle = bgColor;
    ctx.fillRect(originX, originY, outerPx, outerPx);
  }

  ctx.fillStyle = eyeColor;

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
    if (transparent) ctx.restore();
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

function getQRContent(qr) {
  if (qr.type === 'dynamic' && qr.short_code) {
    return `${window.location.origin}/r?code=${qr.short_code}`;
  }
  return qr.content;
}

// ─── Core renderer ────────────────────────────────────────────────────────────

/**
 * Renders a fully-designed QR code onto a canvas element.
 * Applies all design_config properties: colors, gradients, module style,
 * eye shapes, eye color, logo, and transparent background.
 */
export async function renderQR(canvas, qrData, canvasPx = 300) {
  const dc = qrData.design_config || {};
  const fgColor = dc.foreground_color || '#000000';
  const transparentBg = dc.transparent_background === true || dc.transparent_background === 'true';
  const bgColor = transparentBg ? 'rgba(0,0,0,0)' : (dc.background_color || '#ffffff');
  const gradientType = dc.gradient_type || 'none';
  const gradientColor2 = dc.gradient_color2 || '#6366f1';
  const qrStyle = dc.qr_style || 'squares';
  const eyeOuterShape = dc.eye_outer_shape || 'square';
  const eyeInnerShape = dc.eye_inner_shape || 'square';
  const eyeColor = dc.eye_color || fgColor;

  const content = getQRContent(qrData);

  const qrMatrix = QRCode.create(content, { errorCorrectionLevel: 'H' });
  const modules = qrMatrix.modules;
  const size = modules.size;
  const margin = 2;
  const totalModules = size + margin * 2;
  const cellSize = canvasPx / totalModules;

  canvas.width = canvasPx;
  canvas.height = canvasPx;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvasPx, canvasPx);

  if (!transparentBg) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasPx, canvasPx);
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

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
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
  ctx.restore();

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

/**
 * Renders a QR code to a new off-screen canvas at the given pixel size.
 */
export async function renderQRToCanvas(qrData, size = 300) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  await renderQR(canvas, qrData, size);
  return canvas;
}

// ─── Download helpers ─────────────────────────────────────────────────────────

/**
 * Downloads a fully-designed 1024×1024 PNG for a QR code record.
 * Applies all design_config properties via the shared renderer.
 */
export async function downloadQRPng(qr) {
  const canvas = await renderQRToCanvas(qr, 1024);
  const link = document.createElement('a');
  link.download = `${(qr.name || 'qrcode').replace(/[^a-z0-9]/gi, '_')}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/**
 * Downloads an SVG for a QR code record.
 * Applies foreground/background colors and transparent background.
 * Note: SVG output from the qrcode library uses square modules only;
 * gradients, custom eye shapes, logos, and rounded styles are not
 * representable in plain SVG — use PNG for full design fidelity.
 */
export async function downloadQRSvg(qr) {
  const dc = qr.design_config || {};
  const transparent = dc.transparent_background === true || dc.transparent_background === 'true';
  const content = getQRContent(qr);
  const fgColor = dc.foreground_color || '#000000';
  const bgColor = transparent ? 'transparent' : (dc.background_color || '#ffffff');

  const svgString = await QRCode.toString(content, {
    type: 'svg',
    margin: transparent ? 0 : 2,
    color: { dark: fgColor, light: bgColor },
  });

  let finalSvg = svgString;

  if (transparent) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const rects = doc.querySelectorAll('rect');
    const svgEl = doc.querySelector('svg');
    const svgSize = svgEl?.getAttribute('width') || svgEl?.getAttribute('viewBox')?.split(' ')[2];

    rects.forEach(rect => {
      const fill = (rect.getAttribute('fill') || '').toLowerCase();
      const w = rect.getAttribute('width');
      const h = rect.getAttribute('height');
      if (
        fill === '#ffffff' || fill === 'white' || fill === 'transparent' ||
        w === '100%' || h === '100%' ||
        (svgSize && w === svgSize && h === svgSize)
      ) {
        rect.parentNode.removeChild(rect);
      }
    });

    finalSvg = new XMLSerializer().serializeToString(doc.documentElement);
  }

  const blob = new Blob([finalSvg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${(qr.name || 'qrcode').replace(/[^a-z0-9]/gi, '_')}.svg`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
