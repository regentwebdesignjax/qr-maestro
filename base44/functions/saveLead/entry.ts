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

    // Test: Store phone in notes field with special prefix to see if update works at all
    let notesWithPhone = notes || '';
    if (lead_phone) {
      notesWithPhone = `[PHONE: ${lead_phone}] ${notesWithPhone}`.trim();
    }

    const leadData = {
      user_email,
      qr_code_id: qr_code_id || '',
      qr_code_name: qr_code_name || '',
      lead_name,
      lead_email,
      lead_phone: lead_phone ? String(lead_phone) : '',
      lead_tag: lead_tag || '',
      notes: notesWithPhone,
    };

    console.log('Creating lead with data:', JSON.stringify(leadData));
    console.log('Lead phone included in payload:', lead_phone ? 'YES - ' + lead_phone : 'NO');

    const result = await base44.asServiceRole.entities.Lead.create(leadData);

    console.log('Lead created successfully. ID:', result?.id);
    console.log('Result has lead_phone field:', result?.lead_phone ? `YES - ${result.lead_phone}` : 'NO - field missing from result');
    console.log('Result has notes:', result?.notes ? `YES - ${result.notes}` : 'NO');

    // If lead_phone is in result, great! If not, Base44 database schema doesn't support it yet
    if (!result?.lead_phone && lead_phone) {
      console.warn('⚠️ WARNING: lead_phone field not returned by create operation');
      console.warn('This suggests the Lead entity database schema does not include the lead_phone column yet');
      console.warn('Phone data stored in notes field as fallback: ' + notesWithPhone);
    }

    return Response.json({ success: true, id: result?.id });
  } catch (error) {
    console.error('saveLead error:', error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});