import { createClient } from 'npm:@base44/sdk@0.8.25';

// Use service-role client directly — no user auth needed for public lead capture
const base44 = createClient({
  appId: Deno.env.get('BASE44_APP_ID'),
  serviceRoleKey: true,
});

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { user_email, qr_code_id, qr_code_name, lead_name, lead_email } = body;

    console.log('saveLead called with:', JSON.stringify({ user_email, qr_code_id, qr_code_name, lead_name, lead_email }));

    if (!lead_name || !lead_email || !user_email) {
      console.error('Missing required fields');
      return Response.json({ error: 'Missing required fields: lead_name, lead_email, and user_email are required' }, { status: 400 });
    }

    const result = await base44.entities.Lead.create({
      user_email,
      qr_code_id: qr_code_id || '',
      qr_code_name: qr_code_name || '',
      lead_name,
      lead_email,
    });

    console.log('Lead created successfully:', JSON.stringify(result));
    return Response.json({ success: true, id: result?.id });
  } catch (error) {
    console.error('saveLead error:', error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});