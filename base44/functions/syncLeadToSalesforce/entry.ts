import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SALESFORCE_CONNECTOR_ID = '68e14191f0b0a5a83d54d9b5';

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

    let accessToken: string;
    let instanceUrl: string;
    try {
      const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection(SALESFORCE_CONNECTOR_ID);
      accessToken = conn.accessToken;
      instanceUrl = conn.instanceUrl;
    } catch {
      return Response.json({ error: 'Salesforce not connected. Please connect your Salesforce account.' }, { status: 400 });
    }

    const sfBase = `${instanceUrl}/services/data/v59.0`;
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

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

      const nameParts = (lead.lead_name || '').split(' ');
      const properties = {
        FirstName: nameParts[0] || '',
        LastName: nameParts.slice(1).join(' ') || nameParts[0] || '',
        Email: lead.lead_email,
        Phone: lead.lead_phone || '',
        Company: lead.qr_code_name || 'QR Sensei',
        LeadSource: 'Web',
      };

      // Search for existing lead by email
      const query = `SELECT+Id+FROM+Lead+WHERE+Email='${encodeURIComponent(lead.lead_email)}'`;
      const searchRes = await fetch(`${sfBase}/query?q=${query}`, { headers: { 'Authorization': `Bearer ${accessToken}` } });
      const searchData = await searchRes.json();
      const existingId = searchData.records?.[0]?.Id;

      let sfRes: Response;
      if (existingId) {
        sfRes = await fetch(`${sfBase}/sobjects/Lead/${existingId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(properties),
        });
      } else {
        sfRes = await fetch(`${sfBase}/sobjects/Lead`, {
          method: 'POST',
          headers,
          body: JSON.stringify(properties),
        });
      }

      if (sfRes.ok || sfRes.status === 204) {
        const sfData = sfRes.status === 204 ? {} : await sfRes.json();
        await base44.asServiceRole.entities.Lead.update(id, { sf_synced: true, sf_sync_error: '' });
        results.push({ id, success: true, salesforce_id: existingId || sfData.id });
      } else {
        const errData = await sfRes.json().catch(() => ({}));
        const errMsg = errData?.[0]?.message || errData?.message || 'Salesforce sync failed';
        await base44.asServiceRole.entities.Lead.update(id, { sf_sync_error: errMsg });
        results.push({ id, success: false, error: errMsg });
      }
    }

    const successCount = results.filter(r => r.success).length;
    return Response.json({ success: true, synced: successCount, total: ids.length, results });
  } catch (error) {
    console.error('syncLeadToSalesforce error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
