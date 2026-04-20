import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const { qr_code_id } = body;

    if (!qr_code_id) {
      return Response.json({ error: 'qr_code_id required' }, { status: 400 });
    }

    // Verify the QR code belongs to this user
    const qrCodes = await base44.asServiceRole.entities.QRCode.filter({ id: qr_code_id, owner_email: user.email });
    if (qrCodes.length === 0 && user.role !== 'admin') {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    // Fetch all scans for this QR code using service role (bypasses RLS)
    const scans = await base44.asServiceRole.entities.Scan.filter({ qr_code_id }, '-created_date', 5000);

    return Response.json({ scans });
  } catch (error) {
    console.error('getScans error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});