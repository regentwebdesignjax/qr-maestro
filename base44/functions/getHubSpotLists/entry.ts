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

    // Fetch static lists only — active/smart lists cannot be manually targeted
    const res = await fetch(
      'https://api.hubapi.com/crm/v3/lists/?listType=STATIC&properties=name,listId&limit=500',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) {
      const err = await res.json();
      return Response.json({ error: err.message || 'Failed to fetch HubSpot lists' }, { status: res.status });
    }

    const data = await res.json();
    const lists = (data.lists || []).map((l: { listId: number; name: string }) => ({
      id: String(l.listId),
      name: l.name,
    }));

    return Response.json({ connected: true, lists });
  } catch (error) {
    console.error('getHubSpotLists error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
