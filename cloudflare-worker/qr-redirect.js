/**
 * QR Sensei — Cloudflare Worker: Custom Domain Redirect Handler
 *
 * Deploy to: Workers & Pages → qr-redirect → Edit Code → paste this file.
 *
 * This Worker handles direct requests to customers.qr-sensei.com (e.g., for
 * testing). It is NOT responsible for routing custom-domain scans —
 * a Cloudflare Redirect Rule in the qr-sensei.com zone handles that path.
 *
 * Cloudflare Redirect Rule (create once in qr-sensei.com zone → Rules →
 * Redirect Rules):
 *   Name:       Custom Domain QR Redirect
 *   Expression: (not ends_with(http.host, "qr-sensei.com"))
 *   Type:       Dynamic redirect  •  Status: 302
 *   URL:        concat("https://qr-sensei.com/r?code=", substring(http.request.uri.path, 1))
 *   Preserve query string: off
 *
 * Why a Redirect Rule and not this Worker?
 * CF for SaaS routes custom hostname traffic (Host: customer.example.com) to
 * the custom_origin_server via a direct TCP connection. Worker Routes and Worker
 * Custom Domains match by Host header, so they never fire for custom hostname
 * traffic (host mismatch). Redirect Rules evaluate before any origin connection
 * and DO match CF for SaaS custom hostname requests, making them the correct
 * tool for this routing problem.
 */

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Extract short_code from path: /abc123 → abc123
    const shortCode = url.pathname.replace(/^\//, '').split('/')[0];

    if (!shortCode) {
      return Response.redirect('https://qr-sensei.com/', 302);
    }

    // Redirect to the main app's public redirect route.
    // The /r?code= route loads the React app which calls the redirect
    // function and then navigates to the destination — handling all
    // content types (URL, vCard, WiFi, business card, etc.) correctly.
    return Response.redirect(
      `https://qr-sensei.com/r?code=${encodeURIComponent(shortCode)}`,
      302
    );
  },
};
