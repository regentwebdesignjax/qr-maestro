/**
 * QR Sensei — External Redirect Origin Server
 *
 * Deploy this on Fly.io (free tier) as the custom_origin_server for
 * Cloudflare for SaaS custom hostnames.
 *
 * Why this exists:
 *   Attaching a Worker directly to a CF for SaaS custom hostname (the "worker"
 *   field on the Custom Hostnames API) requires Cloudflare Workers for Platforms
 *   — an enterprise add-on not included in Workers Paid ($5/month). Fly.io
 *   provides a real TCP-accessible HTTP server that CF for SaaS can connect to
 *   without needing that enterprise feature.
 *
 * Flow when a QR code is scanned:
 *   qrs.myenvelopepro.com/abc123
 *     → CF for SaaS (TLS, cert)
 *     → TCP to this Fly.io server (custom_origin_server)
 *     → 302 → https://qr-sensei.com/r?code=abc123
 *     → React app → redirect function → final destination
 *
 * Deploy steps:
 *   1. Install flyctl: https://fly.io/docs/hands-on/install-flyctl/
 *   2. fly auth signup (free)
 *   3. cd fly-redirect-origin
 *   4. fly launch --name qr-sensei-redirect --region iad --no-deploy
 *   5. fly deploy
 *   6. Note the app hostname: qr-sensei-redirect.fly.dev
 *   7. In Base44 dashboard → Environment Secrets, set:
 *        CLOUDFLARE_FALLBACK_ORIGIN = qr-sensei-redirect.fly.dev
 *   8. In the app → Custom Domains → Refresh Status
 */

const port = parseInt(Deno.env.get('PORT') || '8080');

Deno.serve({ port }, (req) => {
  const url = new URL(req.url);

  // Extract short_code from path: /abc123 → abc123
  const shortCode = url.pathname.replace(/^\//, '').split('/')[0];

  if (!shortCode) {
    return Response.redirect('https://qr-sensei.com/', 302);
  }

  return Response.redirect(
    `https://qr-sensei.com/r?code=${encodeURIComponent(shortCode)}`,
    302
  );
});
