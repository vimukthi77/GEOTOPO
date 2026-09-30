'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceDot,
} from 'recharts';
import { TrackerTerrainCalculationResult } from '@/lib/tracker-post-terrain/calculateTrackerCoordinates';
import { Layers, Activity, BarChart2, TrendingUp, Compass } from 'lucide-react';

interface ElevationProfileChartProps {
  result: TrackerTerrainCalculationResult;
}

export default function ElevationProfileChart({ result }: ElevationProfileChartProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'cumulative' | 'deltaY' | 'deltaZ'>('profile');

  // Chart 1 & 2 Data: Profile & Cumulative Distance
  const lineChartData = result.points.map((pt) => ({
    name: pt.label,
    yM: Number(pt.yM.toFixed(3)),
    cumDistM: Number(pt.cumLengthM.toFixed(3)),
    zM: Number(pt.zM.toFixed(3)),
    zMm: Number(pt.zMm.toFixed(1)),
    segmentLengthMm: pt.segmentLengthMm,
  }));

  // Chart 3 & 4 Data: Segments Delta Y & Delta Z
  const segmentData = result.points
    .filter((pt) => pt.segmentLengthMm !== null)
    .map((pt) => ({
      name: `Seg ${pt.pointIndex - 1} (${pt.label})`,
      segmentMm: pt.segmentLengthMm,
      deltaYMm: pt.deltaYMm ? Number(pt.deltaYMm.toFixed(2)) : 0,
      deltaZM: pt.deltaZM ? Number(pt.deltaZM.toFixed(4)) : 0,
      deltaZMm: pt.deltaZMm ? Number(pt.deltaZMm.toFixed(2)) : 0,
    }));

  const zMin = Math.min(...result.points.map((p) => p.zM));
  const zMax = Math.max(...result.points.map((p) => p.zM));
  const zPadding = Math.max(0.5, (zMax - zMin) * 0.25);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 md:p-7 shadow-2xl backdrop-blur-xl text-slate-100 space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
            <Activity className="w-4 h-4 text-[#36ADA3]" />
            <span>Interactive Visualizations</span>
          </div>
          <h3 className="text-xl font-extrabold text-white mt-1">
            Engineering Profile &amp; Segment Dynamics
          </h3>
          <p className="text-xs text-slate-400">
            Zone: <span className="text-slate-200 font-semibold">{result.zoneName}</span> • Config: <span className="text-slate-200 font-semibold">{result.config.name}</span>
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800/80">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-[#112E81] to-[#36ADA3] text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Elevation Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('cumulative')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'cumulative'
                ? 'bg-gradient-to-r from-[#112E81] to-[#36ADA3] text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Cum. Dist vs Elevation</span>
          </button>

          <button
            onClick={() => setActiveTab('deltaY')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'deltaY'
                ? 'bg-gradient-to-r from-[#112E81] to-[#36ADA3] text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Horiz. ΔY</span>
          </button>

          <button
            onClick={() => setActiveTab('deltaZ')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'deltaZ'
                ? 'bg-gradient-to-r from-[#112E81] to-[#36ADA3] text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Vert. ΔZ</span>
          </button>
        </div>
      </div>

      {/* Chart Display Area */}
      <div className="h-[380px] w-full pt-2">
        {activeTab === 'profile' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineChartData} margin={{ top: 20, right: 30, left: 10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />
              <XAxis
                dataKey="yM"
                stroke="#94A3B8"
                fontSize={11}
                tickFormatter={(v) => `${v}m`}
                label={{ value: 'Horizontal Coordinate Y (m)', position: 'insideBottom', offset: -15, fill: '#CBD5E1', fontSize: 12 }}
              />
              <YAxis
                domain={[zMin - zPadding, zMax + zPadding]}
                stroke="#94A3B8"
                fontSize={11}
                tickFormatter={(v) => `${v.toFixed(2)}m`}
                label={{ value: 'Elevation Z (m)', angle: -90, position: 'insideLeft', fill: '#CBD5E1', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#F8FAFC' }}
                formatter={(value: any) => [`${value} m`, 'Elevation Z']}
                labelFormatter={(label) => `Y Coordinate: ${label} m`}
              />
              <Legend verticalAlign="top" height={36} />
              <Line
                type="monotone"
                dataKey="zM"
                name="Tracker Post Elevation (Z)"
                stroke="#38BDF8"
                strokeWidth={3}
                dot={{ r: 6, fill: '#0EA5E9', stroke: '#FFFFFF', strokeWidth: 2 }}
                activeDot={{ r: 8, fill: '#36ADA3' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'cumulative' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineChartData} margin={{ top: 20, right: 30, left: 10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />
              <XAxis
                dataKey="cumDistM"
                stroke="#94A3B8"
                fontSize={11}
                tickFormatter={(v) => `${v}m`}
                label={{ value: 'Cumulative Sloped Tracker Distance (m)', position: 'insideBottom', offset: -15, fill: '#CBD5E1', fontSize: 12 }}
              />
              <YAxis
                domain={[zMin - zPadding, zMax + zPadding]}
                stroke="#94A3B8"
                fontSize={11}
                tickFormatter={(v) => `${v.toFixed(2)}m`}
                label={{ value: 'Elevation Z (m)', angle: -90, position: 'insideLeft', fill: '#CBD5E1', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#F8FAFC' }}
                formatter={(value: any) => [`${value} m`, 'Elevation Z']}
                labelFormatter={(label) => `Cum. Distance: ${label} m`}
              />
              <Legend verticalAlign="top" height={36} />
              <Line
                type="monotone"
                dataKey="zM"
                name="Elevation Z vs Distance"
                stroke="#36ADA3"
                strokeWidth={3}
                dot={{ r: 6, fill: '#10B981', stroke: '#FFFFFF', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'deltaY' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={segmentData} margin={{ top: 20, right: 30, left: 10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} angle={-20} textAnchor="end" />
              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                tickFormatter={(v) => `${v}mm`}
                label={{ value: 'Horizontal Increment ΔY (mm)', angle: -90, position: 'insideLeft', fill: '#CBD5E1', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#F8FAFC' }}
                formatter={(value: any) => [`${value} mm`, 'ΔY Horizontal']}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="deltaYMm" name="Segment Horizontal Increment ΔY (mm)" fill="#3B82F6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'deltaZ' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={segmentData} margin={{ top: 20, right: 30, left: 10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} angle={-20} textAnchor="end" />
              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                tickFormatter={(v) => `${v}mm`}
                label={{ value: 'Vertical Elevation Increment ΔZ (mm)', angle: -90, position: 'insideLeft', fill: '#CBD5E1', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#F8FAFC' }}
                formatter={(value: any) => [`${value} mm`, 'ΔZ Vertical']}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="deltaZMm" name="Segment Vertical Increment ΔZ (mm)" fill="#10B981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer Info Pill */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/70 text-xs text-slate-400">
        <div>
          Angle θ = <span className="text-teal-300 font-mono font-bold">{result.thetaDeg.toFixed(6)}°</span> • Projection Y = <span className="text-slate-200 font-mono font-bold">{result.totalHorizontalProjectionM.toFixed(3)} m</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span>Real-time Engineering Charting Engine</span>
        </div>
      </div>
    </div>
  );
}
