'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { CutFillDetail } from '@/lib/optimization';
import { Loader2, Maximize2, Minimize2 } from 'lucide-react';

// Dynamic load to disable SSR compilation of Plotly
const PlotlyTerrainMap = dynamic(() => import('./PlotlyTerrainMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] flex flex-col items-center justify-center text-slate-500 text-sm gap-2 bg-slate-50 border border-slate-100 rounded-xl">
      <Loader2 className="w-8 h-8 animate-spin text-[#112E81]" />
      <span className="font-medium tracking-wide">Compiling 3D Engine & Topo WebGL...</span>
    </div>
  ),
});

interface TerrainMapProps {
  data: CutFillDetail[];
  targetZ: number;
  optimalSlopeX: number;
  optimalSlopeY: number;
}

export default function TerrainMap({
  data,
  targetZ,
  optimalSlopeX,
  optimalSlopeY,
}: TerrainMapProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-full space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">3D Topography Mesh</h3>
            <p className="text-xs text-slate-500">
              Rotate, pan, and zoom to inspect coordinates. Green plane represents the optimized Target Z grade.
            </p>
          </div>
          <button
            onClick={() => setIsMaximized(true)}
            className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer self-start"
            title="View Full Screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 w-full min-h-[400px]">
          <PlotlyTerrainMap
            data={data}
            targetZ={targetZ}
            optimalSlopeX={optimalSlopeX}
            optimalSlopeY={optimalSlopeY}
          />
        </div>
      </div>

      {/* Full Screen Modal */}
      {isMaximized && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in zoom-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">3D Topography Mesh (Full Screen)</h3>
                <p className="text-xs text-slate-500">
                  Rotate, pan, and zoom to inspect coordinates. Green plane represents the optimized Target Z grade.
                </p>
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
              <PlotlyTerrainMap
                data={data}
                targetZ={targetZ}
                optimalSlopeX={optimalSlopeX}
                optimalSlopeY={optimalSlopeY}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
