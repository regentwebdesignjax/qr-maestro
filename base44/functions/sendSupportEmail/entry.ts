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

    // Platform SendEmail only works for registered app users.
    // Route notification to all admin users.
    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    if (admins.length === 0) {
      console.warn('No admin users found to receive contact form submission.');
    }
    await Promise.all(admins.map(admin =>
      base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        from_name: 'QR Sensei Contact Form',
        subject: `[QR Sensei Contact] ${reason} — from ${name} <${email}>`,
        body: emailBody,
      })
    ));

    return Response.json({ success: true });
  } catch (error) {
    console.error('sendSupportEmail error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});