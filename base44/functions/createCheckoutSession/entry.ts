import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.4.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const DBC_PRICE_MONTHLY   = 'price_1TNv2cQJqdSd3DGEgvCK2CZ2';
const DBC_PRICE_ANNUAL    = 'price_1TNvFWQJqdSd3DGEGflRsrcM';
const GM_PRICE_MONTHLY    = 'price_1TnpcVQJqdSd3DGEU7IHrfXu';
const GM_PRICE_ANNUAL     = 'price_1TnpeiQJqdSd3DGEXMWPIP8P';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan = 'black_belt', period, total_seats } = await req.json();

    const isAnnual = period === 'annual';
    const isGrandMaster = plan === 'grand_master';

    const basePriceId = isGrandMaster
      ? (isAnnual ? GM_PRICE_ANNUAL : GM_PRICE_MONTHLY)
      : (isAnnual ? Deno.env.get('PRICE_ID_ANNUAL') : Deno.env.get('PRICE_ID_MONTHLY'));

    const extraDbcPriceId = isAnnual ? DBC_PRICE_ANNUAL : DBC_PRICE_MONTHLY;

    // Ensure customer exists
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      try {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { user_id: user.id },
        });
        customerId = customer.id;
        await base44.auth.updateMe({ stripe_customer_id: customerId });
        console.log(`[createCheckoutSession] Created Stripe customer ${customerId} for user ${user.id}`);
      } catch (error) {
        console.error('[createCheckoutSession] Error creating Stripe customer:', error.message);
        throw new Error(`Failed to create Stripe customer: ${error.message}`);
      }
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
      allow_promotion_codes: true,
      success_url: `${req.headers.get('origin') || 'https://app.base44.app'}/Dashboard?success=true`,
      cancel_url: `${req.headers.get('origin') || 'https://app.base44.app'}/Pricing?canceled=true`,
      metadata: { user_id: user.id, plan, period },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
