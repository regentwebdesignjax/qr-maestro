import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function parseUserAgent(ua: string): { device_type: string; os: string; browser: string } {
  const uaLow = (ua || '').toLowerCase();
  let device_type = 'desktop';
  if (/mobile|android(?!.*tablet)|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) {
    device_type = 'mobile';
  } else if (/tablet|ipad|playbook|silk/i.test(ua)) {
    device_type = 'tablet';
  }
  let os = 'unknown';
  if (uaLow.includes('iphone') || uaLow.includes('ipad') || uaLow.includes('ipod')) os = 'iOS';
  else if (uaLow.includes('android')) os = 'Android';
  else if (uaLow.includes('windows')) os = 'Windows';
  else if (uaLow.includes('mac')) os = 'macOS';
  else if (uaLow.includes('linux')) os = 'Linux';
  let browser = 'unknown';
  if (uaLow.includes('crios')) browser = 'Chrome';
  else if (uaLow.includes('fxios')) browser = 'Firefox';
  else if (uaLow.includes('edg/') || uaLow.includes('edgios')) browser = 'Edge';
  else if (uaLow.includes('chrome') && !uaLow.includes('chromium')) browser = 'Chrome';
  else if (uaLow.includes('firefox')) browser = 'Firefox';
  else if (uaLow.includes('safari') && !uaLow.includes('chrome')) browser = 'Safari';
  else if (uaLow.includes('opr') || uaLow.includes('opera')) browser = 'Opera';
  return { device_type, os, browser };
}

Deno.serve(async (req) => {
  try {
    console.log('[redirect] Incoming request:', req.url);

    const base44 = createClientFromRequest(req);

    const url = new URL(req.url);
    // Support code in query param (GET) or in POST body
    let code = url.searchParams.get('code');
    if (!code && req.method === 'POST') {
      try {
        const body = await req.clone().json();
        code = body.code || null;
      } catch (_) {}
    }
    console.log('[redirect] Looking up code:', code);

    if (!code) {
      return Response.json({ error: 'Missing code parameter' }, { status: 400 });
    }

    // Look up the QR code by short_code only (avoid boolean filter quirks)
    const qrCodes = await base44.asServiceRole.entities.QRCode.filter({
      short_code: code,
    }).catch((err) => {
      console.error('[redirect] Filter error:', err);
      return [];
    });

    console.log('[redirect] Query returned', qrCodes.length, 'results');

    if (qrCodes.length === 0) {
      console.log('[redirect] QR code not found for short_code:', code);
      return Response.json({ content_type: 'inactive', error: 'QR code not found' }, { status: 404 });
    }

    const qrCode = qrCodes[0];
    console.log('[redirect] Found QR code:', qrCode.id, 'is_active:', qrCode.is_active);

    if (qrCode.is_active === false) {
      return Response.json({ content_type: 'inactive', error: 'QR code is inactive' }, { status: 404 });
    }

    // Extract request metadata for scan analytics
    const ua = req.headers.get('User-Agent') || req.headers.get('user-agent') || '';
    const { device_type, os, browser } = parseUserAgent(ua);
    const country = req.headers.get('CF-IPCountry') || req.headers.get('cf-ipcountry') || '';
    const city = req.headers.get('CF-IPCity') || req.headers.get('cf-ipcity') || '';
    const referrer = req.headers.get('Referer') || req.headers.get('referer') || '';

    // Record analytics scan + increment count (fire-and-forget, don't block redirect)
    Promise.all([
      base44.asServiceRole.entities.Scan.create({
        qr_code_id: qrCode.id,
        device_type,
        os,
        browser,
        country: country || undefined,
        city: city || undefined,
        referrer: referrer || undefined,
      }),
      base44.asServiceRole.entities.QRCode.update(qrCode.id, {
        scan_count: (qrCode.scan_count || 0) + 1,
      }),
    ]).catch((e) => console.error('[redirect] Analytics error:', e));

    // For URL content type, return the destination URL
    if (qrCode.content_type === 'url') {
      return Response.json({ content_type: 'url', url: qrCode.content });
    }

    // For other content types, return metadata so the Worker redirects to the landing page
    return Response.json({
      content_type: qrCode.content_type,
      short_code: qrCode.short_code,
      content: qrCode.content,
      design_config: qrCode.design_config,
    });
  } catch (error) {
    console.error('[redirect] Error:', error.message, error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
