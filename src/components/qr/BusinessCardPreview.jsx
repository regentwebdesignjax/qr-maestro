import React from 'react';
import { User, Phone, Mail, Globe, Linkedin, Instagram, Twitter, Youtube, Facebook, Link, Music, MessageCircle, Video } from 'lucide-react';

const PLATFORM_ICONS = {
  linkedin: Linkedin,
  instagram: Instagram,
  twitter: Twitter,
  x: Twitter,
  youtube: Youtube,
  facebook: Facebook,
  tiktok: Music,
  telegram: MessageCircle,
  whatsapp: MessageCircle,
  zoom: Video,
  phone: Phone,
  email: Mail,
  website: Globe,
  globe: Globe,
};

function getPlatformIcon(platform) {
  return PLATFORM_ICONS[platform.toLowerCase().trim()] || Link;
}

export default function BusinessCardPreview({ data = {} }) {
  const [headshotError, setHeadshotError] = React.useState(false);
  const [bannerError, setBannerError] = React.useState(false);

  React.useEffect(() => {
    setHeadshotError(false);
    setBannerError(false);
  }, [data.headshot_url, data.banner_url]);

  const themeColor = '#BB3F27';
  const ctaColor = data.design_config?.cta_button_color || themeColor;
  const ctaTextColor = data.design_config?.cta_text_color || '#ffffff';
  const socialLinks = data.social_links || [];

  return (
    <div className="flex justify-center">
      {/* Phone frame */}
      <div className="w-[280px] rounded-[2rem] border-[6px] border-gray-800 shadow-2xl overflow-hidden bg-white">
        {/* Status bar */}
        <div className="bg-gray-800 h-6 flex items-center justify-center">
          <div className="w-16 h-1.5 rounded-full bg-gray-600"></div>
        </div>

        {/* Card content */}
        <div className="overflow-y-auto max-h-[520px] bg-gray-50">
          {/* Banner */}
          <div className="relative w-full aspect-[3/1] bg-gradient-to-br from-gray-700 to-gray-900 overflow-visible">
            {data.banner_url && !bannerError ? (
              <img
                src={data.banner_url}
                alt="Banner"
                className="w-full h-full object-cover"
                onError={() => setBannerError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-white/30 text-xs">Banner Image</span>
              </div>
            )}
            {/* Headshot overlapping banner */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
              <div className="w-20 h-20 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-200 flex items-center justify-center">
                {data.headshot_url && !headshotError ? (
                  <img
                    src={data.headshot_url}
                    alt="Headshot"
                    className="w-full h-full object-cover"
                    onError={() => setHeadshotError(true)}
                  />
                ) : (
                  <User className="w-8 h-8 text-gray-400" />
                )}
              </div>
            </div>
          </div>

          {/* Identity block */}
          <div className="pt-12 px-4 pb-2 text-center">
            <h2 className="text-base font-bold text-gray-900 leading-tight">{data.name || 'Your Name'}</h2>
            {data.title && <p className="text-xs text-gray-500 mt-0.5">{data.title}</p>}
            {data.company && (
              <div className="flex items-center justify-center gap-1.5 mt-1">
                {data.company_logo_url && (
                  <img src={data.company_logo_url} alt="Logo" className="w-4 h-4 object-contain rounded" />
                )}
                <p className="text-xs font-medium text-gray-700">{data.company}</p>
              </div>
            )}
            {data.bio && <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-3">{data.bio}</p>}
          </div>

          {/* Action buttons */}
          <div className="px-4 py-3 flex gap-2">
            <button className="flex-1 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: ctaColor, color: ctaTextColor }}>
              Save Contact
            </button>
            <button className="flex-1 py-2 rounded-lg text-xs font-semibold border-2" style={{ borderColor: ctaColor, color: ctaColor }}>
              Exchange Info
            </button>
          </div>

          {/* Contact links */}
          <div className="px-4 pb-4 space-y-1.5">
            {data.phone && (
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100">
                <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="text-xs text-gray-700 truncate">{data.phone}</span>
              </div>
            )}
            {data.email && (
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100">
                <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="text-xs text-gray-700 truncate">{data.email}</span>
              </div>
            )}
            {data.website && (
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100">
                <Globe className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="text-xs text-gray-700 truncate">{data.website}</span>
              </div>
            )}
            {socialLinks.filter(l => l.platform && l.url).map((link, idx) => {
              const IconComp = getPlatformIcon(link.platform);
              return (
                <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100">
                  <IconComp className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 capitalize leading-none">{link.platform}</p>
                    <span className="text-xs text-gray-700 truncate block">{link.url}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Home indicator */}
        <div className="bg-gray-800 h-6 flex items-end justify-center pb-1.5">
          <div className="w-12 h-1 rounded-full bg-gray-600"></div>
        </div>
      </div>
    </div>
  );
}