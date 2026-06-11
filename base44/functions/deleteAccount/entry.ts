import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@17.4.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Cancel active Stripe subscriptions
    if (user.stripe_customer_id) {
      const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripe_customer_id,
        status: 'active',
      });
      for (const sub of subscriptions.data) {
        await stripe.subscriptions.cancel(sub.id);
      }
    }

    const service = base44.asServiceRole.entities;

    // 2. Delete user's data
    const qrCodes = await service.QRCode.filter({ owner_email: user.email });
    for (const qr of qrCodes) {
      const scans = await service.Scan.filter({ qr_code_id: qr.id });
      for (const scan of scans) {
        await service.Scan.delete(scan.id);
      }
      await service.QRCode.delete(qr.id);
    }

    const leads = await service.Lead.filter({ user_email: user.email });
    for (const lead of leads) {
      await service.Lead.delete(lead.id);
    }

    const folders = await service.Folder.filter({ user_email: user.email });
    for (const folder of folders) {
      await service.Folder.delete(folder.id);
    }

    const qrFolders = await service.QRFolder.filter({ user_email: user.email });
    for (const qf of qrFolders) {
      await service.QRFolder.delete(qf.id);
    }

    const domains = await service.CustomDomain.filter({ user_email: user.email });
    for (const domain of domains) {
      await service.CustomDomain.delete(domain.id);
    }

    // 3. Delete the user account itself
    await service.User.delete(user.id);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});