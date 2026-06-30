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
      if (!['black_belt', 'grand_master'].includes(user.subscription_tier) || user.subscription_status !== 'active') {
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
    let existing = [];
    try {
      existing = await base44.asServiceRole.entities.CustomDomain.filter({ hostname: normalized });
    } catch (e) {
      return Response.json({ error: `CustomDomain entity not found in Base44 — ensure it has been created in the dashboard. Details: ${e.message}` }, { status: 500 });
    }

    if (existing.length > 0) {
      const ownedByCaller = existing[0].user_email === user.email;
      if (!ownedByCaller) {
        return Response.json({ error: 'This domain is already in use by another account' }, { status: 409 });
      }
      // Active or pending — return the existing record as-is
      if (existing[0].status !== 'deactivated') {
        return Response.json({ customDomain: existing[0] });
      }
      // Deactivated — fall through to re-register; old record is cleaned up below
    }

    const apiToken = Deno.env.get('CLOUDFLARE_API_TOKEN');
    const zoneId = Deno.env.get('CLOUDFLARE_ZONE_ID');

    if (!apiToken || !zoneId) {
      return Response.json({ error: 'Cloudflare credentials not configured — add CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID to Base44 environment secrets' }, { status: 500 });
    }

    // Clean up a previously deactivated record for this hostname before re-registering
    if (existing.length > 0 && existing[0].status === 'deactivated') {
      const old = existing[0];
      if (old.cf_custom_hostname_id) {
        await fetch(`${CF_API}/zones/${zoneId}/custom_hostnames/${old.cf_custom_hostname_id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${apiToken}` },
        }).catch((e) => console.warn('[addCustomDomain] CF cleanup error:', e.message));
      }
      await base44.asServiceRole.entities.CustomDomain.delete(old.id)
        .catch((e) => console.warn('[addCustomDomain] DB cleanup error:', e.message));
    }

    // Register the hostname with Cloudflare for SaaS.
    // Routing is handled by a Worker Route (*/* on qr-sensei.com zone) — no worker field needed.
    // custom_origin_server must be set to the fallback origin so CF for SaaS has a target;
    // the Worker Route intercepts before TCP connection, so the origin is never actually called.
    const fallbackOrigin = Deno.env.get('CLOUDFLARE_FALLBACK_ORIGIN') || 'customers.qr-sensei.com';

    const cfRes = await fetch(`${CF_API}/zones/${zoneId}/custom_hostnames`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hostname: normalized,
        ssl: { method: 'http', type: 'dv', settings: { min_tls_version: '1.2' } },
        custom_origin_server: fallbackOrigin,
      }),
    });
    const cfData = await cfRes.json();

    if (!cfRes.ok || !cfData.success) {
      const msg = cfData.errors?.[0]?.message || 'Cloudflare API error';
      const code = cfData.errors?.[0]?.code ?? '';
      console.error('[addCustomDomain] CF registration failed:', code, msg);
      // Return 200 so the SDK resolves (not throws) and the frontend can display the message.
      return Response.json({ error: `Cloudflare error (${code}): ${msg}` });
    }

    const cfHostname = cfData.result;

    // Trigger validation refresh immediately — CF treats PATCH as a signal to retry HTTP validation
    await fetch(
      `${CF_API}/zones/${zoneId}/custom_hostnames/${cfHostname.id}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    ).catch((e) => console.warn('[addCustomDomain] validation refresh failed:', e.message));

    let customDomain;
    try {
      customDomain = await base44.asServiceRole.entities.CustomDomain.create({
        user_email: user.email,
        hostname: normalized,
        cf_custom_hostname_id: cfHostname.id,
        status: 'pending',
        ssl_status: cfHostname.ssl?.status || 'pending_validation',
        ownership_status: cfHostname.ownership_verification_http ? 'pending' : cfHostname.status,
      });
    } catch (e) {
      return Response.json({ error: `Cloudflare registration succeeded but failed to save record: ${e.message}` }, { status: 500 });
    }

    return Response.json({ customDomain });
  } catch (error) {
    console.error('addCustomDomain error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
