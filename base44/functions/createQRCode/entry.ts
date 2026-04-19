import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

function generateShortCode() {
  return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 6);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const qrCodeData = await req.json();

    // Determine if user is Pro
    const isPro = user.role === 'admin' ||
      (user.subscription_tier === 'pro' && user.subscription_status === 'active');

    // Enforce: non-Pro users cannot create dynamic QR codes
    if (!isPro && qrCodeData.type === 'dynamic') {
      qrCodeData.type = 'static';
    }

    // Always generate a fresh short_code server-side for dynamic codes
    if (qrCodeData.type === 'dynamic') {
      qrCodeData.short_code = generateShortCode();
    } else {
      qrCodeData.short_code = null;
    }

    // Store owner email explicitly so public redirect lookups can find it without auth
    qrCodeData.owner_email = user.email;

    const created = await base44.entities.QRCode.create(qrCodeData);

    return Response.json({ qrCode: created });
  } catch (error) {
    console.error('Error in createQRCode:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});