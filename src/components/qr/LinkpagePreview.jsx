import React, { useState } from 'react';
import { ImageIcon } from 'lucide-react';

const FONT_FAMILIES = {
  open_sans: "'Open Sans', sans-serif",
  poppins: "'Poppins', sans-serif",
  inter: "'Inter', sans-serif",
  roboto: "'Roboto', sans-serif",
};

function getColorBrightness(hexColor) {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

function getAutoFontColor(bgColor, overlayColor, overlayOpacity) {
  if (overlayOpacity > 0.5) {
    const brightness = getColorBrightness(overlayColor);
    return brightness > 128 ? '#000000' : '#ffffff';
  }
  const brightness = getColorBrightness(bgColor);
  return brightness > 128 ? '#000000' : '#ffffff';
}

export default function LinkpagePreview({ data = {} }) {
  const [profileError, setProfileError] = useState(false);
  const [backgroundError, setBackgroundError] = useState(false);

  React.useEffect(() => {
    setProfileError(false);
    setBackgroundError(false);
  }, [data.profile_image, data.design?.background_image]);

  const design = data.design || {};
  const fontFamily = FONT_FAMILIES[design.font_family] || FONT_FAMILIES.open_sans;

  let titleColor = design.title_color || '#000000';
  let descriptionColor = design.description_color || '#666666';
  let buttonTextColor = design.button_text_color || '#ffffff';

  // Auto font color applies to all background types when enabled
  // BUT ONLY FOR TITLE AND DESCRIPTION - not buttons
  if (design.auto_font_color) {
    let bgColorForBrightness = design.background_color || '#ffffff';
    let overlayOpacityForCheck = design.overlay_opacity || 0;

    // For image backgrounds, consider the overlay if it's significant
    if (design.background_type === 'image' && overlayOpacityForCheck > 0.5) {
      bgColorForBrightness = design.overlay_color || '#000000';
    }
    // For gradient backgrounds, check the starting color
    else if (design.background_type === 'gradient') {
      bgColorForBrightness = design.gradient_start || '#2f3f7f';
    }

    const autoColor = getAutoFontColor(
      bgColorForBrightness,
      design.overlay_color || '#000000',
      overlayOpacityForCheck
    );
    titleColor = autoColor;
    descriptionColor = autoColor;
    // Do NOT override button text color - it's fully under user control
  }

  const getButtonStyle = () => {
    const baseStyle = {
      backgroundColor: design.button_color || '#2f3f7f',
      color: buttonTextColor,
      border: 'none',
      fontWeight: '600',
      fontSize: '14px',
      cursor: 'pointer',
      width: '100%',
      padding: '12px 16px',
      fontFamily,
    };

    const style = design.button_style || 'rounded';
    if (style === 'rounded') {
      baseStyle.borderRadius = '8px';
    } else if (style === 'square') {
      baseStyle.borderRadius = '0px';
    } else if (style === 'pill') {
      baseStyle.borderRadius = '24px';
    }

    return baseStyle;
  };

  const backgroundStyle = (() => {
    if (design.background_type === 'gradient') {
      return {
        background: `linear-gradient(135deg, ${design.gradient_start || '#2f3f7f'} 0%, ${design.gradient_end || '#ffffff'} 100%)`,
      };
    }

    if (design.background_type === 'image' && design.background_image && !backgroundError) {
      return {
        backgroundColor: design.background_color || '#ffffff',
      };
    }

    return {
      backgroundColor: design.background_color || '#ffffff',
    };
  })();

  // Separate background image layer with saturation filter
  const backgroundImageStyle = (() => {
    if (design.background_type === 'image' && design.background_image && !backgroundError) {
      const saturation = design.background_saturation ?? 100;
      const backgroundOpacity = design.background_opacity ?? 1;
      return {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url(${design.background_image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: backgroundOpacity,
        filter: saturation !== 100 ? `saturate(${saturation / 100})` : undefined,
        pointerEvents: 'none',
        zIndex: 0,
      };
    }
    return null;
  })();

  const links = data.links || [];
  const hasImageBackground = design.background_type === 'image' && (design.overlay_opacity || 0) > 0;
  const overlayStyle = hasImageBackground ? {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: design.overlay_color || '#000000',
    opacity: design.overlay_opacity || 0,
    pointerEvents: 'none',
  } : null;

  return (
    <div className="flex justify-center">
      {/* Phone frame */}
      <div className="w-[280px] rounded-[2rem] border-[6px] border-gray-800 shadow-2xl overflow-hidden bg-white">
        {/* Status bar */}
        <div className="bg-gray-800 h-6 flex items-center justify-center">
          <div className="w-16 h-1.5 rounded-full bg-gray-600"></div>
        </div>

        {/* Linkpage content */}
        <div
          className="overflow-y-auto max-h-[520px] px-6 py-8 relative"
          style={{
            ...backgroundStyle,
            fontFamily,
          }}
        >
          {backgroundImageStyle && <div style={backgroundImageStyle}></div>}
          {overlayStyle && <div style={overlayStyle}></div>}
          <div className="relative z-10">
          {/* Profile Image */}
          <div className="flex justify-center mb-6">
            {data.profile_image && !profileError ? (
              <img
                src={data.profile_image}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                onError={() => setProfileError(true)}
              />
            ) : (
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-gray-200 flex items-center justify-center">
                <ImageIcon className="w-10 h-10 text-gray-400" />
              </div>
            )}
          </div>

            {/* Title */}
            <h1
              className="text-center text-xl font-bold mb-2"
              style={{ color: data.title ? titleColor : '#ccc' }}
            >
              {data.title || 'Your Title'}
            </h1>

            {/* Description */}
            <p
              className="text-center text-sm mb-6 leading-relaxed"
              style={{ color: data.description ? descriptionColor : '#ccc' }}
            >
              {data.description || 'Add a description to tell visitors more about you'}
            </p>

            {/* Links */}
            <div className="space-y-2 mb-4">
              {links.length > 0 && links.filter((link) => link.button_text && link.button_url).length > 0 ? (
                links
                  .filter((link) => link.button_text && link.button_url)
                  .map((link, idx) => (
                    <button
                      key={idx}
                      type="button"
                      style={getButtonStyle()}
                      className="transition-opacity hover:opacity-90"
                    >
                      {link.button_text}
                    </button>
                  ))
              ) : (
                <>
                  <button
                    type="button"
                    style={{
                      ...getButtonStyle(),
                      opacity: 0.5,
                    }}
                    className="cursor-default"
                    disabled
                  >
                    Button 1
                  </button>
                  <button
                    type="button"
                    style={{
                      ...getButtonStyle(),
                      opacity: 0.5,
                    }}
                    className="cursor-default"
                    disabled
                  >
                    Button 2
                  </button>
                </>
              )}
            </div>

            {/* Powered by QR Sensei */}
            {design.show_branding !== false && (
              <div className="mt-6 text-center text-xs text-gray-500">
                Powered by{' '}
                <span className="font-semibold">QR Sensei</span>
              </div>
            )}
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
