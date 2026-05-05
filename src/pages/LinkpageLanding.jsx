import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
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

export default function LinkpageLanding() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const [linkpageData, setLinkpageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrCodeId, setQrCodeId] = useState(null);

  useEffect(() => {
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

    fetchLinkpage();
  }, [slug, searchParams]);

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
  const backgroundStyle = {
    backgroundColor: design.background_color,
    backgroundImage: design.background_type === 'image' && design.background_image
      ? `url(${design.background_image})`
      : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    fontFamily: FONT_MAP[design.font_family] || FONT_MAP.open_sans
  };

  const titleStyle = {
    color: design.title_color,
    fontFamily: FONT_MAP[design.font_family] || FONT_MAP.open_sans
  };

  const descriptionStyle = {
    color: design.description_color,
    fontFamily: FONT_MAP[design.font_family] || FONT_MAP.open_sans
  };

  const buttonStyle = {
    backgroundColor: design.button_color,
    color: design.button_text_color,
    fontFamily: FONT_MAP[design.font_family] || FONT_MAP.open_sans
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
      <div className="max-w-md mx-auto">
        {/* Profile Image */}
        {profile_image && (
          <div className="mb-6 flex justify-center">
            <img
              src={profile_image}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover border-4"
              style={{ borderColor: design.title_color }}
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
                    BUTTON_STYLES[design.button_style] || BUTTON_STYLES.rounded
                  }`}
                >
                  {link.button_text}
                </button>
              )
            ))}
          </div>
        )}

        {/* Powered by QR Maestro */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Powered by{' '}
            <a href="/" className="font-semibold hover:underline">
              QR Maestro
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
