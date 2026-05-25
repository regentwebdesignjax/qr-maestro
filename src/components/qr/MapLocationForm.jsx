import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Loader } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const loadGoogleMapsPlaces = (apiKey) => {
  if (window.google?.maps?.places) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById('google-maps-places-script');
    if (existingScript) {
      existingScript.addEventListener('load', resolve, { once: true });
      existingScript.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-places-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

export default function MapLocationForm({ data, onChange }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState('');
  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const addressInputRef = useRef(null);

  // Initialize Google Places services on component mount
  useEffect(() => {
    const initGooglePlaces = async () => {
      try {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          setError('Google Maps API key not configured');
          setIsInitializing(false);
          return;
        }

        await loadGoogleMapsPlaces(apiKey);

        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        placesService.current = new window.google.maps.places.PlacesService(
          document.createElement('div')
        );
        setIsInitializing(false);
      } catch (err) {
        console.error('Failed to initialize Google Places API:', err);
        setError('Could not load address suggestions');
        setIsInitializing(false);
      }
    };

    initGooglePlaces();
  }, []);

  const handleAddressChange = async (value) => {
    const updated = { ...data, address: value };
    onChange(updated);

    if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (!autocompleteService.current || isInitializing) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingPlaces(true);
    setError('');

    try {
      const predictions = await autocompleteService.current.getPlacePredictions({
        input: value,
        componentRestrictions: { country: 'us' },
      });

      setSuggestions(predictions.predictions || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Places API error:', err);
      setError('Address suggestions temporarily unavailable');
      setSuggestions([]);
    } finally {
      setIsLoadingPlaces(false);
    }
  };

  const handleSelectSuggestion = async (suggestion) => {
    const { main_text, description, place_id } = suggestion;
    const fullAddress = description;

    // Update address field
    const updated = { ...data, address: fullAddress };
    onChange(updated);

    setSuggestions([]);
    setShowSuggestions(false);

    // Get detailed place info to extract coordinates
    if (!placesService.current) return;

    setIsLoadingPlaces(true);
    try {
      placesService.current.getDetails(
        { placeId: place_id, fields: ['geometry', 'formatted_address'] },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place?.geometry) {
            const { lat, lng } = place.geometry.location;
            const updatedWithCoords = {
              ...updated,
              latitude: lat(),
              longitude: lng(),
            };
            onChange(updatedWithCoords);
          }
          setIsLoadingPlaces(false);
        }
      );
    } catch (err) {
      console.error('Error getting place details:', err);
      setIsLoadingPlaces(false);
    }
  };

  return (
    <div className="space-y-3">
      {isInitializing && (
        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded text-blue-700 text-xs">
          <Loader className="w-3 h-3 animate-spin" />
          Loading address suggestions...
        </div>
      )}

      {/* Address Input with Autocomplete */}
      <div className="relative">
        <Label className="text-xs text-gray-500">Address or Business Name *</Label>
        <div className="relative">
          <Input
            ref={addressInputRef}
            placeholder={isInitializing ? "Loading..." : "Start typing an address..."}
            value={data.address}
            onChange={(e) => handleAddressChange(e.target.value)}
            onFocus={() => data.address.length > 1 && setShowSuggestions(true)}
            disabled={isInitializing}
            className="w-full"
          />
          {isLoadingPlaces && (
            <div className="absolute right-3 top-10 text-gray-400">
              <Loader className="w-4 h-4 animate-spin" />
            </div>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto mt-1">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSuggestion(suggestion)}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                type="button"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">
                      {suggestion.main_text}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {suggestion.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}

        <p className="text-xs text-gray-400 mt-1">
          Suggestions provide accurate coordinates for embedded maps
        </p>
      </div>

      {/* Manual Latitude/Longitude Input */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-gray-500">
            Latitude <span className="text-gray-400">(Optional)</span>
          </Label>
          <Input
            placeholder="40.7128"
            type="number"
            step="any"
            value={data.latitude}
            onChange={(e) => {
              const updated = { ...data, latitude: e.target.value };
              onChange(updated);
            }}
          />
        </div>
        <div>
          <Label className="text-xs text-gray-500">
            Longitude <span className="text-gray-400">(Optional)</span>
          </Label>
          <Input
            placeholder="-74.0060"
            type="number"
            step="any"
            value={data.longitude}
            onChange={(e) => {
              const updated = { ...data, longitude: e.target.value };
              onChange(updated);
            }}
          />
        </div>
      </div>
    </div>
  );
}