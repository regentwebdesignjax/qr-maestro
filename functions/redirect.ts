import { Base44Client } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    // Create public client using service role - no authentication required
    const base44 = new Base44Client({
      appId: Deno.env.get('BASE44_APP_ID'),
      useServiceRole: true,
    });
    
    // Get short code from query parameter
    const url = new URL(req.url);
    const short_code = url.searchParams.get('code');

    if (!short_code) {
      return new Response('Short code required', { 
        status: 400,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Access QR code data without authentication
    const qrCodes = await base44.entities.QRCode.filter({ short_code });

    if (qrCodes.length === 0 || !qrCodes[0].is_active) {
      // Redirect to home page if not found
      return Response.redirect(url.origin, 302);
    }

    const qrCode = qrCodes[0];

    // Track the scan asynchronously (don't wait for it)
    base44.entities.Scan.create({
      qr_code_id: qrCode.id,
      device_type: 'unknown',
      browser: 'unknown',
    }).then(() => {
      return base44.entities.QRCode.update(qrCode.id, {
        scan_count: (qrCode.scan_count || 0) + 1
      });
    }).catch(err => {
      console.error('Error tracking scan:', err);
    });

    // Ensure the URL has a protocol
    let redirectUrl = qrCode.content;
    if (!/^https?:\/\//i.test(redirectUrl)) {
      redirectUrl = 'https://' + redirectUrl;
    }

    // Return 302 redirect
    return Response.redirect(redirectUrl, 302);
  } catch (error) {
    console.error('Error in redirect:', error);
    const url = new URL(req.url);
    return Response.redirect(url.origin, 302);
  }
});