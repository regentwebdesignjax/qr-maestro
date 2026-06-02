import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const HUBSPOT_CONNECTOR_ID = '6a19b113175aa6149bf214b0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection(HUBSPOT_CONNECTOR_ID);
      accessToken = conn.accessToken;
    } catch {
      return Response.json({ connected: false, lists: [] });
    }

    const headers = { Authorization: `Bearer ${accessToken}` };

    // Try v3 lists API first (requires crm.lists.read scope)
    const v3Res = await fetch('https://api.hubapi.com/crm/v3/lists/?limit=500', { headers });
    if (v3Res.ok) {
      const v3Data = await v3Res.json();
      const lists = (v3Data.lists || [])
        .filter((l: { listType: string }) => l.listType === 'STATIC')
        .map((l: { listId: number; name: string }) => ({ id: String(l.listId), name: l.name }));
      return Response.json({ connected: true, lists });
    }

    // Fall back to v1 static lists endpoint (requires contacts scope)
    const v1Res = await fetch('https://api.hubapi.com/contacts/v1/lists/static?count=250', { headers });
    if (v1Res.ok) {
      const v1Data = await v1Res.json();
      const lists = (v1Data.lists || []).map((l: { listId: number; name: string }) => ({
        id: String(l.listId),
        name: l.name,
      }));
      return Response.json({ connected: true, lists });
    }

    // Both APIs failed — likely a scope issue on the HubSpot connector
    const v1ErrText = await v1Res.text().catch(() => '');
    console.error(`HubSpot list APIs failed. v3: ${v3Res.status}, v1: ${v1Res.status} ${v1ErrText}`);
    return Response.json({
      connected: true,
      lists: [],
      listsError: `Your HubSpot connection doesn't have list permissions (v3: ${v3Res.status}, v1: ${v1Res.status}). Reconnect HubSpot to grant list access.`,
    });
  } catch (error) {
    console.error('getHubSpotLists error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
