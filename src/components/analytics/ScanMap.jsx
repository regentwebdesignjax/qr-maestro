import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import 'leaflet/dist/leaflet.css';

// Approximate country centroids for common countries
const COUNTRY_COORDS = {
  'United States': [37.09, -95.71],
  'US': [37.09, -95.71],
  'United Kingdom': [55.37, -3.44],
  'UK': [55.37, -3.44],
  'Canada': [56.13, -106.35],
  'Germany': [51.17, 10.45],
  'France': [46.23, 2.21],
  'Australia': [-25.27, 133.78],
  'India': [20.59, 78.96],
  'Brazil': [-14.24, -51.93],
  'Japan': [36.20, 138.25],
  'China': [35.86, 104.19],
  'Mexico': [23.63, -102.55],
  'Italy': [41.87, 12.57],
  'Spain': [40.46, -3.75],
  'Netherlands': [52.13, 5.29],
  'Sweden': [60.13, 18.64],
  'Norway': [60.47, 8.47],
  'Denmark': [56.26, 9.50],
  'Russia': [61.52, 105.32],
  'South Korea': [35.91, 127.77],
  'Argentina': [-38.42, -63.62],
  'South Africa': [-30.56, 22.94],
  'Nigeria': [9.08, 8.68],
  'Egypt': [26.82, 30.80],
  'Turkey': [38.96, 35.24],
  'Poland': [51.92, 19.15],
  'Indonesia': [-0.79, 113.92],
  'Thailand': [15.87, 100.99],
  'Philippines': [12.88, 121.77],
  'Singapore': [1.35, 103.82],
  'New Zealand': [-40.90, 174.89],
  'Portugal': [39.40, -8.22],
  'Belgium': [50.50, 4.47],
  'Switzerland': [46.82, 8.23],
  'Austria': [47.52, 14.55],
  'Israel': [31.05, 34.85],
  'UAE': [23.42, 53.85],
  'Saudi Arabia': [23.89, 45.08],
};

export default function ScanMap({ scans }) {
  // Aggregate by country
  const countryCounts = scans.reduce((acc, scan) => {
    const country = scan.country;
    if (!country) return acc;
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {});

  const maxCount = Math.max(...Object.values(countryCounts), 1);

  const markers = Object.entries(countryCounts)
    .map(([country, count]) => {
      // Try lat/lng directly on scan if available, fallback to country lookup
      const coords = COUNTRY_COORDS[country];
      if (!coords) return null;
      return { country, count, coords };
    })
    .filter(Boolean);

  // Also handle scans with direct lat/lng
  const latLngScans = scans.filter(s => s.lat && s.lng);

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Scan Locations</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-hidden rounded-b-xl">
        <div style={{ height: 400 }}>
          <MapContainer
            center={[20, 0]}
            zoom={2}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap contributors"
            />

            {/* Country-level circles */}
            {markers.map(({ country, count, coords }) => (
              <CircleMarker
                key={country}
                center={coords}
                radius={6 + (count / maxCount) * 20}
                pathOptions={{
                  fillColor: '#3b82f6',
                  fillOpacity: 0.6,
                  color: '#1d4ed8',
                  weight: 1.5,
                }}
              >
                <Tooltip>
                  <span className="font-medium">{country}</span>: {count} scan{count !== 1 ? 's' : ''}
                </Tooltip>
              </CircleMarker>
            ))}

            {/* Precise lat/lng markers if available */}
            {latLngScans.map((scan, i) => (
              <CircleMarker
                key={`latlong-${i}`}
                center={[scan.lat, scan.lng]}
                radius={8}
                pathOptions={{ fillColor: '#10b981', fillOpacity: 0.7, color: '#059669', weight: 1.5 }}
              >
                <Tooltip>
                  {scan.city || scan.country || 'Unknown'}: 1 scan
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {markers.length === 0 && latLngScans.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80">
            <p className="text-gray-500">No location data available yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}