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
      // Pre-flight: probe the Worker directly so we can surface the EXACT failure
      // (token can't read Workers vs. Worker doesn't exist with this name vs. other CF error)
      // BEFORE attempting the PATCH attachment.
      let preflightFailed = false;

      const zoneInfoRes = await fetch(`${CF_API}/zones/${zoneId}`, {
        headers: { 'Authorization': `Bearer ${apiToken}` },
      });
      let accountId: string | null = null;
      if (zoneInfoRes.ok) {
        const zoneInfoData = await zoneInfoRes.json();
        accountId = zoneInfoData.result?.account?.id || null;
      }

      if (accountId) {
        const workerCheckUrl = `${CF_API}/accounts/${accountId}/workers/scripts/${workerService}`;
        const workerCheckRes = await fetch(workerCheckUrl, {
          headers: { 'Authorization': `Bearer ${apiToken}` },
        });
        console.log('[checkDomainStatus] Worker pre-flight:', workerCheckUrl, '→', workerCheckRes.status);

        if (workerCheckRes.status === 401 || workerCheckRes.status === 403) {
          routingError = `Cloudflare API token cannot read Workers. Fix: dash.cloudflare.com → My Profile → API Tokens → edit the token whose value is stored in Base44 as CLOUDFLARE_API_TOKEN → add BOTH "Account → Workers Scripts → Read" AND "Account → Workers Scripts → Edit" permissions. The token VALUE stays the same; only its permissions change, so no Base44 update is needed.`;
          preflightFailed = true;
        } else if (workerCheckRes.status === 404) {
          routingError = `Worker named "${workerService}" not found in your Cloudflare account. Open dash.cloudflare.com → Workers & Pages and confirm the Worker's exact name. If it has a different name (e.g. "qr-redirect-worker"), set CLOUDFLARE_WORKER_SERVICE in Base44 environment secrets to that exact name.`;
          preflightFailed = true;
        } else if (!workerCheckRes.ok) {
          const body = await workerCheckRes.text().catch(() => '');
          routingError = `Worker pre-flight failed: HTTP ${workerCheckRes.status} ${body.slice(0, 200)}`;
          preflightFailed = true;
        }
      } else {
        console.warn('[checkDomainStatus] Could not resolve account_id from zone; skipping pre-flight');
      }

      if (preflightFailed) {
        console.error('[checkDomainStatus] Pre-flight failed:', routingError);
      } else {
        console.log('[checkDomainStatus] Worker not attached. Patching hostname to attach Worker and set custom_origin_server...');
        // Include environment: 'production' — some newer service-style Workers require it
        // to bind correctly. The custom_origin_server stays as a fallback for visibility.
        const patchBody = {
          worker: { service: workerService, environment: 'production' },
          custom_origin_server: fallbackOrigin,
        };
        console.log('[checkDomainStatus] PATCH body:', JSON.stringify(patchBody));

        const patchRes = await fetch(
          `${CF_API}/zones/${zoneId}/custom_hostnames/${domain.cf_custom_hostname_id}`,
          {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(patchBody),
          }
        );

        if (patchRes.ok) {
          const patchData = await patchRes.json();
          console.log('[checkDomainStatus] PATCH full response:', JSON.stringify(patchData));
          if (patchData.success) {
            const attachedService = patchData.result?.worker?.service;
            if (attachedService) {
              routingConfigured = true;
              console.log('[checkDomainStatus] PATCH succeeded, worker:', attachedService, 'origin:', patchData.result?.custom_origin_server);
            } else {
              // Pre-flight passed (Worker exists, token can read it), but PATCH silently dropped
              // the worker field. Surface CF's hint messages if any were included.
              const cfMessages = (patchData.messages || []).map((m: { message?: string }) => m.message).filter(Boolean).join('; ');
              routingError = `Cloudflare accepted the request but did not attach the Worker. Verify in dash.cloudflare.com → My Profile → API Tokens that your token has BOTH "Account → Workers Scripts → Read" AND "Account → Workers Scripts → Edit" (two separate rows). If both are present, verify Workers Paid is active on your ACCOUNT (not the zone) at dash.cloudflare.com → Workers & Pages → Plans.${cfMessages ? ' CF hints: ' + cfMessages : ''}`;
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
