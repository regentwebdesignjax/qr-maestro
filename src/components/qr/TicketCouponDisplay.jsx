import React from 'react';
import DOMPurify from 'dompurify';

export default function TicketCouponDisplay({ couponData, branded, design_config }) {
  const themeColor = design_config?.landing_theme_color || '#BB3F27';
  const btnBg = design_config?.landing_button_bg || design_config?.cta_button_color || themeColor;
  const btnText = design_config?.landing_button_text || '#ffffff';

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

  const sanitizedDescription = DOMPurify.sanitize(description, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  });

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Ticket Shape Container */}
      <div className="relative">
        {/* SVG for ticket shape with perforation */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 400 300"
          preserveAspectRatio="xMidYMid slice"
          style={{ pointerEvents: 'none' }}
        >
          <defs>
            <pattern id="perforation" patternUnits="userSpaceOnUse" width="12" height="12">
              <circle cx="6" cy="6" r="2" fill="#ddd" opacity="0.5" />
            </pattern>
          </defs>

          {/* Main ticket background */}
          <rect width="400" height="300" rx="8" fill="#f8f8f8" stroke={themeColor} strokeWidth="2" />

          {/* Perforation line (vertical divider) */}
          <line x1="180" y1="20" x2="180" y2="280" stroke="url(#perforation)" strokeWidth="2" strokeDasharray="8,4" />

          {/* Left section highlight */}
          <rect x="10" y="10" width="160" height="280" rx="6" fill="none" stroke={themeColor} strokeWidth="1" opacity="0.2" />
        </svg>

        {/* Content Container */}
        <div className="relative p-6 h-80 flex flex-col md:flex-row">
          {/* Left Section - Coupon Code */}
          <div className="flex-1 flex flex-col items-center justify-center text-center md:border-r-2 md:border-dashed md:border-gray-300 md:pr-6 pb-6 md:pb-0">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest font-semibold text-gray-500">Use Code</p>
              <p className="text-5xl md:text-6xl font-black" style={{ color: themeColor }}>
                {code}
              </p>
            </div>
          </div>

          {/* Right Section - Description & Button */}
          <div className="flex-1 flex flex-col items-center justify-between md:pl-6 md:items-start">
            {/* Description */}
            {description && (
              <div
                className="prose prose-sm max-w-none text-gray-700 text-sm md:text-base mb-4 line-clamp-3"
                dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
              />
            )}

            {/* Redemption Button */}
            {redemptionUrl && (
              <a
                href={redemptionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full md:w-auto px-6 py-3 rounded-lg font-semibold text-center transition-all hover:shadow-lg"
                style={{
                  backgroundColor: btnBg,
                  color: btnText,
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = btnBgHover)}
                onMouseLeave={(e) => (e.target.style.backgroundColor = btnBg)}
              >
                {buttonText}
              </a>
            )}

            {/* No URL message */}
            {!redemptionUrl && description && (
              <div className="text-xs text-gray-500 italic">
                No redemption link provided
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Helpful text below ticket */}
      <div className="mt-6 text-center text-xs text-gray-500">
        <p>Take a screenshot or note the code above</p>
      </div>
    </div>
  );
}
