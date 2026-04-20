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

    // Verify the QR code belongs to this user — check both created_by and owner_email
    const qrCodes = await base44.asServiceRole.entities.QRCode.filter({ id: qr_code_id });
    if (qrCodes.length === 0) {
      return Response.json({ error: 'QR code not found' }, { status: 404 });
    }
    const qrCode = qrCodes[0];
    const ownerMatch = qrCode.created_by === user.email || qrCode.owner_email === user.email;
    if (!ownerMatch && user.role !== 'admin') {
      console.error(`getScans: ownership mismatch. qr.created_by=${qrCode.created_by}, qr.owner_email=${qrCode.owner_email}, user=${user.email}`);
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.log(`getScans: fetching scans for qr_code_id=${qr_code_id}, qr.id=${qrCode.id}`);

    // Fetch all scans for this QR code using service role (bypasses RLS)
    const scans = await base44.asServiceRole.entities.Scan.filter({ qr_code_id }, '-created_date', 5000);

    return Response.json({ scans });
  } catch (error) {
    console.error('getScans error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});