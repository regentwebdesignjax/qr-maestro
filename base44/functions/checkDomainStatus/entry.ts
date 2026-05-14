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

    const cfOrigin = (cfHostname.custom_origin_server || '').toLowerCase().trim();

    // Routing is configured when either:
    // 1. A Worker is directly attached (Workers for Platforms enterprise) — runs at edge, no TCP
    // 2. custom_origin_server points to a working external server (non-CF, non-default)
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
              // CF silently dropped the worker field. This happens because the "worker" field
              // on CF for SaaS custom hostnames requires Workers for Platforms (enterprise),
              // NOT just Workers Paid ($5/month). No token permission fix will resolve this.
              //
              // Fallback strategy: use an external origin server (e.g. Fly.io).
              // If CLOUDFLARE_FALLBACK_ORIGIN is set to something other than the default
              // zone hostname (which causes CF loopback → 403/522), treat routing as
              // configured via external origin and patch custom_origin_server to point to it.
              console.error('[checkDomainStatus] PATCH succeeded but worker not attached — Workers for Platforms enterprise required. CF result:', JSON.stringify(patchData.result));
              const DEFAULT_ORIGIN = 'customers.qr-sensei.com';
              const isExternalOrigin = fallbackOrigin.toLowerCase() !== DEFAULT_ORIGIN;

              if (isExternalOrigin) {
                // Ensure custom_origin_server is pointing at the external origin
                if (cfOrigin !== fallbackOrigin.toLowerCase().trim()) {
                  console.log('[checkDomainStatus] Updating custom_origin_server to external origin:', fallbackOrigin);
                  const originPatchRes = await fetch(
                    `${CF_API}/zones/${zoneId}/custom_hostnames/${domain.cf_custom_hostname_id}`,
                    {
                      method: 'PATCH',
                      headers: { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({ custom_origin_server: fallbackOrigin }),
                    }
                  );
                  const originPatchData = await originPatchRes.json();
                  if (originPatchData.success) {
                    console.log('[checkDomainStatus] custom_origin_server updated to external origin:', fallbackOrigin);
                  } else {
                    const originErr = originPatchData.errors?.[0]?.message || 'unknown';
                    console.error('[checkDomainStatus] Failed to update custom_origin_server:', originErr);
                  }
                }
                routingConfigured = true;
                console.log('[checkDomainStatus] Using external origin for routing:', fallbackOrigin);
              } else {
                // Default origin (customers.qr-sensei.com) causes CF loopback → 403/522.
                // User must deploy an external redirect server and configure CLOUDFLARE_FALLBACK_ORIGIN.
                routingError = `Worker attachment requires Cloudflare Workers for Platforms (enterprise — not included in Workers Paid). SOLUTION: Deploy the redirect server in fly-redirect-origin/ to Fly.io (free), then set CLOUDFLARE_FALLBACK_ORIGIN in Base44 environment secrets to your Fly.io app hostname (e.g. qr-sensei-redirect.fly.dev). See fly-redirect-origin/main.ts for instructions.`;
              }
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
