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

    // Include phone in initial creation attempt
    const leadData = {
      user_email,
      qr_code_id: qr_code_id || '',
      qr_code_name: qr_code_name || '',
      lead_name,
      lead_email,
      lead_phone: lead_phone ? String(lead_phone) : '',
      lead_tag: lead_tag || '',
      notes: notes || '',
    };
    console.log('Creating lead with data:', JSON.stringify(leadData));

    const result = await base44.asServiceRole.entities.Lead.create(leadData);

    console.log('Lead created successfully:', JSON.stringify(result));
    console.log('Result keys:', Object.keys(result || {}));
    console.log('Result lead_phone value:', result?.lead_phone);
    console.log('Result full object:', JSON.stringify(result, null, 2));

    // If phone field didn't persist, try alternative methods
    if (lead_phone) {
      if (!result?.lead_phone) {
        console.warn('Phone field not in created record - attempting workarounds');

        try {
          // Workaround 1: Try direct field update
          console.log('Attempting update with just phone field...');
          const patched = await base44.asServiceRole.entities.Lead.update(result.id, {
            lead_phone: String(lead_phone),
          });
          console.log('Direct update result:', JSON.stringify(patched));
        } catch (err1) {
          console.error('Direct update failed:', err1.message);

          try {
            // Workaround 2: Try update with all fields
            console.log('Attempting update with full object...');
            const fullUpdate = await base44.asServiceRole.entities.Lead.update(result.id, {
              ...result,
              lead_phone: String(lead_phone),
            });
            console.log('Full update result:', JSON.stringify(fullUpdate));
          } catch (err2) {
            console.error('Full update also failed:', err2.message);
          }
        }
      }
    }
    return Response.json({ success: true, id: result?.id });
  } catch (error) {
    console.error('saveLead error:', error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});