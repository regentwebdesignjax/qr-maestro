import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.4.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

const DBC_PRICE_IDS = new Set(['price_1TNv2cQJqdSd3DGEgvCK2CZ2', 'price_1TNvFWQJqdSd3DGEGflRsrcM']);
const CUSTOM_DOMAIN_PRICE_IDS = new Set(['price_1TVEhkQJqdSd3DGEtdZwvKpe', 'price_1TVEi3QJqdSd3DGEpemwH33m']);

const CF_API = 'https://api.cloudflare.com/client/v4';

function getExtraDbcs(lineItems) {
  const item = lineItems?.data?.find(i => DBC_PRICE_IDS.has(i.price?.id));
  return item ? (item.quantity || 0) : 0;
}

function hasCustomDomainAddon(lineItems) {
  return lineItems?.data?.some(i => CUSTOM_DOMAIN_PRICE_IDS.has(i.price?.id)) ?? false;
}

async function deactivateCustomDomain(base44ServiceRole: any, userEmail: string) {
  const apiToken = Deno.env.get('CLOUDFLARE_API_TOKEN');
  const zoneId = Deno.env.get('CLOUDFLARE_ZONE_ID');

  const domains = await base44ServiceRole.entities.CustomDomain.filter({ user_email: userEmail });
  for (const domain of domains) {
    if (domain.status === 'deactivated') continue;
    if (domain.cf_custom_hostname_id && apiToken && zoneId) {
      await fetch(`${CF_API}/zones/${zoneId}/custom_hostnames/${domain.cf_custom_hostname_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${apiToken}` },
      }).catch((e) => console.error('CF delete error:', e.message));
    }
    await base44ServiceRole.entities.CustomDomain.update(domain.id, { status: 'deactivated' })
      .catch((e) => console.error('Domain deactivate error:', e.message));
  }
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
        const includesCustomDomain = session.metadata.include_custom_domain === 'true';

        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { expand: ['data.price'] });
        const extraDbcs = getExtraDbcs(lineItems);

        const users = await base44.asServiceRole.entities.User.filter({ id: userId });
        if (users.length > 0) {
          await base44.asServiceRole.entities.User.update(userId, {
            subscription_tier: 'pro',
            subscription_status: 'active',
            subscription_period: period,
            purchased_extra_dbcs: extraDbcs,
            ...(includesCustomDomain && {
              custom_domain_addon: true,
              custom_domain_addon_period: period,
            }),
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
          const extraDbcs = getExtraDbcs(subscription.items);
          const addonActive = hasCustomDomainAddon(subscription.items);

          const wasAddonActive = user.custom_domain_addon === true;
          const addonJustRemoved = wasAddonActive && !addonActive;

          await base44.asServiceRole.entities.User.update(user.id, {
            subscription_status: status,
            purchased_extra_dbcs: extraDbcs,
            custom_domain_addon: addonActive,
            ...(!addonActive && { custom_domain_addon_period: 'none' }),
          });

          if (addonJustRemoved) {
            await deactivateCustomDomain(base44.asServiceRole, user.email);
          }
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
            custom_domain_addon: false,
            custom_domain_addon_period: 'none',
          });
          await deactivateCustomDomain(base44.asServiceRole, user.email);
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
