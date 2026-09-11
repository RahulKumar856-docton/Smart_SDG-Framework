import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { adminApi } from '../../../services/adminApi';
import { MapPin, Search, Filter, Layers, RefreshCw, Maximize, AlertCircle, CheckCircle2, AlertTriangle, Crosshair, Map, List, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

// Fix for default Leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const projectIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});
const requestIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});
const inspectionIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});
const searchResultIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

// Component to dynamically update map center
const MapUpdater = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

export default function GISMap() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [data, setData] = useState({
    projects: [] as any[],
    requests: [] as any[],
    inspections: [] as any[],
    facilities: [] as any[]
  });
  
  const [coverage, setCoverage] = useState<any>(null);
  const [filtersData, setFiltersData] = useState({ departments: [], wards: [] });
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Layer controls
  const [layers, setLayers] = useState({
    projects: true,
    requests: true,
    inspections: true,
    facilities: true
  });
  
  // Filters
  const [filters, setFilters] = useState({
    department: '',
    ward: '',
    search: ''
  });
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchMarker, setSearchMarker] = useState<[number, number] | null>(null);
  
  // Routing State
  const [routeOrigin, setRouteOrigin] = useState<any>(null);
  const [routeDestination, setRouteDestination] = useState<any>(null);
  const [routeLine, setRouteLine] = useState<[number, number][] | null>(null);
  const [routeDetails, setRouteDetails] = useState<{distance: string, time: string} | null>(null);
  const [routingError, setRoutingError] = useState<string | null>(null);

  const [mapCenter, setMapCenter] = useState<[number, number]>([11.0168, 76.9558]);
  const [mapZoom, setMapZoom] = useState(13);
  
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getGisData();
      if (res.success) {
        setData(res.data);
        setCoverage(res.coverage);
        setLastUpdated(new Date());
      }
      
      const filtersRes = await adminApi.getGisFilters();
      if (filtersRes.success) {
        setFiltersData(filtersRes.data);
      }
    } catch (err) {
      console.error(err);
      setError('Unable to load municipal map data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      // Nominatim API
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`);
      if (res.data && res.data.length > 0) {
        const result = res.data[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        setSearchMarker([lat, lon]);
        setMapCenter([lat, lon]);
        setMapZoom(16);
        setSearchResults([result]);
      } else {
        alert("Location not found.");
      }
    } catch (err) {
      console.error("Geocoding failed", err);
    }
  };

  const calculateRoute = async () => {
    if (!routeOrigin || !routeDestination) {
      setRoutingError("Origin and Destination are required.");
      return;
    }
    
    if (!routeOrigin.latitude || !routeDestination.latitude) {
      setRoutingError("One or both locations do not have valid coordinates.");
      return;
    }
    
    setRoutingError(null);
    setRouteDetails(null);
    setRouteLine(null);
    
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${routeOrigin.longitude},${routeOrigin.latitude};${routeDestination.longitude},${routeDestination.latitude}?overview=full&geometries=geojson`;
      const res = await axios.get(url);
      
      if (res.data.routes && res.data.routes.length > 0) {
        const route = res.data.routes[0];
        const distanceKm = (route.distance / 1000).toFixed(2);
        const timeMin = Math.round(route.duration / 60);
        
        // OSRM returns [lon, lat], Leaflet needs [lat, lon]
        const line = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
        
        setRouteLine(line);
        setRouteDetails({ distance: `${distanceKm} km`, time: `${timeMin} min` });
        
        // Adjust map to fit route
        const lat = (routeOrigin.latitude + routeDestination.latitude) / 2;
        const lon = (routeOrigin.longitude + routeDestination.longitude) / 2;
        setMapCenter([lat, lon]);
        setMapZoom(13);
      }
    } catch (err) {
      console.error("Routing failed", err);
      setRoutingError("Unable to calculate route. Please try again.");
    }
  };

  const applyFilters = (item: any) => {
    if (filters.ward && item.ward !== filters.ward) return false;
    if (filters.department && item.department_id !== parseInt(filters.department)) return false;
    if (filters.search) {
      const term = filters.search.toLowerCase();
      const title = (item.title || item.project_name || '').toLowerCase();
      if (!title.includes(term)) return false;
    }
    return true;
  };

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };
  
  const handleMarkerClick = (entity: any, type: string) => {
    setSelectedEntity({ ...entity, type });
  };

  const clearRoute = () => {
    setRouteOrigin(null);
    setRouteDestination(null);
    setRouteLine(null);
    setRouteDetails(null);
    setRoutingError(null);
  };

  if (loading && !data.projects.length) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-4" />
          <p className="text-gray-600 font-medium">Loading municipal geographic data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span className="font-medium">{error}</span>
          </div>
          <button onClick={loadData} className="px-4 py-2 bg-red-100 hover:bg-red-200 rounded-md text-sm font-medium transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between z-10 shrink-0 shadow-sm">
        <div>
          <div className="flex items-center text-sm text-gray-500 mb-1">
            <span className="hover:text-gray-900 cursor-pointer">Home</span>
            <span className="mx-2">/</span>
            <span className="hover:text-gray-900 cursor-pointer">Admin</span>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">GIS Map</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Map className="h-6 w-6 mr-2 text-blue-600" />
            Municipal GIS Map
          </h1>
          <p className="text-gray-500 text-sm mt-1">Monitor municipal projects, citizen requests and field operations through an interactive geographic view.</p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search Location..." 
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm w-48 lg:w-64 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
          </div>
          <button onClick={handleSearch} className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 bg-white shadow-sm" title="Search Location">
            <Search className="h-4 w-4 text-gray-600" />
          </button>
          <button onClick={() => setShowFilters(!showFilters)} className={`px-3 py-2 border rounded-md flex items-center text-sm font-medium shadow-sm transition-colors ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'}`}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
          <button onClick={loadData} className="px-3 py-2 border border-gray-300 bg-white rounded-md flex items-center text-sm font-medium hover:bg-gray-50 text-gray-700 shadow-sm transition-colors">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Map Area */}
        <div className="flex-1 relative">
          <MapContainer center={mapCenter} zoom={mapZoom} className="w-full h-full z-0">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapUpdater center={mapCenter} zoom={mapZoom} />
            
            <MarkerClusterGroup>
              {layers.projects && data.projects.filter(applyFilters).map(p => (
                <Marker key={`p-${p.id}`} position={[p.latitude, p.longitude]} icon={projectIcon} eventHandlers={{ click: () => handleMarkerClick(p, 'project') }}>
                  <Popup>
                    <div className="p-1">
                      <h3 className="font-bold text-sm mb-1">{p.title}</h3>
                      <p className="text-xs text-gray-600 mb-1">ID: PRJ-{p.id}</p>
                      <p className="text-xs text-gray-600 mb-2">Status: <span className="font-medium text-blue-600">{p.status}</span></p>
                      <Link to={`/admin/projects/${p.id}`} className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 block text-center">View Project</Link>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {layers.requests && data.requests.filter(applyFilters).map(r => (
                <Marker key={`r-${r.id}`} position={[r.latitude, r.longitude]} icon={requestIcon} eventHandlers={{ click: () => handleMarkerClick(r, 'request') }}>
                  <Popup>
                    <div className="p-1">
                      <h3 className="font-bold text-sm mb-1">{r.title}</h3>
                      <p className="text-xs text-gray-600 mb-1">ID: {r.request_id_code || `REQ-${r.id}`}</p>
                      <p className="text-xs text-gray-600 mb-2">Status: <span className="font-medium text-orange-600">{r.status}</span></p>
                      <Link to={`/admin/citizen-requests/${r.id}`} className="text-xs bg-orange-600 text-white px-2 py-1 rounded hover:bg-orange-700 block text-center">View Request</Link>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {layers.inspections && data.inspections.filter(applyFilters).map(i => (
                <Marker key={`i-${i.id}`} position={[i.latitude, i.longitude]} icon={inspectionIcon} eventHandlers={{ click: () => handleMarkerClick(i, 'inspection') }}>
                  <Popup>
                    <div className="p-1">
                      <h3 className="font-bold text-sm mb-1">Inspection {i.id}</h3>
                      <p className="text-xs text-gray-600 mb-1">Project: {i.title}</p>
                      <p className="text-xs text-gray-600 mb-1">Officer: {i.officer}</p>
                      <p className="text-xs text-gray-600 mb-2">Status: <span className="font-medium text-green-600">{i.status}</span></p>
                      <Link to={`/admin/inspections/${i.id}`} className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 block text-center">View Inspection</Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
            
            {searchMarker && (
              <Marker position={searchMarker} icon={searchResultIcon}>
                <Popup>Searched Location</Popup>
              </Marker>
            )}

            {routeLine && (
              <Polyline positions={routeLine} color="#3b82f6" weight={4} opacity={0.8} />
            )}
            
            {/* Map Legend Overlay */}
            <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg z-[1000] border border-gray-200">
              <h4 className="font-semibold text-sm mb-3 flex items-center"><Layers className="w-4 h-4 mr-2 text-gray-500" /> Map Legend</h4>
              <div className="space-y-3">
                <label className="flex items-center cursor-pointer group">
                  <input type="checkbox" checked={layers.projects} onChange={() => toggleLayer('projects')} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2" />
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2 group-hover:scale-110 transition-transform"></div>
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">Projects ({data.projects.filter(applyFilters).length})</span>
                </label>
                <label className="flex items-center cursor-pointer group">
                  <input type="checkbox" checked={layers.requests} onChange={() => toggleLayer('requests')} className="rounded border-gray-300 text-red-500 focus:ring-red-500 mr-2" />
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2 group-hover:scale-110 transition-transform"></div>
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">Citizen Requests ({data.requests.filter(applyFilters).length})</span>
                </label>
                <label className="flex items-center cursor-pointer group">
                  <input type="checkbox" checked={layers.inspections} onChange={() => toggleLayer('inspections')} className="rounded border-gray-300 text-green-500 focus:ring-green-500 mr-2" />
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2 group-hover:scale-110 transition-transform"></div>
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">Field Inspections ({data.inspections.filter(applyFilters).length})</span>
                </label>
              </div>
            </div>
          </MapContainer>
        </div>

        {/* Filters Panel - Overlays on mobile, side by side on desktop */}
        {showFilters && (
          <div className="w-80 bg-white border-l border-gray-200 shadow-xl overflow-y-auto flex flex-col absolute right-0 top-0 bottom-0 z-20 sm:relative sm:z-10 animate-in slide-in-from-right-8 duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-semibold flex items-center text-gray-800"><Filter className="w-4 h-4 mr-2 text-gray-500" /> Map Filters</h3>
              <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">&times;</button>
            </div>
            
            <div className="p-5 space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Search Text</label>
                <input 
                  type="text" 
                  placeholder="Project or request name..." 
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Department</label>
                <select 
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  value={filters.department}
                  onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                >
                  <option value="">All Departments</option>
                  {filtersData.departments.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Ward</label>
                <select 
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  value={filters.ward}
                  onChange={(e) => setFilters(prev => ({ ...prev, ward: e.target.value }))}
                >
                  <option value="">All Wards</option>
                  {filtersData.wards.map((w: any) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <button 
                  onClick={() => setFilters({ department: '', ward: '', search: '' })}
                  className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
            
            {/* Stats section */}
            <div className="p-5 border-t border-gray-100 bg-gray-50 flex-1">
              <h3 className="font-semibold text-sm mb-4 text-gray-800">Geographic Data Coverage</h3>
              {coverage && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">Projects Mapped</span>
                      <span className="font-semibold text-gray-900">{coverage.projects.mapped} / {coverage.projects.total}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${coverage.projects.total ? (coverage.projects.mapped/coverage.projects.total)*100 : 0}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">Requests Mapped</span>
                      <span className="font-semibold text-gray-900">{coverage.requests.mapped} / {coverage.requests.total}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${coverage.requests.total ? (coverage.requests.mapped/coverage.requests.total)*100 : 0}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">Inspections Mapped</span>
                      <span className="font-semibold text-gray-900">{coverage.inspections.mapped} / {coverage.inspections.total}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${coverage.inspections.total ? (coverage.inspections.mapped/coverage.inspections.total)*100 : 0}%` }}></div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                    <p className="text-xs text-gray-500 flex items-center justify-center">
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Last Updated: {lastUpdated.toLocaleTimeString()}
                    </p>
                    <Link to="/admin/data-quality" className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium inline-block hover:underline">
                      Review Missing Locations in Data Quality →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Details & Routing Panel at bottom */}
      <div className="h-64 sm:h-56 bg-white border-t border-gray-200 p-0 flex shrink-0 shadow-lg z-20">
        {/* Left: Entity Details */}
        <div className="w-1/2 p-5 border-r border-gray-200 overflow-y-auto">
          {selectedEntity ? (
            <div className="animate-in fade-in duration-300">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-lg text-gray-900 flex items-center">
                  {selectedEntity.type === 'project' && <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" />}
                  {selectedEntity.type === 'request' && <div className="w-3 h-3 rounded-full bg-red-500 mr-2" />}
                  {selectedEntity.type === 'inspection' && <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />}
                  {selectedEntity.title || `Inspection ${selectedEntity.id}`}
                </h3>
                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 font-medium text-gray-600 uppercase">
                  {selectedEntity.type}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm mb-4">
                <div className="text-gray-500">Status: <span className="text-gray-900 font-medium">{selectedEntity.status}</span></div>
                {selectedEntity.ward && <div className="text-gray-500">Ward: <span className="text-gray-900 font-medium">{selectedEntity.ward}</span></div>}
                {selectedEntity.department && <div className="text-gray-500">Department: <span className="text-gray-900">{selectedEntity.department}</span></div>}
                {selectedEntity.progress !== undefined && <div className="text-gray-500">Progress: <span className="text-gray-900 font-medium">{selectedEntity.progress}%</span></div>}
                {selectedEntity.priority && <div className="text-gray-500">Priority: <span className="text-gray-900">{selectedEntity.priority}</span></div>}
              </div>
              
              <div className="flex space-x-3">
                {selectedEntity.type === 'project' && (
                  <Link to={`/admin/projects/${selectedEntity.id}`} className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-sm font-medium transition-colors">
                    View Project Details
                  </Link>
                )}
                {selectedEntity.type === 'request' && (
                  <Link to={`/admin/citizen-requests/${selectedEntity.id}`} className="px-4 py-2 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded text-sm font-medium transition-colors">
                    View Request Details
                  </Link>
                )}
                {selectedEntity.type === 'inspection' && (
                  <Link to={`/admin/inspections/${selectedEntity.id}`} className="px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded text-sm font-medium transition-colors">
                    View Inspection Details
                  </Link>
                )}
                
                <button 
                  onClick={() => setRouteOrigin(selectedEntity)}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded text-sm font-medium text-gray-700 transition-colors"
                >
                  Set as Origin
                </button>
                <button 
                  onClick={() => setRouteDestination(selectedEntity)}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded text-sm font-medium text-gray-700 transition-colors"
                >
                  Set as Destination
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <MapPin className="h-10 w-10 text-gray-300 mb-3" />
              <p className="font-medium text-gray-600">Map Overview</p>
              <p className="text-sm mt-1">Select a marker on the map to view entity details.</p>
            </div>
          )}
        </div>
        
        {/* Right: Routing Tools */}
        <div className="w-1/2 p-5 bg-gray-50/50 overflow-y-auto">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center">
            <Navigation className="w-4 h-4 mr-2 text-blue-600" />
            Route Between Locations
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-24 text-sm font-medium text-gray-500 uppercase">Origin</div>
              <div className="flex-1 bg-white border border-gray-200 p-2 rounded text-sm text-gray-700 truncate shadow-sm">
                {routeOrigin ? routeOrigin.title || `${routeOrigin.type} ${routeOrigin.id}` : <span className="text-gray-400 italic">Select marker & set as origin</span>}
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-24 text-sm font-medium text-gray-500 uppercase">Destination</div>
              <div className="flex-1 bg-white border border-gray-200 p-2 rounded text-sm text-gray-700 truncate shadow-sm">
                {routeDestination ? routeDestination.title || `${routeDestination.type} ${routeDestination.id}` : <span className="text-gray-400 italic">Select marker & set as destination</span>}
              </div>
            </div>
            
            {routingError && (
              <div className="text-red-500 text-xs flex items-center mt-2 p-2 bg-red-50 rounded">
                <AlertTriangle className="w-3 h-3 mr-1" /> {routingError}
              </div>
            )}
            
            <div className="flex space-x-3 pt-2">
              <button 
                onClick={calculateRoute}
                disabled={!routeOrigin || !routeDestination}
                className={`flex-1 py-2 rounded text-sm font-medium shadow-sm transition-colors ${!routeOrigin || !routeDestination ? 'bg-blue-300 text-white cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                Calculate Route
              </button>
              <button 
                onClick={clearRoute}
                disabled={!routeOrigin && !routeDestination && !routeLine}
                className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded text-sm font-medium text-gray-700 shadow-sm transition-colors disabled:opacity-50"
              >
                Clear
              </button>
            </div>
            
            {routeDetails && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-md flex justify-around animate-in slide-in-from-bottom-2">
                <div className="text-center">
                  <div className="text-xs text-blue-500 font-medium uppercase">Distance</div>
                  <div className="text-lg font-bold text-blue-700">{routeDetails.distance}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-blue-500 font-medium uppercase">Estimated Time</div>
                  <div className="text-lg font-bold text-blue-700">{routeDetails.time}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
