import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const CF_API = 'https://api.cloudflare.com/client/v4';

export async function deactivateCustomDomainForUser(base44ServiceRole: any, userEmail: string) {
  const domains = await base44ServiceRole.entities.CustomDomain.filter({ user_email: userEmail });
  if (domains.length === 0) return;

  const apiToken = Deno.env.get('CLOUDFLARE_API_TOKEN');
  const zoneId = Deno.env.get('CLOUDFLARE_ZONE_ID');

  for (const domain of domains) {
    if (domain.status === 'deactivated') continue;

    // Remove from Cloudflare if we have the CF ID
    if (domain.cf_custom_hostname_id && apiToken && zoneId) {
      await fetch(`${CF_API}/zones/${zoneId}/custom_hostnames/${domain.cf_custom_hostname_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${apiToken}` },
      }).catch((e) => console.error('CF delete error:', e.message));
    }

    await base44ServiceRole.entities.CustomDomain.update(domain.id, { status: 'deactivated' })
      .catch((e) => console.error('Domain deactivate error:', e.message));
  }
}

// HTTP endpoint so admins or the app itself can trigger deactivation
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Users can only delete their own domain; admins can pass a target email
    let targetEmail = user.email;
    if (user.role === 'admin') {
      const body = await req.json().catch(() => ({}));
      targetEmail = body.user_email || user.email;
    }

    await deactivateCustomDomainForUser(base44.asServiceRole, targetEmail);

    // Clear the add-on flag on the user record
    const targets = await base44.asServiceRole.entities.User.filter({ email: targetEmail });
    if (targets.length > 0) {
      await base44.asServiceRole.entities.User.update(targets[0].id, {
        custom_domain_addon: false,
        custom_domain_addon_period: 'none',
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('deleteCustomDomain error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
