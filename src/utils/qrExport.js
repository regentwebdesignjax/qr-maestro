import QRCode from 'qrcode';

/**
 * Shared QR export utility — used by all pages.
 * Handles transparency, 1024px hi-res PNG, and SVG background scrubbing.
 */

function getQRContent(qr) {
  if (qr.type === 'dynamic' && qr.short_code) {
    return `${window.location.origin}/r?code=${qr.short_code}`;
  }
  return qr.content;
}

/**
 * Download a 1024×1024 PNG for a QR code record.
 * Respects transparent_background from design_config.
 */
export async function downloadQRPng(qr) {
  const dc = qr.design_config || {};
  const transparent = !!dc.transparent_background;
  const content = getQRContent(qr);
  const fgColor = dc.foreground_color || '#000000';
  const bgColor = dc.background_color || '#ffffff';

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  // Start from a fully transparent baseline
  ctx.clearRect(0, 0, 1024, 1024);

  await QRCode.toCanvas(canvas, content, {
    width: 1024,
    margin: transparent ? 0 : 2,
    color: {
      dark: fgColor,
      light: transparent ? '#00000000' : bgColor,
    },
  });

  // After toCanvas, if transparent, clear any remaining opaque background pixels
  if (transparent) {
    const imageData = ctx.getImageData(0, 0, 1024, 1024);
    const data = imageData.data;
    // The background color in the QR is the bgColor or white; treat near-white as transparent
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) {
        data[i + 3] = 0; // make transparent
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  console.log(`Background layer detected and removed: ${transparent}`);

  const link = document.createElement('a');
  link.download = `${(qr.name || 'qrcode').replace(/[^a-z0-9]/gi, '_')}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/**
 * Download an SVG for a QR code record.
 * Strips the white background rect when transparent_background is set.
 */
export async function downloadQRSvg(qr) {
  const dc = qr.design_config || {};
  const transparent = !!dc.transparent_background;
  const content = getQRContent(qr);
  const fgColor = dc.foreground_color || '#000000';
  const bgColor = transparent ? 'transparent' : (dc.background_color || '#ffffff');

  const svgString = await QRCode.toString(content, {
    type: 'svg',
    margin: transparent ? 0 : 2,
    color: { dark: fgColor, light: bgColor },
  });

  let finalSvg = svgString;
  let bgRemoved = false;

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
        bgRemoved = true;
      }
    });

    finalSvg = new XMLSerializer().serializeToString(doc.documentElement);
  }

  console.log(`Background layer detected and removed: ${bgRemoved}`);

  const blob = new Blob([finalSvg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${(qr.name || 'qrcode').replace(/[^a-z0-9]/gi, '_')}.svg`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}