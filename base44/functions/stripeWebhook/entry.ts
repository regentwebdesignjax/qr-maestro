import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.4.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
const EXTRA_DBC_PRICE_ID = 'price_1TNv2cQJqdSd3DGEgvCK2CZ2';

function getExtraDbcs(lineItems) {
  const item = lineItems?.data?.find(i => i.price?.id === EXTRA_DBC_PRICE_ID);
  return item ? (item.quantity || 0) : 0;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return Response.json({ error: 'No signature' }, { status: 400 });
  }

  let event;

  try {
    const body = await req.text();
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata.user_id;
        const period = session.metadata.period;
        const amountTotal = session.amount_total ? session.amount_total / 100 : null;

        // Fetch line items to determine extra DBC seats
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { expand: ['data.price'] });
        const extraDbcs = getExtraDbcs(lineItems);

        const users = await base44.asServiceRole.entities.User.filter({ id: userId });
        if (users.length > 0) {
          await base44.asServiceRole.entities.User.update(userId, {
            subscription_tier: 'pro',
            subscription_status: 'active',
            subscription_period: period,
            purchased_extra_dbcs: extraDbcs,
          });
        }

        await base44.asServiceRole.entities.ConversionEvent.create({
          event_type: 'upgrade_conversion',
          plan: 'black_belt',
          period: period ?? 'unknown',
          revenue: amountTotal,
          user_id: userId,
          customer_email: session.customer_email ?? null,
          stripe_session_id: session.id,
        });
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        const users = await base44.asServiceRole.entities.User.filter({ stripe_customer_id: customerId });

        if (users.length > 0) {
          const user = users[0];
          const status = subscription.status === 'active' ? 'active' :
                        subscription.status === 'past_due' ? 'past_due' : 'canceled';

          // Determine extra DBCs from subscription items
          const extraDbcs = getExtraDbcs(subscription.items);

          await base44.asServiceRole.entities.User.update(user.id, {
            subscription_status: status,
            purchased_extra_dbcs: extraDbcs,
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        const users = await base44.asServiceRole.entities.User.filter({ stripe_customer_id: customerId });

        if (users.length > 0) {
          const user = users[0];
          await base44.asServiceRole.entities.User.update(user.id, {
            subscription_tier: 'free',
            subscription_status: 'none',
            subscription_period: 'none',
            purchased_extra_dbcs: 0,
          });
        }
        break;
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});