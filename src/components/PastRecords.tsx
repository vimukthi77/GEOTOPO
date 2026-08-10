'use client';

import React, { useEffect, useState } from 'react';
import { History, Search, Trash2, Calendar, Loader2, Compass, FileSpreadsheet, RefreshCw } from 'lucide-react';

interface ISurveySummary {
  _id: string;
  zone: string;
  area: string;
  targetZ: number;
  gridArea: number;
  metrics: {
    totalCutVolume: number;
    totalFillVolume: number;
    netBalance: number;
    avgGroundHeight: number;
  };
  createdAt: string;
}

interface PastRecordsProps {
  onLoadRecord: (id: string) => void;
  refreshTrigger: number;
}

export default function PastRecords({ onLoadRecord, refreshTrigger }: PastRecordsProps) {
  const [records, setRecords] = useState<ISurveySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchZone, setSearchZone] = useState('');
  const [searchArea, setSearchArea] = useState('');

  const fetchRecords = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (searchZone.trim()) params.append('zone', searchZone.trim());
      if (searchArea.trim()) params.append('area', searchArea.trim());
      
      const res = await fetch(`/api/survey?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to load past survey records.');
      }
      const data = await res.json();
      setRecords(data.surveys || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error loading history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [searchZone, searchArea, refreshTrigger]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent loading the record
    if (!confirm('Are you sure you want to delete this historical earthwork record? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/survey/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Failed to delete survey record.');
      }
      fetchRecords(); // Refresh list
    } catch (err: any) {
      alert(err.message || 'Failed to delete record');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-[580px] space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#112E81]/10 rounded-xl border border-[#112E81]/20 text-[#112E81]">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Past Records</h2>
            <p className="text-xs text-slate-500">Historical grading optimization models.</p>
          </div>
        </div>
        
        <button
          onClick={fetchRecords}
          className="p-2 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 border border-transparent transition cursor-pointer"
          title="Refresh History"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Search filters */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            placeholder="Filter Zone..."
            value={searchZone}
            onChange={(e) => setSearchZone(e.target.value)}
            className="w-full pl-8 pr-2 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#112E81] text-slate-800 placeholder-slate-400"
          />
        </div>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            placeholder="Filter Area..."
            value={searchArea}
            onChange={(e) => setSearchArea(e.target.value)}
            className="w-full pl-8 pr-2 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#112E81] text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Main Records List Container */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 custom-scrollbar">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center py-20 gap-3 text-slate-500 text-xs">
            <Loader2 className="w-7 h-7 animate-spin text-[#112E81]" />
            <span>Retrieving historical data...</span>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 text-xs py-10">{error}</div>
        ) : records.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400 text-xs">
            <History className="w-10 h-10 text-slate-200 mb-2" />
            <span>No matching survey records found.</span>
          </div>
        ) : (
          records.map((rec) => {
            const dateStr = new Date(rec.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
            const netM3 = rec.metrics.netBalance;
            const absoluteNet = Math.abs(netM3);

            return (
              <div
                key={rec._id}
                onClick={() => onLoadRecord(rec._id)}
                className="p-4 bg-slate-50 border border-slate-100 hover:border-[#112E81]/30 hover:bg-white rounded-xl transition cursor-pointer flex items-center justify-between group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-black bg-[#112E81]/10 text-[#112E81] border border-[#112E81]/20 rounded">
                      {rec.zone}
                    </span>
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase">{rec.area}</span>
                  </div>

                  <div className="text-[10px] text-slate-600 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-[#36ADA3]" />
                    <span>Grade Z: </span>
                    <span className="font-mono text-[#36ADA3] font-bold">{rec.targetZ.toFixed(2)} m</span>
                  </div>

                  <div className="text-[9px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dateStr}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-black text-slate-800">
                      {absoluteNet.toLocaleString(undefined, { maximumFractionDigits: 1 })}{' '}
                      <span className="text-[9px] text-slate-500">m³</span>
                    </div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-wide">
                      {netM3 > 0 ? 'Surplus' : 'Deficit'}
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDelete(e, rec._id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    title="Delete record from MongoDB"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
