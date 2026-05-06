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

    console.log('[createQRCode] Raw request body (req.json()):', {
      keys: Object.keys(qrCodeData),
      values: qrCodeData,
      stringified: JSON.stringify(qrCodeData)
    });
      name: qrCodeData.name,
      content_type: qrCodeData.content_type,
      type: qrCodeData.type,
      is_active: qrCodeData.is_active,
      short_code: qrCodeData.short_code,
      content_length: qrCodeData.content?.length || 0,
      has_custom_slug: qrCodeData.content?.includes('custom_slug') || false,
      keys: Object.keys(qrCodeData)
    });

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
        console.log('[createQRCode] Parsed linkpage data:', {
          custom_slug: linkpageData.custom_slug,
          browser_title: linkpageData.browser_title,
          title: linkpageData.title,
          has_links: !!linkpageData.links,
          content_length: qrCodeData.content.length
        });

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

    let created;
    try {
      created = await base44.entities.QRCode.create(qrCodeData);
      console.log('[createQRCode] Create call succeeded');
    } catch (createErr) {
      console.error('[createQRCode] Create call failed:', {
        error: createErr.message,
        code: createErr.code,
        response: createErr.response?.data || 'NO_RESPONSE_DATA'
      });
      throw createErr;
    }

    console.log('[createQRCode] Response about to be sent:', {
      has_created: !!created,
      created_id: created?.id,
      created_name: created?.name,
      created_type: created?.type,
      created_content_type: created?.content_type,
      created_is_active: created?.is_active,
      created_keys: created ? Object.keys(created) : [],
      response_will_be: { qrCode: created }
    });

    // Log the created QR code for linkpages
    if (qrCodeData.content_type === 'linkpages') {
      console.log('[createQRCode] Created linkpage QR code:', {
        id: created.id,
        name: created.name,
        content_type: created.content_type,
        has_content: !!created.content,
        content_length: created.content?.length || 0,
        owner_email: created.owner_email
      });
    }

    return Response.json({ qrCode: created });
  } catch (error) {
    console.error('Error in createQRCode:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});