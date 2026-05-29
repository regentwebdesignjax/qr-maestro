import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

function parseDate(str) {
  if (!str) return null;
  const raw = str.endsWith('Z') ? str : str + 'Z';
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

function filterScans(scans, startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return scans.filter(s => {
    const d = parseDate(s.created_date);
    if (!d) return false;
    return d >= start && d <= end;
  });
}

function computeStats(scans) {
  // Unique scanners
  const seen = new Set(scans.map(s => `${s.browser}|${s.device_type}|${s.country}`));
  const uniqueScanners = seen.size;

  // OS breakdown
  const osMap = {};
  scans.forEach(s => {
    const os = s.os || 'Unknown';
    osMap[os] = (osMap[os] || 0) + 1;
  });
  const osStats = Object.entries(osMap).sort((a, b) => b[1] - a[1]);

  // Country breakdown
  const countryMap = {};
  scans.forEach(s => {
    const c = s.country || 'Unknown';
    countryMap[c] = (countryMap[c] || 0) + 1;
  });
  const countryStats = Object.entries(countryMap).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // City breakdown
  const cityMap = {};
  scans.forEach(s => {
    if (!s.city) return;
    const key = s.city + (s.country ? `, ${s.country}` : '');
    cityMap[key] = (cityMap[key] || 0) + 1;
  });
  const cityStats = Object.entries(cityMap).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Time of day (hour buckets 0-23)
  const hourMap = Array(24).fill(0);
  scans.forEach(s => {
    const d = parseDate(s.created_date);
    if (d) hourMap[d.getUTCHours()]++;
  });
  const peakHours = hourMap
    .map((count, hour) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .filter(h => h.count > 0);

  // Scans over time (daily)
  const dailyMap = {};
  scans.forEach(s => {
    const d = parseDate(s.created_date);
    if (d) {
      const key = d.toISOString().split('T')[0];
      dailyMap[key] = (dailyMap[key] || 0) + 1;
    }
  });
  const scansOverTime = Object.entries(dailyMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return { uniqueScanners, osStats, countryStats, cityStats, peakHours, scansOverTime };
}

function formatHour(h) {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

function buildCSV(scans) {
  const headers = ['Date (UTC)', 'Country', 'City', 'State', 'Device Type', 'OS', 'Browser', 'Referrer'];
  const rows = scans.map(s => [
    s.created_date ? parseDate(s.created_date)?.toISOString().replace('T', ' ').slice(0, 19) : '',
    s.country || '',
    s.city || '',
    s.state || '',
    s.device_type || '',
    s.os || '',
    s.browser || '',
    s.referrer || '',
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
  return [headers.join(','), ...rows].join('\n');
}

async function buildPDF(qrName, dateLabel, scans, stats) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const margin = 18;
  const contentW = W - margin * 2;
  let y = 0;

  // Brand colors
  const red = [187, 63, 39];
  const dark = [20, 32, 36];
  const gray = [110, 120, 125];
  const lightGray = [180, 185, 188];

  // ── Header band ───────────────────────────────────────────────────
  // Dark branded header background
  doc.setFillColor(...dark);
  doc.rect(0, 0, W, 36, 'F');

  // Red accent bar at very top
  doc.setFillColor(...red);
  doc.rect(0, 0, W, 3, 'F');

  // Embed the QR Sensei logo (PNG)
  try {
    const logoUrl = 'https://media.base44.com/images/public/697bd26bb993b44c81affe97/af65437e0_qr-sensei-logo-v1.png';
    const logoRes = await fetch(logoUrl);
    const logoBuffer = await logoRes.arrayBuffer();
    const logoBytes = new Uint8Array(logoBuffer);
    const logoBase64 = btoa(new TextDecoder('iso-8859-1').decode(logoBytes));
    const logoDataUrl = `data:image/png;base64,${logoBase64}`;
    doc.addImage(logoDataUrl, 'PNG', margin, 7, 52, 20);
  } catch (_) {
    // Fallback: text logo if image fails
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...red);
    doc.text('QR', margin, 20);
    const qrW = doc.getTextWidth('QR');
    doc.setTextColor(255, 255, 255);
    doc.text(' SENSEI', margin + qrW, 20);
  }

  // "Analytics Report" label — right side of header
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 205, 208);
  doc.text('ANALYTICS REPORT', W - margin, 16, { align: 'right' });
  doc.setFontSize(7);
  doc.setTextColor(150, 158, 163);
  doc.text(`Generated ${new Date().toUTCString()}`, W - margin, 22, { align: 'right' });

  y = 46;

  // ── QR code name + date range ─────────────────────────────────────
  doc.setTextColor(...dark);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(qrName || 'QR Code Report', margin, y);
  y += 6;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  doc.text(`Period: ${dateLabel}`, margin, y);
  y += 9;

  // Divider
  doc.setDrawColor(...red);
  doc.setLineWidth(0.6);
  doc.line(margin, y, margin + 30, y);
  doc.setDrawColor(220, 215, 210);
  doc.setLineWidth(0.3);
  doc.line(margin + 30, y, W - margin, y);
  y += 9;

  // ── QR code name + date range ─────────────────────────────────────
  doc.setTextColor(...dark);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(qrName || 'QR Code Report', margin, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  doc.text(`Period: ${dateLabel}`, margin, y);
  y += 8;

  // ── Divider ───────────────────────────────────────────────────────
  doc.setDrawColor(230, 225, 220);
  doc.setLineWidth(0.3);
  doc.line(margin, y, W - margin, y);
  y += 8;

  // ── Overview cards ────────────────────────────────────────────────
  const cardW = (contentW - 8) / 2;

  // Total Scans — brand red tint
  doc.setFillColor(255, 237, 233);
  doc.roundedRect(margin, y, cardW, 22, 3, 3, 'F');
  doc.setTextColor(...red);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL SCANS', margin + 5, y + 8);
  doc.setTextColor(...dark);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(String(scans.length), margin + 5, y + 18);

  // Unique Scanners — brand dark tint
  const card2X = margin + cardW + 8;
  doc.setFillColor(235, 238, 240);
  doc.roundedRect(card2X, y, cardW, 22, 3, 3, 'F');
  doc.setTextColor(...dark);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('UNIQUE SCANNERS', card2X + 5, y + 8);
  doc.setFontSize(22);
  doc.text(String(stats.uniqueScanners), card2X + 5, y + 18);

  y += 30;

  // ── Section header helper ─────────────────────────────────────────
  const sectionHeader = (title) => {
    doc.setFillColor(...red);
    doc.roundedRect(margin, y, 3, 5, 1, 1, 'F');
    doc.setTextColor(...dark);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 6, y + 4.5);
    y += 10;
  };

  // ── Section: Scans Over Time ──────────────────────────────────────
  sectionHeader('Scans Over Time');

  if (stats.scansOverTime.length === 0) {
    doc.setFontSize(9); doc.setFont('helvetica', 'italic'); doc.setTextColor(...gray);
    doc.text('No data available.', margin, y); y += 12;
  } else {
    const chartH = 40;
    const chartX = margin + 6;
    const chartW = contentW - 6;
    const chartTop = y;
    const chartBottom = chartTop + chartH;
    const maxCount = Math.max(...stats.scansOverTime.map(d => d.count));
    const pts = stats.scansOverTime;
    const n = pts.length;

    // Background
    doc.setFillColor(252, 250, 249);
    doc.rect(chartX, chartTop, chartW, chartH, 'F');

    // Grid lines (3 horizontal)
    doc.setDrawColor(220, 215, 210);
    doc.setLineWidth(0.2);
    [0.25, 0.5, 0.75, 1].forEach(frac => {
      const gy = chartBottom - frac * chartH;
      doc.line(chartX, gy, chartX + chartW, gy);
      doc.setFontSize(6); doc.setTextColor(...gray);
      doc.text(String(Math.round(frac * maxCount)), chartX - 1, gy + 1, { align: 'right' });
    });

    // Bars
    const barW = Math.max(2, (chartW / n) * 0.6);
    const step = chartW / n;
    doc.setLineWidth(0.5);

    pts.forEach((pt, i) => {
      const bx = chartX + i * step + step * 0.2;
      const bh = maxCount > 0 ? (pt.count / maxCount) * chartH : 0;
      const bTop = chartBottom - bh;

      doc.setFillColor(...red);
      doc.rect(bx, bTop, barW, bh, 'F');

      // Date label — show every Nth to avoid crowding
      const showEvery = Math.max(1, Math.ceil(n / 10));
      if (i % showEvery === 0 || i === n - 1) {
        doc.setFontSize(5.5); doc.setTextColor(...gray);
        const label = pt.date.slice(5); // MM-DD
        doc.text(label, bx + barW / 2, chartBottom + 4, { align: 'center' });
      }
    });

    // Chart border
    doc.setDrawColor(210, 205, 200);
    doc.setLineWidth(0.3);
    doc.rect(chartX, chartTop, chartW, chartH);

    y = chartBottom + 10;
  }

  // ── Section: Devices / OS ─────────────────────────────────────────
  sectionHeader('Scans by Device / OS');

  if (stats.osStats.length === 0) {
    doc.setFontSize(9); doc.setFont('helvetica', 'italic'); doc.setTextColor(...gray);
    doc.text('No device data available.', margin, y); y += 8;
  } else {
    const total = scans.length;
    const labelW = 32; // fixed width for OS label
    const valueW = 20; // fixed width for "N (XX%)" text on right
    const barAreaX = margin + labelW;
    const barAreaW = contentW - labelW - valueW;

    stats.osStats.forEach(([os, count]) => {
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      const barW = total > 0 ? (count / total) * barAreaW : 0;

      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...dark);
      doc.text(os, margin, y + 3.5);

      // Bar track
      doc.setFillColor(240, 237, 233);
      doc.roundedRect(barAreaX, y, barAreaW, 4, 1, 1, 'F');
      // Bar fill
      if (barW > 0) {
        doc.setFillColor(...red);
        doc.roundedRect(barAreaX, y, barW, 4, 1, 1, 'F');
      }

      // Value label — to the right of the track, guaranteed clear
      doc.setFontSize(8); doc.setTextColor(...gray);
      doc.text(`${count} (${pct}%)`, barAreaX + barAreaW + 2, y + 3.5);

      y += 9;
    });
  }

  y += 4;

  // ── Section: Peak Scanning Hours (vertical bar chart) ────────────
  sectionHeader('Peak Scanning Hours');

  if (stats.peakHours.length === 0) {
    doc.setFontSize(9); doc.setFont('helvetica', 'italic'); doc.setTextColor(...gray);
    doc.text('No time-of-day data available.', margin, y); y += 8;
  } else {
    const peakSorted = [...stats.peakHours].sort((a, b) => a.hour - b.hour); // chronological
    const maxCount = stats.peakHours[0].count; // already sorted desc
    const chartH = 30;
    const chartBottom = y + chartH;
    const n = peakSorted.length;
    const barW = 18;
    const gap = 10;
    const totalBarsW = n * barW + (n - 1) * gap;
    const startX = margin + (contentW - totalBarsW) / 2;

    peakSorted.forEach((pt, i) => {
      const bx = startX + i * (barW + gap);
      const bh = maxCount > 0 ? (pt.count / maxCount) * chartH : 0;
      const bTop = chartBottom - bh;

      // Bar
      doc.setFillColor(...red);
      doc.roundedRect(bx, bTop, barW, bh, 2, 2, 'F');

      // Count label above bar
      doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...dark);
      doc.text(String(pt.count), bx + barW / 2, bTop - 2, { align: 'center' });

      // Hour label below bar
      doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...gray);
      doc.text(formatHour(pt.hour), bx + barW / 2, chartBottom + 5, { align: 'center' });
    });

    y = chartBottom + 12;
    doc.setFontSize(7.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(...gray);
    doc.text('* Hours shown in UTC', margin, y); y += 8;
  }

  y += 4;

  // ── Section: Top Scan Locations ───────────────────────────────────
  const locationsNeeded = Math.max(stats.countryStats.length, 1) * 8 + 30;
  if (y + locationsNeeded > 270) { doc.addPage(); y = 20; }

  sectionHeader('Top Scan Locations (Countries)');

  if (stats.countryStats.length === 0) {
    doc.setFontSize(9); doc.setFont('helvetica', 'italic'); doc.setTextColor(...gray);
    doc.text('No location data available.', margin, y); y += 8;
  } else {
    const total = scans.length;
    doc.setFillColor(245, 242, 240);
    doc.rect(margin, y - 1, contentW, 7, 'F');
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 80, 75);
    doc.text('Country', margin + 2, y + 4);
    doc.text('Scans', margin + 80, y + 4);
    doc.text('Share', margin + 110, y + 4);
    y += 9;

    stats.countryStats.forEach(([country, count], idx) => {
      const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
      if (idx % 2 === 0) {
        doc.setFillColor(252, 250, 249);
        doc.rect(margin, y - 1, contentW, 7, 'F');
      }
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...dark);
      doc.text(country, margin + 2, y + 4);
      doc.text(String(count), margin + 80, y + 4);
      doc.text(`${pct}%`, margin + 110, y + 4);
      y += 7;
    });
  }

  y += 8;

  // Top Cities
  if (stats.cityStats.length > 0) {
    if (y + stats.cityStats.length * 7 + 20 > 270) { doc.addPage(); y = 20; }

    sectionHeader('Top Scan Locations (Cities)');

    const total = scans.length;
    doc.setFillColor(245, 242, 240);
    doc.rect(margin, y - 1, contentW, 7, 'F');
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(100, 80, 75);
    doc.text('City', margin + 2, y + 4);
    doc.text('Scans', margin + 80, y + 4);
    doc.text('Share', margin + 110, y + 4);
    y += 9;

    stats.cityStats.forEach(([city, count], idx) => {
      const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
      if (idx % 2 === 0) {
        doc.setFillColor(252, 250, 249);
        doc.rect(margin, y - 1, contentW, 7, 'F');
      }
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...dark);
      doc.text(city, margin + 2, y + 4);
      doc.text(String(count), margin + 80, y + 4);
      doc.text(`${pct}%`, margin + 110, y + 4);
      y += 7;
    });
  }

  // ── Footer ────────────────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    // Footer background
    doc.setFillColor(...dark);
    doc.rect(0, 280, W, 17, 'F');
    doc.setFillColor(...red);
    doc.rect(0, 280, W, 1.5, 'F');
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(160, 168, 172);
    doc.text('Powered by QR Sensei  |  qr-sensei.com', margin, 288);
    doc.text(`Page ${i} of ${pageCount}`, W - margin, 288, { align: 'right' });
  }

  return doc.output('arraybuffer');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const isPro = user.role === 'admin' || (user.subscription_tier === 'pro' && user.subscription_status === 'active');
    if (!isPro) return Response.json({ error: 'Pro plan required' }, { status: 403 });

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const { qr_code_id, start_date, end_date, format, date_label } = body;

    if (!qr_code_id || !start_date || !end_date || !format) {
      return Response.json({ error: 'qr_code_id, start_date, end_date, and format are required' }, { status: 400 });
    }

    // Verify ownership
    const qrCodes = await base44.asServiceRole.entities.QRCode.filter({ id: qr_code_id });
    if (qrCodes.length === 0) return Response.json({ error: 'QR code not found' }, { status: 404 });
    const qrCode = qrCodes[0];
    const ownerMatch = qrCode.owner_email === user.email || qrCode.created_by === user.email || qrCode.created_by === user.id;
    if (!ownerMatch && user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const allScans = await base44.asServiceRole.entities.Scan.filter({ qr_code_id }, '-created_date', 5000);
    const scans = filterScans(allScans, start_date, end_date);

    const safeName = (qrCode.name || 'analytics').replace(/[^a-z0-9_\-]/gi, '_');

    if (format === 'csv') {
      const csv = buildCSV(scans);
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${safeName}_analytics.csv"`,
        },
      });
    }

    if (format === 'pdf') {
      const stats = computeStats(scans);
      const pdfBuffer = await buildPDF(qrCode.name, date_label || `${start_date} - ${end_date}`, scans, stats);
      return new Response(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${safeName}_analytics.pdf"`,
        },
      });
    }

    return Response.json({ error: 'Invalid format. Use "pdf" or "csv".' }, { status: 400 });
  } catch (error) {
    console.error('exportAnalytics error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});