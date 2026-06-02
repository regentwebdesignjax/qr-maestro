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

    // Use the v3 lists API (requires crm.lists.read scope).
    // NOTE: the legacy v1 lists API was sunset by HubSpot on 2026-04-30 and now
    // returns 403/404, so v3 is the only viable path.
    const v3Res = await fetch('https://api.hubapi.com/crm/v3/lists/?limit=500', { headers });
    if (v3Res.ok) {
      const v3Data = await v3Res.json();
      const lists = (v3Data.lists || [])
        .filter((l: { listType: string }) => l.listType === 'STATIC')
        .map((l: { listId: number; name: string }) => ({ id: String(l.listId), name: l.name }));
      return Response.json({ connected: true, lists });
    }

    // Surface HubSpot's actual error category/message so the cause is diagnosable.
    // 403 + MISSING_SCOPES => the connector's HubSpot app lacks crm.lists.read.
    // 403 with a user-permission message => the connected user lacks "Lists" access.
    const v3ErrText = await v3Res.text().catch(() => '');
    let category = '';
    let hsMessage = '';
    try {
      const parsed = JSON.parse(v3ErrText);
      category = parsed.category || '';
      hsMessage = parsed.message || '';
    } catch {
      // non-JSON error body — fall through with raw text
    }
    console.error(`HubSpot v3 lists failed. status=${v3Res.status} category=${category} message=${hsMessage} raw=${v3ErrText}`);

    // HubSpot's v3 Lists API rejects user-level OAuth tokens (the only kind a
    // public-app connector like Base44's can mint). Reconnecting / changing scopes
    // / super-admin access cannot fix this — it's a token-type restriction.
    const isUserTokenRejected = /user level oauth token is not allowed/i.test(hsMessage);

    let listsError: string;
    if (isUserTokenRejected) {
      listsError = "HubSpot's Lists API does not accept the connector's user-level OAuth token, so lists can't be loaded. This is a connector-level limitation, not a scope or permission issue — reconnecting won't help.";
    } else if (v3Res.status === 403 && category === 'MISSING_SCOPES') {
      listsError = 'The HubSpot connector app is missing the crm.lists.read scope. This must be enabled on the connector itself (Base44 side) before reconnecting will help.';
    } else if (v3Res.status === 403) {
      listsError = hsMessage
        ? `HubSpot denied list access: ${hsMessage}`
        : 'HubSpot denied list access (403). The connected user may lack "Lists" permission in HubSpot, or the connector app is missing the crm.lists.read scope.';
    } else {
      listsError = hsMessage
        ? `HubSpot list lookup failed (${v3Res.status}): ${hsMessage}`
        : `HubSpot list lookup failed (${v3Res.status}).`;
    }

    return Response.json({
      connected: true,
      lists: [],
      listsError,
      hubspotStatus: v3Res.status,
      hubspotCategory: category,
      // Signals an unfixable-by-user connector limitation so the UI can hide the
      // "reconnect to grant list access" prompt instead of looping the user.
      connectorLimitation: isUserTokenRejected,
    });
  } catch (error) {
    console.error('getHubSpotLists error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
