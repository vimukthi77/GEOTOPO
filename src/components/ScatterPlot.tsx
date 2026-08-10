'use client';

import React, { useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { CutFillDetail } from '@/lib/optimization';
import { Maximize2, Minimize2 } from 'lucide-react';

interface ScatterPlotProps {
  data: CutFillDetail[];
}

export default function SpatialScatterPlot({ data }: ScatterPlotProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 h-96 flex items-center justify-center text-slate-500 text-sm">
        No coordinate data available for spatial scatter plotting.
      </div>
    );
  }

  // Find min/max Z to compute color gradients
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const p of data) {
    if (p.z < minZ) minZ = p.z;
    if (p.z > maxZ) maxZ = p.z;
  }
  const zRange = maxZ - minZ || 1.0;

  // Helper to map normalized Z to a high-end terrain gradient: Deep Indigo (#112E81) to Bright Emerald (#36ADA3)
  const getElevationColor = (z: number) => {
    const norm = (z - minZ) / zRange; // 0 to 1
    const r = Math.round(17 + norm * (54 - 17));
    const g = Math.round(46 + norm * (173 - 46));
    const b = Math.round(129 + norm * (163 - 129));
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Format data for Recharts
  const chartData = data.map((p) => ({
    x: p.x,
    y: p.y,
    z: p.z,
    pointId: p.pointId,
    cutDepth: p.cutDepth,
    fillDepth: p.fillDepth,
    depthType: p.depthType,
    color: getElevationColor(p.z),
  }));

  // Custom Tooltip Component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-4 rounded-xl shadow-xl text-xs space-y-1.5 text-slate-700 font-sans">
          <div className="font-extrabold text-slate-900 text-[11px] border-b border-slate-100 pb-1 flex items-center justify-between">
            <span>POINT ID: {dataPoint.pointId}</span>
            <span className={`px-1.5 py-0.5 rounded font-bold uppercase text-[9px] ${
              dataPoint.depthType === 'cut' ? 'bg-red-50 text-red-600 border border-red-200' :
              dataPoint.depthType === 'fill' ? 'bg-[#112E81]/10 text-[#112E81] border border-[#112E81]/20' :
              'bg-[#36ADA3]/10 text-[#36ADA3] border border-[#36ADA3]/20'
            }`}>
              {dataPoint.depthType}
            </span>
          </div>
          <div><span className="text-slate-400 font-semibold uppercase">Easting (X):</span> <span className="font-mono text-slate-800">{dataPoint.x.toLocaleString()} ft</span></div>
          <div><span className="text-slate-400 font-semibold uppercase">Northing (Y):</span> <span className="font-mono text-slate-800">{dataPoint.y.toLocaleString()} ft</span></div>
          <div><span className="text-slate-400 font-semibold uppercase">Elevation (Z):</span> <span className="font-mono text-[#36ADA3] font-bold">{dataPoint.z.toFixed(2)} ft</span></div>
          
          {dataPoint.cutDepth > 0 && (
            <div className="text-red-600 font-bold mt-1 border-t border-slate-100 pt-1.5">
              Cut Depth: {dataPoint.cutDepth.toFixed(2)} ft
            </div>
          )}
          {dataPoint.fillDepth > 0 && (
            <div className="text-[#112E81] font-bold mt-1 border-t border-slate-100 pt-1.5">
              Fill Depth: {dataPoint.fillDepth.toFixed(2)} ft
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
        <XAxis
          type="number"
          dataKey="x"
          name="Easting"
          unit="ft"
          stroke="#475569"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          domain={['autoGrid', 'autoGrid']}
        />
        <YAxis
          type="number"
          dataKey="y"
          name="Northing"
          unit="ft"
          stroke="#475569"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          domain={['autoGrid', 'autoGrid']}
        />
        <ZAxis type="number" range={[100, 350]} />
        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(0,0,0,0.1)' }} />
        <Scatter name="Survey Points" data={chartData}>
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color}
              style={{
                filter: `drop-shadow(0 3px 6px ${entry.color}55)`,
                cursor: 'pointer',
              }}
            />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );

  return (
    <>
      <div id="recharts-scatter-plot-container" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-full space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">XY Spatial Plot</h3>
            <p className="text-xs text-slate-500">Spatial distribution of coordinates (X vs Y). Colored by elevation.</p>
          </div>
          
          <div className="flex items-center gap-3.5">
            {/* Legend */}
            <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#112E81]" />
                <span>Low ({minZ.toFixed(1)} ft)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#36ADA3]" />
                <span>High ({maxZ.toFixed(1)} ft)</span>
              </div>
            </div>

            <button
              onClick={() => setIsMaximized(true)}
              className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              title="View Full Screen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 w-full min-h-[300px]">
          {renderChart()}
        </div>
      </div>

      {/* Full Screen Modal */}
      {isMaximized && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in zoom-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">XY Spatial Plot (Full Screen)</h3>
                <p className="text-xs text-slate-500">Spatial distribution of coordinates (X vs Y). Colored by elevation.</p>
              </div>
              <button
                onClick={() => setIsMaximized(false)}
                className="p-2 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                title="Exit Full Screen"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 w-full min-h-0">
              {renderChart()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
