import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { user_email, qr_code_id, qr_code_name, lead_name, lead_email } = body;

    if (!lead_name || !lead_email || !user_email) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await base44.asServiceRole.entities.Lead.create({
      user_email,
      qr_code_id: qr_code_id || '',
      qr_code_name: qr_code_name || '',
      lead_name,
      lead_email,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('saveLead error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});