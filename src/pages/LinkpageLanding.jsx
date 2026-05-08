import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

const FONT_MAP = {
  open_sans: "'Open Sans', sans-serif",
  poppins: "'Poppins', sans-serif",
  inter: "'Inter', sans-serif",
  roboto: "'Roboto', sans-serif"
};

const BORDER_RADIUS = {
  rounded: '10px',
  square: '0px',
  pill: '9999px'
};

function isDarkColor(hex) {
  const clean = (hex || '#ffffff').replace('#', '');
  if (clean.length !== 6) return false;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
}

export default function LinkpageLanding({ initialData, qrCodeId: propQrCodeId }) {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [linkpageData, setLinkpageData] = useState(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  const [qrCodeId, setQrCodeId] = useState(propQrCodeId || null);
  const [hoveredBtn, setHoveredBtn] = useState(null);

  useEffect(() => {
    if (initialData) return;

    const fetchLinkpage = async () => {
      try {
        setLoading(true);
        const response = await base44.functions.invoke('resolveLinkpageSlug', { slug });
        const resolvedData = response.data || response;

        if (resolvedData?.content_type === 'inactive') {
          setError(resolvedData.message || 'This Linkpage is inactive.');
          setLoading(false);
          return;
        }

        if (!resolvedData?.linkpage) {
          setError(resolvedData?.error || 'Linkpage not found');
          setLoading(false);
          return;
        }

        if (resolvedData.short_code) {
          navigate(`/r?code=${resolvedData.short_code}`, { replace: true });
          return;
        }

        setQrCodeId(resolvedData.id);
        setLinkpageData(resolvedData.linkpage);
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-10 w-10 mx-auto mb-4"
            style={{ border: '2px solid #e5e7eb', borderTopColor: '#BB3F27' }}
          />
          <p className="text-sm text-gray-400 font-medium tracking-wide">Loading…</p>
        </div>
      </div>
    );
  }

  if (error || !linkpageData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center px-6">
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4 text-2xl">
            🔗
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            {error || 'The linkpage you are looking for does not exist.'}
          </p>
        </div>
      </div>
    );
  }

  const { profile_image, title, description, links, design, browser_title } = linkpageData;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  React.useEffect(() => {
    if (browser_title) document.title = browser_title;
  }, [browser_title]);

  const safeDesign = design || {
    background_type: 'solid',
    background_color: '#ffffff',
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

  const fontFamily = FONT_MAP[safeDesign.font_family] || FONT_MAP.open_sans;

  // Determine if background is dark for footer contrast
  const darkBg = (() => {
    if (safeDesign.background_type === 'gradient') return isDarkColor(safeDesign.gradient_start);
    if (safeDesign.background_type === 'image') {
      return (safeDesign.overlay_opacity || 0) > 0.5
        ? isDarkColor(safeDesign.overlay_color)
        : false;
    }
    return isDarkColor(safeDesign.background_color);
  })();

  let backgroundStyle = { fontFamily, position: 'relative' };
  if (safeDesign.background_type === 'solid') {
    backgroundStyle.backgroundColor = safeDesign.background_color || '#ffffff';
  } else if (safeDesign.background_type === 'gradient') {
    backgroundStyle.background = `linear-gradient(160deg, ${safeDesign.gradient_start || '#2f3f7f'} 0%, ${safeDesign.gradient_end || '#ffffff'} 100%)`;
  } else {
    backgroundStyle.backgroundColor = safeDesign.background_color || '#ffffff';
  }

  const backgroundImageStyle =
    safeDesign.background_type === 'image' && safeDesign.background_image
      ? {
          position: 'fixed',
          inset: 0,
          backgroundImage: `url(${safeDesign.background_image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          opacity: safeDesign.background_opacity ?? 1,
          filter:
            safeDesign.background_saturation && safeDesign.background_saturation !== 100
              ? `saturate(${safeDesign.background_saturation / 100})`
              : undefined,
          pointerEvents: 'none',
          zIndex: 0,
        }
      : null;

  const overlayStyle =
    safeDesign.background_type === 'image' && (safeDesign.overlay_opacity || 0) > 0
      ? {
          position: 'absolute',
          inset: 0,
          backgroundColor: safeDesign.overlay_color || '#000000',
          opacity: safeDesign.overlay_opacity,
          pointerEvents: 'none',
        }
      : null;

  const getButtonStyle = (idx) => ({
    backgroundColor: safeDesign.button_color || '#2f3f7f',
    color: safeDesign.button_text_color || '#ffffff',
    fontFamily,
    fontWeight: '600',
    fontSize: '15px',
    borderRadius: BORDER_RADIUS[safeDesign.button_style] || BORDER_RADIUS.rounded,
    boxShadow:
      hoveredBtn === idx
        ? '0 8px 24px rgba(0,0,0,0.2)'
        : '0 2px 10px rgba(0,0,0,0.12)',
    transform: hoveredBtn === idx ? 'translateY(-2px)' : 'translateY(0)',
    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
  });

  const handleLinkClick = (url, index) => {
    if (qrCodeId) {
      base44.functions
        .invoke('trackLinkClick', { short_code: qrCodeId, link_index: index, link_url: url })
        .catch(() => {});
    }
    window.location.href = url;
  };

  return (
    <div style={backgroundStyle} className="min-h-screen">
      {backgroundImageStyle && <div style={backgroundImageStyle} />}
      {overlayStyle && <div style={overlayStyle} />}

      <div className="relative z-10 max-w-md mx-auto px-5 pt-14 pb-12">
        {/* Profile section */}
        <div className="flex flex-col items-center mb-8">
          {profile_image && (
            <div className="mb-5">
              <img
                src={profile_image}
                alt={title || 'Profile'}
                className="w-24 h-24 rounded-full object-cover"
                style={{
                  border: '3px solid rgba(255,255,255,0.85)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                }}
              />
            </div>
          )}

          {title && (
            <h1
              style={{ color: safeDesign.title_color || '#000000', fontFamily }}
              className="text-2xl font-bold text-center leading-tight mb-2"
            >
              {title}
            </h1>
          )}

          {description && (
            <p
              style={{ color: safeDesign.description_color || '#666666', fontFamily }}
              className="text-center text-sm leading-relaxed max-w-xs"
            >
              {description}
            </p>
          )}
        </div>

        {/* Links */}
        {links?.length > 0 && (
          <div className="space-y-3">
            {links.map((link, idx) =>
              link.button_url && link.button_text ? (
                <button
                  key={idx}
                  onClick={() => handleLinkClick(link.button_url, idx)}
                  onMouseEnter={() => setHoveredBtn(idx)}
                  onMouseLeave={() => setHoveredBtn(null)}
                  style={getButtonStyle(idx)}
                  className="w-full px-6 py-4 text-center cursor-pointer"
                >
                  {link.button_text}
                </button>
              ) : null
            )}
          </div>
        )}

        {/* Branded footer */}
        <div className="mt-12 text-center">
          <a
            href="https://qr-sensei.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily,
              fontSize: '11px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              color: darkBg ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Powered by{' '}
            <strong style={{ color: darkBg ? 'rgba(255,255,255,0.6)' : '#BB3F27' }}>
              QR Sensei
            </strong>
          </a>
        </div>
      </div>
    </div>
  );
}
