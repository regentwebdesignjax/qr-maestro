import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    // Get slug from request body
    const body = await req.json();
    const slug = body.slug;

    if (!slug) {
      return Response.json({ error: 'No slug provided' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Query all linkpage QR codes
    const qrCodes = await base44.asServiceRole.entities.QRCode.filter({
      content_type: 'linkpages'
    }).catch(() => []);

    console.log(`[resolveLinkpageSlug] Looking for slug: "${slug}"`);
    console.log(`[resolveLinkpageSlug] Found ${qrCodes.length} linkpage QR codes`);

    // Find the QR code with matching custom_slug
    let matchingQR = null;
    for (const qr of qrCodes) {
      if (!qr.is_active) {
        console.log(`[resolveLinkpageSlug] Skipping inactive QR code: ${qr.id}`);
        continue;
      }

      try {
        const parsed = JSON.parse(qr.content || '{}');
        const parsedSlug = parsed.custom_slug;
        const matches = parsedSlug === slug;

        console.log(`[resolveLinkpageSlug] Checking QR ${qr.id}:`, {
          stored_custom_slug: parsedSlug,
          requested_slug: slug,
          matches: matches,
          is_active: qr.is_active,
          content_preview: qr.content ? qr.content.substring(0, 150) : 'NO_CONTENT'
        });

        // Only match if custom_slug exists and equals the requested slug
        if (parsedSlug && matches) {
          console.log(`[resolveLinkpageSlug] ✓ MATCH FOUND for slug "${slug}"`);
          matchingQR = qr;
          break;
        }
      } catch (err) {
        console.log(`[resolveLinkpageSlug] Failed to parse QR ${qr.id}: ${err.message}`);
      }
    }

    if (!matchingQR) {
      console.log(`[resolveLinkpageSlug] ✗ NO MATCH - Linkpage not found for slug: "${slug}"`);
      return Response.json({ error: 'Linkpage not found' }, { status: 404 });
    }

    // Subscription check for dynamic QR codes
    if (matchingQR.type === 'dynamic' && matchingQR.owner_email) {
      const owners = await base44.asServiceRole.entities.User.filter({
        email: matchingQR.owner_email
      });
      const owner = owners[0];
      // Allow admins and active Pro subscribers; block lapsed subscriptions
      if (owner && owner.role !== 'admin') {
        const subStatus = owner.subscription_status;
        const subTier = owner.subscription_tier;
        if (subTier === 'pro' && subStatus !== 'active') {
          return Response.json({
            content_type: 'inactive',
            message: 'This professional identity is currently resting. Please contact the owner to reactivate.',
          });
        }
      }
    }

    // Parse linkpage content
    let linkpageData = {};
    try {
      linkpageData = JSON.parse(matchingQR.content || '{}');
    } catch {
      // Return empty linkpage data if parsing fails
    }

    // Track scan
    try {
      const ua = req.headers.get('user-agent') || '';
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || req.headers.get('x-real-ip')
        || null;

      // Parse device/browser info (simplified from redirect function)
      const deviceType = /mobile|android|iphone|tablet|ipad/i.test(ua) ? 'mobile' : 'desktop';
      const browser = /edg\//i.test(ua) ? 'Edge' : /chrome/i.test(ua) ? 'Chrome' : /firefox/i.test(ua) ? 'Firefox' : 'Other';
      const os = /iphone|ipad|ipod/i.test(ua) ? 'iOS' : /android/i.test(ua) ? 'Android' : /windows/i.test(ua) ? 'Windows' : 'Other';

      await base44.asServiceRole.entities.Scan.create({
        qr_code_id: matchingQR.id,
        device_type: deviceType,
        browser,
        os,
        country: null,
        state: null,
        city: null,
        lat: null,
        lng: null,
      }).catch((e) => console.error('Scan create error:', e.message));

      // Update scan count
      await base44.asServiceRole.entities.QRCode.update(matchingQR.id, {
        scan_count: (matchingQR.scan_count || 0) + 1,
      }).catch((e) => console.error('Scan count update error:', e.message));
    } catch (e) {
      console.error('Scan tracking error:', e.message);
    }

    // Return linkpage data with QR metadata
    return Response.json({
      id: matchingQR.id,
      short_code: matchingQR.short_code,
      content_type: 'linkpages',
      linkpage: linkpageData
    });
  } catch (error) {
    console.error('Resolve linkpage slug error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
