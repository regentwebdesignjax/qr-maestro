import React, { useState } from 'react';

const FONT_FAMILIES = {
  open_sans: "'Open Sans', sans-serif",
  poppins: "'Poppins', sans-serif",
  inter: "'Inter', sans-serif",
  roboto: "'Roboto', sans-serif",
};

export default function LinkpagePreview({ data = {} }) {
  const [profileError, setProfileError] = useState(false);
  const [backgroundError, setBackgroundError] = useState(false);

  React.useEffect(() => {
    setProfileError(false);
    setBackgroundError(false);
  }, [data.profile_image, data.design?.background_image]);

  const design = data.design || {};
  const fontFamily = FONT_FAMILIES[design.font_family] || FONT_FAMILIES.open_sans;

  const getButtonStyle = () => {
    const baseStyle = {
      backgroundColor: design.button_color || '#2f3f7f',
      color: design.button_text_color || '#ffffff',
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
    if (design.background_type === 'image' && design.background_image && !backgroundError) {
      return {
        backgroundImage: `url(${design.background_image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    return {
      backgroundColor: design.background_color || '#ffffff',
    };
  })();

  const links = data.links || [];

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
          className="overflow-y-auto max-h-[520px] px-6 py-8"
          style={{
            ...backgroundStyle,
            fontFamily,
          }}
        >
          {/* Profile Image */}
          {data.profile_image && !profileError && (
            <div className="flex justify-center mb-6">
              <img
                src={data.profile_image}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                onError={() => setProfileError(true)}
              />
            </div>
          )}

          {/* Title */}
          {data.title && (
            <h1
              className="text-center text-xl font-bold mb-2"
              style={{ color: design.title_color || '#000000' }}
            >
              {data.title}
            </h1>
          )}

          {/* Description */}
          {data.description && (
            <p
              className="text-center text-sm mb-6 leading-relaxed"
              style={{ color: design.description_color || '#666666' }}
            >
              {data.description}
            </p>
          )}

          {/* Links */}
          {links.length > 0 && (
            <div className="space-y-2 mb-4">
              {links
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
                ))}
            </div>
          )}
        </div>

        {/* Home indicator */}
        <div className="bg-gray-800 h-6 flex items-end justify-center pb-1.5">
          <div className="w-12 h-1 rounded-full bg-gray-600"></div>
        </div>
      </div>
    </div>
  );
}
