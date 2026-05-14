import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function parseUserAgent(ua) {
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

async function geoFromIp(ip) {
  // Skip private/loopback IPs
  if (!ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('10.') || ip.startsWith('192.168.')) {
    return {};
  }
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,lat,lon`, {
      signal: AbortSignal.timeout(3000),
    });
    const data = await res.json();
    if (data.status === 'success') {
      return {
        country: data.countryCode || data.country || undefined,
        city: data.city || undefined,
        state: data.regionName || undefined,
        lat: data.lat || undefined,
        lng: data.lon || undefined,
      };
    }
  } catch (e) {
    console.warn('[redirect] ip-api lookup failed:', e.message);
  }
  return {};
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

    // Look up the QR code by short_code
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

    // Try Cloudflare headers first
    const cfCountry = req.headers.get('X-Geo-Country') || req.headers.get('CF-IPCountry') || '';
    const cfCity = req.headers.get('X-Geo-City') || req.headers.get('CF-IPCity') || '';
    const cfState = req.headers.get('X-Geo-Region') || '';
    const cfLatStr = req.headers.get('X-Geo-Latitude') || req.headers.get('CF-IPLatitude') || '';
    const cfLngStr = req.headers.get('X-Geo-Longitude') || req.headers.get('CF-IPLongitude') || '';
    const referrer = req.headers.get('Referer') || req.headers.get('referer') || '';

    let country = cfCountry;
    let city = cfCity;
    let state = cfState;
    let lat = cfLatStr ? parseFloat(cfLatStr) : undefined;
    let lng = cfLngStr ? parseFloat(cfLngStr) : undefined;

    // If lat/lng missing, fall back to ip-api.com (free, no key needed)
    if (!lat || !lng) {
      const clientIp =
        req.headers.get('CF-Connecting-IP') ||
        req.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
        req.headers.get('X-Real-IP') ||
        '';
      console.log('[redirect] No CF lat/lng, trying ip-api for IP:', clientIp);
      const geoData = await geoFromIp(clientIp);
      if (geoData.lat) lat = geoData.lat;
      if (geoData.lng) lng = geoData.lng;
      if (!country && geoData.country) country = geoData.country;
      if (!city && geoData.city) city = geoData.city;
      if (!state && geoData.state) state = geoData.state;
    }

    console.log('[redirect] Geo data:', { country, city, state, lat, lng });

    // Record analytics scan + increment count (fire-and-forget, don't block redirect)
    Promise.all([
      base44.asServiceRole.entities.Scan.create({
        qr_code_id: qrCode.id,
        device_type,
        os,
        browser,
        country: country || undefined,
        city: city || undefined,
        state: state || undefined,
        lat,
        lng,
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

    // For other content types, return metadata so the client renders the landing page
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