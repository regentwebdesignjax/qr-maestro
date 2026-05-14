import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CF_API = 'https://api.cloudflare.com/client/v4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find this user's custom domain record
    const domains = await base44.asServiceRole.entities.CustomDomain.filter({ user_email: user.email });

    if (domains.length === 0) {
      return Response.json({ customDomain: null });
    }

    const domain = domains[0];

    // Deactivated records don't need any polling
    if (domain.status === 'deactivated') {
      return Response.json({ customDomain: domain, routingConfigured: false });
    }

    const apiToken = Deno.env.get('CLOUDFLARE_API_TOKEN');
    const zoneId = Deno.env.get('CLOUDFLARE_ZONE_ID');
    // CLOUDFLARE_FALLBACK_ORIGIN must be an in-zone hostname (not workers.dev) that has a
    // Worker route attached. Defaults to the canonical value so existing hostnames self-heal
    // even when the env var is not explicitly set.
    const fallbackOrigin = Deno.env.get('CLOUDFLARE_FALLBACK_ORIGIN') || 'customers.qr-sensei.com';

    if (!apiToken || !zoneId || !domain.cf_custom_hostname_id) {
      return Response.json({ customDomain: domain, routingConfigured: false });
    }

    // Poll Cloudflare for the latest status
    const cfRes = await fetch(
      `${CF_API}/zones/${zoneId}/custom_hostnames/${domain.cf_custom_hostname_id}`,
      { headers: { 'Authorization': `Bearer ${apiToken}` } }
    );

    if (!cfRes.ok) {
      const cfErrBody = await cfRes.text().catch(() => '');
      console.error('[checkDomainStatus] CF GET failed:', cfRes.status, cfErrBody);
      return Response.json({ customDomain: domain, routingConfigured: false });
    }

    const cfData = await cfRes.json();
    if (!cfData.success) {
      return Response.json({ customDomain: domain, routingConfigured: false });
    }

    const cfHostname = cfData.result;
    const sslStatus = cfHostname.ssl?.status || '';
    const ownershipStatus = cfHostname.status || '';

    // Routing is configured when either:
    // 1. A Worker is directly attached (Workers Paid) — preferred, handles request at the edge
    // 2. custom_origin_server is set — fallback for non-Workers-Paid zones
    const workerService = Deno.env.get('CLOUDFLARE_WORKER_SERVICE') || 'qr-redirect';
    // routingConfigured requires the Worker to be ATTACHED to this custom hostname.
    // Having custom_origin_server set is not sufficient — CF for SaaS will still TCP-connect
    // to the origin (causing 403/522). Only an attached Worker runs at the edge without origin.
    const workerAttached = !!(cfHostname.worker?.service);
    let routingConfigured = workerAttached;
    let routingError: string | null = null;

    if (!workerAttached) {
      console.log('[checkDomainStatus] Worker not attached. Patching hostname to attach Worker and set custom_origin_server...');
      const patchRes = await fetch(
        `${CF_API}/zones/${zoneId}/custom_hostnames/${domain.cf_custom_hostname_id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          // Attach Worker directly (Workers Paid) + keep custom_origin_server as fallback.
          // custom_origin_sni omitted — requires paid SSL for SaaS (CF error 1456).
          body: JSON.stringify({
            worker: { service: workerService },
            custom_origin_server: fallbackOrigin,
          }),
        }
      );

      if (patchRes.ok) {
        const patchData = await patchRes.json();
        if (patchData.success) {
          const attachedService = patchData.result?.worker?.service;
          if (attachedService) {
            routingConfigured = true;
            console.log('[checkDomainStatus] PATCH succeeded, worker:', attachedService, 'origin:', patchData.result?.custom_origin_server);
          } else {
            // CF accepted the PATCH but silently ignored the worker field.
            // Most common cause: CLOUDFLARE_API_TOKEN is missing the Account-level
            // "Workers Scripts: Edit" permission. Zone-level tokens (DNS + SSL only) cannot
            // attach Workers to custom hostnames — CF silently drops the field.
            // Fix: dash.cloudflare.com → My Profile → API Tokens → edit the token →
            //   add Account → Workers Scripts → Edit permission.
            routingError = `Cloudflare ignored the Worker attachment (worker.service not returned). Most likely fix: edit CLOUDFLARE_API_TOKEN in the Cloudflare dashboard (My Profile → API Tokens) and add "Account → Workers Scripts → Edit" permission. Also verify the Worker is named exactly "${workerService}" in Workers & Pages.`;
            console.error('[checkDomainStatus] PATCH succeeded but worker not attached. CF result:', JSON.stringify(patchData.result));
          }
        } else {
          routingError = patchData.errors?.map((e: { code?: number; message: string }) => `[${e.code ?? '?'}] ${e.message}`).join('; ') || 'CF API error';
          console.error('[checkDomainStatus] PATCH CF error:', routingError);
        }
      } else {
        const body = await patchRes.text().catch(() => '');
        routingError = `HTTP ${patchRes.status}: ${body}`;
        console.error('[checkDomainStatus] PATCH HTTP error:', routingError);
      }
    }

    // active when both SSL cert is valid and ownership is verified
    const isActive = sslStatus === 'active' && ownershipStatus === 'active';
    const newStatus = isActive ? 'active' : domain.status;

    const updated = await base44.asServiceRole.entities.CustomDomain.update(domain.id, {
      status: newStatus,
      ssl_status: sslStatus,
      ownership_status: ownershipStatus,
    });

    return Response.json({ customDomain: updated, routingConfigured, routingError });
  } catch (error) {
    console.error('checkDomainStatus error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
