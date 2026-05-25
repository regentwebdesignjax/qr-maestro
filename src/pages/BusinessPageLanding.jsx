import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Globe, ChevronDown } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50">
      {/* Brand Header Image */}
      {pageData.brand_image && (
        <div className="w-full h-48 overflow-hidden bg-gray-200">
          <img src={pageData.brand_image} alt="Brand" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Logo and Title */}
        <div className="flex items-start gap-4">
          {pageData.logo && (
            <div className="flex-shrink-0">
              <img src={pageData.logo} alt="Logo" className="w-20 h-20 object-contain" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{pageData.business_name}</h1>
            {pageData.headline && (
              <p className="text-lg text-gray-600 mt-1">{pageData.headline}</p>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
          isOpen
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-600' : 'bg-red-600'}`} />
          {isOpen ? `Open until ${todayHours?.close || 'N/A'}` : 'Closed today'}
        </div>

        {/* Message/Description */}
        {pageData.message && (
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-gray-700 leading-relaxed">{pageData.message}</p>
          </div>
        )}

        {/* Contact Information */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Contact</h2>

          <div className="space-y-2">
            {pageData.contact_name && (
              <div className="flex items-center gap-3 text-gray-700">
                <span className="font-medium">{pageData.contact_name}</span>
              </div>
            )}

            {pageData.phone && (
              <a
                href={`tel:${pageData.phone}`}
                className="flex items-center gap-3 text-blue-600 hover:text-blue-700 font-medium"
              >
                <Phone className="w-5 h-5" />
                {pageData.phone}
              </a>
            )}

            {pageData.email && (
              <a
                href={`mailto:${pageData.email}`}
                className="flex items-center gap-3 text-blue-600 hover:text-blue-700 font-medium break-all"
              >
                <Mail className="w-5 h-5" />
                {pageData.email}
              </a>
            )}

            {pageData.address && (
              <a
                href={`https://www.google.com/maps?q=${encodeURIComponent(pageData.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-blue-600 hover:text-blue-700 font-medium"
              >
                <MapPin className="w-5 h-5" />
                {pageData.address}
              </a>
            )}
          </div>
        </div>

        {/* Business Hours */}
        {pageData.schedule && pageData.schedule.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Hours
            </h2>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {pageData.schedule.map((day, idx) => (
                <div key={idx}>
                  <button
                    onClick={() => setExpandedDay(expandedDay === idx ? null : idx)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center gap-3 text-left flex-1">
                      <span className="font-medium text-gray-900 w-24">{day.day}</span>
                      <span className={day.closed ? 'text-gray-500' : 'text-gray-600'}>
                        {day.closed ? 'Closed' : `${day.open} – ${day.close}`}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedDay === idx ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Button */}
        {pageData.button_url && (
          <a
            href={pageData.button_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full block text-center py-3 px-4 rounded-xl font-semibold text-white transition-all"
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
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-4">
          Scanned via QR Code
        </div>
      </div>
    </div>
  );
}
