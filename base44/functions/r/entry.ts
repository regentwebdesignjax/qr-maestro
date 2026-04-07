import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    // Extract short code from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const short_code = pathParts[pathParts.length - 1];

    if (!short_code) {
      return Response.redirect('/', 302);
    }

    const base44 = createClientFromRequest(req);

    // Use service role to access QR code data without authentication
    const qrCodes = await base44.asServiceRole.entities.QRCode.filter({ short_code });

    if (qrCodes.length === 0 || !qrCodes[0].is_active) {
      return Response.redirect('/', 302);
    }

    const qrCode = qrCodes[0];

    // Ensure the URL has a protocol
    let redirectUrl = qrCode.content;
    if (!/^https?:\/\//i.test(redirectUrl)) {
      redirectUrl = 'https://' + redirectUrl;
    }

    // Track the scan asynchronously (don't wait)
    base44.asServiceRole.entities.Scan.create({
      qr_code_id: qrCode.id,
      device_type: 'unknown',
      browser: 'unknown',
    }).catch(err => console.error('Scan tracking error:', err));

    // Update scan count asynchronously (don't wait)
    base44.asServiceRole.entities.QRCode.update(qrCode.id, {
      scan_count: (qrCode.scan_count || 0) + 1
    }).catch(err => console.error('Scan count error:', err));

    // HTTP 302 redirect to the target URL
    return Response.redirect(redirectUrl, 302);
  } catch (error) {
    console.error('Error in redirect:', error);
    return Response.redirect('/', 302);
  }
});