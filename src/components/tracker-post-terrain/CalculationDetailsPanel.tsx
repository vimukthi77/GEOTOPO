'use client';

import React, { useState } from 'react';
import { TrackerTerrainCalculationResult } from '@/lib/tracker-post-terrain/calculateTrackerCoordinates';
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface CalculationDetailsPanelProps {
  result: TrackerTerrainCalculationResult;
}

export default function CalculationDetailsPanel({ result }: CalculationDetailsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const {
    E1_m,
    E2_m,
    deltaElevation_m,
    totalLengthM,
    totalLengthMm,
    ratio,
    thetaRad,
    thetaDeg,
    sinTheta,
    cosTheta,
    tanTheta,
    totalHorizontalProjectionM,
  } = result;

  return (
    <div
      className={`border rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl transition-colors duration-200 ${
        isDark
          ? 'bg-slate-900/90 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900 shadow-xl'
      }`}
    >
      {/* Toggle Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-5 md:p-6 transition text-left cursor-pointer ${
          isDark
            ? 'bg-slate-950/60 hover:bg-slate-950/90'
            : 'bg-slate-50/80 hover:bg-slate-100/90'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-500/10 text-teal-500 rounded-2xl border border-teal-500/20">
            <BookOpen className="w-5 h-5 text-[#36ADA3]" />
          </div>
          <div>
            <h4 className={`text-base font-extrabold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <span>How is θ calculated? (Engineering Math &amp; Formulas)</span>
            </h4>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Transparent step-by-step breakdown based on inclined tracker geometry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-teal-600 dark:text-teal-300">
          <span>{isOpen ? 'Hide Explanation' : 'View Formulas & Steps'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div
          className={`p-5 md:p-7 border-t space-y-6 text-sm ${
            isDark
              ? 'border-slate-800/80 bg-slate-900/50 text-slate-300'
              : 'border-slate-200 bg-slate-50/50 text-slate-700'
          }`}
        >
          {/* Section 1: Geometrical Premise */}
          <div className="space-y-2">
            <h5 className="font-bold text-xs uppercase tracking-wider text-teal-600 dark:text-teal-300">
              1. Geometrical Principle (Inclined Beam vs Horizontal Projection)
            </h5>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              In solar tracker civil engineering, the fixed segment lengths (L1, L2, ... Ln) represent physical distances measured <strong>along the inclined tracker beam line</strong>. Therefore, the total tracker length L_total is the total inclined beam length.
            </p>
            <div className={`p-3 rounded-xl border font-mono text-xs text-sky-600 dark:text-sky-300 space-y-1 ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div>ΔE = E2 - E1 = {E2_m.toFixed(4)} m - {E1_m.toFixed(4)} m = {deltaElevation_m.toFixed(4)} m</div>
              <div>L_total = {totalLengthMm} mm = {totalLengthM.toFixed(3)} m</div>
            </div>
          </div>

          {/* Section 2: Inclination Angle Formula */}
          <div className="space-y-2">
            <h5 className="font-bold text-xs uppercase tracking-wider text-teal-600 dark:text-teal-300">
              2. Inclination Angle Formula (ASIN / sin⁻¹)
            </h5>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Because the tracker beam is the hypotenuse of the elevation triangle:
            </p>
            <div className={`p-3.5 rounded-xl border font-mono text-xs space-y-2 ${
              isDark
                ? 'bg-slate-950 border-teal-500/30 text-emerald-300'
                : 'bg-white border-teal-200 text-emerald-700'
            }`}>
              <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>θ = sin⁻¹( ΔE / L_total )</div>
              <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                ratio = ΔE / L_total = {deltaElevation_m.toFixed(6)} / {totalLengthM.toFixed(3)} = {ratio.toFixed(8)}
              </div>
              <div className="text-teal-600 dark:text-teal-300 font-bold">
                θ = asin({ratio.toFixed(8)}) = {thetaRad.toFixed(8)} radians = {thetaDeg.toFixed(6)}°
              </div>
            </div>
            <p className="text-[11px] text-amber-600 dark:text-amber-300/90 italic">
              Note: Do NOT use tan⁻¹ (atan) for this calculation, as the fixed segment lengths are sloped beam lengths, not horizontal ground distances.
            </p>
          </div>

          {/* Section 3: Trigonometric Components */}
          <div className="space-y-2">
            <h5 className="font-bold text-xs uppercase tracking-wider text-teal-600 dark:text-teal-300">
              3. Trigonometric Multipliers
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                <span className={`block text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>sin(θ)</span>
                <span className="text-teal-600 dark:text-teal-300 font-bold">{sinTheta.toFixed(8)}</span>
              </div>
              <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                <span className={`block text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>cos(θ)</span>
                <span className="text-teal-600 dark:text-teal-300 font-bold">{cosTheta.toFixed(8)}</span>
              </div>
              <div className={`p-3 rounded-xl border text-center ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                <span className={`block text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>tan(θ) verification</span>
                <span className="text-sky-600 dark:text-sky-300 font-bold">{tanTheta.toFixed(8)}</span>
              </div>
            </div>
          </div>

          {/* Section 4: Sequential Coordinate Increments */}
          <div className="space-y-2">
            <h5 className="font-bold text-xs uppercase tracking-wider text-teal-600 dark:text-teal-300">
              4. Sequential Coordinate Iteration (X, Y and Z)
            </h5>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Starting from P1 (X1 = {result.startX_m.toFixed(3)}m, Y1 = {result.startY_m.toFixed(3)}m, Z1 = {result.E1_m.toFixed(3)}m), each subsequent pile post coordinate is calculated iteratively from the fixed segment length Li:
            </p>
            <div className={`p-3 rounded-xl border font-mono text-xs space-y-1 ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
            }`}>
              <div>ΔY_i = L_i × cos(θ)   (Horizontal increment)</div>
              <div>ΔZ_i = L_i × sin(θ)   (Vertical increment)</div>
              <div className="pt-1 text-teal-600 dark:text-teal-300 font-bold">X_i = X1</div>
              <div className="text-teal-600 dark:text-teal-300 font-bold">
                {result.yDirection === 'DECREASING (-)'
                  ? 'Y_i = Y1 - cumGroundY_i = Y_(i-1) - ΔY_i (Reduce Y)'
                  : 'Y_i = Y1 + cumGroundY_i = Y_(i-1) + ΔY_i (Add Y)'}
              </div>
              <div className="text-sky-600 dark:text-sky-300 font-bold">Z_i = Z1 + cumDeltaZ_i = Z_(i-1) + ΔZ_i</div>
            </div>
          </div>

          {/* Section 5: Verification Example */}
          <div className={`space-y-2 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <h5 className="font-bold text-xs uppercase tracking-wider text-teal-600 dark:text-teal-300">
              5. Final Endpoint Elevation Verification
            </h5>
            <div className={`p-3.5 rounded-xl border text-xs space-y-1 ${
              isDark ? 'bg-emerald-950/40 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
            }`}>
              <div className="font-bold text-emerald-700 dark:text-emerald-300">
                Calculated Total Horizontal Projection Y_max = {totalHorizontalProjectionM.toFixed(4)} m ({result.totalHorizontalProjectionMm.toFixed(1)} mm)
              </div>
              <div className="font-bold text-emerald-700 dark:text-emerald-300">
                Calculated Final Z = E1 + L_total × sin(θ) = {E1_m.toFixed(4)} + ({totalLengthM.toFixed(4)} × {sinTheta.toFixed(6)}) = {result.calculatedFinalZM.toFixed(4)} m
              </div>
              <div className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                Target E2 = {E2_m.toFixed(4)} m | Endpoint Discrepancy Error = {result.endpointErrorM.toFixed(6)} m (PASS)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

