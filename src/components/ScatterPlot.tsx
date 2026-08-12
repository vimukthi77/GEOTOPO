'use client';

import React, { useState } from 'react';
import {
  ComposedChart,
  Scatter,
  Line,
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
  optimalTargetZ: number;
  optimalSlopeY: number;
}

export default function SpatialScatterPlot({
  data,
  optimalTargetZ,
  optimalSlopeY,
}: ScatterPlotProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 h-96 flex items-center justify-center text-slate-500 text-sm">
        No coordinate data available for profile plotting.
      </div>
    );
  }

  const is1D = data.length > 0 && data[0].distanceAlongBar !== undefined;

  // Sort data by distanceAlongBar if available, otherwise by Y (Northing)
  const sortedData = [...data].sort((a, b) => 
    is1D ? (a.distanceAlongBar! - b.distanceAlongBar!) : (a.y - b.y)
  );

  // Find Northing (Y) center to calculate the sloped profile line projection
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of data) {
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const yc = (minY + maxY) / 2;

  // Helper to color points by grading status
  const getPointColor = (depthType: 'cut' | 'fill' | 'grade') => {
    if (depthType === 'cut') return '#dc2626'; // Red
    if (depthType === 'fill') return '#112E81'; // Blue
    return '#36ADA3'; // Green
  };

  // Format data for Recharts
  const chartData = sortedData.map((p) => ({
    x: p.x,
    y: is1D ? p.distanceAlongBar : p.y, // Plotted on the horizontal axis
    z: p.z, // Plotted on the vertical axis (Elevation Z)
    pointId: p.pointId,
    cutDepth: p.cutDepth,
    fillDepth: p.fillDepth,
    depthType: p.depthType,
    // Use targetZ directly for 1D mode, project along Y for 2D mode
    targetZ: is1D ? p.targetZ : (optimalTargetZ + optimalSlopeY * (p.y - yc)),
    flatTargetZ: p.flatTargetZ, // Flat Target Z line value
    color: getPointColor(p.depthType),
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
          <div><span className="text-slate-400 font-semibold uppercase">Easting (X):</span> <span className="font-mono text-slate-800">{dataPoint.x.toFixed(1)} m</span></div>
          <div><span className="text-slate-400 font-semibold uppercase">Northing (Y):</span> <span className="font-mono text-slate-800">{dataPoint.y.toFixed(1)} m</span></div>
          {is1D && (
            <div><span className="text-slate-400 font-semibold uppercase">Dist on Bar:</span> <span className="font-mono text-slate-800 font-bold">{dataPoint.y.toFixed(1)} m</span></div>
          )}
          <div className="border-t border-slate-100 pt-1.5 space-y-1">
            <div><span className="text-slate-400 font-semibold uppercase">Sloped Target:</span> <span className="font-mono text-[#36ADA3] font-bold">{dataPoint.targetZ.toFixed(2)} m</span></div>
            <div><span className="text-slate-400 font-semibold uppercase">Flat Target:</span> <span className="font-mono text-slate-500">{dataPoint.flatTargetZ.toFixed(2)} m</span></div>
          </div>
          {dataPoint.cutDepth > 0 && (
            <div className="text-red-600 font-extrabold text-[10px] mt-1">
              Excavation (Cut): {dataPoint.cutDepth.toFixed(2)} m
            </div>
          )}
          {dataPoint.fillDepth > 0 && (
            <div className="text-[#112E81] font-extrabold text-[10px] mt-1">
              Embankment (Fill): {dataPoint.fillDepth.toFixed(2)} m
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
        <XAxis
          type="number"
          dataKey="y"
          name={is1D ? "Distance" : "Northing"}
          unit="m"
          stroke="#475569"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          domain={['autoGrid', 'autoGrid']}
          label={{ value: is1D ? 'Distance along Bar (m)' : 'Northing (Y) (m)', position: 'insideBottom', offset: -10, fill: '#475569', fontSize: 10, fontWeight: 'bold' }}
        />
        <YAxis
          type="number"
          dataKey="z"
          name="Elevation"
          unit="m"
          stroke="#475569"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          domain={['autoGrid', 'autoGrid']}
          label={{ value: 'Elevation (Z) (m)', angle: -90, position: 'insideLeft', offset: 0, fill: '#475569', fontSize: 10, fontWeight: 'bold' }}
        />
        <ZAxis type="number" range={[64, 64]} />
        
        {/* Flat Target Z Reference Line */}
        <Line
          type="linear"
          dataKey="flatTargetZ"
          stroke="#94a3b8"
          strokeWidth={2}
          strokeDasharray="6 4"
          dot={false}
          activeDot={false}
          name="Flat Target Grade"
        />

        {/* Sloped Target Z Reference Line */}
        <Line
          type="linear"
          dataKey="targetZ"
          stroke="#36ADA3"
          strokeWidth={3}
          dot={false}
          activeDot={false}
          name="Sloped Target Grade"
        />

        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(0,0,0,0.1)' }} />
        
        <Scatter name="Survey Points" dataKey="z">
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color}
              style={{
                filter: `drop-shadow(0 2px 4px ${entry.color}44)`,
                cursor: 'pointer',
              }}
            />
          ))}
        </Scatter>
      </ComposedChart>
    </ResponsiveContainer>
  );

  return (
    <>
      <div id="recharts-scatter-plot-container" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-full space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">2D Profile View (Z vs Y)</h3>
            <p className="text-xs text-slate-500">Elevation profile along Northing axis. Displays flat and sloped target grades.</p>
          </div>
          
          <div className="flex items-center gap-3.5">
            {/* Custom Legend */}
            <div className="flex flex-wrap items-center gap-3.5 text-[9px] text-slate-500 font-bold uppercase tracking-wider">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#dc2626]" />
                <span>Cut</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#112E81]" />
                <span>Fill</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#36ADA3]" />
                <span>Grade</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 border-t-2 border-dashed border-[#94a3b8]" />
                <span>Flat Grade</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 border-t-2 border-[#36ADA3]" />
                <span>Sloped Grade</span>
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
                <h3 className="text-lg font-bold text-slate-900">2D Profile View (Z vs Y) (Full Screen)</h3>
                <p className="text-xs text-slate-500">Elevation profile along Northing axis. Displays flat and sloped target grades.</p>
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
