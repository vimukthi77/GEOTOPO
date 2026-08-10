'use client';

import React from 'react';
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js-dist-min';
import { CutFillDetail } from '@/lib/optimization';

const Plot = createPlotlyComponent(Plotly);

interface PlotlyTerrainMapProps {
  data: CutFillDetail[];
  targetZ: number;
}

export default function PlotlyTerrainMap({ data, targetZ }: PlotlyTerrainMapProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center text-slate-500 text-sm">
        No coordinate data loaded for 3D terrain rendering.
      </div>
    );
  }

  // Find bounding box for the reference plane
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const p of data) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  // Expand bounds slightly for better visual margin
  const padX = (maxX - minX) * 0.05 || 10;
  const padY = (maxY - minY) * 0.05 || 10;
  
  const planeX = [minX - padX, maxX + padX, maxX + padX, minX - padX];
  const planeY = [minY - padY, minY - padY, maxY + padY, maxY + padY];
  const planeZ = [targetZ, targetZ, targetZ, targetZ];

  // Map points to Plotly scatter traces
  // Divide data into cut, fill, and grade for separate color/label trace control
  const cutPoints = data.filter(p => p.depthType === 'cut');
  const fillPoints = data.filter(p => p.depthType === 'fill');
  const gradePoints = data.filter(p => p.depthType === 'grade');

  const traceCut = {
    x: cutPoints.map(p => p.x),
    y: cutPoints.map(p => p.y),
    z: cutPoints.map(p => p.z),
    mode: 'markers',
    name: 'Cut (Excavation)',
    type: 'scatter3d',
    text: cutPoints.map(p => `Pt ${p.pointId}<br>Elev: ${p.z.toFixed(2)} ft<br>Cut Depth: ${p.cutDepth.toFixed(2)} ft`),
    hoverinfo: 'text',
    marker: {
      color: '#dc2626',
      size: 7,
      symbol: 'circle',
      line: {
        color: '#991b1b',
        width: 1
      },
      opacity: 0.95
    }
  };

  const traceFill = {
    x: fillPoints.map(p => p.x),
    y: fillPoints.map(p => p.y),
    z: fillPoints.map(p => p.z),
    mode: 'markers',
    name: 'Fill (Embankment)',
    type: 'scatter3d',
    text: fillPoints.map(p => `Pt ${p.pointId}<br>Elev: ${p.z.toFixed(2)} ft<br>Fill Depth: ${p.fillDepth.toFixed(2)} ft`),
    hoverinfo: 'text',
    marker: {
      color: '#112E81',
      size: 7,
      symbol: 'circle',
      line: {
        color: '#0c2363',
        width: 1
      },
      opacity: 0.95
    }
  };

  const traceGrade = {
    x: gradePoints.map(p => p.x),
    y: gradePoints.map(p => p.y),
    z: gradePoints.map(p => p.z),
    mode: 'markers',
    name: 'At Grade',
    type: 'scatter3d',
    text: gradePoints.map(p => `Pt ${p.pointId}<br>Elev: ${p.z.toFixed(2)} ft<br>On Grade`),
    hoverinfo: 'text',
    marker: {
      color: '#36ADA3',
      size: 7,
      symbol: 'circle',
      line: {
        color: '#207871',
        width: 1
      },
      opacity: 0.95
    }
  };

  // Semitransparent 3D surface grid plane representing Target Grade Z
  const traceTargetPlane = {
    type: 'mesh3d',
    x: planeX,
    y: planeY,
    z: planeZ,
    i: [0, 0],
    j: [1, 2],
    k: [2, 3],
    color: '#36ADA3',
    opacity: 0.2,
    name: `Target Grade (${targetZ.toFixed(2)} ft)`,
    showlegend: true,
    hoverinfo: 'skip'
  };

  // 3D Terrain Surface (Delaunay triangulation of all points)
  const traceTerrainSurface = {
    type: 'mesh3d',
    x: data.map(p => p.x),
    y: data.map(p => p.y),
    z: data.map(p => p.z),
    opacity: 0.35,
    color: '#94a3b8',
    name: 'Topographic Mesh',
    showlegend: true,
    hoverinfo: 'skip'
  };

  const traces: any[] = [
    traceTerrainSurface,
    traceTargetPlane,
    traceCut,
    traceFill,
    traceGrade
  ];

  return (
    <div id="plotly-terrain-map-container" className="w-full h-full min-h-[400px] rounded-xl overflow-hidden">
      <Plot
        data={traces}
        layout={{
          autosize: true,
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(0,0,0,0)',
          margin: { l: 0, r: 0, b: 0, t: 0 },
          scene: {
            xaxis: {
              title: { text: 'Easting (X)', font: { color: '#334155', size: 10 } },
              gridcolor: 'rgba(0,0,0,0.15)',
              zerolinecolor: 'rgba(0,0,0,0.15)',
              backgroundcolor: 'rgba(0,0,0,0)',
              tickfont: { color: '#475569', size: 9 },
            },
            yaxis: {
              title: { text: 'Northing (Y)', font: { color: '#334155', size: 10 } },
              gridcolor: 'rgba(0,0,0,0.15)',
              zerolinecolor: 'rgba(0,0,0,0.15)',
              backgroundcolor: 'rgba(0,0,0,0)',
              tickfont: { color: '#475569', size: 9 },
            },
            zaxis: {
              title: { text: 'Elevation (Z)', font: { color: '#334155', size: 10 } },
              gridcolor: 'rgba(0,0,0,0.15)',
              zerolinecolor: 'rgba(0,0,0,0.15)',
              backgroundcolor: 'rgba(0,0,0,0)',
              tickfont: { color: '#475569', size: 9 },
            },
            camera: {
              eye: { x: 1.5, y: 1.5, z: 1.2 },
            },
          },
          legend: {
            font: { color: '#334155', size: 10 },
            x: 0,
            y: 1,
            orientation: 'v',
          },
        }}
        config={{
          responsive: true,
          displaylogo: false,
          modeBarButtonsToRemove: ['sendDataToCloud', 'select2d', 'lasso2d'],
          preserveDrawingBuffer: true,
        }}
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
