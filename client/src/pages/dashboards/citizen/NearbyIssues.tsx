import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Navigation, AlertTriangle, Loader2, Wrench, CheckSquare, Building2, Filter } from 'lucide-react';
import { citizenApi } from '../../../services/citizenApi';

// Helper function to calculate distance in km using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; 
};

export default function NearbyIssues() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  
  const [radius, setRadius] = useState<number>(5); // Default 5km radius
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await citizenApi.get('/map/data');
      if (res.success) {
        // Only keep issues (reports and requests)
        const issues = res.data.filter((item: any) => item.type === 'SERVICE_REQUEST' || item.type === 'REPORT');
        setData(issues);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    handleLocate();
  }, []);

  const handleLocate = () => {
    setLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLat(pos.coords.latitude);
          setUserLng(pos.coords.longitude);
          setLocating(false);
        },
        (err) => {
          console.error(err);
          setLocating(false);
        }
      );
    } else {
      setLocating(false);
    }
  };

  const processedData = React.useMemo(() => {
    if (!userLat || !userLng) return [];
    
    return data
      .map(item => ({
        ...item,
        distance: calculateDistance(userLat, userLng, item.latitude, item.longitude)
      }))
      .filter(item => item.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
      
  }, [data, userLat, userLng, radius]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Nearby Issues</h1>
          <p className="text-sm text-gray-500">Discover civic issues and service requests in your vicinity.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
            <Filter className="w-4 h-4 text-gray-400 mr-2" />
            <select 
              value={radius} 
              onChange={e => setRadius(Number(e.target.value))}
              className="text-sm border-none bg-transparent focus:ring-0 text-gray-700 font-medium outline-none"
            >
              <option value={1}>Within 1 km</option>
              <option value={2}>Within 2 km</option>
              <option value={5}>Within 5 km</option>
              <option value={10}>Within 10 km</option>
            </select>
          </div>
          
          <button 
            onClick={handleLocate}
            disabled={locating}
            className="flex items-center px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-sm"
          >
            {locating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Navigation className="w-4 h-4 mr-2" />}
            {locating ? 'Locating...' : 'Update Location'}
          </button>
        </div>
      </div>

      {!userLat && !locating && (
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl flex flex-col items-center text-center">
          <MapPin className="w-12 h-12 text-blue-300 mb-3" />
          <h3 className="text-lg font-bold text-blue-900 mb-2">Location Required</h3>
          <p className="text-blue-700 max-w-md">Please allow location access or click "Update Location" to discover issues near you.</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        </div>
      ) : userLat && processedData.length === 0 ? (
        <div className="bg-white p-16 rounded-xl shadow-sm border border-gray-100 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
            <CheckSquare className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">All Clear!</h3>
          <p className="text-gray-500">There are no reported issues within {radius} km of your location.</p>
        </div>
      ) : userLat && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedData.map((item) => (
            <div key={`${item.type}-${item.id}`} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group relative">
              <div className={`h-1 w-full ${item.type === 'REPORT' ? 'bg-red-500' : 'bg-orange-500'}`}></div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className={`px-2.5 py-1 rounded text-xs font-bold ${
                    item.type === 'REPORT' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'
                  } flex items-center`}>
                    {item.type === 'REPORT' ? <AlertTriangle className="w-3 h-3 mr-1" /> : <Wrench className="w-3 h-3 mr-1" />}
                    {item.type.replace('_', ' ')}
                  </div>
                  <span className="text-xs font-bold text-gray-400 font-mono bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                    {item.ref_id}
                  </span>
                </div>
                
                <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2">{item.title}</h3>
                
                <div className="space-y-2 mt-4">
                  <div className="flex items-start text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{item.location || 'Location not specified'}</span>
                  </div>
                  <div className="flex items-center text-sm font-semibold text-teal-700 bg-teal-50 px-2 py-1 rounded inline-flex">
                    <Navigation className="w-3 h-3 mr-1.5" />
                    {item.distance < 1 ? `${Math.round(item.distance * 1000)} meters away` : `${item.distance.toFixed(1)} km away`}
                  </div>
                </div>
              </div>
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                  ['RESOLVED', 'COMPLETED'].includes(item.status) ? 'bg-green-100 text-green-700' :
                  ['IN_PROGRESS', 'ACTION_IN_PROGRESS', 'INVESTIGATION'].includes(item.status) ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-200 text-gray-700'
                }`}>
                  {item.status?.replace(/_/g, ' ') || 'UNKNOWN'}
                </span>
                
                <Link 
                  to={item.type === 'REPORT' ? `/citizen/reports/${item.id}` : `/citizen/services/${item.id}`}
                  className="text-sm font-bold text-teal-600 hover:text-teal-800"
                >
                  View Details &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
