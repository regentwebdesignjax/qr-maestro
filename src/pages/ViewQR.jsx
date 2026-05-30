import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { maskUrl } from '@/lib/maskUrl';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ScanLine, ExternalLink } from 'lucide-react';
import QRCodePreview from '../components/qr/QRCodePreview';

const CONTENT_TYPE_LABELS = {
  business_card: 'Business Card',
  business_page: 'Business Page',
  linkpages: 'Linkpage',
  vcard: 'vCard Contact',
  url: 'Website',
  wifi: 'WiFi Credentials',
  text: 'Plain Text',
  pdf: 'PDF',
  social: 'Social Media',
  coupon: 'Coupon Code',
  image: 'Image',
  mp3: 'Audio (MP3)',
  call: 'Phone Call',
  sms: 'SMS Message',
};

function getFriendlyContentType(type) {
  return CONTENT_TYPE_LABELS[type] || type;
}

// Parse and format content into readable label/value pairs
function parseContentFields(contentType, content) {
  if (!content) return null;

  if (contentType === 'business_card') {
    try {
      const d = JSON.parse(content);
      const fields = [];
      if (d.name)    fields.push({ label: 'Name',    value: d.name });
      if (d.title)   fields.push({ label: 'Title',   value: d.title });
      if (d.company) fields.push({ label: 'Company', value: d.company });
      if (d.email)   fields.push({ label: 'Email',   value: d.email });
      if (d.phone)   fields.push({ label: 'Phone',   value: d.phone });
      if (d.website) fields.push({ label: 'Website', value: d.website });
      if (d.bio)     fields.push({ label: 'Bio',     value: d.bio });
      return fields.length > 0 ? fields : null;
    } catch { return null; }
  }

  if (contentType === 'wifi') {
    const ssid = content.match(/S:([^;]+)/)?.[1];
    const pwd  = content.match(/P:([^;]+)/)?.[1];
    const enc  = content.match(/T:([^;]+)/)?.[1];
    const fields = [];
    if (ssid) fields.push({ label: 'Network (SSID)', value: ssid });
    if (enc)  fields.push({ label: 'Security',       value: enc });
    if (pwd)  fields.push({ label: 'Password',       value: pwd });
    return fields.length > 0 ? fields : null;
  }

  if (contentType === 'vcard') {
    const get = (key) => content.match(new RegExp(`${key}[^:]*:(.+)`))?.[1]?.trim();
    const fields = [];
    const fn = get('FN');
    const org = get('ORG');
    const tel = get('TEL');
    const email = get('EMAIL');
    const url = get('URL');
    if (fn)    fields.push({ label: 'Name',    value: fn });
    if (org)   fields.push({ label: 'Company', value: org });
    if (tel)   fields.push({ label: 'Phone',   value: tel });
    if (email) fields.push({ label: 'Email',   value: email });
    if (url)   fields.push({ label: 'Website', value: url });
    return fields.length > 0 ? fields : null;
  }

  if (contentType === 'coupon') {
    try {
      const d = JSON.parse(content);
      const fields = [];
      if (d.code)         fields.push({ label: 'Promo Code', value: d.code });
      if (d.description)  fields.push({ label: 'Description', value: d.description, isHtml: true });
      if (d.redemptionUrl) fields.push({ label: 'Redemption URL', value: d.redemptionUrl, isLink: true });
      if (d.buttonText)   fields.push({ label: 'Button Text', value: d.buttonText });
      return fields.length > 0 ? fields : null;
    } catch {
      // Legacy format: just the coupon code
      return [{ label: 'Promo Code', value: content }];
    }
  }

  if (contentType === 'linkpages') {
    try {
      const d = JSON.parse(content);
      const slug = d.custom_slug || 'linkpage';
      const url = `${window.location.origin}/linkpage/${slug}`;
      return [{ label: 'Linkpage URL', value: url, isLink: true }];
    } catch { return null; }
  }

  if (contentType === 'business_page') {
    try {
      const d = JSON.parse(content);
      const fields = [];
      if (d.business_name) fields.push({ label: 'Business', value: d.business_name });
      if (d.headline) fields.push({ label: 'Headline', value: d.headline });
      if (d.contact_name) {
        const contact = d.contact_title
          ? `${d.contact_name} (${d.contact_title})`
          : d.contact_name;
        fields.push({ label: 'Contact', value: contact });
      }
      if (d.phone) fields.push({ label: 'Phone', value: d.phone });
      if (d.email) fields.push({ label: 'Email', value: d.email });
      if (d.address) fields.push({ label: 'Address', value: d.address });
      if (d.button_title) fields.push({ label: 'Button', value: d.button_title });
      if (d.schedule && Array.isArray(d.schedule)) {
        const hoursText = d.schedule.map(day => {
          if (day.closed) return `${day.day} Closed`;
          const convertTo12Hour = (time24) => {
            const [hours, minutes] = time24.split(':');
            const hour = parseInt(hours, 10);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 || 12;
            return `${hour12}:${minutes} ${ampm}`;
          };
          return `${day.day} ${convertTo12Hour(day.open)}–${convertTo12Hour(day.close)}`;
        }).join(' • ');
        fields.push({ label: 'Hours', value: hoursText });
      }
      return fields.length > 0 ? fields : null;
    } catch { return null; }
  }

  // For url, text, call, sms — just show the value directly
  return null;
}

// Normalize a raw QR code record so top-level fields are always available.
// The API may return the entity with user-defined fields nested under `.data`.
function normalizeQRCode(raw) {
  if (!raw) return raw;
  // If top-level fields are already present (e.g. `type`, `content_type`), use as-is
  if (raw.type || raw.content_type) {
    const qr = { ...raw };
    if (typeof qr.design_config === 'string') {
      try { qr.design_config = JSON.parse(qr.design_config); } catch { qr.design_config = {}; }
    }
    if (!qr.design_config) qr.design_config = {};
    return qr;
  }
  // Otherwise flatten `.data` into the top level
  const qr = { ...raw, ...(raw.data || {}) };
  if (typeof qr.design_config === 'string') {
    try { qr.design_config = JSON.parse(qr.design_config); } catch { qr.design_config = {}; }
  }
  if (!qr.design_config) qr.design_config = {};
  return qr;
}

export default function ViewQR() {
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customDomainBase, setCustomDomainBase] = useState(null);

  useEffect(() => {
    const fetchQRCode = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');

      if (!id) {
        window.location.href = '/Dashboard';
        return;
      }

      try {
        // Fetch QR code and active custom domain in parallel
        const [qrCodes, domainRes] = await Promise.all([
          base44.entities.QRCode.filter({ id }),
          base44.functions.invoke('checkDomainStatus', {}).catch(() => null),
        ]);

        if (qrCodes.length === 0) {
          window.location.href = '/Dashboard';
          return;
        }

        let qr = normalizeQRCode(qrCodes[0]);
        const activeDomain = domainRes?.data?.customDomain;
        const customDomainUrl = activeDomain?.status === 'active' && activeDomain?.hostname
          ? `https://${activeDomain.hostname}`
          : null;

        if (customDomainUrl) {
          setCustomDomainBase(customDomainUrl);
        }

        // For dynamic QRs without a stored custom domain URL, persist the active custom domain
        // back to the database so future renders and downloads always use the branded URL.
        // The actual injection for rendering happens via the customDomainBase prop on QRCodePreview.
        if (qr.type === 'dynamic' && !qr.redirect_base_url && customDomainUrl) {
          console.log('[ViewQR] Persisting custom domain for old QR:', { id: qr.id, customDomainUrl });
          qr = { ...qr, redirect_base_url: customDomainUrl };
          try {
            await base44.entities.QRCode.update(qr.id, { redirect_base_url: customDomainUrl });
          } catch (err) {
            console.warn('[ViewQR] Could not update QR record:', err);
          }
        }

        setQrCode(qr);
      } catch (error) {
        console.error('Error fetching QR code:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQRCode();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!qrCode) return null;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="w-full mx-auto px-4 sm:px-6">
        <Link to="/MyQRCodes">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My QR Codes
          </Button>
        </Link>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* QR Code Display — uses full rendering engine with design_config */}
          <Card>
            <CardHeader>
              <CardTitle>QR Code</CardTitle>
            </CardHeader>
            <CardContent>
              <QRCodePreview qrData={qrCode} customDomainBase={customDomainBase} />
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 divide-y divide-gray-100">
              {/* Name */}
              <div className="py-3">
                <p className="text-xs text-muted-foreground mb-0.5">Name</p>
                <p className="font-semibold text-gray-900">{qrCode.name}</p>
              </div>

              {/* Type */}
              <div className="py-3">
                <p className="text-xs text-muted-foreground mb-1">Type</p>
                <Badge variant={qrCode.type === 'dynamic' ? 'default' : 'secondary'}>
                  {qrCode.type === 'static' ? 'Static' : 'Dynamic'}
                </Badge>
              </div>

              {/* Content Type */}
              <div className="py-3">
                <p className="text-xs text-muted-foreground mb-0.5">Content Type</p>
                <p className="font-medium text-gray-800">{getFriendlyContentType(qrCode.content_type)}</p>
              </div>

              {/* Content */}
              <div className="py-3">
                <p className="text-xs text-muted-foreground mb-1.5">Content</p>
                {(() => {
                  const fields = parseContentFields(qrCode.content_type, qrCode.content);
                  if (fields) {
                    return (
                      <div className="space-y-2">
                        {fields.map(({ label, value, isHtml, isLink }) => (
                          <div key={label} className="flex gap-2 text-sm">
                            <span className="text-muted-foreground w-20 shrink-0">{label}</span>
                            {isHtml ? (
                              <div className="font-medium text-gray-800 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: value }} />
                            ) : isLink ? (
                              <a href={value} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline break-all">{value}</a>
                            ) : (
                              <span className="font-medium text-gray-800 break-all">{value}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return (
                   <p className="font-medium text-gray-800 break-all text-sm">{maskUrl(qrCode.content)}</p>
                  );
                })()}
              </div>

              {/* Scan Link */}
              {qrCode.type === 'dynamic' && qrCode.short_code && (
                <div className="py-3">
                  <p className="text-xs text-muted-foreground mb-1">Scan Link</p>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const scanUrl = qrCode.redirect_base_url
                        ? `${qrCode.redirect_base_url}/${qrCode.short_code}`
                        : `${window.location.origin}/r?code=${qrCode.short_code}`;
                      return (
                        <>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 flex-1 truncate">
                            {scanUrl}
                          </code>
                          <a
                            href={scanUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary shrink-0"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Total Scans */}
              <div className="py-4">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <ScanLine className="w-3.5 h-3.5" /> Total Scans
                </p>
                <p className="text-4xl font-bold text-primary">{qrCode.scan_count || 0}</p>
              </div>

              {/* Actions */}
              {qrCode.type === 'dynamic' && (
                <div className="pt-4 flex flex-wrap gap-4 md:gap-5">
                  <Link to={'/EditQR?id=' + qrCode.id}>
                    <Button>Edit Dynamic QR</Button>
                  </Link>
                  <Link to={'/Analytics?id=' + qrCode.id}>
                    <Button variant="outline">View Full Analytics</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}