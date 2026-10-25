import React, { useEffect, useState } from 'react';
import { Map as MapIcon, MapPin, Filter, Layers, Navigation, AlertTriangle, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom icons for severity
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
  HIGH: createIcon('red'),
  CRITICAL: createIcon('red'),
  MEDIUM: createIcon('orange'),
  LOW: createIcon('blue'),
  DEFAULT: createIcon('blue')
};

// Component to dynamically fit bounds of all markers
function MapBounds({ reports }: { reports: any[] }) {
  const map = useMap();
  useEffect(() => {
    if (reports.length > 0) {
      const bounds = L.latLngBounds(reports.map(r => [r.latitude, r.longitude]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [reports, map]);
  return null;
}

export default function AuthorityGIS() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showUnmapped, setShowUnmapped] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGISData();
  }, []);

  const fetchGISData = async () => {
    try {
      const res = await axios.get('/api/authority/gis');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] relative">
      <div className="bg-white border-b border-slate-200 p-4 flex justify-between items-center z-[1000] shadow-sm relative">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            <MapIcon className="w-6 h-6 mr-2 text-blue-600" />
            GIS Intelligence
          </h1>
          <p className="text-sm text-slate-500">Live municipal coordinate tracking & issue hotspots</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 flex items-center hover:bg-slate-100">
            <Filter className="w-4 h-4 mr-2" /> Filters
          </button>
          <button className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 flex items-center hover:bg-slate-100">
            <Layers className="w-4 h-4 mr-2" /> Hotspots
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="absolute top-24 left-4 z-[400] grid grid-cols-2 md:grid-cols-5 gap-3 w-full max-w-5xl pr-8">
        {!loading && data?.summary && (
          <>
            <div className="bg-white/95 backdrop-blur shadow p-4 rounded-xl border border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Reports</p>
              <p className="text-xl font-black text-slate-800">{data.summary.totalReports}</p>
            </div>
            <div className="bg-white/95 backdrop-blur shadow p-4 rounded-xl border border-blue-200">
              <p className="text-[10px] font-bold text-blue-500 uppercase">Mapped Reports</p>
              <p className="text-xl font-black text-blue-700">{data.summary.mappedReports}</p>
            </div>
            <div className="bg-white/95 backdrop-blur shadow p-4 rounded-xl border border-orange-200">
              <p className="text-[10px] font-bold text-orange-500 uppercase">Unmapped</p>
              <p className="text-xl font-black text-orange-700">{data.summary.unmappedReports}</p>
            </div>
            <div className="bg-white/95 backdrop-blur shadow p-4 rounded-xl border border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Active Issues</p>
              <p className="text-xl font-black text-slate-800">{data.summary.activeIssues}</p>
            </div>
            <div className="bg-white/95 backdrop-blur shadow p-4 rounded-xl border border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Hotspots</p>
              <p className="text-xl font-black text-slate-800">{data.summary.hotspots}</p>
            </div>
          </>
        )}
      </div>

      {/* UNMAPPED WARNING TOAST */}
      {!loading && data?.unmapped?.length > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
          <div className="bg-orange-900 text-white px-6 py-3 rounded-full shadow-2xl font-medium text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            {data.summary.unmappedReports} reports need location data
            <button onClick={() => setShowUnmapped(true)} className="ml-2 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-xs font-bold transition">
              Review Unmapped Reports
            </button>
          </div>
        </div>
      )}

      {/* MAP / EMPTY STATES */}
      <div className="flex-1 bg-slate-100 relative flex items-center justify-center z-0">
        {loading ? (
          <p className="text-slate-500 font-medium">Loading GIS Data...</p>
        ) : !data || data.summary.totalReports === 0 ? (
          // CASE A: No reports at all
          <div className="text-center p-8 bg-white/80 backdrop-blur rounded-xl shadow-lg border border-slate-200 max-w-sm">
            <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-800 font-bold mb-1">No reports available</p>
            <p className="text-slate-500 text-sm">No municipal reports have been submitted yet.</p>
          </div>
        ) : data.reports.length === 0 && data.unmapped.length > 0 ? (
          // CASE B: Reports exist, but NONE have coordinates
          <div className="text-center p-8 bg-white/80 backdrop-blur rounded-xl shadow-lg border border-slate-200 max-w-sm">
            <AlertTriangle className="w-12 h-12 text-orange-300 mx-auto mb-3" />
            <p className="text-slate-800 font-bold mb-1">Missing Coordinates</p>
            <p className="text-slate-500 text-sm mb-4">Reports are available, but location information has not been captured yet.</p>
            <button onClick={() => setShowUnmapped(true)} className="w-full py-2 bg-orange-100 text-orange-800 font-bold rounded-lg text-sm">
              Review {data.unmapped.length} Unmapped Reports
            </button>
          </div>
        ) : (
          // CASE C: We have mapped reports!
          <MapContainer center={[10.9601, 78.0766]} zoom={13} className="w-full h-full" zoomControl={false}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <MapBounds reports={data.reports} />
            
            {data.reports.map((report: any) => (
              <Marker 
                key={report.id} 
                position={[report.latitude, report.longitude]}
                icon={report.severity === 'HIGH' || report.severity === 'CRITICAL' ? icons.HIGH : icons.DEFAULT}
              >
                <Popup className="rounded-xl overflow-hidden shadow-xl border-0 p-0 m-0 custom-popup">
                  <div className="p-4 w-64">
                    <p className="text-xs font-bold text-slate-400 mb-1">{report.report_id_code}</p>
                    <h3 className="text-sm font-bold text-slate-900 mb-2">{report.title}</h3>
                    <div className="text-xs text-slate-600 mb-4 space-y-1">
                      <p><span className="font-semibold">Category:</span> {report.category}</p>
                      <p><span className="font-semibold">Priority:</span> {report.severity}</p>
                      <p><span className="font-semibold">Status:</span> {report.status}</p>
                    </div>
                    <button 
                      onClick={() => navigate(`/authority/reports/${report.id}`)}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center justify-center transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-1" /> View Report
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>

      {/* UNMAPPED REPORTS DRAWER */}
      {showUnmapped && data?.unmapped && (
        <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[2000] border-l border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <h2 className="text-lg font-bold text-slate-900">Unmapped Reports ({data.unmapped.length})</h2>
            <button onClick={() => setShowUnmapped(false)} className="text-slate-500 hover:text-slate-800 font-bold text-sm">Close</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {data.unmapped.map((ur: any) => (
              <div key={ur.id} className="p-4 border border-slate-200 rounded-xl hover:border-blue-300 transition-colors">
                <p className="text-xs font-bold text-slate-400 mb-1">{ur.report_id_code}</p>
                <h3 className="text-sm font-bold text-slate-900 mb-1">{ur.title}</h3>
                <p className="text-xs text-slate-500 mb-3">{ur.location || 'No address provided'}</p>
                <div className="flex gap-2">
                  <button onClick={() => navigate(`/authority/reports/${ur.id}`)} className="flex-1 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded hover:bg-slate-200">
                    View Details
                  </button>
                  <button className="flex-1 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded hover:bg-blue-100">
                    Add Location
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
