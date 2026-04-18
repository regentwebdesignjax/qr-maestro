import React from 'react';

const FONT_CLASS = {
  poppins: 'font-poppins',
  serif: 'font-serif',
  mono: 'font-mono',
};

/**
 * BrandedLayout wraps landing page content with optional branding:
 * - Header image banner
 * - Floating brand logo
 * - Theme color applied to buttons and accents via CSS variable
 * Falls back to a plain centered layout when no branding is present.
 */
export default function BrandedLayout({ designConfig = {}, children }) {
  const {
    landing_header_image,
    landing_brand_logo,
    landing_theme_color,
    landing_font,
  } = designConfig;

  const hasBranding = landing_header_image || landing_brand_logo || landing_theme_color;
  const fontClass = FONT_CLASS[landing_font] || 'font-poppins';

  if (!hasBranding) {
    return (
      <div className={`flex items-center justify-center min-h-screen bg-background p-4 ${fontClass}`}>
        {children}
      </div>
    );
  }

  const themeColor = landing_theme_color || '#BB3F27';

  return (
    <div
      className={`min-h-screen bg-gray-50 ${fontClass}`}
      style={{ '--landing-theme': themeColor }}
    >
      {/* Header Banner */}
      {landing_header_image && (
        <div className="w-full h-48 md:h-64 overflow-hidden relative bg-gray-200">
          <img
            src={landing_header_image}
            alt="Brand header"
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
        </div>
      )}

      {/* Brand Logo floating over header */}
      {landing_brand_logo && (
        <div className={`flex justify-center ${landing_header_image ? '-mt-12' : 'pt-10'}`}>
          <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
            <img
              src={landing_brand_logo}
              alt="Brand logo"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className={`flex justify-center p-4 ${landing_brand_logo ? 'pt-6' : landing_header_image ? 'pt-8' : 'pt-16'}`}>
        {/* Inject CSS variable for theme color so child buttons can use it */}
        <style>{`
          .branded-action-btn {
            background-color: ${themeColor} !important;
            color: #fff !important;
          }
          .branded-action-btn:hover {
            opacity: 0.88;
          }
          .branded-icon-bg {
            background-color: ${themeColor}18 !important;
          }
          .branded-icon {
            color: ${themeColor} !important;
          }
        `}</style>
        {children}
      </div>
    </div>
  );
}