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

    // Dynamic codes always need a short_code.
    // Static business cards also need one so the QR encodes a redirect URL
    // instead of the raw JSON metadata.
    const needsShortCode = qrCodeData.type === 'dynamic' || qrCodeData.content_type === 'business_card';
    if (needsShortCode) {
      if (!qrCodeData.short_code) {
        qrCodeData.short_code = generateShortCode();
        console.log('[createQRCode] Generated new short_code:', qrCodeData.short_code);
      } else {
        console.log('[createQRCode] Using client-provided short_code:', qrCodeData.short_code);
      }
    } else {
      qrCodeData.short_code = null;
    }

    console.log('[createQRCode] is_active from frontend:', qrCodeData.is_active);

    // Store owner email explicitly so public redirect lookups can find it without auth
    qrCodeData.owner_email = user.email;

    // If the user has an active custom domain, embed it so all renders use that URL.
    // Check the CustomDomain entity directly rather than relying on the user flag,
    // so admins and users whose flag hasn't synced yet are handled correctly.
    console.log('[createQRCode] redirect_base_url from frontend:', qrCodeData.redirect_base_url);
    if (qrCodeData.type === 'dynamic' && isPro) {
      console.log('[createQRCode] looking up custom domain for user:', user.email);
      const domains = await base44.asServiceRole.entities.CustomDomain.filter({
        user_email: user.email,
        status: 'active',
      }).catch((err) => {
        console.error('[createQRCode] CustomDomain filter error:', err);
        return [];
      });
      console.log('[createQRCode] found domains:', domains);
      if (domains.length > 0) {
        qrCodeData.redirect_base_url = `https://${domains[0].hostname}`;
        console.log('[createQRCode] set redirect_base_url to:', qrCodeData.redirect_base_url);
      }
    }
    console.log('[createQRCode] final redirect_base_url before save:', qrCodeData.redirect_base_url);
    console.log('[createQRCode] final is_active before save:', qrCodeData.is_active);
    console.log('[createQRCode] final short_code before save:', qrCodeData.short_code);

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
        console.error('[createQRCode] Error checking slug uniqueness:', err);
      }
    }

    const created = await base44.entities.QRCode.create(qrCodeData);

    console.log('[createQRCode] Successfully created QR code:', {
      id: created.id,
      short_code: created.short_code,
      is_active: created.is_active,
      redirect_base_url: created.redirect_base_url,
      type: created.type,
    });

    return Response.json({ qrCode: created });
  } catch (error) {
    console.error('Error in createQRCode:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});