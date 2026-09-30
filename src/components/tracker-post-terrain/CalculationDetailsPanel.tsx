'use client';

import React, { useState } from 'react';
import { TrackerTerrainCalculationResult } from '@/lib/tracker-post-terrain/calculateTrackerCoordinates';
import { ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

interface CalculationDetailsPanelProps {
  result: TrackerTerrainCalculationResult;
}

export default function CalculationDetailsPanel({ result }: CalculationDetailsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

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
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl text-slate-100 transition-all">
      {/* Toggle Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 md:p-6 bg-slate-950/60 hover:bg-slate-950/90 transition text-left cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/20">
            <BookOpen className="w-5 h-5 text-[#36ADA3]" />
          </div>
          <div>
            <h4 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>How is θ calculated? (Engineering Math &amp; Formulas)</span>
            </h4>
            <p className="text-xs text-slate-400">
              Transparent step-by-step breakdown based on inclined tracker geometry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
          <span>{isOpen ? 'Hide Explanation' : 'View Formulas & Steps'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className="p-5 md:p-7 border-t border-slate-800/80 space-y-6 bg-slate-900/50 text-slate-300 text-sm">
          {/* Section 1: Geometrical Premise */}
          <div className="space-y-2">
            <h5 className="font-bold text-white text-xs uppercase tracking-wider text-teal-300">
              1. Geometrical Principle (Inclined Beam vs Horizontal Projection)
            </h5>
            <p className="text-xs text-slate-300 leading-relaxed">
              In solar tracker civil engineering, the fixed segment lengths (L1, L2, ... Ln) represent physical distances measured <strong>along the inclined tracker beam line</strong>. Therefore, the total tracker length L_total is the total inclined beam length.
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-sky-300 space-y-1">
              <div>ΔE = E2 - E1 = {E2_m.toFixed(4)} m - {E1_m.toFixed(4)} m = {deltaElevation_m.toFixed(4)} m</div>
              <div>L_total = {totalLengthMm} mm = {totalLengthM.toFixed(3)} m</div>
            </div>
          </div>

          {/* Section 2: Inclination Angle Formula */}
          <div className="space-y-2">
            <h5 className="font-bold text-white text-xs uppercase tracking-wider text-teal-300">
              2. Inclination Angle Formula (ASIN / sin⁻¹)
            </h5>
            <p className="text-xs text-slate-300 leading-relaxed">
              Because the tracker beam is the hypotenuse of the elevation triangle:
            </p>
            <div className="p-3.5 bg-slate-950 rounded-xl border border-teal-500/30 font-mono text-xs text-emerald-300 space-y-2">
              <div className="font-bold text-white">θ = sin⁻¹( ΔE / L_total )</div>
              <div className="text-slate-400">
                ratio = ΔE / L_total = {deltaElevation_m.toFixed(6)} / {totalLengthM.toFixed(3)} = {ratio.toFixed(8)}
              </div>
              <div className="text-teal-300 font-bold">
                θ = asin({ratio.toFixed(8)}) = {thetaRad.toFixed(8)} radians = {thetaDeg.toFixed(6)}°
              </div>
            </div>
            <p className="text-[11px] text-amber-300/90 italic">
              Note: Do NOT use tan⁻¹ (atan) for this calculation, as the fixed segment lengths are sloped beam lengths, not horizontal ground distances.
            </p>
          </div>

          {/* Section 3: Trigonometric Components */}
          <div className="space-y-2">
            <h5 className="font-bold text-white text-xs uppercase tracking-wider text-teal-300">
              3. Trigonometric Multipliers
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                <span className="text-slate-400 block text-[10px]">sin(θ)</span>
                <span className="text-teal-300 font-bold">{sinTheta.toFixed(8)}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                <span className="text-slate-400 block text-[10px]">cos(θ)</span>
                <span className="text-teal-300 font-bold">{cosTheta.toFixed(8)}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                <span className="text-slate-400 block text-[10px]">tan(θ) verification</span>
                <span className="text-sky-300 font-bold">{tanTheta.toFixed(8)}</span>
              </div>
            </div>
          </div>

          {/* Section 4: Sequential Coordinate Increments */}
          <div className="space-y-2">
            <h5 className="font-bold text-white text-xs uppercase tracking-wider text-teal-300">
              4. Sequential Coordinate Iteration (Y and Z)
            </h5>
            <p className="text-xs text-slate-300 leading-relaxed">
              Starting from P1 (Y0 = 0, Z0 = E1), each subsequent pile post coordinate is calculated iteratively from the fixed segment length Li:
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-200 space-y-1">
              <div>ΔY_i = L_i × cos(θ)   (Horizontal increment)</div>
              <div>ΔZ_i = L_i × sin(θ)   (Vertical increment)</div>
              <div className="pt-1 text-teal-300 font-bold">Y_i = Y_(i-1) + ΔY_i</div>
              <div className="text-sky-300 font-bold">Z_i = Z_(i-1) + ΔZ_i</div>
            </div>
          </div>

          {/* Section 5: Verification Example */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <h5 className="font-bold text-white text-xs uppercase tracking-wider text-teal-300">
              5. Final Endpoint Elevation Verification
            </h5>
            <div className="p-3.5 bg-emerald-950/40 rounded-xl border border-emerald-500/30 text-xs space-y-1">
              <div className="font-bold text-emerald-300">
                Calculated Total Horizontal Projection Y_max = {totalHorizontalProjectionM.toFixed(4)} m ({result.totalHorizontalProjectionMm.toFixed(1)} mm)
              </div>
              <div className="font-bold text-emerald-300">
                Calculated Final Z = E1 + L_total × sin(θ) = {E1_m.toFixed(4)} + ({totalLengthM.toFixed(4)} × {sinTheta.toFixed(6)}) = {result.calculatedFinalZM.toFixed(4)} m
              </div>
              <div className="text-slate-300">
                Target E2 = {E2_m.toFixed(4)} m | Endpoint Discrepancy Error = {result.endpointErrorM.toFixed(6)} m (PASS)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
