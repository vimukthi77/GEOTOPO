'use client';

import React, { useState } from 'react';
import { TrackerTerrainCalculationResult } from '@/lib/tracker-post-terrain/calculateTrackerCoordinates';
import { Table, Copy, Check, FileSpreadsheet, Ruler, ArrowRightLeft } from 'lucide-react';

import { useTheme } from '@/context/ThemeContext';

interface CoordinateTableProps {
  result: TrackerTerrainCalculationResult;
}

export default function CoordinateTable({ result }: CoordinateTableProps) {
  const [unitMode, setUnitMode] = useState<'m' | 'mm'>('m');
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [copiedCsv, setCopiedCsv] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
    <div
      className={`border rounded-3xl p-5 md:p-7 shadow-2xl backdrop-blur-xl space-y-5 transition-colors duration-200 ${
        isDark
          ? 'bg-slate-900/90 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900 shadow-xl'
      }`}
    >
      {/* Header & Controls */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <div>
          <div className="flex items-center gap-2 text-teal-500 font-bold text-xs uppercase tracking-wider">
            <Table className="w-4 h-4 text-[#36ADA3]" />
            <span>Deterministic Coordinates</span>
          </div>
          <h3 className={`text-xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Point Coordinate Table (X, Y, Z)
          </h3>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Full 64-bit double precision calculated • Rounded to 3 decimal places for site display
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Unit Toggle */}
          <div
            className={`flex items-center gap-1 p-1 rounded-2xl border ${
              isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <button
              onClick={() => setUnitMode('m')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                unitMode === 'm'
                  ? 'bg-[#112E81] text-white border border-sky-400/40 shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Meters (m)
            </button>
            <button
              onClick={() => setUnitMode('mm')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                unitMode === 'mm'
                  ? 'bg-[#112E81] text-white border border-sky-400/40 shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Millimeters (mm)
            </button>
          </div>

          {/* Copy Buttons */}
          <button
            onClick={handleCopyCoordinatesOnly}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition active:scale-95 cursor-pointer ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
            title="Copy P1, X, Y, Z tabular text to clipboard"
          >
            {copiedCoords ? (
              <Check className="w-3.5 h-3.5 text-teal-500" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-sky-500" />
            )}
            <span>{copiedCoords ? 'Copied!' : 'Copy Coordinates'}</span>
          </button>

          <button
            onClick={handleCopyFullCsv}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition active:scale-95 cursor-pointer ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
            title="Copy full CSV table"
          >
            {copiedCsv ? (
              <Check className="w-3.5 h-3.5 text-teal-500" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-500" />
            )}
            <span>{copiedCsv ? 'CSV Copied!' : 'Copy CSV'}</span>
          </button>
        </div>
      </div>

      {/* Coordinate Note Pill */}
      <div
        className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 ${
          isDark
            ? 'bg-white/5 border-white/5 text-slate-300'
            : 'bg-teal-50/60 border-teal-200 text-slate-700'
        }`}
      >
        <Ruler className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-teal-600 dark:text-teal-300">Coordinate Convention:</span> X coordinate is set to {isM ? points[0]?.xM.toFixed(3) : points[0]?.xMm.toFixed(3)} {unitMode}. Y represents cumulative horizontal ground distance along tracker axis, and Z represents post elevation above datum.
        </div>
      </div>

      {/* Table Container */}
      <div
        className={`overflow-x-auto rounded-2xl border max-h-[460px] overflow-y-auto custom-scrollbar ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <table className="w-full text-left border-collapse">
          <thead
            className={`sticky top-0 z-10 text-xs font-bold uppercase tracking-wider border-b ${
              isDark
                ? 'bg-slate-950/95 text-slate-300 border-slate-800'
                : 'bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            <tr>
              <th className="py-3.5 px-4">Point</th>
              <th className="py-3.5 px-4 text-right">Physical Segment Length ({isM ? 'm' : 'mm'})</th>
              <th className="py-3.5 px-4 text-right">Ground Projection ΔY ({isM ? 'm' : 'mm'})</th>
              <th className="py-3.5 px-4 text-right">Cumulative Ground Y ({isM ? 'm' : 'mm'})</th>
              <th className="py-3.5 px-4 text-right">X ({isM ? 'm' : 'mm'})</th>
              <th className="py-3.5 px-4 text-right">Y Ground ({isM ? 'm' : 'mm'})</th>
              <th className="py-3.5 px-4 text-right">Z Elevation ({isM ? 'm' : 'mm'})</th>
              <th className="py-3.5 px-4 text-right">ΔZ Elevation Change ({isM ? 'm' : 'mm'})</th>
            </tr>
          </thead>
          <tbody
            className={`divide-y font-mono text-xs ${
              isDark ? 'divide-slate-800/60 text-slate-200' : 'divide-slate-200 text-slate-800'
            }`}
          >
            {points.map((pt, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === points.length - 1;

              return (
                <tr
                  key={pt.label}
                  className={`transition-colors ${
                    isDark
                      ? `hover:bg-slate-800/50 ${
                          isFirst ? 'bg-teal-950/20 text-teal-200 font-semibold' : isLast ? 'bg-sky-950/20 text-sky-200 font-semibold' : ''
                        }`
                      : `hover:bg-slate-50 ${
                          isFirst ? 'bg-teal-50 text-teal-900 font-semibold' : isLast ? 'bg-sky-50 text-sky-900 font-semibold' : ''
                        }`
                  }`}
                >
                  <td className="py-3 px-4 font-extrabold flex items-center gap-2">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        isFirst ? 'bg-teal-500' : isLast ? 'bg-sky-500' : isDark ? 'bg-slate-600' : 'bg-slate-400'
                      }`}
                    />
                    <span>{pt.label}</span>
                  </td>
                  <td className={`py-3 px-4 text-right ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {pt.segmentLengthMm !== null
                      ? isM
                        ? pt.segmentLengthM!.toFixed(3)
                        : pt.segmentLengthMm
                      : '—'}
                  </td>
                  <td className="py-3 px-4 text-right text-teal-600 dark:text-teal-400 font-medium">
                    {pt.deltaYM !== null
                      ? isM
                        ? pt.deltaYM!.toFixed(3)
                        : pt.deltaYMm!.toFixed(3)
                      : '—'}
                  </td>
                  <td className="py-3 px-4 text-right text-teal-700 dark:text-teal-300 font-bold">
                    {isM ? pt.cumGroundYM.toFixed(3) : pt.cumGroundYMm.toFixed(3)}
                  </td>
                  <td className={`py-3 px-4 text-right ${isDark ? 'text-slate-300' : 'text-slate-700'} font-semibold`}>
                    {isM ? pt.xM.toFixed(3) : pt.xMm.toFixed(3)}
                  </td>
                  <td className="py-3 px-4 text-right text-teal-700 dark:text-teal-300 font-bold">
                    {isM ? pt.yM.toFixed(3) : pt.yMm.toFixed(3)}
                  </td>
                  <td className="py-3 px-4 text-right text-sky-700 dark:text-sky-300 font-bold">
                    {isM ? pt.zM.toFixed(3) : pt.zMm.toFixed(3)}
                  </td>
                  <td className={`py-3 px-4 text-right ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
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
          <tfoot
            className={`sticky bottom-0 z-10 text-xs font-mono font-bold border-t-2 ${
              isDark
                ? 'bg-slate-950 border-slate-700'
                : 'bg-slate-100 border-slate-300 text-slate-900'
            }`}
          >
            <tr className={isDark ? 'bg-slate-950/95 text-teal-300' : 'bg-slate-100 text-teal-900'}>
              <td className="py-3.5 px-4 font-extrabold uppercase font-sans tracking-wider text-teal-600 dark:text-teal-400">
                TOTAL / SUM
              </td>
              <td className="py-3.5 px-4 text-right text-sky-600 dark:text-sky-300 font-extrabold">
                {isM ? result.totalLengthM.toFixed(3) : result.totalLengthMm}
              </td>
              <td className="py-3.5 px-4 text-right text-teal-600 dark:text-teal-300 font-extrabold">
                {isM ? result.totalHorizontalProjectionM.toFixed(3) : result.totalHorizontalProjectionMm.toFixed(3)}
              </td>
              <td className="py-3.5 px-4 text-right text-teal-600 dark:text-teal-300 font-extrabold">
                {isM ? result.totalHorizontalProjectionM.toFixed(3) : result.totalHorizontalProjectionMm.toFixed(3)}
              </td>
              <td className={`py-3.5 px-4 text-right ${isDark ? 'text-slate-300' : 'text-slate-700'} font-bold`}>
                {isM ? points[0]?.xM.toFixed(3) : points[0]?.xMm.toFixed(3)}
              </td>
              <td className="py-3.5 px-4 text-right text-teal-600 dark:text-teal-300 font-extrabold">
                {isM ? result.totalHorizontalProjectionM.toFixed(3) : result.totalHorizontalProjectionMm.toFixed(3)}
              </td>
              <td className="py-3.5 px-4 text-right text-sky-600 dark:text-sky-300 font-extrabold">
                {isM ? result.E2_m.toFixed(3) : result.E2_mm.toFixed(3)}
              </td>
              <td className="py-3.5 px-4 text-right text-emerald-600 dark:text-emerald-300 font-extrabold">
                {isM
                  ? `${result.deltaElevation_m >= 0 ? '+' : ''}${result.deltaElevation_m.toFixed(3)}`
                  : `${result.deltaElevation_mm >= 0 ? '+' : ''}${result.deltaElevation_mm.toFixed(3)}`}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
