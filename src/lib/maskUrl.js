/**
 * Replaces base44 infrastructure domains with the qr-sensei.com storage proxy
 * path so no "base44" branding appears in public-facing URLs or browser bars.
 * The /storage/* path is handled by the Cloudflare Worker, which streams the
 * file from media.base44.com transparently.
 */
export function maskUrl(url) {
  if (!url || typeof url !== 'string') return url;
  // Replace any base44 media/storage domain with the proxy prefix
  return url
    .replace(/https?:\/\/media\.base44\.app/g, 'https://qr-sensei.com/storage')
    .replace(/https?:\/\/media\.base44\.com/g, 'https://qr-sensei.com/storage')
    .replace(/https?:\/\/[a-z0-9-]+\.base44\.app/g, 'https://qr-sensei.com/storage')
    .replace(/https?:\/\/[a-z0-9-]+\.base44\.com/g, 'https://qr-sensei.com/storage');
}
