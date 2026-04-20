import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Upload, Download, CheckCircle, AlertTriangle, X, FileText } from 'lucide-react';

const TEMPLATE_HEADERS = ['Type', 'Name', 'URL', 'First Name', 'Last Name', 'Title', 'Phone', 'Email', 'Company'];
const TEMPLATE_ROWS = [
  ['url', 'Company Website', 'https://example.com', '', '', '', '', '', ''],
  ['business_card', 'Jane Doe Card', '', 'Jane', 'Doe', 'Marketing Manager', '+1 555-123-4567', 'jane@example.com', 'Acme Corp'],
];

function downloadTemplate() {
  const rows = [TEMPLATE_HEADERS, ...TEMPLATE_ROWS];
  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'qr_bulk_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text) {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const parseRow = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'));
  return lines.slice(1).map(line => {
    const values = parseRow(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  }).filter(row => Object.values(row).some(v => v));
}

function rowToQRCode(row, userEmail) {
  const type = (row.type || 'url').toLowerCase().trim();
  const name = row.name || `Untitled (${type})`;
  const shortCode = Math.random().toString(36).substring(2, 10);

  if (type === 'business_card') {
    const bcData = {
      name: [row.first_name, row.last_name].filter(Boolean).join(' '),
      title: row.title || '',
      phone: row.phone || '',
      email: row.email || '',
      company: row.company || '',
    };
    return {
      name,
      type: 'dynamic',
      content_type: 'business_card',
      content: JSON.stringify(bcData),
      short_code: shortCode,
      owner_email: userEmail,
      scan_count: 0,
      is_active: true,
      design_config: {
        foreground_color: '#000000',
        background_color: '#ffffff',
        qr_style: 'squares',
      },
    };
  }

  // Default: URL
  return {
    name,
    type: 'dynamic',
    content_type: 'url',
    content: row.url || '',
    short_code: shortCode,
    owner_email: userEmail,
    scan_count: 0,
    is_active: true,
    design_config: {
      foreground_color: '#000000',
      background_color: '#ffffff',
      qr_style: 'squares',
    },
  };
}

export default function BulkCreate() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [rows, setRows] = useState(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('idle'); // idle | processing | done
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => base44.auth.redirectToLogin('/BulkCreate'));
  }, []);

  const isPro = user?.role === 'admin' || (user?.subscription_tier === 'pro' && user?.subscription_status === 'active');

  const handleFile = (file) => {
    setError('');
    setRows(null);
    if (!file || !file.name.endsWith('.csv')) {
      setError('Please upload a .csv file.');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseCSV(e.target.result);
      if (parsed.length === 0) {
        setError('No valid rows found in the CSV. Make sure it has a header row and data rows.');
        return;
      }
      setRows(parsed);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleProcess = async () => {
    if (!rows || !user) return;
    setError('');

    // Capacity check for DBCs
    const dbcRows = rows.filter(r => (r.type || '').toLowerCase().trim() === 'business_card');
    if (dbcRows.length > 0 && isPro) {
      const dbcCapacity = 10 + (user.purchased_extra_dbcs || 0);
      const existingQRCodes = await base44.entities.QRCode.filter({ owner_email: user.email });
      const activeDbcCount = existingQRCodes.filter(qr => qr.content_type === 'vcard' || qr.content_type === 'business_card').length;
      const remaining = dbcCapacity - activeDbcCount;
      if (dbcRows.length > remaining) {
        setError(`You only have ${remaining} DBC seat(s) remaining (capacity: ${dbcCapacity}, used: ${activeDbcCount}). Your CSV contains ${dbcRows.length} business card rows. Please reduce the number of DBC rows or purchase more seats.`);
        return;
      }
    }

    setStatus('processing');
    setProgress({ current: 0, total: rows.length });

    let successCount = 0;
    for (let i = 0; i < rows.length; i++) {
      const qrData = rowToQRCode(rows[i], user.email);
      await base44.entities.QRCode.create(qrData);
      successCount++;
      setProgress({ current: i + 1, total: rows.length });
    }

    setStatus('done');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <Link to="/MyQRCodes"><Button variant="ghost" className="mb-6"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button></Link>
          <Card>
            <CardContent className="py-16 text-center">
              <AlertTriangle className="w-14 h-14 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Pro Feature</h2>
              <p className="text-gray-600 mb-6">Bulk creation is available on the Black Belt plan.</p>
              <Link to="/Pricing"><Button>Upgrade to Pro</Button></Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card>
            <CardContent className="py-16 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Bulk Creation Complete!</h2>
              <p className="text-gray-600 mb-6">
                {progress.total} QR code{progress.total !== 1 ? 's' : ''} forged successfully.
              </p>
              <Button onClick={() => navigate('/MyQRCodes')}>View My QR Codes</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (status === 'processing') {
    const pct = Math.round((progress.current / progress.total) * 100);
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card>
            <CardContent className="py-16 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-6"></div>
              <h2 className="text-xl font-bold mb-2">
                Forging {progress.current} of {progress.total} codes...
              </h2>
              <div className="w-full bg-gray-100 rounded-full h-3 mt-4 max-w-sm mx-auto">
                <div
                  className="bg-primary h-3 rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">{pct}% complete</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link to="/MyQRCodes">
          <Button variant="ghost" className="mb-6"><ArrowLeft className="w-4 h-4 mr-2" />Back to My QR Codes</Button>
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold">Bulk Create QR Codes</h1>
          <p className="text-gray-500 text-sm mt-1">Upload a CSV to generate multiple QR codes or Digital Business Cards at once.</p>
        </div>

        {/* Template Download */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Step 1 — Download Template</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Use our CSV template with the correct column headers. Supported types: <span className="font-medium">url</span>, <span className="font-medium">business_card</span>.
            </p>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Download CSV Template
            </Button>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Step 2 — Upload Your CSV</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                dragging ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
              }`}
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <p className="font-medium text-gray-700">Drag & drop your CSV here</p>
              <p className="text-sm text-gray-400 mt-1">or click to browse</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {rows && !error && (
              <div className="flex items-center gap-2 mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                <FileText className="w-4 h-4 shrink-0" />
                <span>
                  <span className="font-semibold">{fileName}</span> — {rows.length} row{rows.length !== 1 ? 's' : ''} ready
                  {rows.filter(r => (r.type || '').toLowerCase().trim() === 'business_card').length > 0 &&
                    ` (${rows.filter(r => (r.type || '').toLowerCase().trim() === 'business_card').length} business card${rows.filter(r => (r.type || '').toLowerCase().trim() === 'business_card').length !== 1 ? 's' : ''})`
                  }
                </span>
                <button onClick={(e) => { e.stopPropagation(); setRows(null); setFileName(''); }} className="ml-auto text-green-600 hover:text-green-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Process */}
        <Button
          className="w-full h-11"
          disabled={!rows || !!error}
          onClick={handleProcess}
        >
          <Upload className="w-4 h-4 mr-2" />
          Forge {rows ? rows.length : 0} QR Code{rows?.length !== 1 ? 's' : ''}
        </Button>
      </div>
    </div>
  );
}