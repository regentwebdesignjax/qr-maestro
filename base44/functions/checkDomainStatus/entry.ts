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

    // If already active or deactivated, no need to poll Cloudflare
    if (domain.status === 'active' || domain.status === 'deactivated') {
      return Response.json({ customDomain: domain });
    }

    const apiToken = Deno.env.get('CLOUDFLARE_API_TOKEN');
    const zoneId = Deno.env.get('CLOUDFLARE_ZONE_ID');
    const workerDomain = Deno.env.get('CLOUDFLARE_WORKER_DOMAIN');

    if (!apiToken || !zoneId || !domain.cf_custom_hostname_id) {
      return Response.json({ customDomain: domain });
    }

    // Poll Cloudflare for the latest status
    const cfRes = await fetch(
      `${CF_API}/zones/${zoneId}/custom_hostnames/${domain.cf_custom_hostname_id}`,
      { headers: { 'Authorization': `Bearer ${apiToken}` } }
    );

    if (!cfRes.ok) {
      return Response.json({ customDomain: domain });
    }

    const cfData = await cfRes.json();
    if (!cfData.success) {
      return Response.json({ customDomain: domain });
    }

    const cfHostname = cfData.result;
    const sslStatus = cfHostname.ssl?.status || '';
    const ownershipStatus = cfHostname.status || '';

    // If CLOUDFLARE_WORKER_DOMAIN is set and this hostname doesn't already have
    // custom_origin_server pointing to the Worker, patch it now.
    // This fixes hostnames that were registered before custom_origin_server was added.
    if (workerDomain && cfHostname.custom_origin_server !== workerDomain) {
      await fetch(
        `${CF_API}/zones/${zoneId}/custom_hostnames/${domain.cf_custom_hostname_id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ custom_origin_server: workerDomain }),
        }
      ).catch((e) => console.error('[checkDomainStatus] PATCH custom_origin_server failed:', e));
    }

    // active when both SSL cert is valid and ownership is verified
    const isActive = sslStatus === 'active' && ownershipStatus === 'active';
    const newStatus = isActive ? 'active' : domain.status;

    const updated = await base44.asServiceRole.entities.CustomDomain.update(domain.id, {
      status: newStatus,
      ssl_status: sslStatus,
      ownership_status: ownershipStatus,
    });

    return Response.json({ customDomain: updated });
  } catch (error) {
    console.error('checkDomainStatus error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
