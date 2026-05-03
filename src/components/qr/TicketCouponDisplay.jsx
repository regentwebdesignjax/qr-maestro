import React from 'react';

const FONT_OPTIONS = [
  { value: 'system', label: 'System (Default)', font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  { value: 'georgia', label: 'Georgia (Serif)', font: 'Georgia, serif' },
  { value: 'verdana', label: 'Verdana', font: 'Verdana, sans-serif' },
  { value: 'trebuchet', label: 'Trebuchet MS', font: '"Trebuchet MS", sans-serif' },
  { value: 'palatino', label: 'Palatino (Serif)', font: '"Palatino Linotype", "Book Antiqua", Palatino, serif' },
  { value: 'courier', label: 'Courier (Mono)', font: '"Courier New", monospace' },
  { value: 'times', label: 'Times New Roman (Serif)', font: '"Times New Roman", serif' },
  { value: 'arial', label: 'Arial', font: 'Arial, sans-serif' },
];

export default function TicketCouponDisplay({ couponData, branded, design_config }) {
  const themeColor = design_config?.landing_theme_color || '#BB3F27';
  const btnBg = design_config?.landing_button_bg || design_config?.cta_button_color || themeColor;
  const btnText = design_config?.landing_button_text || '#ffffff';
  const fontFamily = design_config?.coupon_font || 'system';

  const selectedFont = FONT_OPTIONS.find(f => f.value === fontFamily);
  const fontStyle = selectedFont?.font || FONT_OPTIONS[0].font;

  const darken = (hex, pct = 15) => {
    const c = hex.replace('#', '');
    const factor = 1 - pct / 100;
    const r = Math.max(0, Math.round(parseInt(c.substring(0, 2), 16) * factor));
    const g = Math.max(0, Math.round(parseInt(c.substring(2, 4), 16) * factor));
    const b = Math.max(0, Math.round(parseInt(c.substring(4, 6), 16) * factor));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };
  const btnBgHover = darken(btnBg);

  // Parse coupon data - handle both new JSON format and legacy string format
  let code = '';
  let description = '';
  let redemptionUrl = '';
  let buttonText = 'Redeem Now';

  if (typeof couponData === 'string') {
    // Legacy format: just the coupon code
    code = couponData;
  } else if (typeof couponData === 'object') {
    // New JSON format
    code = couponData.code || '';
    description = couponData.description || '';
    redemptionUrl = couponData.redemptionUrl || '';
    buttonText = couponData.buttonText || 'Redeem Now';
  }

  return (
    <div className="w-full flex items-center justify-center p-4 bg-transparent">
      {/* Premium Mobile-First Vertical Ticket */}
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden shadow-lg bg-white"
        style={{ fontFamily: fontStyle }}
      >
        {/* Top Section - Description & Messaging */}
        <div
          className="px-6 pt-8 pb-6 text-center"
          style={{ backgroundColor: '#f8f8f8' }}
        >
          {description && (
            <div
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          )}
          {!description && (
            <p className="text-gray-600 text-sm">Special Offer</p>
          )}
        </div>

        {/* Middle Section - Code Display */}
        <div className="px-6 py-8 text-center bg-white">
          <p className="text-xs uppercase tracking-widest font-semibold text-gray-500 mb-4">
            Use Code
          </p>
          <p
            className="text-5xl font-black break-words leading-tight"
            style={{ color: themeColor }}
          >
            {code}
          </p>
        </div>

        {/* Perforated Edge Divider */}
        <div className="px-6">
          <svg className="w-full h-8" viewBox="0 0 300 30" preserveAspectRatio="none">
            <defs>
              <pattern id="perforation" patternUnits="userSpaceOnUse" width="20" height="30">
                <circle cx="10" cy="15" r="2.5" fill={themeColor} opacity="0.3" />
              </pattern>
            </defs>
            <rect width="300" height="30" fill="url(#perforation)" />
            <line x1="0" y1="15" x2="300" y2="15" stroke={themeColor} strokeWidth="0.5" opacity="0.2" />
          </svg>
        </div>

        {/* Bottom Section - Button Area */}
        {redemptionUrl ? (
          <div className="px-6 py-8">
            <a
              href={redemptionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-6 py-4 rounded-xl font-bold text-center transition-all hover:shadow-lg uppercase tracking-wide text-sm"
              style={{
                backgroundColor: btnBg,
                color: btnText,
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = btnBgHover)}
              onMouseLeave={(e) => (e.target.style.backgroundColor = btnBg)}
            >
              {buttonText}
            </a>
          </div>
        ) : (
          <div className="px-6 py-8 text-center">
            <div className="text-xs text-gray-500 italic">
              No redemption link provided
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="px-6 pb-6 text-center">
          <p className="text-xs text-gray-400">
            Take a screenshot or share this code
          </p>
        </div>
      </div>
    </div>
  );
}

export { FONT_OPTIONS };
