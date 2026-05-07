import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { user_email, qr_code_id, qr_code_name, lead_name, lead_email, lead_phone, lead_tag, notes } = body;

    console.log('saveLead called with:', JSON.stringify({ user_email, qr_code_id, qr_code_name, lead_name, lead_email, lead_phone, lead_tag, notes }));

    if (!lead_name || !lead_email || !user_email) {
      console.error('Missing required fields');
      return Response.json({ error: 'Missing required fields: lead_name, lead_email, and user_email are required' }, { status: 400 });
    }

    const leadData = {
      user_email,
      qr_code_id: qr_code_id || '',
      qr_code_name: qr_code_name || '',
      lead_name,
      lead_email,
      lead_tag: lead_tag || '',
      notes: notes || '',
    };
    console.log('Creating lead with data:', JSON.stringify(leadData));

    let result = await base44.asServiceRole.entities.Lead.create(leadData);

    console.log('Lead created successfully:', JSON.stringify(result));
    console.log('Initial lead phone field:', result?.lead_phone);

    // Update the lead with phone field after creation
    if (lead_phone) {
      console.log('Updating lead with phone:', lead_phone);
      result = await base44.asServiceRole.entities.Lead.update(result.id, {
        lead_phone: String(lead_phone),
      });
      console.log('Lead updated with phone:', JSON.stringify(result));
    }
    return Response.json({ success: true, id: result?.id });
  } catch (error) {
    console.error('saveLead error:', error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});