import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

// Fix for default Leaflet marker icons in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapLocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
}

export default function MapLocationPicker({ onLocationSelect, initialLat, initialLng }: MapLocationPickerProps) {
  const [position, setPosition] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : null
  );
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const mapRef = useRef<L.Map>(null);

  const defaultCenter: [number, number] = [11.0168, 76.9558]; // Default coordinates
  const mapCenter = position || defaultCenter;

  const reverseGeocode = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await res.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
        onLocationSelect(lat, lng, data.display_name);
      } else {
        setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        onLocationSelect(lat, lng, `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    } catch (err) {
      console.error("Geocoding failed", err);
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      onLocationSelect(lat, lng, `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } finally {
      setLoading(false);
    }
  };

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        setPosition([e.latlng.lat, e.latlng.lng]);
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      },
    });

    return position === null ? null : (
      <Marker position={position} />
    );
  };

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setPosition([lat, lng]);
          if (mapRef.current) {
            mapRef.current.flyTo([lat, lng], 15);
          }
          reverseGeocode(lat, lng);
        },
        (err) => {
          console.error(err);
          alert('Location access denied or unavailable.');
          setLoading(false);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-semibold text-gray-700">Select Location on Map</label>
        <button 
          type="button" 
          onClick={handleUseMyLocation}
          className="flex items-center text-sm font-semibold text-teal-600 hover:text-teal-800 transition-colors"
        >
          <Navigation className="w-4 h-4 mr-1" /> Use My Location
        </button>
      </div>

      <div className="relative h-64 w-full rounded-xl overflow-hidden border-2 border-gray-200">
        <MapContainer 
          center={mapCenter} 
          zoom={13} 
          scrollWheelZoom={true} 
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker />
        </MapContainer>
        
        {loading && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-[1000]">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          </div>
        )}
      </div>

      {address && (
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-start">
          <MapPin className="w-5 h-5 text-teal-600 mr-2 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-gray-800 font-medium">{address}</p>
            {position && (
              <p className="text-xs text-gray-500 mt-1">
                Lat: {position[0].toFixed(6)}, Lng: {position[1].toFixed(6)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
