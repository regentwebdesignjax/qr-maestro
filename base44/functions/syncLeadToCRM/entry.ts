import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

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

    // Get the HubSpot connector ID from env (injected at runtime)
    const HUBSPOT_CONNECTOR_ID = Deno.env.get('HUBSPOT_CONNECTOR_ID');
    if (!HUBSPOT_CONNECTOR_ID) {
      return Response.json({ error: 'HubSpot connector not configured' }, { status: 500 });
    }

    // Get user's HubSpot access token
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection(HUBSPOT_CONNECTOR_ID);
      accessToken = conn.accessToken;
    } catch {
      return Response.json({ error: 'HubSpot not connected. Please connect your HubSpot account.' }, { status: 400 });
    }

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

      // Build HubSpot contact properties
      const properties = {
        email: lead.lead_email,
        firstname: lead.lead_name?.split(' ')[0] || lead.lead_name || '',
        lastname: lead.lead_name?.split(' ').slice(1).join(' ') || '',
        phone: lead.lead_phone || '',
        hs_lead_status: 'NEW',
      };

      // Map lead_tag as a note in the description
      if (lead.lead_tag) {
        properties.description = `Source Tag: ${lead.lead_tag}`;
      }

      // Map notes
      if (lead.notes) {
        const cleanedNotes = lead.notes.replace(/^\[PHONE:\s*[^\]]+\]\s*/, '').trim();
        if (cleanedNotes) {
          properties.description = properties.description
            ? `${properties.description} | Notes: ${cleanedNotes}`
            : `Notes: ${cleanedNotes}`;
        }
      }

      // Map source card name as company if available
      if (lead.qr_code_name) {
        properties.company = lead.qr_code_name;
      }

      // Upsert contact in HubSpot (creates or updates by email)
      const hsRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ properties }),
      });

      const hsData = await hsRes.json();

      if (hsRes.ok) {
        // Mark lead as synced
        await base44.asServiceRole.entities.Lead.update(id, {
          crm_synced: true,
          crm_sync_error: '',
        });
        results.push({ id, success: true, hubspot_id: hsData.id });
      } else if (hsRes.status === 409) {
        // Contact already exists — update it
        const existingId = hsData.message?.match(/ID: (\d+)/)?.[1];
        if (existingId) {
          const updateRes = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${existingId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ properties }),
          });
          if (updateRes.ok) {
            await base44.asServiceRole.entities.Lead.update(id, {
              crm_synced: true,
              crm_sync_error: '',
            });
            results.push({ id, success: true, hubspot_id: existingId, updated: true });
          } else {
            const errData = await updateRes.json();
            const errMsg = errData.message || 'HubSpot update failed';
            await base44.asServiceRole.entities.Lead.update(id, { crm_sync_error: errMsg });
            results.push({ id, success: false, error: errMsg });
          }
        } else {
          const errMsg = hsData.message || 'Duplicate contact, could not resolve ID';
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