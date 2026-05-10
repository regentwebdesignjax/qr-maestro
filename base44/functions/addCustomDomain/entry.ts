import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CF_API = 'https://api.cloudflare.com/client/v4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = user.role === 'admin';

    if (!isAdmin) {
      if (user.subscription_tier !== 'pro' || user.subscription_status !== 'active') {
        return Response.json({ error: 'Pro subscription required' }, { status: 403 });
      }

      if (!user.custom_domain_addon) {
        return Response.json({ error: 'Custom Domain add-on not active on this account' }, { status: 403 });
      }
    }

    const { hostname } = await req.json();

    if (!hostname || typeof hostname !== 'string') {
      return Response.json({ error: 'hostname is required' }, { status: 400 });
    }

    const normalized = hostname.trim().toLowerCase();

    // Must be a subdomain (at least two dots or one dot with a TLD), not a root domain
    const parts = normalized.split('.');
    if (parts.length < 3) {
      return Response.json(
        { error: 'A subdomain is required (e.g. qr.yourdomain.com). Root domains are not supported.' },
        { status: 400 }
      );
    }

    // Enforce uniqueness across all accounts
    const existing = await base44.asServiceRole.entities.CustomDomain.filter({ hostname: normalized });
    if (existing.length > 0) {
      const ownedByCaller = existing[0].user_email === user.email;
      if (!ownedByCaller) {
        return Response.json({ error: 'This domain is already in use by another account' }, { status: 409 });
      }
      // Already registered by this user — return the existing record
      return Response.json({ customDomain: existing[0] });
    }

    const apiToken = Deno.env.get('CLOUDFLARE_API_TOKEN');
    const zoneId = Deno.env.get('CLOUDFLARE_ZONE_ID');

    if (!apiToken || !zoneId) {
      return Response.json({ error: 'Cloudflare credentials not configured' }, { status: 500 });
    }

    // Register the hostname with Cloudflare for SaaS
    const cfRes = await fetch(`${CF_API}/zones/${zoneId}/custom_hostnames`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hostname: normalized,
        ssl: { method: 'http', type: 'dv', settings: { min_tls_version: '1.2' } },
      }),
    });

    const cfData = await cfRes.json();

    if (!cfRes.ok || !cfData.success) {
      const msg = cfData.errors?.[0]?.message || 'Cloudflare API error';
      return Response.json({ error: msg }, { status: 502 });
    }

    const cfHostname = cfData.result;

    const customDomain = await base44.asServiceRole.entities.CustomDomain.create({
      user_email: user.email,
      hostname: normalized,
      cf_custom_hostname_id: cfHostname.id,
      status: 'pending',
      ssl_status: cfHostname.ssl?.status || 'pending_validation',
      ownership_status: cfHostname.ownership_verification_http ? 'pending' : cfHostname.status,
    });

    return Response.json({ customDomain });
  } catch (error) {
    console.error('addCustomDomain error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
