import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, Loader2, Navigation, Layers, CheckSquare, FileText, 
  Wrench, Building2, AlertTriangle, RefreshCw
} from 'lucide-react';
import { citizenApi } from '../../../services/citizenApi';

// Icon Definitions
const createIcon = (color: string) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const icons = {
  PROJECT: createIcon('blue'),
  SERVICE_REQUEST: createIcon('orange'),
  REPORT: createIcon('red'),
  FACILITY: createIcon('green'),
  ME: createIcon('violet')
};

// Component to handle map centering and user location
function MapController({ center, zoom }: { center: [number, number] | null, zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { animate: true, duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function CitizenMap() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mapData, setMapData] = useState<any[]>([]);
  
  // Filters
  const [layers, setLayers] = useState({
    PROJECT: true,
    SERVICE_REQUEST: true,
    REPORT: true,
    FACILITY: true
  });
  
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([11.0168, 76.9558]);
  const [mapZoom, setMapZoom] = useState(13);
  
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMapData = async () => {
    setLoading(true);
    setError('');
    try {
      // Create citizenApi.getMapData method or just use generic get
      const res = await citizenApi.get('/map/data');
      if (res.success) {
        setMapData(res.data);
      } else {
        setError('Failed to load map data.');
      }
    } catch (err) {
      console.error(err);
      setError('Unable to reach map services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, []);

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserLocation([lat, lng]);
          setMapCenter([lat, lng]);
          setMapZoom(15);
        },
        (err) => {
          console.error(err);
          alert('Location access denied or unavailable.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const filteredData = useMemo(() => {
    let data = mapData.filter(item => layers[item.type as keyof typeof layers]);
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter(item => 
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.location && item.location.toLowerCase().includes(q))
      );
    }
    return data;
  }, [mapData, layers, searchQuery]);

  const handleNavigateToDetails = (item: any) => {
    if (item.type === 'SERVICE_REQUEST') navigate(`/citizen/services/${item.id}`);
    else if (item.type === 'REPORT') navigate(`/citizen/reports/${item.id}`);
    // Public projects/facilities might not have dedicated citizen detail pages yet, 
    // or they could route to a general page.
  };

  const handleGetDirections = (lat: number, lng: number) => {
    // External link to Google Maps since we don't have a paid routing API built-in
    let url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    if (userLocation) {
      url += `&origin=${userLocation[0]},${userLocation[1]}`;
    }
    window.open(url, '_blank');
  };

  if (loading && mapData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 className="w-12 h-12 text-teal-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading Municipal Map...</p>
      </div>
    );
  }

  if (error && mapData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center max-w-md mx-auto">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to load the municipal map.</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <button onClick={fetchMapData} className="px-6 py-2 bg-slate-900 text-white rounded-lg">Retry</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] -m-4 sm:-m-6 lg:-m-8">
      
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-4 z-10 shrink-0 shadow-sm">
        <div className="flex items-center">
          <MapPin className="w-6 h-6 text-teal-600 mr-2" />
          <h1 className="text-xl font-bold text-gray-900">Municipal Map</h1>
        </div>
        
        <div className="flex-1 max-w-md w-full relative">
          <input 
            type="text" 
            placeholder="Search municipal locations..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2 bg-gray-100 border-transparent focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 rounded-lg text-sm transition-all"
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={fetchMapData}
            className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button 
            onClick={handleUseMyLocation}
            className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Navigation className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">My Location</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 relative overflow-hidden">
        
        {/* Sidebar Filters */}
        <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col shrink-0 overflow-y-auto hidden md:flex z-10 shadow-[4px_0_15px_-3px_rgba(0,0,0,0.05)]">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center">
            <Layers className="w-4 h-4 mr-2" /> Map Layers
          </h2>
          
          <div className="space-y-4">
            <label className="flex items-center cursor-pointer group">
              <input type="checkbox" checked={layers.SERVICE_REQUEST} onChange={() => toggleLayer('SERVICE_REQUEST')} className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500" />
              <div className="ml-3 flex items-center">
                <div className="w-3 h-3 rounded-full bg-orange-500 mr-2 shadow-sm"></div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Service Requests</span>
              </div>
            </label>
            
            <label className="flex items-center cursor-pointer group">
              <input type="checkbox" checked={layers.REPORT} onChange={() => toggleLayer('REPORT')} className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500" />
              <div className="ml-3 flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2 shadow-sm"></div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Citizen Reports</span>
              </div>
            </label>
            
            <label className="flex items-center cursor-pointer group">
              <input type="checkbox" checked={layers.PROJECT} onChange={() => toggleLayer('PROJECT')} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
              <div className="ml-3 flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2 shadow-sm"></div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Municipal Projects</span>
              </div>
            </label>
            
            <label className="flex items-center cursor-pointer group">
              <input type="checkbox" checked={layers.FACILITY} onChange={() => toggleLayer('FACILITY')} className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500" />
              <div className="ml-3 flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2 shadow-sm"></div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Public Facilities</span>
              </div>
            </label>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Summary</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-100">
                <p className="text-2xl font-bold text-gray-900">{filteredData.length}</p>
                <p className="text-xs font-medium text-gray-500 mt-1">Total Pins</p>
              </div>
            </div>
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 bg-gray-100 relative z-0">
          <MapContainer 
            center={mapCenter} 
            zoom={mapZoom} 
            scrollWheelZoom={true} 
            zoomControl={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <ZoomControl position="bottomright" />
            <MapController center={mapCenter} zoom={mapZoom} />
            
            {userLocation && (
              <Marker position={userLocation} icon={icons.ME}>
                <Popup className="rounded-lg shadow-xl">
                  <div className="p-1">
                    <p className="font-bold text-gray-900 flex items-center mb-1">
                      <Navigation className="w-4 h-4 mr-1 text-violet-600" /> Your Location
                    </p>
                    <p className="text-xs text-gray-500">Current approximate device location.</p>
                  </div>
                </Popup>
              </Marker>
            )}

            <MarkerClusterGroup chunkedLoading maxClusterRadius={60}>
              {filteredData.map(item => (
                <Marker 
                  key={`${item.type}-${item.id}`} 
                  position={[item.latitude, item.longitude]}
                  icon={icons[item.type as keyof typeof icons] || icons.FACILITY}
                >
                  <Popup className="rounded-xl shadow-xl p-0">
                    <div className="w-64 overflow-hidden">
                      <div className={`px-4 py-2 border-b flex items-center ${
                        item.type === 'SERVICE_REQUEST' ? 'bg-orange-50 border-orange-100' :
                        item.type === 'REPORT' ? 'bg-red-50 border-red-100' :
                        item.type === 'PROJECT' ? 'bg-blue-50 border-blue-100' :
                        'bg-green-50 border-green-100'
                      }`}>
                        {item.type === 'SERVICE_REQUEST' && <Wrench className="w-4 h-4 text-orange-600 mr-2 shrink-0" />}
                        {item.type === 'REPORT' && <AlertTriangle className="w-4 h-4 text-red-600 mr-2 shrink-0" />}
                        {item.type === 'PROJECT' && <Building2 className="w-4 h-4 text-blue-600 mr-2 shrink-0" />}
                        {item.type === 'FACILITY' && <CheckSquare className="w-4 h-4 text-green-600 mr-2 shrink-0" />}
                        
                        <span className={`text-xs font-bold uppercase tracking-wider ${
                          item.type === 'SERVICE_REQUEST' ? 'text-orange-800' :
                          item.type === 'REPORT' ? 'text-red-800' :
                          item.type === 'PROJECT' ? 'text-blue-800' :
                          'text-green-800'
                        }`}>
                          {item.type.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 text-base leading-tight mb-2">{item.title}</h3>
                        
                        {(item.ref_id || item.status) && (
                          <div className="flex justify-between items-center mb-3">
                            {item.ref_id && <span className="text-xs text-gray-500 font-mono">{item.ref_id}</span>}
                            {item.status && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 uppercase">
                                {item.status.replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {item.location && (
                          <p className="text-xs text-gray-600 mb-4 line-clamp-2">{item.location}</p>
                        )}
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleGetDirections(item.latitude, item.longitude)}
                            className="flex-1 flex items-center justify-center py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <Navigation className="w-3 h-3 mr-1.5" /> Directions
                          </button>
                          
                          {(item.type === 'SERVICE_REQUEST' || item.type === 'REPORT') && (
                            <button 
                              onClick={() => handleNavigateToDetails(item)}
                              className="flex-1 flex items-center justify-center py-2 px-3 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-semibold transition-colors"
                            >
                              <FileText className="w-3 h-3 mr-1.5" /> View Details
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
