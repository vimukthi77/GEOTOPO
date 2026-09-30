'use client';

import React, { useState } from 'react';
import { TrackerTerrainCalculationResult } from '@/lib/tracker-post-terrain/calculateTrackerCoordinates';
import { Table, Copy, Check, FileSpreadsheet, Ruler, ArrowRightLeft } from 'lucide-react';

interface CoordinateTableProps {
  result: TrackerTerrainCalculationResult;
}

export default function CoordinateTable({ result }: CoordinateTableProps) {
  const [unitMode, setUnitMode] = useState<'m' | 'mm'>('m');
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [copiedCsv, setCopiedCsv] = useState(false);

  const { points } = result;

  const handleCopyCoordinatesOnly = () => {
    const lines = points.map((p) => {
      const x = unitMode === 'm' ? p.xM.toFixed(3) : p.xMm.toFixed(3);
      const y = unitMode === 'm' ? p.yM.toFixed(3) : p.yMm.toFixed(3);
      const z = unitMode === 'm' ? p.zM.toFixed(3) : p.zMm.toFixed(3);
      return `${p.label}\t${x}\t${y}\t${z}`;
    });
    const header = `Point\tX (${unitMode})\tY (${unitMode})\tZ (${unitMode})`;
    const text = [header, ...lines].join('\n');

    navigator.clipboard.writeText(text);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const handleCopyFullCsv = () => {
    const isM = unitMode === 'm';
    const header = `Point,Segment (${isM ? 'm' : 'mm'}),CumDist (${isM ? 'm' : 'mm'}),X (${isM ? 'm' : 'mm'}),Y (${isM ? 'm' : 'mm'}),Z (${isM ? 'm' : 'mm'}),DeltaY (${isM ? 'm' : 'mm'}),DeltaZ (${isM ? 'm' : 'mm'})`;

    const rows = points.map((p) => {
      const seg = p.segmentLengthMm !== null ? (isM ? p.segmentLengthM!.toFixed(3) : p.segmentLengthMm) : '';
      const cum = isM ? p.cumLengthM.toFixed(3) : p.cumLengthMm;
      const x = isM ? p.xM.toFixed(3) : p.xMm.toFixed(3);
      const y = isM ? p.yM.toFixed(3) : p.yMm.toFixed(3);
      const z = isM ? p.zM.toFixed(3) : p.zMm.toFixed(3);
      const dy = p.deltaYM !== null ? (isM ? p.deltaYM!.toFixed(3) : p.deltaYMm!.toFixed(3)) : '';
      const dz = p.deltaZM !== null ? (isM ? p.deltaZM!.toFixed(3) : p.deltaZMm!.toFixed(3)) : '';
      return `${p.label},${seg},${cum},${x},${y},${z},${dy},${dz}`;
    });

    const csvText = [header, ...rows].join('\n');
    navigator.clipboard.writeText(csvText);
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2000);
  };

  const isM = unitMode === 'm';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 md:p-7 shadow-2xl backdrop-blur-xl text-slate-100 space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
            <Table className="w-4 h-4 text-[#36ADA3]" />
            <span>Deterministic Coordinates</span>
          </div>
          <h3 className="text-xl font-extrabold text-white mt-1">
            Point Coordinate Table (X, Y, Z)
          </h3>
          <p className="text-xs text-slate-400">
            Full 64-bit double precision calculated • Rounded to 3 decimal places for site display
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Unit Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
            <button
              onClick={() => setUnitMode('m')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                unitMode === 'm'
                  ? 'bg-[#112E81] text-white border border-sky-400/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Meters (m)
            </button>
            <button
              onClick={() => setUnitMode('mm')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                unitMode === 'mm'
                  ? 'bg-[#112E81] text-white border border-sky-400/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Millimeters (mm)
            </button>
          </div>

          {/* Copy Buttons */}
          <button
            onClick={handleCopyCoordinatesOnly}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition active:scale-95 cursor-pointer"
            title="Copy P1, X, Y, Z tabular text to clipboard"
          >
            {copiedCoords ? (
              <Check className="w-3.5 h-3.5 text-teal-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-sky-400" />
            )}
            <span>{copiedCoords ? 'Copied!' : 'Copy Coordinates'}</span>
          </button>

          <button
            onClick={handleCopyFullCsv}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition active:scale-95 cursor-pointer"
            title="Copy full CSV table"
          >
            {copiedCsv ? (
              <Check className="w-3.5 h-3.5 text-teal-400" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-400" />
            )}
            <span>{copiedCsv ? 'CSV Copied!' : 'Copy CSV'}</span>
          </button>
        </div>
      </div>

      {/* Coordinate Note Pill */}
      <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-xs text-slate-300 flex items-start gap-2.5">
        <Ruler className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-teal-300">Coordinate Convention:</span> X is currently fixed at 0.000 because the supplied tracker geometry defines the longitudinal Y-Z profile only. Y represents cumulative horizontal distance, and Z represents elevation above datum.
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 max-h-[460px] overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-950/95 sticky top-0 z-10 text-slate-300 text-xs font-bold uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4">Point</th>
              <th className="py-3.5 px-4 text-right">Segment ({isM ? 'm' : 'mm'})</th>
              <th className="py-3.5 px-4 text-right">Cum. Dist ({isM ? 'm' : 'mm'})</th>
              <th className="py-3.5 px-4 text-right">X ({isM ? 'm' : 'mm'})</th>
              <th className="py-3.5 px-4 text-right">Y ({isM ? 'm' : 'mm'})</th>
              <th className="py-3.5 px-4 text-right">Z Elevation ({isM ? 'm' : 'mm'})</th>
              <th className="py-3.5 px-4 text-right">ΔY Horiz ({isM ? 'm' : 'mm'})</th>
              <th className="py-3.5 px-4 text-right">ΔZ Vert ({isM ? 'm' : 'mm'})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-xs text-slate-200">
            {points.map((pt, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === points.length - 1;

              return (
                <tr
                  key={pt.label}
                  className={`hover:bg-slate-800/50 transition-colors ${
                    isFirst
                      ? 'bg-teal-950/20 text-teal-200 font-semibold'
                      : isLast
                      ? 'bg-sky-950/20 text-sky-200 font-semibold'
                      : ''
                  }`}
                >
                  <td className="py-3 px-4 font-extrabold flex items-center gap-2">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        isFirst ? 'bg-teal-400' : isLast ? 'bg-sky-400' : 'bg-slate-600'
                      }`}
                    />
                    <span>{pt.label}</span>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400">
                    {pt.segmentLengthMm !== null
                      ? isM
                        ? pt.segmentLengthM!.toFixed(3)
                        : pt.segmentLengthMm
                      : '—'}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-300">
                    {isM ? pt.cumLengthM.toFixed(3) : pt.cumLengthMm}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400">
                    {isM ? pt.xM.toFixed(3) : pt.xMm.toFixed(3)}
                  </td>
                  <td className="py-3 px-4 text-right text-teal-300 font-bold">
                    {isM ? pt.yM.toFixed(3) : pt.yMm.toFixed(3)}
                  </td>
                  <td className="py-3 px-4 text-right text-sky-300 font-bold">
                    {isM ? pt.zM.toFixed(3) : pt.zMm.toFixed(3)}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400">
                    {pt.deltaYM !== null
                      ? isM
                        ? pt.deltaYM!.toFixed(3)
                        : pt.deltaYMm!.toFixed(3)
                      : '—'}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400">
                    {pt.deltaZM !== null
                      ? isM
                        ? pt.deltaZM!.toFixed(3)
                        : pt.deltaZMm!.toFixed(3)
                      : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
