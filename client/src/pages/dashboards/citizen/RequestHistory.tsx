import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, Calendar, Search, Star, FileText, Filter, CheckCircle, XCircle } from 'lucide-react';
import { citizenApi } from '../../../services/citizenApi';

export default function RequestHistory() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await citizenApi.getRequests({ status: 'RESOLVED,REJECTED' });
        if (res.success) {
          // Filter out active statuses (only keep resolved or rejected)
          const history = res.data.filter((r: any) => ['RESOLVED', 'REJECTED'].includes(r.status));
          setRequests(history);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filteredRequests = requests.filter(req => {
    if (typeFilter !== 'All' && req.status !== typeFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return req.title?.toLowerCase().includes(term) || req.request_id_code?.toLowerCase().includes(term);
    }
    return true;
  });

  // Group by Month/Year
  const groupedHistory = filteredRequests.reduce((acc, req) => {
    const date = new Date(req.created_at);
    const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(req);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Service History</h1>
        <p className="text-sm text-gray-500">View your past resolved or rejected municipal service requests.</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search past requests..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
          />
        </div>
        <div className="relative w-full sm:w-64">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select 
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none appearance-none bg-white"
          >
            <option value="All">All Past Requests</option>
            <option value="RESOLVED">Resolved Only</option>
            <option value="REJECTED">Rejected Only</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full"></div>
        </div>
      ) : Object.keys(groupedHistory).length === 0 ? (
        <div className="bg-white p-16 rounded-xl shadow-sm border border-gray-100 text-center">
          <Archive className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">No history found</h3>
          <p className="text-gray-500 mb-6">You don't have any past resolved or rejected requests matching your search.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.keys(groupedHistory).map(monthYear => (
            <div key={monthYear} className="space-y-4">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center">
                <Calendar className="w-4 h-4 mr-2" /> {monthYear}
              </h2>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {groupedHistory[monthYear].map((req: any) => (
                    <div key={req.id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      <div className="flex items-start gap-4 flex-1">
                        <div className="shrink-0 mt-1">
                          {req.status === 'RESOLVED' ? (
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                              <XCircle className="w-5 h-5 text-red-600" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              {req.request_id_code}
                            </span>
                            <span className="text-xs text-gray-400">
                              Resolved on {new Date(req.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="font-bold text-gray-900">{req.title}</h3>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <FileText className="w-3.5 h-3.5 mr-1" /> {req.category}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-6 md:w-64">
                        {req.status === 'RESOLVED' && (
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                            <span className="text-sm font-medium text-gray-700">Done</span>
                          </div>
                        )}
                        <Link 
                          to={`/citizen/services/${req.id}`} 
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm transition-colors whitespace-nowrap"
                        >
                          View Details
                        </Link>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
