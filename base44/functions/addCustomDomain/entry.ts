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
    // Attach the qr-redirect Worker directly to the custom hostname (requires Workers Paid).
    // When a Worker is attached, CF for SaaS runs it at the edge for all requests to this
    // hostname — no TCP origin connection is made, eliminating 522 errors entirely.
    // custom_origin_server is kept as a fallback for zones not yet on Workers Paid.
    const fallbackOrigin = Deno.env.get('CLOUDFLARE_FALLBACK_ORIGIN') || 'customers.qr-sensei.com';
    const workerService = Deno.env.get('CLOUDFLARE_WORKER_SERVICE') || 'qr-redirect';

    const postHostname = async (includeWorker: boolean, includeOrigin: boolean) => {
      const body: Record<string, unknown> = {
        hostname: normalized,
        ssl: { method: 'http', type: 'dv', settings: { min_tls_version: '1.2' } },
      };
      if (includeWorker) {
        // Attach Worker directly — requires Workers Paid. Worker handles the request at the
        // edge so no origin TCP connection is needed (avoids 522 on CF for SaaS free tier).
        body.worker = { service: workerService };
      }
      if (includeOrigin) {
        body.custom_origin_server = fallbackOrigin;
      }
      const res = await fetch(`${CF_API}/zones/${zoneId}/custom_hostnames`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      return { res, data };
    };

    // First attempt: attach Worker + custom_origin_server (Workers Paid required for worker field).
    let { res: cfRes, data: cfData } = await postHostname(true, true);

    // If CF rejected the worker field (e.g. not on Workers Paid yet), retry without it.
    if (!cfRes.ok || !cfData.success) {
      const cfMsg = cfData.errors?.[0]?.message || '';
      const cfCode = cfData.errors?.[0]?.code;
      console.warn('[addCustomDomain] First attempt failed:', cfCode, cfMsg);

      if (cfMsg.toLowerCase().includes('worker') || cfMsg.toLowerCase().includes('dispatch') || cfMsg.toLowerCase().includes('namespace')) {
        console.log('[addCustomDomain] Retrying without worker field (upgrade to Workers Paid to enable)...');
        ({ res: cfRes, data: cfData } = await postHostname(false, true));
      }
    }

    // If custom_origin_server was also rejected, retry with neither.
    if (!cfRes.ok || !cfData.success) {
      const cfMsg = cfData.errors?.[0]?.message || '';
      const cfCode = cfData.errors?.[0]?.code;
      console.warn('[addCustomDomain] Second attempt failed:', cfCode, cfMsg);

      if (cfMsg.toLowerCase().includes('origin') || cfMsg.toLowerCase().includes('custom_origin')) {
        console.log('[addCustomDomain] Retrying without custom_origin_server...');
        ({ res: cfRes, data: cfData } = await postHostname(false, false));
      }
    }

    if (!cfRes.ok || !cfData.success) {
      const msg = cfData.errors?.[0]?.message || 'Cloudflare API error';
      const code = cfData.errors?.[0]?.code ?? '';
      console.error('[addCustomDomain] CF registration failed:', code, msg);
      // Return 200 so the SDK resolves (not throws) and the frontend can display the message.
      return Response.json({ error: `Cloudflare error (${code}): ${msg}` });
    }

    const cfHostname = cfData.result;

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
