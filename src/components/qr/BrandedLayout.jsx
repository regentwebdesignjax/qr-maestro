import React from 'react';

const FONT_CLASS = {
  poppins: 'font-poppins',
  serif: 'font-serif',
  mono: 'font-mono',
};

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
  const hasLogo = !!landing_brand_logo;
  const hasBanner = !!landing_header_image;

  return (
    <div className={`min-h-screen bg-gray-50 ${fontClass}`}>
      <style>{`
        .branded-action-btn {
          background-color: ${themeColor} !important;
          color: #fff !important;
        }
        .branded-action-btn:hover { opacity: 0.88; }
        .branded-icon-bg { background-color: ${themeColor}18 !important; }
        .branded-icon { color: ${themeColor} !important; }
      `}</style>

      {/* Banner + Logo overlap container */}
      <div className="relative w-full">
        {/* Header Banner — 3:1 aspect ratio */}
        {hasBanner && (
          <div className="w-full aspect-[3/1] overflow-hidden bg-gray-200">
            <img
              src={landing_header_image}
              alt="Brand header"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
          </div>
        )}

        {/* Brand Logo — overlapping bottom edge of banner */}
        {hasLogo && (
          <div className={`flex justify-center ${hasBanner ? 'absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10' : 'pt-8'}`}>
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white flex-shrink-0">
              <img
                src={landing_brand_logo}
                alt="Brand logo"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
      </div>

      {/* Content — padded to clear the overlapping logo */}
      <div className={`flex justify-center p-4 ${hasBanner && hasLogo ? 'pt-16' : hasBanner || hasLogo ? 'pt-10' : 'pt-6'}`}>
        {children}
      </div>
    </div>
  );
}