import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const short_code = url.searchParams.get('code');

    if (!short_code) return Response.redirect(url.origin, 302);

    const qrCodes = await base44.asServiceRole.entities.QRCode.filter({ short_code });

    if (qrCodes.length === 0 || !qrCodes[0].is_active) {
      return Response.redirect(url.origin, 302);
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

    return Response.redirect(redirectUrl, 302);
  } catch (error) {
    console.error('Redirect error:', error);
    return Response.redirect(new URL(req.url).origin, 302);
  }
});