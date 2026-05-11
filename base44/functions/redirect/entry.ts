import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const url = new URL(req.url);
    const code = url.searchParams.get('code');

    if (!code) {
      return Response.json({ error: 'Missing code parameter' }, { status: 400 });
    }

    // Look up the QR code by short_code
    const qrCodes = await base44.asServiceRole.entities.QRCode.filter({
      short_code: code,
      is_active: true,
    }).catch(() => []);

    if (qrCodes.length === 0) {
      return Response.json({ content_type: 'inactive', error: 'QR code not found or inactive' }, { status: 404 });
    }

    const qrCode = qrCodes[0];

    // Increment scan count
    try {
      await base44.asServiceRole.entities.QRCode.update(qrCode.id, {
        scan_count: (qrCode.scan_count || 0) + 1,
      });
    } catch (e) {
      console.error('[redirect] Failed to increment scan count:', e);
    }

    // For URL content type, return the destination URL
    if (qrCode.content_type === 'url') {
      return Response.json({
        content_type: 'url',
        url: qrCode.content,
      });
    }

    // For other content types, return the QR code info so the landing page can be rendered
    return Response.json({
      content_type: qrCode.content_type,
      short_code: qrCode.short_code,
      content: qrCode.content,
      design_config: qrCode.design_config,
    });
  } catch (error) {
    console.error('[redirect] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
