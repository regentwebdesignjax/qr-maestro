import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.4.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { period } = await req.json();

    const priceId = period === 'monthly' 
      ? Deno.env.get('PRO_MONTHLY_ID')
      : Deno.env.get('PRO_ANNUAL_ID');

    // Check if user already has a Stripe customer ID
    let customerId = user.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      });
      customerId = customer.id;

      // Update user with Stripe customer ID
      await base44.auth.updateMe({ stripe_customer_id: customerId });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.get('origin') || 'https://app.base44.app'}/Dashboard?success=true`,
      cancel_url: `${req.headers.get('origin') || 'https://app.base44.app'}/Pricing?canceled=true`,
      metadata: {
        user_id: user.id,
        period: period,
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});