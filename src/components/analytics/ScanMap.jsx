import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import 'leaflet/dist/leaflet.css';

export default function ScanMap({ scans }) {
  // Group by city+country using lat/lng from scan records
  const cityMap = {};
  scans.forEach((scan) => {
    if (!scan.lat || !scan.lng) return;
    const key = `${scan.lat},${scan.lng}`;
    if (!cityMap[key]) {
      cityMap[key] = {
        lat: scan.lat,
        lng: scan.lng,
        city: scan.city || null,
        country: scan.country || null,
        count: 0,
      };
    }
    cityMap[key].count += 1;
  });

  const markers = Object.values(cityMap);
  const maxCount = Math.max(...markers.map(m => m.count), 1);

  const hasData = markers.length > 0;

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Scan Locations</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-hidden rounded-b-xl relative">
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

            {markers.map(({ lat, lng, city, country, count }) => (
              <CircleMarker
                key={`${lat},${lng}`}
                center={[lat, lng]}
                radius={6 + (count / maxCount) * 18}
                pathOptions={{
                  fillColor: '#3b82f6',
                  fillOpacity: 0.65,
                  color: '#1d4ed8',
                  weight: 1.5,
                }}
              >
                <Tooltip>
                  <span className="font-medium">
                    {[city, country].filter(Boolean).join(', ') || 'Unknown'}
                  </span>
                  : {count} scan{count !== 1 ? 's' : ''}
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80">
            <p className="text-gray-500 text-sm">No location data available yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}