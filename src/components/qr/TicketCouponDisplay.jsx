import React from 'react';

const FONT_OPTIONS = [
  { value: 'system', label: 'System (Default)', font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  { value: 'georgia', label: 'Georgia (Serif)', font: 'Georgia, serif' },
  { value: 'verdana', label: 'Verdana', font: 'Verdana, sans-serif' },
  { value: 'trebuchet', label: 'Trebuchet MS', font: '"Trebuchet MS", sans-serif' },
  { value: 'palatino', label: 'Palatino (Serif)', font: '"Palatino Linotype", "Book Antiqua", Palatino, serif' },
  { value: 'courier', label: 'Courier (Mono)', font: '"Courier New", monospace' },
  { value: 'times', label: 'Times New Roman (Serif)', font: '"Times New Roman", serif' },
  { value: 'arial', label: 'Arial', font: 'Arial, sans-serif' },
];

export default function TicketCouponDisplay({ couponData, branded, design_config }) {
  const themeColor = design_config?.landing_theme_color || '#BB3F27';
  const btnBg = design_config?.landing_button_bg || design_config?.cta_button_color || themeColor;
  const btnText = design_config?.landing_button_text || '#ffffff';
  const fontFamily = design_config?.coupon_font || 'system';

  const selectedFont = FONT_OPTIONS.find(f => f.value === fontFamily);
  const fontStyle = selectedFont?.font || FONT_OPTIONS[0].font;

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

  return (
    <div className="w-full flex items-center justify-center p-4">
      {/* Ticket Container - Responsive */}
      <div className="w-full max-w-2xl" style={{ fontFamily: fontStyle }}>
        {/* Mobile Layout (stacked) */}
        <div className="lg:hidden">
          {/* Ticket Box */}
          <div
            className="rounded-lg p-6 space-y-4 border-2"
            style={{
              borderColor: themeColor,
              backgroundColor: '#f8f8f8',
            }}
          >
            {/* Code Section */}
            <div className="text-center border-b-2 border-dashed pb-4" style={{ borderColor: themeColor }}>
              <p className="text-xs uppercase tracking-widest font-semibold text-gray-500 mb-2">Use Code</p>
              <p
                className="text-4xl font-black break-words"
                style={{ color: themeColor }}
              >
                {code}
              </p>
            </div>

            {/* Description & Button Section */}
            <div className="space-y-4">
              {description && (
                <div
                  className="prose prose-sm max-w-none text-gray-700 text-sm"
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              )}

              {redemptionUrl && (
                <a
                  href={redemptionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-4 py-3 rounded-lg font-semibold text-center transition-all hover:shadow-lg"
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

              {!redemptionUrl && description && (
                <div className="text-xs text-gray-500 italic text-center">
                  No redemption link provided
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Layout (side-by-side ticket) */}
        <div className="hidden lg:block">
          <div
            className="rounded-lg border-2 overflow-hidden"
            style={{ borderColor: themeColor, backgroundColor: '#f8f8f8' }}
          >
            <div className="flex">
              {/* Left Section - Code */}
              <div
                className="flex-1 flex flex-col items-center justify-center p-8 border-r-2 border-dashed min-h-80"
                style={{ borderColor: themeColor }}
              >
                <div className="text-center w-full">
                  <p className="text-xs uppercase tracking-widest font-semibold text-gray-500 mb-3">Use Code</p>
                  <p
                    className="text-6xl font-black break-words"
                    style={{ color: themeColor }}
                  >
                    {code}
                  </p>
                </div>
              </div>

              {/* Right Section - Description & Button */}
              <div className="flex-1 flex flex-col justify-between p-8">
                {/* Description */}
                {description && (
                  <div
                    className="prose prose-sm max-w-none text-gray-700 text-sm mb-4 line-clamp-4"
                    dangerouslySetInnerHTML={{ __html: description }}
                  />
                )}

                {/* Button or No URL Message */}
                {redemptionUrl ? (
                  <a
                    href={redemptionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 rounded-lg font-semibold text-center transition-all hover:shadow-lg self-start"
                    style={{
                      backgroundColor: btnBg,
                      color: btnText,
                    }}
                    onMouseEnter={(e) => (e.target.style.backgroundColor = btnBgHover)}
                    onMouseLeave={(e) => (e.target.style.backgroundColor = btnBg)}
                  >
                    {buttonText}
                  </a>
                ) : (
                  description && (
                    <div className="text-xs text-gray-500 italic">
                      No redemption link provided
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Helpful text below ticket */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Take a screenshot or note the code above</p>
        </div>
      </div>
    </div>
  );
}

export { FONT_OPTIONS };
