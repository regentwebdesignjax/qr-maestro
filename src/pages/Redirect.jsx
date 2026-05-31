import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { maskUrl } from '@/lib/maskUrl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wifi, User, FileText, Share2, Music, CheckCircle, Copy, Check, ExternalLink, Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';
import BrandedLayout from '@/components/qr/BrandedLayout';
import BusinessCardDisplay from '@/components/qr/BusinessCardDisplay';
import TicketCouponDisplay from '@/components/qr/TicketCouponDisplay';
import LinkpageLanding from '@/pages/LinkpageLanding';
import BusinessPageLanding from '@/pages/BusinessPageLanding';

function parseWifi(content) {
  // Standard QR WiFi format: WIFI:S:ssid;T:WPA;P:password;;
  if (content.startsWith('WIFI:')) {
    const result = {};
    const inner = content.replace(/^WIFI:/, '').replace(/;;$/, '');
    inner.split(';').forEach(part => {
      const [k, ...rest] = part.split(':');
      const val = rest.join(':');
      if (k === 'S') result.ssid = val;
      else if (k === 'T') result.encryption = val;
      else if (k === 'P') result.password = val;
    });
    return result;
  }
  // Legacy line-based fallback
  const result = {};
  content.split('\n').forEach(line => {
    const [key, ...rest] = line.split(':');
    result[key?.trim().toLowerCase()] = rest.join(':').trim();
  });
  return result;
}

function parseVCard(content) {
  const lines = content.split('\n');
  const result = {};
  lines.forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) return;
    const rawKey = line.substring(0, colonIdx).trim().toLowerCase();
    const val = line.substring(colonIdx + 1).trim();
    // Normalize keys with parameters (e.g. "tel;type=cell" → "tel")
    const key = rawKey.split(';')[0];
    if (!result[key]) result[key] = val;
  });
  return result;
}

function IconBadge({ children, branded, className = '' }) {
  return (
    <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${branded ? 'branded-icon-bg' : 'bg-[#BB3F27]'} ${className}`}>
      <div className={branded ? 'branded-icon' : 'text-white'}>
        {children}
      </div>
    </div>
  );
}

function ActionButton({ href, onClick, children, branded, className = '' }) {
  const base = `w-full py-3 px-4 rounded-xl font-semibold text-sm tracking-wide transition-opacity hover:opacity-90 flex items-center justify-center gap-2 ${className}`;
  const colorClass = branded ? 'lp-btn' : 'bg-[#BB3F27] text-white';
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" className={`${base} ${colorClass}`}>{children}</a>;
  return <button onClick={onClick} className={`${base} ${colorClass}`}>{children}</button>;
}

function WifiDisplay({ content, branded }) {
  const wifi = parseWifi(content);
  const [copied, setCopied] = useState(false);

  const copyPassword = () => {
    navigator.clipboard.writeText(wifi.password || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Card className="w-full max-w-sm rounded-2xl shadow-md border-0">
      <CardContent className="pt-6 pb-6 space-y-5">
        <div className="flex items-center gap-4">
          <IconBadge branded={branded}>
            <Wifi className="w-7 h-7" />
          </IconBadge>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">WiFi Network</p>
            <p className="text-xl font-bold text-[#142024]">{wifi.ssid || 'Network'}</p>
          </div>
        </div>

        {wifi.encryption && wifi.encryption !== 'nopass' && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="font-medium">Security:</span>
            <span className="bg-gray-100 rounded px-2 py-0.5 font-mono text-xs">{wifi.encryption === 'WPA' ? 'WPA/WPA2' : wifi.encryption}</span>
          </div>
        )}

        {wifi.password && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Password</p>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
              <span className="flex-1 font-mono text-sm text-[#142024] break-all">{wifi.password}</span>
              <button
                onClick={copyPassword}
                className="shrink-0 p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                title="Copy password"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
          </div>
        )}

        {wifi.password && (
          <ActionButton onClick={copyPassword} branded={branded}>
            {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Password</>}
          </ActionButton>
        )}

        <p className="text-xs text-gray-400 text-center pt-1">Open Settings → Wi-Fi to connect manually</p>
      </CardContent>
    </Card>
  );
}

function VCardConfirmation({ content, branded }) {
  const vc = parseVCard(content);

  const handleSaveAgain = () => {
    const blob = new Blob([content], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${vc.fn || 'contact'}.vcf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full max-w-sm rounded-2xl shadow-md border-0">
      <CardContent className="pt-8 pb-8 flex flex-col items-center text-center space-y-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${branded ? 'branded-icon-bg' : 'bg-[#BB3F27]'}`}>
          <CheckCircle className={`w-8 h-8 ${branded ? 'branded-icon' : 'text-white'}`} />
        </div>
        <div>
          <p className="text-xl font-bold text-[#142024]">Contact Saved!</p>
          {vc.fn && <p className="text-gray-500 text-sm mt-1">{vc.fn} has been added to your contacts.</p>}
        </div>
        <ActionButton onClick={handleSaveAgain} branded={branded} className="mt-2">
          <User className="w-4 h-4" /> Save Again
        </ActionButton>
      </CardContent>
    </Card>
  );
}

function TextDisplay({ content, name, branded }) {
  return (
    <Card className="w-full max-w-sm rounded-2xl shadow-md border-0">
      <CardContent className="pt-6 pb-6 space-y-5">
        <div className="flex items-center gap-4">
          <IconBadge branded={branded}>
            <FileText className="w-7 h-7" />
          </IconBadge>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Message</p>
            <p className="text-xl font-bold text-[#142024]">{name || 'Note'}</p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl px-4 py-4">
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">{content}</p>
        </div>
      </CardContent>
    </Card>
  );
}


function SocialDisplay({ content, branded }) {
  const parseSocial = (text) => {
    const result = {};
    text.split('\n').forEach(line => {
      if (line.trim()) {
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) return;
        const platform = line.substring(0, colonIdx).trim();
        const value = line.substring(colonIdx + 1).trim();
        if (platform && value) result[platform] = value;
      }
    });
    return result;
  };

  const getUrl = (platform, handle) => {
    if (handle.startsWith('http://') || handle.startsWith('https://')) return handle;
    const cleanHandle = handle.replace(/^@/, '');
    const platformUrls = {
      facebook: `https://facebook.com/${cleanHandle}`,
      instagram: `https://instagram.com/${cleanHandle}`,
      x: `https://x.com/${cleanHandle}`,
      linkedin: `https://linkedin.com/in/${cleanHandle}`,
      youtube: `https://youtube.com/@${cleanHandle}`,
      tiktok: `https://tiktok.com/@${cleanHandle}`,
      threads: `https://threads.net/@${cleanHandle}`,
      telegram: `https://t.me/${cleanHandle}`,
      rss: handle,
      podcast: handle,
      website: handle.includes('.') ? `https://${cleanHandle}` : `https://${cleanHandle}.com`,
      blog: handle.includes('.') ? `https://${cleanHandle}` : `https://${cleanHandle}.com`,
    };
    return platformUrls[platform] || `https://${platform}.com/${cleanHandle}`;
  };

  const PLATFORM_META = {
    facebook: { label: 'Facebook', icon: Facebook, color: '#1877F2' },
    instagram: { label: 'Instagram', icon: Instagram, color: '#E1306C' },
    linkedin: { label: 'LinkedIn', icon: Linkedin, color: '#0A66C2' },
    youtube: { label: 'YouTube', icon: Youtube, color: '#FF0000' },
    x: { label: 'X (Twitter)', icon: null, color: '#000000' },
    tiktok: { label: 'TikTok', icon: null, color: '#010101' },
    threads: { label: 'Threads', icon: null, color: '#000000' },
    telegram: { label: 'Telegram', icon: null, color: '#0088CC' },
  };

  const social = parseSocial(content);

  return (
    <Card className="w-full max-w-sm rounded-2xl shadow-md border-0">
      <CardContent className="pt-6 pb-6 space-y-5">
        <div className="flex items-center gap-4">
          <IconBadge branded={branded}>
            <Share2 className="w-7 h-7" />
          </IconBadge>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Follow Us</p>
            <p className="text-xl font-bold text-[#142024]">Social Links</p>
          </div>
        </div>
        <div className="space-y-2.5">
          {Object.entries(social).map(([platform, handle]) => {
            const isCustom = platform.startsWith('custom_');
            const displayLabel = isCustom ? platform.replace('custom_', '') : (PLATFORM_META[platform]?.label || platform);
            const displayUrl = isCustom ? handle : getUrl(platform, handle);
            const meta = PLATFORM_META[platform];
            const IconComp = meta?.icon;
            const accentColor = branded ? undefined : (meta?.color || '#BB3F27');
            return (
              <a
                key={platform}
                href={displayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 ${branded ? 'lp-btn' : 'text-white'}`}
                style={branded ? undefined : { backgroundColor: accentColor }}
              >
                {IconComp
                  ? <IconComp className="w-5 h-5 shrink-0" />
                  : <ExternalLink className="w-5 h-5 shrink-0" />}
                <span className="capitalize">{displayLabel}</span>
              </a>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function CouponDisplay({ content, branded, design_config }) {
  // Parse coupon content - handle both new JSON format and legacy string format
  let couponData;
  if (typeof content === 'string') {
    try {
      couponData = JSON.parse(content);
    } catch {
      // Legacy format: just the coupon code string
      couponData = content;
    }
  } else {
    couponData = content;
  }

  return <TicketCouponDisplay couponData={couponData} branded={branded} design_config={design_config} />;
}


function MP3Display({ content, branded, design_config = {} }) {
  const safeUrl = maskUrl(content);
  const accentColor = design_config.landing_theme_color || '#BB3F27';
  return (
    <Card className="w-full max-w-sm rounded-2xl shadow-md border-0">
      <CardContent className="pt-6 pb-6 space-y-5">
        <div className="flex items-center gap-4">
          <IconBadge branded={branded}>
            <Music className="w-7 h-7" />
          </IconBadge>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Audio Track</p>
            <p className="text-xl font-bold text-[#142024]">Listen</p>
          </div>
        </div>
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: `${accentColor}18` }}
        >
          <audio
            controls
            className="w-full"
            style={{ accentColor }}
          >
            <source src={safeUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      </CardContent>
    </Card>
  );
}


export default function Redirect() {
  const [state, setState] = useState({ status: 'loading', data: null });

  useEffect(() => {
    const run = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (!code) {
        window.location.href = '/';
        return;
      }

      // Fetch geo from browser (has real user IP) and pass to backend
      let geoPayload = {};
      try {
        const geoRes = await fetch('http://ip-api.com/json/?fields=status,countryCode,regionName,city,lat,lon');
        const geoData = await geoRes.json();
        if (geoData.status === 'success') {
          geoPayload = {
            geo_country: geoData.countryCode,
            geo_city: geoData.city,
            geo_state: geoData.regionName,
            geo_lat: geoData.lat,
            geo_lng: geoData.lon,
          };
        }
      } catch (_) {}

      try {
        const response = await base44.functions.invoke('redirect', { code, ...geoPayload });
        const data = response?.data;

        if (!data) { window.location.href = '/'; return; }

        if (data.content_type === 'url') {
          window.location.href = data.url;
          return;
        }

        if (data.content_type === 'inactive') {
          setState({ status: 'inactive', data });
          return;
        }

        // Direct redirects — no landing page needed
        if (data.content_type === 'pdf') {
          window.location.href = maskUrl(data.content);
          return;
        }
        if (data.content_type === 'image') {
          window.location.href = maskUrl(data.content);
          return;
        }
        if (data.content_type === 'call') {
          window.location.href = `tel:${data.content.trim()}`;
          return;
        }
        if (data.content_type === 'sms') {
          window.location.href = `sms:${data.content.trim()}`;
          return;
        }
        if (data.content_type === 'vcard') {
          // Auto-download the .vcf then show confirmation screen
          const vc = parseVCard(data.content);
          const blob = new Blob([data.content], { type: 'text/vcard' });
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `${vc.fn || 'contact'}.vcf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
          setState({ status: 'display', data });
          return;
        }

        // Parse business card JSON content
        if (data.content_type === 'business_card') {
          try {
            data.bc = JSON.parse(data.content);
          } catch {
            data.bc = {};
          }
          // Attach owner info for lead capture
          data.bc.owner_email = data.owner_email || '';
          data.bc.qr_code_id = data.id || '';
        }

        // Parse linkpage JSON content
        if (data.content_type === 'linkpages') {
          try {
            data.linkpage = JSON.parse(data.content);
          } catch {
            data.linkpage = {};
          }
          // Attach QR code ID for tracking
          data.linkpage.qrCodeId = data.id || '';
        }

        setState({ status: 'display', data });
      } catch (error) {
        console.error('Redirect error:', error);
        const serverError = error.response?.data?.error;
        let msg = 'This QR Code has not been saved yet, or it no longer exists. Please save it in your dashboard to activate the link.';
        if (serverError === 'QR code is inactive') {
          msg = 'This professional identity is currently resting. Please contact the owner to reactivate.';
        }
        setState({
          status: 'inactive',
          data: { message: msg }
        });
      }
    };

    run();
  }, []);

  if (state.status === 'inactive') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🥋</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Card Inactive</h2>
          <p className="text-gray-500 text-sm">{state.data?.message || 'This professional identity is currently resting. Please contact the owner to reactivate.'}</p>
        </div>
      </div>
    );
  }

  if (state.status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  const { data } = state;
  const dc = data.design_config || {};
  const branded = !!(dc.landing_header_image || dc.landing_brand_logo || dc.landing_theme_color);
  const btnBg = dc.landing_button_bg || dc.landing_theme_color || '#BB3F27';
  const btnText = dc.landing_button_text || '#ffffff';
  const darkenHex = (hex, pct = 15) => {
    const c = (hex || '#BB3F27').replace('#', '');
    const factor = 1 - pct / 100;
    const r = Math.max(0, Math.round(parseInt(c.substring(0,2), 16) * factor));
    const g = Math.max(0, Math.round(parseInt(c.substring(2,4), 16) * factor));
    const b = Math.max(0, Math.round(parseInt(c.substring(4,6), 16) * factor));
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
  };

  // Business card gets its own full-page display
  if (data.content_type === 'business_card') {
    return <BusinessCardDisplay data={{ ...data.bc, design_config: dc }} />;
  }

  // Linkpage gets its own full-page display
  if (data.content_type === 'linkpages') {
    return <LinkpageLanding initialData={data.linkpage} qrCodeId={data.id} shortCode={data.short_code} />;
  }

  // Business page gets its own full-page display
  if (data.content_type === 'business_page') {
    return <BusinessPageLanding data={data} />;
  }

  return (
    <BrandedLayout designConfig={dc}>
      <style>{`.lp-btn { background-color: ${btnBg} !important; color: ${btnText} !important; } .lp-btn:hover { background-color: ${darkenHex(btnBg)} !important; }`}</style>
      {data.content_type === 'wifi' && <WifiDisplay content={data.content} branded={branded} />}
      {data.content_type === 'vcard' && <VCardConfirmation content={data.content} branded={branded} />}
      {data.content_type === 'text' && <TextDisplay content={data.content} name={data.name} branded={branded} />}
      {data.content_type === 'social' && <SocialDisplay content={data.content} branded={branded} />}
      {data.content_type === 'coupon' && <CouponDisplay content={data.content} branded={branded} design_config={dc} />}
      {data.content_type === 'mp3' && <MP3Display content={data.content} branded={branded} design_config={dc} />}
    </BrandedLayout>
  );
}