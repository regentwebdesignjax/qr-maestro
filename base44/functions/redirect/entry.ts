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
  if (!ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('10.') || ip.startsWith('192.168.')) {
    return {};
  }
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,lat,lon`, {
      signal: AbortSignal.timeout(4000),
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

    // Parse the full body once
    let bodyData = {};
    const urlParams = new URL(req.url);
    let code = urlParams.searchParams.get('code');

    if (req.method === 'POST') {
      try {
        bodyData = await req.json();
        if (!code) code = bodyData.code || null;
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
      return Response.json({ content_type: 'inactive', error: 'QR code not found' }, { status: 404 });
    }

    const qrCode = qrCodes[0];
    console.log('[redirect] Found QR code:', qrCode.id, 'is_active:', qrCode.is_active);

    if (qrCode.is_active === false) {
      return Response.json({ content_type: 'inactive', error: 'QR code is inactive' }, { status: 404 });
    }

    // Extract UA and referrer
    const ua = req.headers.get('User-Agent') || req.headers.get('user-agent') || '';
    const { device_type, os, browser } = parseUserAgent(ua);
    const referrer = req.headers.get('Referer') || req.headers.get('referer') || bodyData.referrer || '';

    // Geo: prefer client-supplied geo (from browser's ip-api call), then CF headers, then server-side lookup
    let country = bodyData.geo_country || req.headers.get('X-Geo-Country') || req.headers.get('CF-IPCountry') || '';
    let city = bodyData.geo_city || req.headers.get('X-Geo-City') || req.headers.get('CF-IPCity') || '';
    let state = bodyData.geo_state || req.headers.get('X-Geo-Region') || '';
    let lat = bodyData.geo_lat != null ? parseFloat(bodyData.geo_lat) : undefined;
    let lng = bodyData.geo_lng != null ? parseFloat(bodyData.geo_lng) : undefined;

    // If still no lat/lng, try server-side IP lookup
    if (!lat || !lng) {
      const clientIp =
        req.headers.get('CF-Connecting-IP') ||
        req.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
        req.headers.get('X-Real-IP') ||
        '';
      console.log('[redirect] No lat/lng from client or CF headers, trying ip-api for IP:', clientIp);
      const geoData = await geoFromIp(clientIp);
      if (geoData.lat) lat = geoData.lat;
      if (geoData.lng) lng = geoData.lng;
      if (!country && geoData.country) country = geoData.country;
      if (!city && geoData.city) city = geoData.city;
      if (!state && geoData.state) state = geoData.state;
    }

    console.log('[redirect] Final geo:', { country, city, state, lat, lng });

    // Record analytics (fire-and-forget)
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

    if (qrCode.content_type === 'url') {
      return Response.json({ content_type: 'url', url: qrCode.content });
    }

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