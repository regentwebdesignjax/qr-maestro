import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SALESFORCE_CONNECTOR_ID = '68e14191f0b0a5a83d54d9b5';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      await base44.asServiceRole.connectors.getCurrentAppUserConnection(SALESFORCE_CONNECTOR_ID);
      return Response.json({ connected: true });
    } catch {
      return Response.json({ connected: false });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
