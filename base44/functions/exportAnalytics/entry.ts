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
    .slice(0, 3)
    .filter(h => h.count > 0);

  return { uniqueScanners, osStats, countryStats, cityStats, peakHours };
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

function buildPDF(qrName, dateLabel, scans, stats) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const margin = 18;
  const contentW = W - margin * 2;
  let y = 0;

  // ── Brand header bar ──────────────────────────────────────────────
  doc.setFillColor(187, 63, 39); // #BB3F27 primary red
  doc.rect(0, 0, W, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('QR Sensei', margin, 13);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Analytics Report', margin, 21);

  // Report title on right
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toUTCString()}`, W - margin, 21, { align: 'right' });

  y = 38;

  // ── QR code name + date range ─────────────────────────────────────
  doc.setTextColor(20, 32, 36);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(qrName || 'QR Code Report', margin, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Period: ${dateLabel}`, margin, y);
  y += 10;

  // ── Divider ───────────────────────────────────────────────────────
  doc.setDrawColor(230, 225, 220);
  doc.line(margin, y, W - margin, y);
  y += 8;

  // ── Overview cards ────────────────────────────────────────────────
  const cardW = (contentW - 8) / 2;

  // Total Scans card
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(margin, y, cardW, 22, 3, 3, 'F');
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('TOTAL SCANS', margin + 5, y + 8);
  doc.setTextColor(20, 32, 36);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(String(scans.length), margin + 5, y + 18);

  // Unique Scanners card
  const card2X = margin + cardW + 8;
  doc.setFillColor(245, 243, 255);
  doc.roundedRect(card2X, y, cardW, 22, 3, 3, 'F');
  doc.setTextColor(124, 58, 237);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('UNIQUE SCANNERS', card2X + 5, y + 8);
  doc.setTextColor(20, 32, 36);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(String(stats.uniqueScanners), card2X + 5, y + 18);

  y += 30;

  // ── Section: Devices / OS ─────────────────────────────────────────
  const sectionHeader = (title, iconColor) => {
    doc.setFillColor(...iconColor);
    doc.roundedRect(margin, y, 3, 5, 1, 1, 'F');
    doc.setTextColor(20, 32, 36);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 6, y + 4.5);
    y += 10;
  };

  sectionHeader('Scans by Device / OS', [187, 63, 39]);

  if (stats.osStats.length === 0) {
    doc.setFontSize(9); doc.setFont('helvetica', 'italic'); doc.setTextColor(150, 150, 150);
    doc.text('No device data available.', margin, y); y += 8;
  } else {
    const total = scans.length;
    stats.osStats.forEach(([os, count]) => {
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      const barW = total > 0 ? (count / total) * (contentW - 40) : 0;

      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(20, 32, 36);
      doc.text(os, margin, y + 3.5);
      doc.text(`${count} (${pct}%)`, W - margin, y + 3.5, { align: 'right' });

      // Bar track
      doc.setFillColor(240, 237, 233);
      doc.roundedRect(margin + 30, y, contentW - 40, 4, 1, 1, 'F');
      // Bar fill
      if (barW > 0) {
        doc.setFillColor(187, 63, 39);
        doc.roundedRect(margin + 30, y, barW, 4, 1, 1, 'F');
      }
      y += 9;
    });
  }

  y += 4;

  // ── Section: Peak Scanning Hours ─────────────────────────────────
  sectionHeader('Peak Scanning Hours', [187, 63, 39]);

  if (stats.peakHours.length === 0) {
    doc.setFontSize(9); doc.setFont('helvetica', 'italic'); doc.setTextColor(150, 150, 150);
    doc.text('No time-of-day data available.', margin, y); y += 8;
  } else {
    const maxCount = stats.peakHours[0].count;
    stats.peakHours.forEach(({ hour, count }, i) => {
      const label = `#${i + 1} Peak: ${formatHour(hour)}`;
      const barW = maxCount > 0 ? (count / maxCount) * (contentW - 50) : 0;

      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(20, 32, 36);
      doc.text(label, margin, y + 3.5);
      doc.text(`${count} scans`, W - margin, y + 3.5, { align: 'right' });

      doc.setFillColor(240, 237, 233);
      doc.roundedRect(margin + 42, y, contentW - 50, 4, 1, 1, 'F');
      if (barW > 0) {
        doc.setFillColor(187, 63, 39);
        doc.roundedRect(margin + 42, y, barW, 4, 1, 1, 'F');
      }
      y += 9;
    });
    doc.setFontSize(8); doc.setFont('helvetica', 'italic'); doc.setTextColor(130, 130, 130);
    doc.text('* Hours shown in UTC', margin, y); y += 8;
  }

  y += 4;

  // ── Section: Top Scan Locations ───────────────────────────────────
  // Check if we need a new page
  const locationsNeeded = Math.max(stats.countryStats.length, 1) * 8 + 30;
  if (y + locationsNeeded > 270) { doc.addPage(); y = 20; }

  sectionHeader('Top Scan Locations (Countries)', [187, 63, 39]);

  if (stats.countryStats.length === 0) {
    doc.setFontSize(9); doc.setFont('helvetica', 'italic'); doc.setTextColor(150, 150, 150);
    doc.text('No location data available.', margin, y); y += 8;
  } else {
    const total = scans.length;
    // 2-column table header
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
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(20, 32, 36);
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

    sectionHeader('Top Scan Locations (Cities)', [187, 63, 39]);

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
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(20, 32, 36);
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
    doc.setDrawColor(230, 225, 220);
    doc.line(margin, 285, W - margin, 285);
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(160, 160, 160);
    doc.text('© QR Sensei  •  qr-sensei.com', margin, 290);
    doc.text(`Page ${i} of ${pageCount}`, W - margin, 290, { align: 'right' });
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

    // Fetch all scans and filter by date range
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
      const pdfBuffer = buildPDF(qrCode.name, date_label || `${start_date} – ${end_date}`, scans, stats);
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