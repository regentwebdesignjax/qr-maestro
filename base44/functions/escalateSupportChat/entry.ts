import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { Resend } from 'npm:resend@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body = {};
    try { body = await req.json(); } catch (_) {}

    const { name, email, message } = body;

    if (!name || !email || !message) {
      return Response.json({ error: 'name, email, and message are required.' }, { status: 400 });
    }

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    await resend.emails.send({
      from: 'QR Sensei AI Assistant <onboarding@resend.dev>',
      to: 'qrsensei@regentmediagroup.com',
      reply_to: email,
      subject: `[QR Sensei Chat Escalation] Message from ${name}`,
      text: `A user could not get their question answered by the QR Sensei AI Assistant and has requested human support.\n\nName: ${name}\nEmail: ${email}\nUser Account: ${user.email}\n\nMessage:\n${message}\n\n---\nReply directly to this email to respond to ${name}.`,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('escalateSupportChat error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});