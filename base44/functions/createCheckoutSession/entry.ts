import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.4.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const DBC_PRICE_MONTHLY = 'price_1TNv2cQJqdSd3DGEgvCK2CZ2';
const DBC_PRICE_ANNUAL  = 'price_1TNvFWQJqdSd3DGEGflRsrcM';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { period, total_seats } = await req.json();

    const basePriceId = period === 'monthly'
      ? Deno.env.get('PRICE_ID_MONTHLY')
      : Deno.env.get('PRICE_ID_ANNUAL');

    const extraDbcPriceId = period === 'annual' ? DBC_PRICE_ANNUAL : DBC_PRICE_MONTHLY;

    // Ensure customer exists
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      await base44.auth.updateMe({ stripe_customer_id: customerId });
    }

    // Build line items
    const lineItems = [{ price: basePriceId, quantity: 1 }];

    const seats = total_seats || 10;
    if (seats > 10) {
      lineItems.push({
        price: extraDbcPriceId,
        quantity: seats - 10,
        adjustable_quantity: { enabled: true, minimum: 1 },
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: `${req.headers.get('origin') || 'https://app.base44.app'}/Dashboard?success=true`,
      cancel_url: `${req.headers.get('origin') || 'https://app.base44.app'}/Pricing?canceled=true`,
      metadata: { user_id: user.id, period },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});