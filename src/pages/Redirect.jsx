import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wifi, User, FileText, Share2, Tag, Image, Music, Phone, MessageCircle, Link as LinkIcon } from 'lucide-react';
import BrandedLayout from '@/components/qr/BrandedLayout';
import BusinessCardDisplay from '@/components/qr/BusinessCardDisplay';

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
    const [key, ...rest] = line.split(':');
    result[key?.trim().toLowerCase()] = rest.join(':').trim();
  });
  return result;
}

function WifiDisplay({ content, branded }) {
  const wifi = parseWifi(content);
  return (
    <Card className="max-w-sm w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${branded ? 'branded-icon-bg' : 'bg-blue-50'}`}>
            <Wifi className={`w-6 h-6 ${branded ? 'branded-icon' : 'text-blue-600'}`} />
          </div>
          <CardTitle>WiFi Network</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {wifi.ssid && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Network Name</p>
            <p className="text-lg font-semibold">{wifi.ssid}</p>
          </div>
        )}
        {wifi.password && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Password</p>
            <p className="text-lg font-mono bg-gray-100 px-3 py-1 rounded">{wifi.password}</p>
          </div>
        )}
        {wifi.encryption && wifi.encryption !== 'nopass' && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Security</p>
            <p className="font-medium">{wifi.encryption === 'WPA' ? 'WPA/WPA2' : wifi.encryption}</p>
          </div>
        )}
        <p className="text-xs text-gray-400 pt-2">Go to Settings → WiFi to connect manually</p>
      </CardContent>
    </Card>
  );
}

function VCardDisplay({ content, branded }) {
  const vc = parseVCard(content);
  
  const handleSaveContact = () => {
    const link = document.createElement('a');
    link.href = 'data:text/vcard;base64,' + btoa(content);
    link.download = `${vc.fn || 'contact'}.vcf`;
    link.click();
  };

  return (
    <Card className="max-w-sm w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${branded ? 'branded-icon-bg' : 'bg-purple-50'}`}>
            <User className={`w-6 h-6 ${branded ? 'branded-icon' : 'text-purple-600'}`} />
          </div>
          <CardTitle>Contact Info</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {vc.fn && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Name</p>
            <p className="text-lg font-semibold">{vc.fn}</p>
          </div>
        )}
        {vc.tel && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Phone</p>
            <a href={`tel:${vc.tel}`} className="text-blue-600 font-medium">{vc.tel}</a>
          </div>
        )}
        {vc.email && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Email</p>
            <a href={`mailto:${vc.email}`} className="text-blue-600 font-medium">{vc.email}</a>
          </div>
        )}
        {vc.org && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Company</p>
            <p className="font-medium">{vc.org}</p>
          </div>
        )}
        {vc.url && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Website</p>
            <a href={vc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:underline">{vc.url}</a>
          </div>
        )}
        <button onClick={handleSaveContact} className={`w-full px-4 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity mt-4 ${branded ? 'branded-action-btn' : 'bg-primary text-white'}`}>
          Save Contact
        </button>
      </CardContent>
    </Card>
  );
}

function TextDisplay({ content, name, branded }) {
  return (
    <Card className="max-w-sm w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${branded ? 'branded-icon-bg' : 'bg-green-50'}`}>
            <FileText className={`w-6 h-6 ${branded ? 'branded-icon' : 'text-green-600'}`} />
          </div>
          <CardTitle>{name || 'Message'}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 whitespace-pre-wrap">{content}</p>
      </CardContent>
    </Card>
  );
}

function PDFDisplay({ content, name, branded }) {
  return (
    <Card className="max-w-sm w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${branded ? 'branded-icon-bg' : 'bg-red-50'}`}>
            <FileText className={`w-6 h-6 ${branded ? 'branded-icon' : 'text-red-600'}`} />
          </div>
          <CardTitle>PDF Document</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <a href={content} target="_blank" rel="noopener noreferrer" className={`inline-block px-4 py-2 rounded-lg font-medium hover:opacity-90 ${branded ? 'branded-action-btn' : 'bg-primary text-white'}`}>
          Open PDF
        </a>
      </CardContent>
    </Card>
  );
}

function SocialDisplay({ content, branded }) {
  const parseSocial = (text) => {
    const result = {};
    text.split('\n').forEach(line => {
      if (line.trim()) {
        const [platform, value] = line.split(':').map(s => s.trim());
        if (platform && value) result[platform] = value;
      }
    });
    return result;
  };

  const getUrl = (platform, handle) => {
    if (handle.startsWith('http://') || handle.startsWith('https://')) {
      return handle;
    }
    // Remove @ prefix if present for platforms that use it
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

  const KNOWN_PLATFORMS = ['facebook', 'instagram', 'x', 'linkedin', 'youtube', 'tiktok', 'threads', 'telegram', 'rss', 'podcast', 'website', 'blog'];
  const social = parseSocial(content);

  return (
    <Card className="max-w-sm w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${branded ? 'branded-icon-bg' : 'bg-blue-50'}`}>
            <Share2 className={`w-6 h-6 ${branded ? 'branded-icon' : 'text-blue-600'}`} />
          </div>
          <CardTitle>Social Links</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {Object.entries(social).map(([platform, handle]) => {
          const isCustom = platform.startsWith('custom_');
          const displayLabel = isCustom ? platform.replace('custom_', '') : platform;
          const displayUrl = isCustom ? handle : getUrl(platform, handle);
          const isKnown = KNOWN_PLATFORMS.includes(platform);
          return (
            <a
              key={platform}
              href={displayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {(!isKnown || isCustom) && (
                <LinkIcon className="w-4 h-4 text-gray-400 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 capitalize font-medium">{displayLabel}</p>
                <p className="text-sm text-gray-700 hover:text-primary font-medium break-words">{handle}</p>
              </div>
            </a>
          );
        })}
      </CardContent>
    </Card>
  );
}

function CouponDisplay({ content, branded }) {
  return (
    <Card className="max-w-sm w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${branded ? 'branded-icon-bg' : 'bg-yellow-50'}`}>
            <Tag className={`w-6 h-6 ${branded ? 'branded-icon' : 'text-yellow-600'}`} />
          </div>
          <CardTitle>Coupon Code</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Use code</p>
          <p className="text-4xl font-bold text-primary">{content}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ImageDisplay({ content, branded }) {
  return (
    <Card className="max-w-md w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${branded ? 'branded-icon-bg' : 'bg-purple-50'}`}>
            <Image className={`w-6 h-6 ${branded ? 'branded-icon' : 'text-purple-600'}`} />
          </div>
          <CardTitle>Image</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <img src={content} alt="Shared" className="w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

function MP3Display({ content, branded }) {
  return (
    <Card className="max-w-sm w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${branded ? 'branded-icon-bg' : 'bg-indigo-50'}`}>
            <Music className={`w-6 h-6 ${branded ? 'branded-icon' : 'text-indigo-600'}`} />
          </div>
          <CardTitle>Audio</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <audio controls className="w-full">
          <source src={content} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      </CardContent>
    </Card>
  );
}

function CallDisplay({ content, branded }) {
  return (
    <Card className="max-w-sm w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${branded ? 'branded-icon-bg' : 'bg-green-50'}`}>
            <Phone className={`w-6 h-6 ${branded ? 'branded-icon' : 'text-green-600'}`} />
          </div>
          <CardTitle>Call</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-gray-600 mb-3">Tap to call</p>
        <a href={`tel:${content}`} className={`inline-block px-6 py-3 rounded-lg font-medium hover:opacity-90 ${branded ? 'branded-action-btn' : 'bg-primary text-white'}`}>
          {content}
        </a>
      </CardContent>
    </Card>
  );
}

function SMSDisplay({ content, branded }) {
  return (
    <Card className="max-w-sm w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${branded ? 'branded-icon-bg' : 'bg-blue-50'}`}>
            <MessageCircle className={`w-6 h-6 ${branded ? 'branded-icon' : 'text-blue-600'}`} />
          </div>
          <CardTitle>Send SMS</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-gray-600 mb-3">Tap to send a text message</p>
        <a href={`sms:${content}`} className={`inline-block px-6 py-3 rounded-lg font-medium hover:opacity-90 ${branded ? 'branded-action-btn' : 'bg-primary text-white'}`}>
          {content}
        </a>
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

      try {
        const response = await base44.functions.invoke('redirect', { code });
        const data = response?.data;

        if (!data) { window.location.href = '/'; return; }

        if (data.content_type === 'url') {
          window.location.href = data.url;
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
          data.bc.owner_email = data.created_by || '';
          data.bc.qr_code_id = data.id || '';
        }

        setState({ status: 'display', data });
      } catch (error) {
        console.error('Redirect error:', error);
        window.location.href = '/';
      }
    };

    run();
  }, []);

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

  // Business card gets its own full-page display
  if (data.content_type === 'business_card') {
    return <BusinessCardDisplay data={{ ...data.bc, design_config: dc }} />;
  }

  return (
    <BrandedLayout designConfig={dc}>
      {data.content_type === 'wifi' && <WifiDisplay content={data.content} branded={branded} />}
      {data.content_type === 'vcard' && <VCardDisplay content={data.content} branded={branded} />}
      {data.content_type === 'text' && <TextDisplay content={data.content} name={data.name} branded={branded} />}
      {data.content_type === 'pdf' && <PDFDisplay content={data.content} name={data.name} branded={branded} />}
      {data.content_type === 'social' && <SocialDisplay content={data.content} branded={branded} />}
      {data.content_type === 'coupon' && <CouponDisplay content={data.content} branded={branded} />}
      {data.content_type === 'image' && <ImageDisplay content={data.content} branded={branded} />}
      {data.content_type === 'mp3' && <MP3Display content={data.content} branded={branded} />}
      {data.content_type === 'call' && <CallDisplay content={data.content} branded={branded} />}
      {data.content_type === 'sms' && <SMSDisplay content={data.content} branded={branded} />}
    </BrandedLayout>
  );
}