import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

const FONT_MAP = {
  open_sans: "'Open Sans', sans-serif",
  poppins: "'Poppins', sans-serif",
  inter: "'Inter', sans-serif",
  roboto: "'Roboto', sans-serif"
};

const BUTTON_STYLES = {
  rounded: 'rounded-lg',
  square: 'rounded-none',
  pill: 'rounded-full'
};

export default function LinkpageLanding({ initialData, qrCodeId: propQrCodeId, shortCode: propShortCode }) {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [linkpageData, setLinkpageData] = useState(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  const [qrCodeId, setQrCodeId] = useState(propQrCodeId || null);

  useEffect(() => {
    if (initialData) return;

    const fetchLinkpage = async () => {
      try {
        setLoading(true);
        const response = await base44.functions.invoke('resolveLinkpageSlug', { slug });

        // Handle inactive subscription
        if (response && response.content_type === 'inactive') {
          setError(response.message || 'This Linkpage is inactive.');
          setLoading(false);
          return;
        }

        // Handle missing data
        if (!response || !response.linkpage) {
          setError(response?.error || 'Linkpage not found');
          setLoading(false);
          return;
        }

        // If a short_code exists, redirect seamlessly to the tracking link
        if (response.short_code) {
          navigate(`/r?code=${response.short_code}`, { replace: true });
          return;
        }

        setQrCodeId(response.id);
        setLinkpageData(response.linkpage);
        setLoading(false);
      } catch (err) {
        console.error('Error resolving linkpage slug:', err);
        setError('Failed to load linkpage');
        setLoading(false);
      }
    };

    fetchLinkpage();
  }, [slug, initialData, navigate]);

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
          <p className="text-gray-600 max-w-sm mx-auto">{error || 'The linkpage you are looking for does not exist.'}</p>
        </div>
      </div>
    );
  }

  const { profile_image, title, description, links, design, browser_title } = linkpageData || {};

  React.useEffect(() => {
    if (browser_title) document.title = browser_title;
  }, [browser_title]);

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
    font_family: 'open_sans',
    title_color: '#000000',
    description_color: '#666666',
    button_style: 'rounded',
    button_color: '#2f3f7f',
    button_text_color: '#ffffff'
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

  const titleStyle = { color: safeDesign.title_color || '#000000', fontFamily: FONT_MAP[safeDesign.font_family] || FONT_MAP.open_sans };
  const descriptionStyle = { color: safeDesign.description_color || '#666666', fontFamily: FONT_MAP[safeDesign.font_family] || FONT_MAP.open_sans };
  const buttonStyle = { backgroundColor: safeDesign.button_color || '#2f3f7f', color: safeDesign.button_text_color || '#ffffff', fontFamily: FONT_MAP[safeDesign.font_family] || FONT_MAP.open_sans };

  const handleLinkClick = (url, index) => {
    if (qrCodeId) {
      base44.functions.invoke('trackLinkClick', {
        short_code: qrCodeId,
        link_index: index,
        link_url: url
      }).catch(err => console.error('Failed to track link click:', err));
    }
    window.location.href = url;
  };

  return (
    <div style={backgroundStyle} className="min-h-screen p-4 sm:p-6 md:p-8">
      {backgroundImageStyle && <div style={backgroundImageStyle}></div>}
      {overlayStyle && <div style={overlayStyle}></div>}
      <div className="max-w-md mx-auto relative z-10">
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
        {title && (
          <h1 style={titleStyle} className="text-2xl sm:text-3xl font-bold text-center mb-2">{title}</h1>
        )}
        {description && (
          <p style={descriptionStyle} className="text-center text-sm sm:text-base mb-6">{description}</p>
        )}
        {links && links.length > 0 && (
          <div className="space-y-3">
            {links.map((link, idx) => (
              link.button_url && link.button_text && (
                <button
                  key={idx}
                  onClick={() => handleLinkClick(link.button_url, idx)}
                  style={buttonStyle}
                  className={`w-full px-6 py-3 font-semibold text-center transition-opacity hover:opacity-90 ${BUTTON_STYLES[safeDesign.button_style] || BUTTON_STYLES.rounded}`}
                >
                  {link.button_text}
                </button>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}