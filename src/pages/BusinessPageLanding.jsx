import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Globe, ChevronDown, Building2 } from 'lucide-react';

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

export default function BusinessPageLanding({ data }) {
  const [expandedDay, setExpandedDay] = useState(null);

  // Parse business page data - handle both preview (already parsed) and redirect (needs parsing)
  const pageData = data.business_name ? data : (typeof data.content === 'string' ? JSON.parse(data.content) : data.content || {});

  // Utility function to get business day status
  const getTodayHours = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    return pageData.schedule?.find(s => s.day === today);
  };

  const todayHours = getTodayHours();
  const isOpen = todayHours && !todayHours.closed;

  const buttonColor = pageData.button_color || '#2f3f7f';

  return (
    <div className="flex justify-center">
      {/* Phone frame */}
      <div className="w-[280px] rounded-[2rem] border-[6px] border-gray-800 shadow-2xl overflow-hidden bg-white">
        {/* Status bar */}
        <div className="bg-gray-800 h-6 flex items-center justify-center">
          <div className="w-16 h-1.5 rounded-full bg-gray-600"></div>
        </div>

        {/* Card content */}
        <div className="overflow-y-auto max-h-[520px] bg-gray-50">
          {/* Brand Header Image */}
          <div className="relative w-full aspect-[3/1] bg-gradient-to-br from-gray-700 to-gray-900 overflow-visible">
            {pageData.brand_image ? (
              <img src={pageData.brand_image} alt="Brand" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-white/30 text-xs">Brand Image</span>
              </div>
            )}
            {/* Logo overlapping banner */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
              <div className="w-20 h-20 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-200 flex items-center justify-center">
                {pageData.logo ? (
                  <img src={pageData.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <Building2 className="w-10 h-10 text-gray-400" />
                )}
              </div>
            </div>
          </div>

          {/* Identity block */}
          <div className="pt-12 px-4 pb-2 text-center">
            <h1 className="text-base font-bold text-gray-900 leading-tight">{pageData.business_name}</h1>
            {pageData.headline && (
              <p className="text-xs text-gray-500 mt-0.5">{pageData.headline}</p>
            )}

            {pageData.message && (
              <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-3">{pageData.message}</p>
            )}
          </div>

          {/* Message/Description Card */}
          {pageData.message && (
            <div className="px-4 py-3">
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <p className="text-xs text-gray-700 leading-relaxed">{pageData.message}</p>
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="px-4 pb-3 space-y-1.5">
            {pageData.contact_name && (
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100">
                <span className="text-xs font-medium text-gray-700">{pageData.contact_name}</span>
              </div>
            )}

            {pageData.phone && (
              <a
                href={`tel:${pageData.phone}`}
                className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="text-xs text-gray-700 truncate">{formatPhone(pageData.phone)}</span>
              </a>
            )}

            {pageData.email && (
              <a
                href={`mailto:${pageData.email}`}
                className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="text-xs text-gray-700 truncate">{pageData.email}</span>
              </a>
            )}

            {pageData.address && (
              <a
                href={`https://www.google.com/maps?q=${encodeURIComponent(pageData.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="text-xs text-gray-700 truncate">{pageData.address}</span>
              </a>
            )}
          </div>

          {/* Business Hours */}
          {pageData.schedule && pageData.schedule.length > 0 && (
            <div className="px-4 pb-3">
              <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                {pageData.schedule.map((day, idx) => (
                  <div key={idx}>
                    <button
                      onClick={() => setExpandedDay(expandedDay === idx ? null : idx)}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center gap-2 text-left flex-1">
                        <span className="font-medium text-gray-900 text-xs w-16">{day.day}</span>
                        <span className={`text-xs ${day.closed ? 'text-gray-500' : 'text-gray-600'}`}>
                          {day.closed ? 'Closed' : `${convertTo12Hour(day.open)} – ${convertTo12Hour(day.close)}`}
                        </span>
                      </div>
                      <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${expandedDay === idx ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA Button */}
          {pageData.button_url && (
            <div className="px-4 py-3">
              <a
                href={pageData.button_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block text-center py-2 px-4 rounded-lg font-semibold text-white text-xs transition-all"
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

        {/* Home indicator */}
        <div className="bg-gray-800 h-6 flex items-end justify-center pb-1.5">
          <div className="w-12 h-1 rounded-full bg-gray-600"></div>
        </div>
      </div>
    </div>
  );
}
