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

import { useTheme } from '@/context/ThemeContext';

interface ElevationProfileChartProps {
  result: TrackerTerrainCalculationResult;
}

export default function ElevationProfileChart({ result }: ElevationProfileChartProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'cumulative' | 'deltaY' | 'deltaZ'>('profile');
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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

  const gridColor = isDark ? '#334155' : '#E2E8F0';
  const axisColor = isDark ? '#94A3B8' : '#64748B';
  const labelColor = isDark ? '#CBD5E1' : '#334155';
  const tooltipBg = isDark ? '#0F172A' : '#FFFFFF';
  const tooltipBorder = isDark ? '#334155' : '#E2E8F0';
  const tooltipText = isDark ? '#F8FAFC' : '#0F172A';

  return (
    <div
      className={`border rounded-3xl p-5 md:p-7 shadow-2xl backdrop-blur-xl space-y-6 transition-colors duration-200 ${
        isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
      }`}
    >
      {/* Header & Tabs */}
      <div
        className={`flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <div>
          <div className="flex items-center gap-2 text-teal-500 font-bold text-xs uppercase tracking-wider">
            <Activity className="w-4 h-4 text-[#36ADA3]" />
            <span>Interactive Visualizations</span>
          </div>
          <h3 className={`text-xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Tracker Pile Ground Location &amp; Elevation Profile
          </h3>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Zone: <span className="font-semibold">{result.zoneName}</span> • Config: <span className="font-semibold">{result.config.name}</span> • X-Axis: <span className="text-teal-500 font-semibold">Horizontal Ground Location Y (m)</span>
          </p>
        </div>

        {/* Tab Controls */}
        <div
          className={`flex flex-wrap gap-1.5 p-1 rounded-2xl border ${
            isDark ? 'bg-slate-950/80 border-slate-800/80' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-[#112E81] to-[#36ADA3] text-white shadow-md'
                : isDark
                ? 'text-slate-400 hover:text-white hover:bg-white/5'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Ground Location Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('cumulative')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'cumulative'
                ? 'bg-gradient-to-r from-[#112E81] to-[#36ADA3] text-white shadow-md'
                : isDark
                ? 'text-slate-400 hover:text-white hover:bg-white/5'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Sloped Dist vs Elevation</span>
          </button>

          <button
            onClick={() => setActiveTab('deltaY')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'deltaY'
                ? 'bg-gradient-to-r from-[#112E81] to-[#36ADA3] text-white shadow-md'
                : isDark
                ? 'text-slate-400 hover:text-white hover:bg-white/5'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
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
                : isDark
                ? 'text-slate-400 hover:text-white hover:bg-white/5'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
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
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.6} />
              <XAxis
                dataKey="yM"
                stroke={axisColor}
                fontSize={11}
                tickFormatter={(v) => `${v}m`}
                label={{ value: 'Horizontal Ground Location Y (m)', position: 'insideBottom', offset: -15, fill: labelColor, fontSize: 12 }}
              />
              <YAxis
                domain={[zMin - zPadding, zMax + zPadding]}
                stroke={axisColor}
                fontSize={11}
                tickFormatter={(v) => `${v.toFixed(2)}m`}
                label={{ value: 'Elevation Z (m)', angle: -90, position: 'insideLeft', fill: labelColor, fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '12px', color: tooltipText }}
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
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.6} />
              <XAxis
                dataKey="cumDistM"
                stroke={axisColor}
                fontSize={11}
                tickFormatter={(v) => `${v}m`}
                label={{ value: 'Cumulative Sloped Tracker Distance (m)', position: 'insideBottom', offset: -15, fill: labelColor, fontSize: 12 }}
              />
              <YAxis
                domain={[zMin - zPadding, zMax + zPadding]}
                stroke={axisColor}
                fontSize={11}
                tickFormatter={(v) => `${v.toFixed(2)}m`}
                label={{ value: 'Elevation Z (m)', angle: -90, position: 'insideLeft', fill: labelColor, fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '12px', color: tooltipText }}
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
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.6} />
              <XAxis dataKey="name" stroke={axisColor} fontSize={10} angle={-20} textAnchor="end" />
              <YAxis
                stroke={axisColor}
                fontSize={11}
                tickFormatter={(v) => `${v}mm`}
                label={{ value: 'Horizontal Increment ΔY (mm)', angle: -90, position: 'insideLeft', fill: labelColor, fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '12px', color: tooltipText }}
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
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.6} />
              <XAxis dataKey="name" stroke={axisColor} fontSize={10} angle={-20} textAnchor="end" />
              <YAxis
                stroke={axisColor}
                fontSize={11}
                tickFormatter={(v) => `${v}mm`}
                label={{ value: 'Vertical Elevation Increment ΔZ (mm)', angle: -90, position: 'insideLeft', fill: labelColor, fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '12px', color: tooltipText }}
                formatter={(value: any) => [`${value} mm`, 'ΔZ Vertical']}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="deltaZMm" name="Segment Vertical Increment ΔZ (mm)" fill="#10B981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer Info Pill */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 pt-3 border-t text-xs ${
          isDark ? 'border-slate-800/70 text-slate-400' : 'border-slate-200 text-slate-500'
        }`}
      >
        <div>
          Angle θ = <span className="text-teal-600 dark:text-teal-300 font-mono font-bold">{result.thetaDeg.toFixed(6)}°</span> • Projection Y = <span className="font-mono font-bold">{result.totalHorizontalProjectionM.toFixed(3)} m</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          <span>Real-time Engineering Charting Engine</span>
        </div>
      </div>
    </div>
  );
}
