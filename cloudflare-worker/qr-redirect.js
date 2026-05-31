/**
 * QR Sensei — Cloudflare Worker: Custom Domain Redirect Handler
 *
 * Architecture: Worker as Fallback Origin (Workers Paid, no enterprise required)
 *
 * How routing works:
 *   1. customers.qr-sensei.com is the CF for SaaS fallback origin.
 *      Its DNS record is AAAA 100:: (originless, proxied) — it is never
 *      TCP-connected; the Worker Route intercepts before any connection is made.
 *   2. Worker Route */* on the qr-sensei.com zone routes ALL zone traffic
 *      here, including CF for SaaS custom hostname requests.
 *   3. This Worker checks the Host header:
 *      - qr-sensei.com / *.qr-sensei.com → pass through to normal origin (app)
 *      - anything else (customer custom hostname) → 302 redirect
 *
 * Cloudflare Dashboard setup (one-time):
 *   1. Workers & Pages → qr-redirect → Settings → Domains & Routes
 *      - Remove "customers.qr-sensei.com" from Custom Domains if present
 *   2. DNS → delete any A/CNAME for "customers", add:
 *        Type: AAAA  Name: customers  IPv6: 100::  Proxy: Proxied
 *   3. Workers & Pages → qr-redirect → Settings → Domains & Routes → Add Route
 *        Pattern: */*   Zone: qr-sensei.com
 *   4. SSL/TLS → Custom Hostnames → Fallback Origin: customers.qr-sensei.com
 *
 * Deploy: Workers & Pages → qr-redirect → Edit Code → paste this file → Deploy
 */

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const host = url.hostname;

    // Media storage proxy — intercept /storage/* on qr-sensei.com and stream
    // the file from media.base44.com so the base44 domain never appears in
    // the browser address bar or in response headers visible to the end user.
    if ((host === 'qr-sensei.com' || host.endsWith('.qr-sensei.com')) && url.pathname.startsWith('/storage/')) {
      const upstreamPath = url.pathname.slice('/storage'.length); // preserve leading /
      const upstreamUrl = `https://media.base44.com${upstreamPath}${url.search}`;

      // Check Cloudflare's edge cache first
      const cache = caches.default;
      const cacheKey = new Request(upstreamUrl, { method: 'GET' });
      const cached = await cache.match(cacheKey);
      if (cached) return cached;

      const upstream = await fetch(upstreamUrl, {
        cf: { cacheTtl: 86400, cacheEverything: true },
      });

      // Forward the response with clean headers (no base44 server fingerprints)
      const headers = new Headers(upstream.headers);
      headers.delete('x-powered-by');
      headers.delete('server');

      const proxyResponse = new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers,
      });

      if (upstream.ok) {
        await cache.put(cacheKey, proxyResponse.clone());
      }

      return proxyResponse;
    }

    // Pass through all qr-sensei.com zone traffic to the normal origin (React app)
    if (host === 'qr-sensei.com' || host.endsWith('.qr-sensei.com')) {
      return fetch(request);
    }

    // Custom hostname traffic (e.g. qrs.myenvelopepro.com) — extract short_code from path
    const shortCode = url.pathname.replace(/^\//, '').split('/')[0];

    if (!shortCode) {
      return Response.redirect('https://qr-sensei.com/', 302);
    }

    return Response.redirect(
      `https://qr-sensei.com/r?code=${encodeURIComponent(shortCode)}`,
      302
    );
  },
};
