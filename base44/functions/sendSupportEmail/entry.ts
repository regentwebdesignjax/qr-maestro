import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { Resend } from 'npm:resend@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let body = {};
    try { body = await req.json(); } catch (_) {}

    const { name, email, org_name, reason, message } = body;

    if (!name || !email || !reason || !message) {
      return Response.json({ error: 'Name, email, reason, and message are required.' }, { status: 400 });
    }

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    await resend.emails.send({
      from: 'QR Sensei Contact <onboarding@resend.dev>',
      to: 'qrsensei@regentmediagroup.com',
      reply_to: email,
      subject: `[QR Sensei Contact] ${reason} — from ${name}`,
      text: `New Contact/Support Submission from QR Sensei\n\nName: ${name}\nEmail: ${email}\nOrganization: ${org_name || 'N/A'}\nReason: ${reason}\n\nMessage:\n${message}\n\n---\nReply directly to this email to respond to ${name}.`,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('sendSupportEmail error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});