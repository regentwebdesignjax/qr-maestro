import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const HUBSPOT_CONNECTOR_ID = '6a19b113175aa6149bf214b0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { lead_id, lead_ids } = body;

    // Support single lead or batch
    const ids = lead_ids || (lead_id ? [lead_id] : []);
    if (ids.length === 0) {
      return Response.json({ error: 'lead_id or lead_ids required' }, { status: 400 });
    }

    // Get user's HubSpot access token
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection(HUBSPOT_CONNECTOR_ID);
      accessToken = conn.accessToken;
    } catch {
      return Response.json({ error: 'HubSpot not connected. Please connect your HubSpot account.' }, { status: 400 });
    }

    const authHeader = { 'Authorization': `Bearer ${accessToken}` };

    // Check which custom contact properties exist in HubSpot
    const [leadTagRes, qrSourceRes] = await Promise.all([
      fetch('https://api.hubapi.com/crm/v3/properties/contacts/lead_tag', { headers: authHeader }).catch(() => ({ ok: false })),
      fetch('https://api.hubapi.com/crm/v3/properties/contacts/qr_maestro_source', { headers: authHeader }).catch(() => ({ ok: false })),
    ]);
    const leadTagPropertyExists = leadTagRes.ok;
    const qrSourcePropertyExists = qrSourceRes.ok;

    const results = [];

    for (const id of ids) {
      // Fetch the lead
      const leads = await base44.asServiceRole.entities.Lead.filter({ id });
      const lead = leads?.[0];

      if (!lead) {
        results.push({ id, success: false, error: 'Lead not found' });
        continue;
      }

      // Verify ownership
      if (lead.user_email !== user.email && user.role !== 'admin') {
        results.push({ id, success: false, error: 'Unauthorized' });
        continue;
      }

      // Look up the source QR code for the optional HubSpot segment label
      let hubspotSegmentLabel: string | null = null;
      if (lead.qr_code_id) {
        try {
          const qrCodes = await base44.asServiceRole.entities.QRCode.filter({ id: lead.qr_code_id });
          const qr = qrCodes?.[0];
          hubspotSegmentLabel = qr?.design_config?.hubspot_segment_label || null;
        } catch {
          // Non-fatal — proceed without segment label
        }
      }

      // Build HubSpot contact properties
      const properties: Record<string, string> = {
        email: lead.lead_email,
        firstname: lead.lead_name?.split(' ')[0] || lead.lead_name || '',
        lastname: lead.lead_name?.split(' ').slice(1).join(' ') || '',
        phone: lead.lead_phone || '',
      };

      if (lead.lead_tag && leadTagPropertyExists) {
        properties.lead_tag = lead.lead_tag;
      }

      if (lead.qr_code_name) {
        properties.company = lead.qr_code_name;
      }

      // Write the segment label to the qr_maestro_source property so customers can
      // use active (dynamic) HubSpot lists filtered on this field — the Lists API
      // membership endpoints reject user-level OAuth tokens, so a property-based
      // approach is the only option without a private-app token.
      if (hubspotSegmentLabel && qrSourcePropertyExists) {
        properties.qr_maestro_source = hubspotSegmentLabel;
      }

      // Upsert contact in HubSpot (creates or updates by email)
      const hsRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ properties }),
      });

      const hsData = await hsRes.json();

      if (hsRes.ok) {
        await base44.asServiceRole.entities.Lead.update(id, { crm_synced: true, crm_sync_error: '' });
        results.push({ id, success: true, hubspot_id: hsData.id });
      } else if (hsRes.status === 409) {
        // Contact already exists — search by email to get the numeric ID, then PATCH
        const searchRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
          method: 'POST',
          headers: { ...authHeader, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filterGroups: [{
              filters: [{ propertyName: 'email', operator: 'EQ', value: lead.lead_email }]
            }],
            properties: ['email'],
            limit: 1,
          }),
        });
        const searchData = await searchRes.json();
        const existingId = searchData.results?.[0]?.id;
        if (existingId) {
          const updateRes = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${existingId}`, {
            method: 'PATCH',
            headers: { ...authHeader, 'Content-Type': 'application/json' },
            body: JSON.stringify({ properties }),
          });
          if (updateRes.ok) {
            await base44.asServiceRole.entities.Lead.update(id, { crm_synced: true, crm_sync_error: '' });
            results.push({ id, success: true, hubspot_id: existingId, updated: true });
          } else {
            const errData = await updateRes.json();
            const errMsg = errData.message || 'HubSpot update failed';
            await base44.asServiceRole.entities.Lead.update(id, { crm_sync_error: errMsg });
            results.push({ id, success: false, error: errMsg });
          }
        } else {
          const errMsg = searchData.message || 'Contact not found in HubSpot search';
          await base44.asServiceRole.entities.Lead.update(id, { crm_sync_error: errMsg });
          results.push({ id, success: false, error: errMsg });
        }
      } else {
        const errMsg = hsData.message || 'HubSpot sync failed';
        await base44.asServiceRole.entities.Lead.update(id, { crm_sync_error: errMsg });
        results.push({ id, success: false, error: errMsg });
      }
    }

    const successCount = results.filter(r => r.success).length;
    return Response.json({ success: true, synced: successCount, total: ids.length, results });
  } catch (error) {
    console.error('syncLeadToCRM error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
