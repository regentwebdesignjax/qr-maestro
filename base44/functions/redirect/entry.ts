import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function parseDeviceType(ua) {
  if (!ua) return 'unknown';
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) return 'mobile';
  return 'desktop';
}

function parseBrowser(ua) {
  if (!ua) return 'unknown';
  if (/edg\//i.test(ua)) return 'Edge';
  if (/chrome/i.test(ua)) return 'Chrome';
  if (/firefox/i.test(ua)) return 'Firefox';
  if (/safari/i.test(ua)) return 'Safari';
  if (/opera|opr\//i.test(ua)) return 'Opera';
  return 'Other';
}

function parseOS(ua) {
  if (!ua) return 'Unknown';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
  if (/android/i.test(ua)) return 'Android';
  if (/windows phone/i.test(ua)) return 'Windows Phone';
  if (/windows/i.test(ua)) return 'Windows';
  if (/mac os x/i.test(ua)) return 'macOS';
  if (/linux/i.test(ua)) return 'Linux';
  return 'Other';
}

async function geoLocate(ip) {
  try {
    // Skip for local/private IPs
    if (!ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return {};
    }
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,regionName,city,lat,lon,status`, {
      signal: AbortSignal.timeout(3000),
    });
    const data = await res.json();
    if (data.status === 'success') {
      return {
        country: data.country || null,
        state: data.regionName || null,
        city: data.city || null,
        lat: data.lat || null,
        lng: data.lon || null,
      };
    }
  } catch (_) {}
  return {};
}

Deno.serve(async (req) => {
  try {
    let short_code;

    // Support both JSON body and query string
    const url = new URL(req.url);
    const queryCode = url.searchParams.get('code') || url.searchParams.get('short_code');

    if (queryCode) {
      short_code = queryCode;
    } else {
      let body = {};
      try { body = await req.json(); } catch (_) {}
      short_code = body.code || body.short_code;
    }

    if (!short_code) {
      return Response.json({ error: 'No code provided' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const qrCodes = await base44.asServiceRole.entities.QRCode.filter({ short_code });

    if (qrCodes.length === 0 || !qrCodes[0].is_active) {
      return Response.json({ error: 'QR code not found or inactive' }, { status: 404 });
    }

    const qrCode = qrCodes[0];

    // Subscription check for dynamic QR codes
    if (qrCode.type === 'dynamic' && qrCode.owner_email) {
      const owners = await base44.asServiceRole.entities.User.filter({ email: qrCode.owner_email });
      const owner = owners[0];
      // Allow admins and active Pro subscribers; block lapsed subscriptions
      if (owner && owner.role !== 'admin') {
        const subStatus = owner.subscription_status;
        const subTier = owner.subscription_tier;
        if (subTier === 'pro' && subStatus !== 'active') {
          return Response.json({
            content_type: 'inactive',
            message: 'This professional identity is currently resting. Please contact the owner to reactivate.',
          });
        }
      }
    }

    // Get scanner IP from headers (works behind proxies/CDNs)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || null;

    const ua = req.headers.get('user-agent') || '';
    const deviceType = parseDeviceType(ua);
    const browser = parseBrowser(ua);
    const os = parseOS(ua);

    // Geo-locate synchronously before responding so data is always saved
    const geo = await geoLocate(ip);

    try {
      await base44.asServiceRole.entities.Scan.create({
        qr_code_id: qrCode.id,
        device_type: deviceType,
        browser,
        os,
        country: geo.country || null,
        state: geo.state || null,
        city: geo.city || null,
        lat: geo.lat || null,
        lng: geo.lng || null,
      });
    } catch (e) {
      console.error('Scan create error:', e.message, JSON.stringify(e?.response?.data || {}));
    }

    await base44.asServiceRole.entities.QRCode.update(qrCode.id, {
      scan_count: (qrCode.scan_count || 0) + 1,
    }).catch((e) => console.error('Scan count update error:', e.message));

    const contentType = qrCode.content_type || 'url';

    if (contentType === 'url') {
      let redirectUrl = qrCode.content;
      if (!/^https?:\/\//i.test(redirectUrl)) {
        redirectUrl = 'https://' + redirectUrl;
      }
      return Response.json({ content_type: 'url', url: redirectUrl });
    }

    // For text, wifi, vcard, business_card — return raw content for the client to display
    // owner_email is stored as a dedicated field to avoid SDK auto-resolving created_by (User relation → 401)
    return Response.json({
      id: qrCode.id,
      owner_email: qrCode.owner_email || '',
      content_type: contentType,
      content: qrCode.content,
      name: qrCode.name,
      design_config: qrCode.design_config || {},
    });

  } catch (error) {
    console.error('Redirect error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});