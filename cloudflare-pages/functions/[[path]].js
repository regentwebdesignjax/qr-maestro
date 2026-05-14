/**
 * Cloudflare Pages Function — QR Sensei custom domain redirect handler.
 *
 * This Pages project is deployed as the HTTP origin for Cloudflare for SaaS.
 * CF for SaaS makes a direct TCP connection to customers.qr-sensei.com
 * (this Pages project's custom domain) when routing custom hostname scans.
 * Because Pages Functions are a real HTTP server (not a Worker Route), the
 * TCP connection succeeds and this Function runs.
 *
 * Flow: qrs.myenvelopepro.com/abc123
 *   → CF for SaaS (TLS, cert provisioning)
 *   → TCP origin request to customers.qr-sensei.com (this Pages project)
 *   → This Function → 302 → qr-sensei.com/r?code=abc123
 *   → React app → redirect function → final destination
 *
 * Deploy steps:
 *   1. Workers & Pages → Create → Pages → Connect to Git (or Direct Upload)
 *      - Root directory: cloudflare-pages
 *      - Build command: (none)
 *      - Build output directory: public
 *   2. After first deploy, go to Settings → Custom Domains → Add
 *      customers.qr-sensei.com
 *   3. In Workers & Pages → qr-redirect → Settings → Domains & Routes,
 *      remove customers.qr-sensei.com as a Worker Custom Domain if it is
 *      still listed there (only one resource can own the custom domain).
 */

export function onRequest(context) {
  const url = new URL(context.request.url);

  // Extract short_code from path: /abc123 → abc123
  const shortCode = url.pathname.replace(/^\//, '').split('/')[0];

  if (!shortCode) {
    return Response.redirect('https://qr-sensei.com/', 302);
  }

  return Response.redirect(
    `https://qr-sensei.com/r?code=${encodeURIComponent(shortCode)}`,
    302
  );
}
