import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SALESFORCE_CONNECTOR_ID = '6a24a2f7fcbdaaac31c6338d';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { lead_id, lead_ids } = body;

    const ids = lead_ids || (lead_id ? [lead_id] : []);
    if (ids.length === 0) {
      return Response.json({ error: 'lead_id or lead_ids required' }, { status: 400 });
    }

    // Get user's Salesforce access token + instance URL
    let accessToken, instanceUrl;
    try {
      const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection(SALESFORCE_CONNECTOR_ID);
      accessToken = conn.accessToken;
      instanceUrl = conn.connectionConfig?.instance_url;
    } catch {
      return Response.json({ error: 'Salesforce not connected. Please connect your Salesforce account.' }, { status: 400 });
    }

    if (!instanceUrl) {
      return Response.json({ error: 'Salesforce instance URL not found. Please reconnect.' }, { status: 400 });
    }

    const authHeader = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const baseUrl = `${instanceUrl}/services/data/v60.0`;
    const results = [];

    for (const id of ids) {
      const leads = await base44.asServiceRole.entities.Lead.filter({ id });
      const lead = leads?.[0];

      if (!lead) {
        results.push({ id, success: false, error: 'Lead not found' });
        continue;
      }

      if (lead.user_email !== user.email && user.role !== 'admin') {
        results.push({ id, success: false, error: 'Unauthorized' });
        continue;
      }

      // Build Salesforce Lead object
      // Salesforce requires LastName and Company
      const nameParts = (lead.lead_name || '').trim().split(' ');
      const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : '';
      const lastName = nameParts[nameParts.length - 1] || lead.lead_name || 'Unknown';

      const sfLead = {
        FirstName: firstName,
        LastName: lastName,
        Email: lead.lead_email,
        Phone: lead.lead_phone || '',
        Company: lead.qr_code_name || 'N/A',
        LeadSource: 'QR Code',
        Description: lead.notes || '',
      };

      if (lead.lead_tag) {
        sfLead.Description = `[Tag: ${lead.lead_tag}] ${sfLead.Description}`.trim();
      }

      // Try to upsert by email using the composite REST API
      // First check if a lead with this email already exists
      const searchUrl = `${baseUrl}/query?q=${encodeURIComponent(`SELECT Id FROM Lead WHERE Email = '${lead.lead_email}' LIMIT 1`)}`;
      const searchRes = await fetch(searchUrl, { headers: authHeader });
      const searchData = await searchRes.json();

      let sfRes;
      if (searchData.records && searchData.records.length > 0) {
        // Update existing lead
        const existingId = searchData.records[0].Id;
        sfRes = await fetch(`${baseUrl}/sobjects/Lead/${existingId}`, {
          method: 'PATCH',
          headers: authHeader,
          body: JSON.stringify(sfLead),
        });

        if (sfRes.status === 204) {
          await base44.asServiceRole.entities.Lead.update(id, { crm_synced: true, crm_sync_error: '' });
          results.push({ id, success: true, salesforce_id: existingId, updated: true });
        } else {
          const errData = await sfRes.json();
          const errMsg = errData[0]?.message || 'Salesforce update failed';
          await base44.asServiceRole.entities.Lead.update(id, { crm_sync_error: errMsg });
          results.push({ id, success: false, error: errMsg });
        }
      } else {
        // Create new lead
        sfRes = await fetch(`${baseUrl}/sobjects/Lead`, {
          method: 'POST',
          headers: authHeader,
          body: JSON.stringify(sfLead),
        });

        const sfData = await sfRes.json();
        if (sfRes.ok && sfData.success) {
          await base44.asServiceRole.entities.Lead.update(id, { crm_synced: true, crm_sync_error: '' });
          results.push({ id, success: true, salesforce_id: sfData.id });
        } else {
          const errMsg = sfData[0]?.message || sfData.message || 'Salesforce create failed';
          await base44.asServiceRole.entities.Lead.update(id, { crm_sync_error: errMsg });
          results.push({ id, success: false, error: errMsg });
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    return Response.json({ success: true, synced: successCount, total: ids.length, results });
  } catch (error) {
    console.error('syncLeadToSalesforce error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});