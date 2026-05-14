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
    // Fallback origin hostname. Must be a proxied in-zone AAAA 100:: record (originless).
    // Routing is handled by a Worker Route (*/* on qr-sensei.com zone), not by TCP origin.
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

    // Routing is considered configured when custom_origin_server points at the fallback origin.
    // The actual redirect is handled by the Worker Route (*/* on qr-sensei.com zone) which fires
    // at the edge before any TCP connection — the origin itself is never contacted.
    const cfOrigin = (cfHostname.custom_origin_server || '').toLowerCase().trim();
    const routingConfigured = cfOrigin === fallbackOrigin.toLowerCase().trim();
    let routingError: string | null = null;

    if (!routingConfigured) {
      console.log('[checkDomainStatus] custom_origin_server not set correctly. Patching to:', fallbackOrigin);
      const patchRes = await fetch(
        `${CF_API}/zones/${zoneId}/custom_hostnames/${domain.cf_custom_hostname_id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ custom_origin_server: fallbackOrigin }),
        }
      );

      if (patchRes.ok) {
        const patchData = await patchRes.json();
        if (patchData.success) {
          console.log('[checkDomainStatus] PATCH succeeded, origin:', patchData.result?.custom_origin_server);
          // routingConfigured will show as true on the next poll after CF propagates
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
