import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Chatbot-safe function: allows the AI agent to read the current user's subscription
// status and generate a checkout URL for upgrades. Does NOT allow modifying subscription
// data directly — that remains admin-only via updateUserSubscription.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body = {};
    try { body = await req.json(); } catch (_) {}

    const { action } = body;

    // READ: return current user's subscription status
    if (action === 'get_subscription') {
      return Response.json({
        subscription_tier: user.subscription_tier || 'free',
        subscription_status: user.subscription_status || null,
        subscription_period: user.subscription_period || null,
        custom_domain_addon: user.custom_domain_addon || false,
        trial_end_date: user.trial_end_date || null,
        plan_label: user.subscription_tier === 'grand_master'
          ? 'Grand Master'
          : ['black_belt', 'grand_master'].includes(user.subscription_tier)
            ? 'Black Belt'
            : 'White Belt (Free)',
        is_black_belt: ['black_belt', 'grand_master'].includes(user.subscription_tier),
      });
    }

    // CHECKOUT: generate a Stripe checkout URL for upgrading
    if (action === 'get_checkout_url') {
      const { period, total_seats, include_custom_domain } = body;

      if (!period || !['monthly', 'annual'].includes(period)) {
        return Response.json({ error: 'period must be "monthly" or "annual"' }, { status: 400 });
      }

      // Delegate to the existing createCheckoutSession function
      const response = await base44.asServiceRole.functions.invoke('createCheckoutSession', {
        period,
        total_seats: total_seats || 10,
        include_custom_domain: !!include_custom_domain,
      });

      return Response.json({ checkout_url: response?.url || null });
    }

    // BILLING PORTAL: instruct the client to open the portal
    if (action === 'get_billing_portal_info') {
      return Response.json({
        message: 'To manage your subscription, please go to Account Settings and click "Manage Billing". This opens your Stripe billing portal where you can change seats, update payment methods, or cancel.',
      });
    }

    return Response.json({ error: 'Unknown action. Supported: get_subscription, get_checkout_url, get_billing_portal_info' }, { status: 400 });

  } catch (error) {
    console.error('chatSubscriptionManager error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});