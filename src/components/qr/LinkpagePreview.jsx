import React, { useState } from 'react';
import { ImageIcon } from 'lucide-react';

const FONT_FAMILIES = {
  open_sans: "'Open Sans', sans-serif",
  poppins: "'Poppins', sans-serif",
  inter: "'Inter', sans-serif",
  roboto: "'Roboto', sans-serif",
};

const BORDER_RADIUS = {
  rounded: '8px',
  square: '0px',
  pill: '9999px',
};

function isDarkColor(hex) {
  const clean = (hex || '#ffffff').replace('#', '');
  if (clean.length !== 6) return false;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

export default function LinkpagePreview({ data = {} }) {
  const [profileError, setProfileError] = useState(false);
  const [backgroundError, setBackgroundError] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState(null);

  React.useEffect(() => {
    setProfileError(false);
    setBackgroundError(false);
  }, [data.profile_image, data.design?.background_image]);

  const design = data.design || {};
  const fontFamily = FONT_FAMILIES[design.font_family] || FONT_FAMILIES.open_sans;

  const titleColor = design.title_color || '#000000';
  const descriptionColor = design.description_color || '#666666';

  const getButtonStyle = (idx) => ({
    backgroundColor: design.button_color || '#2f3f7f',
    color: design.button_text_color || '#ffffff',
    border: 'none',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    width: '100%',
    padding: '12px 14px',
    fontFamily,
    borderRadius: BORDER_RADIUS[design.button_style] || BORDER_RADIUS.rounded,
    boxShadow:
      hoveredBtn === idx
        ? '0 4px 14px rgba(0,0,0,0.2)'
        : '0 2px 8px rgba(0,0,0,0.12)',
    transform: hoveredBtn === idx ? 'translateY(-1px)' : 'translateY(0)',
    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
  });

  const backgroundStyle = (() => {
    if (design.background_type === 'gradient') {
      return {
        background: `linear-gradient(160deg, ${design.gradient_start || '#2f3f7f'} 0%, ${design.gradient_end || '#ffffff'} 100%)`,
      };
    }
    return { backgroundColor: design.background_color || '#ffffff' };
  })();

  const backgroundImageStyle = (() => {
    if (design.background_type === 'image' && design.background_image && !backgroundError) {
      const saturation = design.background_saturation ?? 100;
      return {
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${design.background_image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: design.background_opacity ?? 1,
        filter: saturation !== 100 ? `saturate(${saturation / 100})` : undefined,
        pointerEvents: 'none',
        zIndex: 0,
      };
    }
    return null;
  })();

  const overlayStyle =
    design.background_type === 'image' && (design.overlay_opacity || 0) > 0
      ? {
          position: 'absolute',
          inset: 0,
          backgroundColor: design.overlay_color || '#000000',
          opacity: design.overlay_opacity || 0,
          pointerEvents: 'none',
        }
      : null;

  const darkBg = (() => {
    if (design.background_type === 'gradient') return isDarkColor(design.gradient_start);
    if (design.background_type === 'image') {
      return (design.overlay_opacity || 0) > 0.5 ? isDarkColor(design.overlay_color) : false;
    }
    return isDarkColor(design.background_color);
  })();

  const links = data.links || [];
  const visibleLinks = links.filter((l) => l.button_text && l.button_url);

  return (
    <div className="flex justify-center">
      {/* Phone frame */}
      <div className="w-[280px] rounded-[2rem] border-[6px] border-gray-800 shadow-2xl overflow-hidden bg-white">
        {/* Status bar */}
        <div className="bg-gray-800 h-6 flex items-center justify-center">
          <div className="w-16 h-1.5 rounded-full bg-gray-600" />
        </div>

        {/* Linkpage content */}
        <div
          className="overflow-y-auto max-h-[520px] px-5 pt-8 pb-6 relative"
          style={{ ...backgroundStyle, fontFamily }}
        >
          {backgroundImageStyle && <div style={backgroundImageStyle} />}
          {overlayStyle && <div style={overlayStyle} />}

          <div className="relative z-10">
            {/* Profile image */}
            <div className="flex justify-center mb-4">
              {data.profile_image && !profileError ? (
                <img
                  src={data.profile_image}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover"
                  style={{
                    border: '3px solid rgba(255,255,255,0.85)',
                    boxShadow: '0 4px 18px rgba(0,0,0,0.18)',
                  }}
                  onError={() => setProfileError(true)}
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center"
                  style={{
                    border: '3px solid rgba(255,255,255,0.85)',
                    boxShadow: '0 4px 18px rgba(0,0,0,0.18)',
                  }}
                >
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>

            {/* Title */}
            <h1
              className="text-center text-lg font-bold mb-1.5 leading-tight"
              style={{ color: data.title ? titleColor : '#ccc' }}
            >
              {data.title || 'Your Title'}
            </h1>

            {/* Description */}
            <p
              className="text-center text-xs mb-5 leading-relaxed"
              style={{ color: data.description ? descriptionColor : '#ccc' }}
            >
              {data.description || 'Add a description to tell visitors more about you'}
            </p>

            {/* Links */}
            <div className="space-y-2 mb-4">
              {visibleLinks.length > 0 ? (
                visibleLinks.map((link, idx) => (
                  <button
                    key={idx}
                    type="button"
                    style={getButtonStyle(idx)}
                    onMouseEnter={() => setHoveredBtn(idx)}
                    onMouseLeave={() => setHoveredBtn(null)}
                  >
                    {link.button_text}
                  </button>
                ))
              ) : (
                <>
                  {[0, 1].map((i) => (
                    <button
                      key={i}
                      type="button"
                      style={{ ...getButtonStyle(null), opacity: 0.4 }}
                      className="cursor-default"
                      disabled
                    >
                      Button {i + 1}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Home indicator */}
        <div className="bg-gray-800 h-6 flex items-end justify-center pb-1.5">
          <div className="w-12 h-1 rounded-full bg-gray-600" />
        </div>
      </div>
    </div>
  );
}
