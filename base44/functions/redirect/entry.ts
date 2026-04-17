import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Read code from JSON body (called via SDK from the React Redirect page)
    const body = await req.json();
    const short_code = body.code || body.short_code;

    if (!short_code) {
      return Response.json({ error: 'No code provided' }, { status: 400 });
    }

    const qrCodes = await base44.asServiceRole.entities.QRCode.filter({ short_code });

    if (qrCodes.length === 0 || !qrCodes[0].is_active) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const qrCode = qrCodes[0];

    // Track scan asynchronously
    base44.asServiceRole.entities.Scan.create({
      qr_code_id: qrCode.id,
      device_type: req.headers.get('user-agent') || 'unknown',
      browser: 'unknown',
    }).catch(() => {});

    base44.asServiceRole.entities.QRCode.update(qrCode.id, {
      scan_count: (qrCode.scan_count || 0) + 1
    }).catch(() => {});

    let redirectUrl = qrCode.content;
    if (!/^https?:\/\//i.test(redirectUrl)) {
      redirectUrl = 'https://' + redirectUrl;
    }

    return Response.json({ url: redirectUrl });
  } catch (error) {
    console.error('Redirect error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});