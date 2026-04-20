/**
 * Replaces base44 infrastructure domains with the custom domain qr-sensei.com
 * so no "base44" branding appears in public-facing URLs.
 */
export function maskUrl(url) {
  if (!url || typeof url !== 'string') return url;
  // Replace any base44 media/storage domain
  return url
    .replace(/https?:\/\/media\.base44\.app/g, 'https://qr-sensei.com')
    .replace(/https?:\/\/media\.base44\.com/g, 'https://qr-sensei.com')
    .replace(/https?:\/\/[a-z0-9-]+\.base44\.app/g, 'https://qr-sensei.com')
    .replace(/https?:\/\/[a-z0-9-]+\.base44\.com/g, 'https://qr-sensei.com');
}