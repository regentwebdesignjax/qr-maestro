import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Require authentication
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
      qrCodeData.short_code = null;
    }

    // Always set created_by to the authenticated user
    qrCodeData.created_by = user.email;

    const created = await base44.asServiceRole.entities.QRCode.create(qrCodeData);

    return Response.json({ qrCode: created });
  } catch (error) {
    console.error('Error in createQRCode:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});