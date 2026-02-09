import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { short_code } = await req.json();

    if (!short_code) {
      return Response.json({ error: 'Short code required' }, { status: 400 });
    }

    // Use service role to access QR code data without authentication
    const qrCodes = await base44.asServiceRole.entities.QRCode.filter({ short_code });

    if (qrCodes.length === 0 || !qrCodes[0].is_active) {
      return Response.json({ error: 'QR code not found or inactive' }, { status: 404 });
    }

    const qrCode = qrCodes[0];

    // Track the scan using service role
    try {
      await base44.asServiceRole.entities.Scan.create({
        qr_code_id: qrCode.id,
        device_type: 'unknown',
        browser: 'unknown',
      });

      // Update scan count
      await base44.asServiceRole.entities.QRCode.update(qrCode.id, {
        scan_count: (qrCode.scan_count || 0) + 1
      });
    } catch (error) {
      console.error('Error tracking scan:', error);
    }

    // Return the URL to redirect to
    return Response.json({ url: qrCode.content });
  } catch (error) {
    console.error('Error in handleQRRedirect:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});