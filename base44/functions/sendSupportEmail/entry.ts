import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let body = {};
    try { body = await req.json(); } catch (_) {}

    const { name, email, org_name, reason, message } = body;

    if (!name || !email || !reason || !message) {
      return Response.json({ error: 'Name, email, reason, and message are required.' }, { status: 400 });
    }

    const emailBody = `
New Contact/Support Submission from QR Sensei

Name: ${name}
Email: ${email}
Organization: ${org_name || 'N/A'}
Reason: ${reason}

Message:
${message}

---
Submitted via QR Sensei contact form.
    `.trim();

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'qrsensei@regentmediagroup.com',
      from_name: 'QR Sensei Contact Form',
      subject: `[QR Sensei] ${reason} — from ${name}`,
      body: emailBody,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('sendSupportEmail error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});