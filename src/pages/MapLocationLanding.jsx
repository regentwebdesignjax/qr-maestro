import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';

export default function MapLocationLanding({ data }) {
  const mapData = typeof data.content === 'string' ? data.content : data.content_data || {};

  // Parse map data (address or lat,lon)
  let mapsUrl = '';
  if (typeof mapData === 'string') {
    // If content is a string, it's either "lat,lon" or an address
    if (mapData.includes(',')) {
      const [lat, lon] = mapData.split(',').map(s => s.trim());
      if (lat && lon && !isNaN(lat) && !isNaN(lon)) {
        mapsUrl = `https://www.google.com/maps?q=${lat},${lon}`;
      }
    } else if (mapData) {
      mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(mapData)}`;
    }
  } else if (mapData.latitude && mapData.longitude) {
    mapsUrl = `https://www.google.com/maps?q=${mapData.latitude},${mapData.longitude}`;
  } else if (mapData.address) {
    mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(mapData.address)}`;
  }

  const displayAddress = (typeof mapData === 'string' && !mapData.includes(','))
    ? mapData
    : (mapData.address || `${mapData.latitude}, ${mapData.longitude}`);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Location</h1>
          </div>
          <p className="text-blue-100">Tap below to view on map</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-gray-600 text-sm mb-1">Address</p>
            <p className="text-lg font-semibold text-gray-900 break-words">{displayAddress}</p>
          </div>

          {/* Map Preview (if coordinates available) */}
          {mapData.latitude && mapData.longitude && (
            <div className="relative w-full h-48 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
              <iframe
                title="Location Map"
                width="100%"
                height="100%"
                frameBorder="0"
                src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyD_kP-Yp06qSW5PCUbxXqLR7GkYhgBFAOo&q=${mapData.latitude},${mapData.longitude}`}
                allowFullScreen=""
                loading="lazy"
              />
            </div>
          )}

          {/* Open Map Button */}
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <ExternalLink className="w-5 h-5" />
              View on Google Maps
            </a>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 text-center text-sm text-gray-500">
          Scanned via QR Code
        </div>
      </div>
    </div>
  );
}
