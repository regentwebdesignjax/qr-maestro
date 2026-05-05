import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

const FONT_MAP = {
  open_sans: "'Open Sans', sans-serif",
  poppins: "'Poppins', sans-serif",
  inter: "'Inter', sans-serif",
  roboto: "'Roboto', sans-serif"
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

const BUTTON_STYLES = {
  rounded: 'rounded-lg',
  square: 'rounded-none',
  pill: 'rounded-full'
};

export default function LinkpageLanding({ initialData, qrCodeId: propQrCodeId, shortCode: propShortCode }) {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const [linkpageData, setLinkpageData] = useState(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  const [qrCodeId, setQrCodeId] = useState(propQrCodeId || null);

  useEffect(() => {
    // If data was provided as props (from Redirect.jsx), skip fetching
    if (initialData) {
      return;
    }

    const fetchLinkpage = async () => {
      try {
        setLoading(true);
        // Fetch all linkpage QR codes and find the one matching this slug
        // Note: In a production app, this should be a dedicated backend function
        const result = await base44.asServiceRole.entities.QRCode.filter({
          content_type: 'linkpages'
        }).catch(() => []);

        let qrData = null;
        for (const qr of result) {
          try {
            const parsed = JSON.parse(qr.content);
            if (parsed.custom_slug === slug) {
              qrData = qr;
              break;
            }
          } catch (e) {
            // Skip entries that can't be parsed
          }
        }

        if (!qrData) {
          setError('Linkpage not found');
          setLoading(false);
          return;
        }

        setQrCodeId(qrData.id);

        // Parse linkpage content
        try {
          const parsed = JSON.parse(qrData.content);
          setLinkpageData(parsed);
        } catch (e) {
          console.error('Failed to parse linkpage content:', e);
          setError('Failed to load linkpage');
        }

        // Track scan
        if (qrData.short_code) {
          await base44.functions.invoke('trackScan', {
            short_code: qrData.short_code,
            location: searchParams.get('location'),
            utm_source: searchParams.get('utm_source'),
            utm_medium: searchParams.get('utm_medium'),
            utm_campaign: searchParams.get('utm_campaign')
          }).catch(err => console.error('Failed to track scan:', err));
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching linkpage:', err);
        setError('Failed to load linkpage');
        setLoading(false);
      }
    };

    if (!initialData) {
      fetchLinkpage();
    }
  }, [slug, searchParams, initialData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !linkpageData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Linkpage Not Found</h1>
          <p className="text-gray-600">{error || 'The linkpage you are looking for does not exist.'}</p>
        </div>
      </div>
    );
  }

  const { profile_image, title, description, links, design, browser_title } = linkpageData;

  // Provide default design values if missing
  const safeDesign = design || {
    background_type: 'solid',
    background_color: '#ffffff',
    background_image: '',
    gradient_start: '#2f3f7f',
    gradient_end: '#ffffff',
    overlay_color: '#000000',
    overlay_opacity: 0,
    background_opacity: 1,
    background_saturation: 100,
    auto_font_color: false,
    font_family: 'open_sans',
    title_color: '#000000',
    description_color: '#666666',
    button_style: 'rounded',
    button_color: '#2f3f7f',
    button_text_color: '#ffffff',
    show_branding: true
  };

  let backgroundStyle = {
    fontFamily: FONT_MAP[safeDesign.font_family] || FONT_MAP.open_sans,
    position: 'relative',
  };

  if (safeDesign.background_type === 'solid') {
    backgroundStyle.backgroundColor = safeDesign.background_color || '#ffffff';
  } else if (safeDesign.background_type === 'gradient') {
    backgroundStyle.background = `linear-gradient(135deg, ${safeDesign.gradient_start || '#2f3f7f'} 0%, ${safeDesign.gradient_end || '#ffffff'} 100%)`;
  } else if (safeDesign.background_type === 'image') {
    backgroundStyle.backgroundColor = safeDesign.background_color || '#ffffff';
  }

  // Separate background image layer with saturation filter - only applied to the image, not content
  const backgroundImageStyle = safeDesign.background_type === 'image' && safeDesign.background_image ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `url(${safeDesign.background_image})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    opacity: safeDesign.background_opacity ?? 1,
    filter: safeDesign.background_saturation && safeDesign.background_saturation !== 100
      ? `saturate(${safeDesign.background_saturation / 100})`
      : undefined,
    pointerEvents: 'none',
    zIndex: 0,
  } : null;

  const hasImageBackground = safeDesign.background_type === 'image' && safeDesign.overlay_opacity > 0;
  const overlayStyle = hasImageBackground ? {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: safeDesign.overlay_color || '#000000',
    opacity: safeDesign.overlay_opacity || 0,
    pointerEvents: 'none'
  } : null;

  let titleColor = safeDesign.title_color || '#000000';
  let descriptionColor = safeDesign.description_color || '#666666';
  let buttonTextColor = safeDesign.button_text_color || '#ffffff';

  // Auto font color applies to all background types when enabled
  // BUT ONLY FOR TITLE AND DESCRIPTION - not buttons
  if (safeDesign.auto_font_color) {
    let bgColorForBrightness = safeDesign.background_color || '#ffffff';
    let overlayOpacityForCheck = safeDesign.overlay_opacity || 0;

    // For image backgrounds, consider the overlay if it's significant
    if (safeDesign.background_type === 'image' && overlayOpacityForCheck > 0.5) {
      bgColorForBrightness = safeDesign.overlay_color || '#000000';
    }
    // For gradient backgrounds, check the starting color
    else if (safeDesign.background_type === 'gradient') {
      bgColorForBrightness = safeDesign.gradient_start || '#2f3f7f';
    }

    const autoColor = getAutoFontColor(
      bgColorForBrightness,
      safeDesign.overlay_color || '#000000',
      overlayOpacityForCheck
    );
    titleColor = autoColor;
    descriptionColor = autoColor;
    // Do NOT override button text color - it's fully under user control
  }

  const titleStyle = {
    color: titleColor,
    fontFamily: FONT_MAP[safeDesign.font_family] || FONT_MAP.open_sans
  };

  const descriptionStyle = {
    color: descriptionColor,
    fontFamily: FONT_MAP[safeDesign.font_family] || FONT_MAP.open_sans
  };

  const buttonStyle = {
    backgroundColor: safeDesign.button_color || '#2f3f7f',
    color: buttonTextColor,
    fontFamily: FONT_MAP[safeDesign.font_family] || FONT_MAP.open_sans
  };

  // Update document title
  React.useEffect(() => {
    if (browser_title) {
      document.title = browser_title;
    }
  }, [browser_title]);

  const handleLinkClick = (url, index) => {
    // Log link click
    if (qrCodeId) {
      base44.functions.invoke('trackLinkClick', {
        short_code: qrCodeId,
        link_index: index,
        link_url: url
      }).catch(err => console.error('Failed to track link click:', err));
    }

    // Navigate to URL
    window.location.href = url;
  };

  return (
    <div style={backgroundStyle} className="min-h-screen p-4 sm:p-6 md:p-8">
      {backgroundImageStyle && <div style={backgroundImageStyle}></div>}
      {overlayStyle && <div style={overlayStyle}></div>}
      <div className="max-w-md mx-auto relative z-10">
        {/* Profile Image */}
        {profile_image && (
          <div className="mb-6 flex justify-center">
            <img
              src={profile_image}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover border-4"
              style={{ borderColor: safeDesign.title_color || '#000000' }}
            />
          </div>
        )}

        {/* Title */}
        {title && (
          <h1
            style={titleStyle}
            className="text-2xl sm:text-3xl font-bold text-center mb-2"
          >
            {title}
          </h1>
        )}

        {/* Description */}
        {description && (
          <p
            style={descriptionStyle}
            className="text-center text-sm sm:text-base mb-6"
          >
            {description}
          </p>
        )}

        {/* Links/Buttons */}
        {links && links.length > 0 && (
          <div className="space-y-3">
            {links.map((link, idx) => (
              link.button_url && link.button_text && (
                <button
                  key={idx}
                  onClick={() => handleLinkClick(link.button_url, idx)}
                  style={buttonStyle}
                  className={`w-full px-6 py-3 font-semibold text-center transition-opacity hover:opacity-90 ${
                    BUTTON_STYLES[safeDesign.button_style] || BUTTON_STYLES.rounded
                  }`}
                >
                  {link.button_text}
                </button>
              )
            ))}
          </div>
        )}

        {/* Powered by QR Sensei */}
        {safeDesign.show_branding !== false && (
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              Powered by{' '}
              <a href="/" className="font-semibold hover:underline">
                QR Sensei
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
