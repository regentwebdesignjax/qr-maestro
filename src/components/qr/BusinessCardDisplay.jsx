import React, { useState } from 'react';
import { Phone, Mail, Globe, Linkedin, Instagram, Twitter, Youtube, Facebook, UserPlus, ArrowRight, Link, Music, MessageCircle, Video, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { maskUrl } from '@/lib/maskUrl';

function buildVCard(data) {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
  if (data.name) lines.push(`FN:${data.name}`);
  if (data.name) lines.push(`N:;${data.name};;;`);
  if (data.company) lines.push(`ORG:${data.company}`);
  if (data.title) lines.push(`TITLE:${data.title}`);
  if (data.phone) lines.push(`TEL;TYPE=CELL:${data.phone}`);
  if (data.email) lines.push(`EMAIL:${data.email}`);
  if (data.website) lines.push(`URL:${data.website}`);
  lines.push('END:VCARD');
  return lines.join('\n');
}

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
  const key = platform.toLowerCase().trim();
  return PLATFORM_ICONS[key] || Link;
}

function normalizeUrl(url, platform) {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const key = platform.toLowerCase().trim();
  if (key === 'instagram') return `https://instagram.com/${url.replace('@', '')}`;
  if (key === 'twitter' || key === 'x') return `https://x.com/${url.replace('@', '')}`;
  if (key === 'linkedin') return `https://linkedin.com/in/${url}`;
  if (key === 'tiktok') return `https://tiktok.com/@${url.replace('@', '')}`;
  if (key === 'facebook') return `https://facebook.com/${url}`;
  if (key === 'youtube') return `https://youtube.com/@${url}`;
  if (key === 'telegram') return `https://t.me/${url.replace('@', '')}`;
  return `https://${url}`;
}

export default function BusinessCardDisplay({ data }) {
  const [showExchange, setShowExchange] = useState(false);
  const [exchangeForm, setExchangeForm] = useState({ name: '', email: '', notes: '' });
  const [exchangeSent, setExchangeSent] = useState(false);
  const [exchangeSubmitting, setExchangeSubmitting] = useState(false);
  const themeColor = data.design_config?.landing_theme_color || '#BB3F27';
  const btnBg = data.design_config?.landing_button_bg || data.design_config?.cta_button_color || themeColor;
  const btnText = data.design_config?.landing_button_text || '#ffffff';

  // Auto-darken a hex color by a percentage for hover states
  const darken = (hex, pct = 15) => {
    const c = hex.replace('#', '');
    const factor = 1 - pct / 100;
    const r = Math.max(0, Math.round(parseInt(c.substring(0,2), 16) * factor));
    const g = Math.max(0, Math.round(parseInt(c.substring(2,4), 16) * factor));
    const b = Math.max(0, Math.round(parseInt(c.substring(4,6), 16) * factor));
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
  };
  const btnBgHover = darken(btnBg);

  const handleSaveContact = () => {
    const vcf = buildVCard(data);
    const blob = new Blob([vcf], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.name || 'contact'}.vcf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExchangeSubmit = async (e) => {
    e.preventDefault();
    setExchangeSubmitting(true);
    try {
      const payload = {
        user_email: data.owner_email || '',
        qr_code_id: data.qr_code_id || '',
        qr_code_name: data.name || '',
        lead_name: exchangeForm.name,
        lead_email: exchangeForm.email,
        lead_tag: data.design_config?.lead_tag || '',
        notes: exchangeForm.notes || '',
      };
      console.log('Submitting lead payload:', payload);
      const response = await base44.functions.invoke('saveLead', payload);
      console.log('saveLead response:', JSON.stringify(response?.data));
    } catch (err) {
      console.error('Lead save error:', err?.response?.data || err.message);
    } finally {
      setExchangeSubmitting(false);
      setExchangeSent(true);
    }
  };

  const socialLinks = data.social_links || [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <style>{`
        .dbc-primary { background-color: ${themeColor} !important; }
        .dbc-primary-border { border-color: ${themeColor} !important; }
        .dbc-primary-text { color: ${themeColor} !important; }
        .dbc-btn { background-color: ${btnBg} !important; color: ${btnText} !important; }
        .dbc-btn:hover { background-color: ${btnBgHover} !important; }
        .dbc-btn-outline { border: 2px solid ${btnBg} !important; color: ${btnBg} !important; }
        .dbc-btn-outline:hover { background-color: ${btnBg}18 !important; }
      `}</style>

      {/* Banner + Headshot overlap */}
      <div className="relative w-full">
        <div className="w-full aspect-[3/1] bg-gradient-to-br from-gray-700 to-gray-900 overflow-hidden">
          {data.banner_url && (
            <img src={maskUrl(data.banner_url)} alt={`${data.name || ''} Banner`} className="w-full h-full object-cover" />
          )}
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-gray-200 flex items-center justify-center">
            {data.headshot_url ? (
              <img src={maskUrl(data.headshot_url)} alt={`${data.name || 'Profile'} headshot`} className="w-full h-full object-cover" />
            ) : (
              <UserPlus className="w-10 h-10 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 pt-20 px-4 pb-8 max-w-md mx-auto w-full">

        {/* Identity */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{data.name || 'Name'}</h1>
          {data.title && <p className="text-gray-500 mt-0.5">{data.title}</p>}
          {(data.company || data.company_logo_url) && (
            <div className="flex items-center justify-center gap-2 mt-2">
              {data.company_logo_url && (
                <img src={maskUrl(data.company_logo_url)} alt={`${data.company || ''} logo`} className="w-5 h-5 object-contain rounded" />
              )}
              {data.company && <span className="text-sm font-semibold text-gray-700">{data.company}</span>}
            </div>
          )}
          {data.bio && (
            <p className="text-sm text-gray-600 mt-3 leading-relaxed">{data.bio}</p>
          )}
        </div>

        {/* Action Tier */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleSaveContact}
            className="dbc-btn flex-1 py-3 rounded-xl font-semibold text-sm shadow-md transition-colors"
          >
            Save Contact
          </button>
          <button
            onClick={() => setShowExchange(!showExchange)}
            className="dbc-btn-outline flex-1 py-3 rounded-xl font-semibold text-sm transition-colors bg-transparent"
          >
            Exchange Info
          </button>
        </div>

        {/* Exchange Info Form */}
        {showExchange && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 shadow-sm">
            {exchangeSent ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
                <p className="font-semibold text-gray-800">Thank you!</p>
                <p className="text-sm text-gray-500 mt-1">Your info has been shared.</p>
              </div>
            ) : (
              <form onSubmit={handleExchangeSubmit} className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">Share your details</p>
                <Input
                  placeholder="Your name"
                  value={exchangeForm.name}
                  onChange={(e) => setExchangeForm(p => ({ ...p, name: e.target.value }))}
                  required
                />
                <Input
                  type="email"
                  placeholder="Your email"
                  value={exchangeForm.email}
                  onChange={(e) => setExchangeForm(p => ({ ...p, email: e.target.value }))}
                  required
                />
                <textarea
                  placeholder="Notes (e.g. Met you at the Tech Expo, or I'd like to talk to Sales about...)"
                  value={exchangeForm.notes}
                  onChange={(e) => setExchangeForm(p => ({ ...p, notes: e.target.value }))}
                  rows={3}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
                <button
                  type="submit"
                  disabled={exchangeSubmitting}
                  className="dbc-btn w-full py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  {exchangeSubmitting ? 'Sending...' : <><span>Send</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Contact Links */}
        <div className="space-y-2">
          {data.phone && (
            <a href={`tel:${data.phone}`} className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <Phone className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-700">{data.phone}</span>
            </a>
          )}
          {data.email && (
            <a href={`mailto:${data.email}`} className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <Mail className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-700">{data.email}</span>
            </a>
          )}
          {data.website && (
            <a href={data.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <Globe className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-700 truncate">{data.website}</span>
            </a>
          )}

          {/* Dynamic social links */}
          {socialLinks.filter(l => l.platform && l.url).map((link, idx) => {
            const IconComp = getPlatformIcon(link.platform);
            return (
              <a
                key={idx}
                href={normalizeUrl(link.url, link.platform)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <IconComp className="w-4 h-4 text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 capitalize">{link.platform}</p>
                  <p className="text-sm text-gray-700 truncate">{link.url}</p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}