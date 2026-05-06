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

    // Enforce: non-Pro users cannot exceed 10 static QR codes
    if (!isPro) {
      const existing = await base44.entities.QRCode.filter({ created_by: user.email, type: 'static' });
      if (existing.length >= 10) {
        return Response.json({ error: 'Free tier limit of 10 static QR codes reached. Upgrade to Black Belt for unlimited QR codes.' }, { status: 403 });
      }
    }

    // Always generate a fresh short_code server-side for dynamic codes
    if (qrCodeData.type === 'dynamic') {
      qrCodeData.short_code = generateShortCode();
    } else {
      qrCodeData.short_code = null;
    }

    // Store owner email explicitly so public redirect lookups can find it without auth
    qrCodeData.owner_email = user.email;

    // Check slug uniqueness for linkpages
    if (qrCodeData.content_type === 'linkpages' && qrCodeData.content) {
      try {
        const linkpageData = JSON.parse(qrCodeData.content);
        if (linkpageData.custom_slug) {
          const existingQRs = await base44.asServiceRole.entities.QRCode.filter({
            content_type: 'linkpages'
          }).catch(() => []);

          const slugExists = existingQRs.some(qr => {
            try {
              const parsed = JSON.parse(qr.content);
              return parsed.custom_slug === linkpageData.custom_slug;
            } catch {
              return false;
            }
          });

          if (slugExists) {
            return Response.json(
              { error: `The slug "${linkpageData.custom_slug}" is already in use. Please choose a different slug.` },
              { status: 409 }
            );
          }
        }
      } catch (err) {
        console.error('Error checking slug uniqueness:', err);
      }
    }

    const created = await base44.entities.QRCode.create(qrCodeData);

    return Response.json({ qrCode: created });
  } catch (error) {
    console.error('Error in createQRCode:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});