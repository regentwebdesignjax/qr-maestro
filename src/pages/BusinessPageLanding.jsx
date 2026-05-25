import React from 'react';
import { Phone, Mail, MapPin, Building2 } from 'lucide-react';

const formatPhone = (phone) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
};

const convertTo12Hour = (time24) => {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export default function BusinessPageLanding({ data, fullPage = true }) {
  // Parse business page data - handle both preview (already parsed) and redirect (needs parsing)
  const pageData = data.business_name ? data : (typeof data.content === 'string' ? JSON.parse(data.content) : data.content || {});

  // Utility function to get business day status
  const getTodayHours = () => {
    const days = ['Sun.', 'Mon.', 'Tues.', 'Wed.', 'Thurs.', 'Fri.', 'Sat.'];
    const today = days[new Date().getDay()];
    return pageData.schedule?.find(s => s.day === today);
  };

  const todayHours = getTodayHours();
  const isOpen = todayHours && !todayHours.closed;

  const buttonColor = pageData.button_color || '#2f3f7f';

  return (
    <div className={`${fullPage ? 'min-h-screen' : ''} bg-gradient-to-b from-gray-50 to-white`}>
      {/* Brand Header Image */}
      <div className="relative w-full h-64 sm:h-80 bg-gradient-to-br from-gray-700 to-gray-900 overflow-hidden">
        {pageData.brand_image ? (
          <img src={pageData.brand_image} alt="Brand" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-white/30">Brand Image</span>
          </div>
        )}
        {/* Logo overlapping banner */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-200 flex items-center justify-center">
            {pageData.logo ? (
              <img src={pageData.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-12">
        {/* Identity block */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{pageData.business_name}</h1>
          {pageData.headline && (
            <p className="text-lg text-gray-600">{pageData.headline}</p>
          )}
        </div>

        {/* Message/Description Card */}
        {pageData.message && (
          <div className="mb-8 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <p className="text-gray-700 leading-relaxed">{pageData.message}</p>
          </div>
        )}

        {/* Contact Information */}
        <div className="space-y-3 mb-8">
          {pageData.contact_name && (
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <div>
                <p className="font-semibold text-gray-900">{pageData.contact_name}</p>
                {pageData.contact_title && (
                  <p className="text-sm text-gray-600">{pageData.contact_title}</p>
                )}
              </div>
            </div>
          )}

          {pageData.phone && (
            <a
              href={`tel:${pageData.phone}`}
              className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Phone className="w-5 h-5 text-gray-400 shrink-0" />
              <span className="text-gray-700">{formatPhone(pageData.phone)}</span>
            </a>
          )}

          {pageData.email && (
            <a
              href={`mailto:${pageData.email}`}
              className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Mail className="w-5 h-5 text-gray-400 shrink-0" />
              <span className="text-gray-700">{pageData.email}</span>
            </a>
          )}

          {pageData.address && (
            <a
              href={`https://www.google.com/maps?q=${encodeURIComponent(pageData.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
              <span className="text-gray-700">{pageData.address}</span>
            </a>
          )}
        </div>

        {/* Business Hours */}
        {pageData.schedule && pageData.schedule.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Business Hours</h2>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {pageData.schedule.map((day, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0"
                >
                  <span className="font-medium text-gray-900 w-20">{day.day}</span>
                  <span className={`${day.closed ? 'text-gray-500' : 'text-gray-600'}`}>
                    {day.closed ? 'Closed' : `${convertTo12Hour(day.open)} – ${convertTo12Hour(day.close)}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Button */}
        {pageData.button_url && (
          <div className="mb-8">
            <a
              href={pageData.button_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full sm:w-auto text-center py-3 px-6 rounded-lg font-semibold text-white transition-all"
              style={{
                backgroundColor: buttonColor,
              }}
              onMouseEnter={(e) => {
                const c = buttonColor.replace('#', '');
                const factor = 0.85;
                const r = Math.max(0, Math.round(parseInt(c.substring(0, 2), 16) * factor));
                const g = Math.max(0, Math.round(parseInt(c.substring(2, 4), 16) * factor));
                const b = Math.max(0, Math.round(parseInt(c.substring(4, 6), 16) * factor));
                const hoverColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
                e.currentTarget.style.backgroundColor = hoverColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = buttonColor;
              }}
            >
              {pageData.button_title || 'Learn More'}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
