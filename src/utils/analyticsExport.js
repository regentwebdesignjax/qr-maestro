import { format } from 'date-fns';
import { jsPDF } from 'jspdf';

const LOGO_URL = 'https://media.base44.com/images/public/697bd26bb993b44c81affe97/af65437e0_qr-sensei-logo-v1.png';
const CHAR_URL = 'https://media.base44.com/images/public/697bd26bb993b44c81affe97/f467416b9_sensei-pose.png';

const PAGE_W = 215.9;
const PAGE_H = 279.4;
const MARGIN = 14;
const CONTENT_W = PAGE_W - MARGIN * 2;
const SEPARATOR_Y = 30;
const CONTENT_START_Y = 37;
const FOOTER_H = 26;
const ACCENT_H = 3;
const FOOTER_TOP = PAGE_H - FOOTER_H;
const CONTENT_END_Y = FOOTER_TOP - 5;

const C_RED    = [187, 63, 39];
const C_BLACK  = [20, 32, 36];
const C_GRAY   = [107, 114, 128];
const C_LGRAY  = [229, 231, 235];

const OS_RGB = {
  iOS:           [31,  41,  55],
  Android:       [34,  197, 94],
  Windows:       [59,  130, 246],
  macOS:         [168, 85,  247],
  Linux:         [249, 115, 22],
  'Windows Phone':[96, 165, 250],
  Other:         [156, 163, 175],
  Unknown:       [209, 213, 219],
};

async function fetchB64(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('fetch failed');
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function heatColor(intensity) {
  if (intensity === 0) return [249, 250, 251];
  return [
    Math.round((0.95 + (0.733 - 0.95) * intensity) * 255),
    Math.round((0.90 + (0.247 - 0.90) * intensity) * 255),
    Math.round((0.88 + (0.153 - 0.88) * intensity) * 255),
  ];
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

function drawHeader(doc, logoB64, generatedAt) {
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, PAGE_W, SEPARATOR_Y + 2, 'F');

  if (logoB64) {
    doc.addImage(logoB64, 'PNG', MARGIN, 7, 52, 15);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...C_BLACK);
  doc.text('ANALYTICS REPORT', PAGE_W - MARGIN, 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated ${generatedAt}`, PAGE_W - MARGIN, 21, { align: 'right' });

  doc.setDrawColor(...C_LGRAY);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, SEPARATOR_Y, PAGE_W - MARGIN, SEPARATOR_Y);
}

function drawFooter(doc, senseiB64) {
  doc.setFillColor(...C_BLACK);
  doc.rect(0, FOOTER_TOP, PAGE_W, FOOTER_H - ACCENT_H, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('Powered by QR Sensei', MARGIN, FOOTER_TOP + 13);

  if (senseiB64) {
    doc.addImage(senseiB64, 'PNG', PAGE_W - 32, FOOTER_TOP - 7, 24, 30);
  }

  doc.setFillColor(...C_RED);
  doc.rect(0, PAGE_H - ACCENT_H, PAGE_W, ACCENT_H, 'F');
}

function maybePageBreak(doc, y, neededH, logoB64, generatedAt, senseiB64) {
  if (y + neededH > CONTENT_END_Y) {
    drawFooter(doc, senseiB64);
    doc.addPage();
    drawHeader(doc, logoB64, generatedAt);
    return CONTENT_START_Y;
  }
  return y;
}

function sectionTitle(doc, text, y) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...C_BLACK);
  doc.text(text, MARGIN, y);
  return y + 7;
}

// ─── Summary stat cards ───────────────────────────────────────────────────────

function drawSummaryStats(doc, totalScans, uniqueScanners, dateRangeLabel, y) {
  const boxW = (CONTENT_W - 5) / 2;
  const boxH = 22;

  [
    { label: 'Total Scans',      value: String(totalScans),    sub: dateRangeLabel },
    { label: 'Unique Scanners',  value: String(uniqueScanners), sub: 'Est. unique devices' },
  ].forEach((box, i) => {
    const x = MARGIN + i * (boxW + 5);

    doc.setFillColor(248, 248, 248);
    doc.setDrawColor(...C_LGRAY);
    doc.setLineWidth(0.3);
    doc.rect(x, y, boxW, boxH, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...C_GRAY);
    doc.text(box.label, x + 4, y + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...C_BLACK);
    doc.text(box.value, x + 4, y + 17);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text(box.sub, x + 4, y + 21);
  });

  return y + boxH + 8;
}

// ─── Scans over time bar chart ────────────────────────────────────────────────

function computeChartData(filteredScans, dateRange) {
  const from   = dateRange.from;
  const toDate = dateRange.to || dateRange.from;
  const daysDiff = Math.ceil((toDate - from) / 86400000);
  const grouped  = {};

  if (daysDiff > 90) {
    filteredScans.forEach(scan => {
      if (!scan.created_date) return;
      const raw = scan.created_date.endsWith('Z') ? scan.created_date : scan.created_date + 'Z';
      const d = new Date(raw);
      if (isNaN(d.getTime())) return;
      const key = format(d, 'yyyy-MM');
      grouped[key] = (grouped[key] || 0) + 1;
    });
    const cur = new Date(from.getFullYear(), from.getMonth(), 1);
    const end = new Date(toDate.getFullYear(), toDate.getMonth(), 1);
    while (cur <= end) {
      const key = format(cur, 'yyyy-MM');
      if (!(key in grouped)) grouped[key] = 0;
      cur.setMonth(cur.getMonth() + 1);
    }
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, scans]) => {
        const [yr, mo] = key.split('-');
        return { label: format(new Date(Number(yr), Number(mo) - 1, 1), 'MMM yyyy'), scans };
      });
  }

  // Daily
  const cur = new Date(from);
  while (cur <= toDate) {
    grouped[format(cur, 'yyyy-MM-dd')] = 0;
    cur.setDate(cur.getDate() + 1);
  }
  filteredScans.forEach(scan => {
    if (!scan.created_date) return;
    const raw = scan.created_date.endsWith('Z') ? scan.created_date : scan.created_date + 'Z';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return;
    const key = format(d, 'yyyy-MM-dd');
    if (key in grouped) grouped[key]++;
  });

  const labelFmt = daysDiff <= 7 ? 'EEE MMM d' : 'MMM d';
  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, scans]) => ({
      label: format(new Date(key + 'T00:00:00'), labelFmt),
      scans,
    }));
}

function drawScansOverTime(doc, filteredScans, dateRange, y) {
  y = sectionTitle(doc, 'Scans Over Time', y);

  const data = computeChartData(filteredScans, dateRange);
  if (!data.length) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(180, 180, 180);
    doc.text('No scan data for this period.', MARGIN, y);
    return y + 10;
  }

  const yAxisW = 10;
  const chartH = 42;
  const chartW = CONTENT_W - yAxisW;
  const maxVal = Math.max(...data.map(d => d.scans), 1);
  const barSpacing = chartW / data.length;
  const barW = Math.max(barSpacing * 0.65, 0.5);

  // Horizontal grid lines + y-axis labels
  for (let i = 0; i <= 4; i++) {
    const lineY = y + chartH * (1 - i / 4);
    doc.setDrawColor(...C_LGRAY);
    doc.setLineWidth(0.2);
    doc.line(MARGIN + yAxisW, lineY, MARGIN + yAxisW + chartW, lineY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(...C_GRAY);
    doc.text(String(Math.round((i / 4) * maxVal)), MARGIN + yAxisW - 1, lineY, {
      align: 'right',
      baseline: 'middle',
    });
  }

  // Bars + x-axis labels
  const step = Math.max(1, Math.ceil(data.length / 12));
  data.forEach((item, i) => {
    const bH = (item.scans / maxVal) * chartH;
    const bX = MARGIN + yAxisW + i * barSpacing + (barSpacing - barW) / 2;
    if (bH > 0) {
      doc.setFillColor(59, 130, 246);
      doc.rect(bX, y + chartH - bH, barW, bH, 'F');
    }
    if (i % step === 0 || i === data.length - 1) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5);
      doc.setTextColor(...C_GRAY);
      doc.text(item.label, bX + barW / 2, y + chartH + 3.5, { align: 'center' });
    }
  });

  return y + chartH + 10;
}

// ─── OS breakdown horizontal bars ─────────────────────────────────────────────

function drawOSBars(doc, osStats, totalScans, y) {
  const entries = Object.entries(osStats).sort(([, a], [, b]) => b - a);
  if (!entries.length) return y;

  y = sectionTitle(doc, 'Scans by Device / OS', y);

  entries.forEach(([os, count]) => {
    const pct = totalScans > 0 ? Math.round((count / totalScans) * 100) : 0;
    const rgb = OS_RGB[os] || [156, 163, 175];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);
    doc.text(os, MARGIN, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...C_BLACK);
    doc.text(`${count}  (${pct}%)`, PAGE_W - MARGIN, y, { align: 'right' });

    doc.setFillColor(...C_LGRAY);
    doc.rect(MARGIN, y + 1.5, CONTENT_W, 3, 'F');

    const fw = Math.max((pct / 100) * CONTENT_W, 0.5);
    doc.setFillColor(...rgb);
    doc.rect(MARGIN, y + 1.5, fw, 3, 'F');

    y += 11;
  });

  return y + 4;
}

// ─── Time of day heatmap (7 × 24 grid) ───────────────────────────────────────

function drawHeatmap(doc, filteredScans, y) {
  y = sectionTitle(doc, 'Scans by Time of Day', y);

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const grid = Array.from({ length: 7 }, () => Array(24).fill(0));

  filteredScans.forEach(scan => {
    if (!scan.created_date) return;
    const raw = scan.created_date.endsWith('Z') ? scan.created_date : scan.created_date + 'Z';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return;
    const dow = d.getDay();
    grid[dow === 0 ? 6 : dow - 1][d.getHours()]++;
  });

  const maxVal   = Math.max(...grid.flat(), 1);
  const labelW   = 11;
  const scaleW   = 14;
  const gridW    = CONTENT_W - labelW - scaleW - 2;
  const colW     = gridW / 7;
  const cellH    = 2.3;
  const gridH    = 24 * cellH;

  // Hour labels (inverted: 11pm at top → 12am at bottom)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(...C_GRAY);
  for (let row = 0; row < 24; row++) {
    const h = 23 - row;
    const label = h === 0 ? '12am' : h === 12 ? '12pm' : h < 12 ? `${h}am` : `${h - 12}pm`;
    doc.text(label, MARGIN + labelW - 1, y + row * cellH + cellH / 2, {
      align: 'right',
      baseline: 'middle',
    });
  }

  // Grid cells
  for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
    const cx = MARGIN + labelW + 2 + dayIdx * colW;
    for (let row = 0; row < 24; row++) {
      const count = grid[dayIdx][23 - row];
      const [r, g, b] = heatColor(count / maxVal);
      doc.setFillColor(r, g, b);
      doc.rect(cx, y + row * cellH, colW - 0.4, cellH - 0.2, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(...C_GRAY);
    doc.text(DAYS[dayIdx], cx + colW / 2, y + gridH + 4, { align: 'center' });
  }

  // Gradient scale (right side)
  const scaleX = MARGIN + labelW + 2 + gridW + 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(...C_GRAY);
  doc.text(String(maxVal), scaleX + 4, y, { align: 'center', baseline: 'top' });
  doc.text('0', scaleX + 4, y + gridH, { align: 'center', baseline: 'bottom' });
  const scaleStepH = gridH / 24;
  for (let i = 0; i < 24; i++) {
    const [r, g, b] = heatColor(1 - i / 23);
    doc.setFillColor(r, g, b);
    doc.rect(scaleX, y + i * scaleStepH, 8, scaleStepH, 'F');
  }

  return y + gridH + 10;
}

// ─── Scan locations table ──────────────────────────────────────────────────────

function aggregateLocations(filteredScans) {
  const grouped = {};
  filteredScans.forEach(scan => {
    const loc     = [scan.city, scan.state].filter(Boolean).join(', ') || scan.country || 'Unknown';
    const country = scan.country || '—';
    const key     = `${loc}|${country}`;
    if (!grouped[key]) grouped[key] = { loc, country, scans: 0 };
    grouped[key].scans++;
  });
  return Object.values(grouped).sort((a, b) => b.scans - a.scans);
}

function drawLocationsTable(doc, filteredScans, y) {
  const all = aggregateLocations(filteredScans);
  if (!all.length) return y;

  y = sectionTitle(doc, 'Top Scan Locations', y);

  const rows   = all.slice(0, 10);
  const total  = filteredScans.length;
  const rowH   = 7;
  const C_LOC  = 100;
  const C_CTY  = 52;
  const C_SCN  = 20;
  const C_PCT  = CONTENT_W - C_LOC - C_CTY - C_SCN;

  // Header row
  doc.setFillColor(243, 244, 246);
  doc.rect(MARGIN, y, CONTENT_W, rowH, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...C_GRAY);
  doc.text('LOCATION',  MARGIN + 3,                        y + 4.5);
  doc.text('COUNTRY',   MARGIN + C_LOC + 3,                y + 4.5);
  doc.text('SCANS',     MARGIN + C_LOC + C_CTY + C_SCN,   y + 4.5, { align: 'right' });
  doc.text('% TOTAL',   MARGIN + CONTENT_W,                y + 4.5, { align: 'right' });
  y += rowH;

  rows.forEach((row, i) => {
    const even = i % 2 === 0;
    doc.setFillColor(even ? 255 : 249, even ? 255 : 250, even ? 255 : 251);
    doc.rect(MARGIN, y, CONTENT_W, rowH, 'F');

    const pct = total > 0 ? Math.round((row.scans / total) * 100) : 0;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(55, 65, 81);
    doc.text(row.loc,     MARGIN + 3,                        y + 4.5);
    doc.text(row.country, MARGIN + C_LOC + 3,                y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.text(String(row.scans), MARGIN + C_LOC + C_CTY + C_SCN, y + 4.5, { align: 'right' });
    doc.text(`${pct}%`,         MARGIN + CONTENT_W,              y + 4.5, { align: 'right' });

    doc.setDrawColor(...C_LGRAY);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, y + rowH, MARGIN + CONTENT_W, y + rowH);
    y += rowH;
  });

  if (all.length > 10) {
    y += 2;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(160, 160, 160);
    doc.text(`+ ${all.length - 10} more locations not shown`, MARGIN, y + 4);
    y += 8;
  }

  return y + 4;
}

// ─── Public entry point ────────────────────────────────────────────────────────

export async function generateAnalyticsPDF({
  qrCode,
  filteredScans,
  osStats,
  uniqueScanners,
  dateRangeLabel,
  dateRange,
}) {
  const [logoB64, senseiB64] = await Promise.all([
    fetchB64(LOGO_URL),
    fetchB64(CHAR_URL),
  ]);

  const generatedAt = format(new Date(), "MMM d, yyyy 'at' h:mm a");
  const doc = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });

  // Page 1 header
  drawHeader(doc, logoB64, generatedAt);

  // QR name + period label
  let y = CONTENT_START_Y;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...C_BLACK);
  doc.text(qrCode.name || 'Analytics Report', MARGIN, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(140, 140, 140);
  doc.text(`Period: ${dateRangeLabel}`, MARGIN, y);
  y += 10;

  // Summary stats
  y = maybePageBreak(doc, y, 28, logoB64, generatedAt, senseiB64);
  y = drawSummaryStats(doc, filteredScans.length, uniqueScanners, dateRangeLabel, y);

  // Scans over time
  const chartData = computeChartData(filteredScans, dateRange);
  y = maybePageBreak(doc, y, chartData.length > 0 ? 58 : 18, logoB64, generatedAt, senseiB64);
  y = drawScansOverTime(doc, filteredScans, dateRange, y);

  // OS breakdown
  const osCount = Object.keys(osStats).length;
  y = maybePageBreak(doc, y, osCount * 11 + 22, logoB64, generatedAt, senseiB64);
  y = drawOSBars(doc, osStats, filteredScans.length, y);

  // Time of day heatmap
  const heatH = 24 * 2.3 + 20;
  y = maybePageBreak(doc, y, heatH, logoB64, generatedAt, senseiB64);
  y = drawHeatmap(doc, filteredScans, y);

  // Locations table
  const locs = aggregateLocations(filteredScans);
  if (locs.length > 0) {
    const locH = Math.min(locs.length, 10) * 7 + 24;
    y = maybePageBreak(doc, y, locH, logoB64, generatedAt, senseiB64);
    drawLocationsTable(doc, filteredScans, y);
  }

  // Footer on final page
  drawFooter(doc, senseiB64);

  const safeName = (qrCode.name || 'analytics').replace(/[^a-z0-9_-]/gi, '_');
  doc.save(`${safeName}_analytics.pdf`);
}
