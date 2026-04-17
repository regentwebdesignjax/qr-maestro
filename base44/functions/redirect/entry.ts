import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    let short_code;

    // Support both JSON body and query string
    const url = new URL(req.url);
    const queryCode = url.searchParams.get('code') || url.searchParams.get('short_code');

    if (queryCode) {
      short_code = queryCode;
    } else {
      let body = {};
      try {
        body = await req.json();
      } catch (_) {}
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

    // Track scan asynchronously (don't await)
    base44.asServiceRole.entities.Scan.create({
      qr_code_id: qrCode.id,
      device_type: req.headers.get('user-agent') || 'unknown',
      browser: 'unknown',
    }).catch(() => {});

    base44.asServiceRole.entities.QRCode.update(qrCode.id, {
      scan_count: (qrCode.scan_count || 0) + 1,
    }).catch(() => {});

    let redirectUrl = qrCode.content;
    if (!/^https?:\/\//i.test(redirectUrl)) {
      redirectUrl = 'https://' + redirectUrl;
    }

    return Response.json({ url: redirectUrl }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error) {
    console.error('Redirect error:', error.message, 'Error data:', JSON.stringify(error.response?.data || {}));
    return Response.json({ error: error.message }, { status: 500 });
  }
});