import React, { useEffect, useState } from 'react';
import { MapPin, Navigation, BookmarkPlus, Tag, X, Loader } from 'lucide-react';

export default function MapLocationLanding({ data }) {
  const [isLoading, setIsLoading] = useState(true);
  const [mapData, setMapData] = useState(null);
  const [mapsUrl, setMapsUrl] = useState('');
  const [displayAddress, setDisplayAddress] = useState('');

  useEffect(() => {
    // Parse map data (address or lat,lon)
    let parsedData = typeof data.content === 'string' ? data.content : data.content_data || {};
    let url = '';
    let address = '';

    if (typeof parsedData === 'string') {
      // If content is a string, it's either "lat,lon" or an address
      if (parsedData.includes(',')) {
        const [lat, lon] = parsedData.split(',').map(s => s.trim());
        if (lat && lon && !isNaN(lat) && !isNaN(lon)) {
          url = `https://www.google.com/maps?q=${lat},${lon}`;
          address = `${lat}, ${lon}`;
        }
      } else if (parsedData) {
        url = `https://www.google.com/maps?q=${encodeURIComponent(parsedData)}`;
        address = parsedData;
      }
    } else if (parsedData.latitude && parsedData.longitude) {
      url = `https://www.google.com/maps?q=${parsedData.latitude},${parsedData.longitude}`;
      address = `${parsedData.latitude}, ${parsedData.longitude}`;
    } else if (parsedData.address) {
      url = `https://www.google.com/maps?q=${encodeURIComponent(parsedData.address)}`;
      address = parsedData.address;
    }

    setMapData(parsedData);
    setMapsUrl(url);
    setDisplayAddress(address);
    setIsLoading(false);
  }, [data]);

  // Auto-redirect to Google Maps after a short delay (allows the page to load)
  useEffect(() => {
    if (mapsUrl && !isLoading) {
      const timer = setTimeout(() => {
        window.location.href = mapsUrl;
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [mapsUrl, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading location...</p>
        </div>
      </div>
    );
  }

  // Render the map interface similar to Google Maps
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Map Container */}
      <div className="flex-1 relative bg-gray-100 overflow-hidden">
        {mapData?.latitude && mapData?.longitude ? (
          <iframe
            title="Location Map"
            width="100%"
            height="100%"
            frameBorder="0"
            src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyD_kP-Yp06qSW5PCUbxXqLR7GkYhgBFAOo&q=${mapData.latitude},${mapData.longitude}&zoom=15`}
            allowFullScreen=""
            loading="lazy"
            style={{ border: 'none' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Loading map...</p>
            </div>
          </div>
        )}

        {/* Top Bar with Location Name and Close */}
        <div className="absolute top-0 left-0 right-0 bg-white shadow-md">
          <div className="flex items-center justify-between p-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Location</p>
              <p className="text-xs text-gray-500 truncate">{displayAddress}</p>
            </div>
            <button className="p-1 hover:bg-gray-100 rounded-lg transition">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons Bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-4 space-y-3">
        {/* Directions Button (Primary) */}
        <a
          href={`https://maps.google.com/?q=${displayAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Navigation className="w-5 h-5" />
          Directions
        </a>

        {/* Secondary Actions */}
        <div className="flex gap-3">
          {/* Save Location */}
          <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95">
            <BookmarkPlus className="w-4 h-4" />
            Save
          </button>

          {/* Add Label */}
          <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95">
            <Tag className="w-4 h-4" />
            Add label
          </button>
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-center text-xs text-gray-400 pb-4 px-4">
        Redirecting to Google Maps...
      </div>
    </div>
  );
}
