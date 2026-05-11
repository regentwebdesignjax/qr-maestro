import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    console.log('[redirect] Incoming request:', req.url);

    const base44 = createClientFromRequest(req);
    console.log('[redirect] Base44 client created');

    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    console.log('[redirect] Looking up code:', code);

    if (!code) {
      console.log('[redirect] No code parameter provided');
      return Response.json({ error: 'Missing code parameter' }, { status: 400 });
    }

    // Look up the QR code by short_code
    console.log('[redirect] Querying QRCode entity with short_code:', code);
    const qrCodes = await base44.asServiceRole.entities.QRCode.filter({
      short_code: code,
      is_active: true,
    }).catch((err) => {
      console.error('[redirect] Filter error:', err);
      return [];
    });

    console.log('[redirect] Query returned', qrCodes.length, 'results');

    if (qrCodes.length === 0) {
      console.log('[redirect] QR code not found or inactive');
      console.log('[redirect] Searched for: { short_code: "' + code + '", is_active: true }');

      // Debug: try searching without is_active filter to see what's in the database
      const allCodes = await base44.asServiceRole.entities.QRCode.filter({
        short_code: code,
      }).catch(() => []);
      console.log('[redirect] Debug - found', allCodes.length, 'QR codes with short_code:', code);
      if (allCodes.length > 0) {
        console.log('[redirect] Debug - first match has is_active:', allCodes[0].is_active);
      }

      return Response.json({ content_type: 'inactive', error: 'QR code not found or inactive' }, { status: 404 });
    }

    const qrCode = qrCodes[0];
    console.log('[redirect] Found QR code:', qrCode.id, 'type:', qrCode.content_type, 'is_active:', qrCode.is_active);

    // Increment scan count
    try {
      await base44.asServiceRole.entities.QRCode.update(qrCode.id, {
        scan_count: (qrCode.scan_count || 0) + 1,
      });
      console.log('[redirect] Scan count incremented');
    } catch (e) {
      console.error('[redirect] Failed to increment scan count:', e);
    }

    // For URL content type, return the destination URL
    if (qrCode.content_type === 'url') {
      console.log('[redirect] Returning URL redirect');
      return Response.json({
        content_type: 'url',
        url: qrCode.content,
      });
    }

    // For other content types, return the QR code info so the landing page can be rendered
    console.log('[redirect] Returning content metadata');
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
