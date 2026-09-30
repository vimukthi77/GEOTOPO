'use client';

import React from 'react';
import { TrackerTerrainCalculationResult } from '@/lib/tracker-post-terrain/calculateTrackerCoordinates';
import { ShieldCheck, CheckCircle2, AlertTriangle, Info, Check, AlertCircle } from 'lucide-react';

interface EngineeringValidationPanelProps {
  result: TrackerTerrainCalculationResult;
}

export default function EngineeringValidationPanel({ result }: EngineeringValidationPanelProps) {
  const { validations, endpointValidationPass, endpointErrorM, calculatedFinalZM, E2_m } = result;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 md:p-7 shadow-2xl backdrop-blur-xl text-slate-100 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#36ADA3]" />
            <span>Quality Assurance &amp; Verification</span>
          </div>
          <h3 className="text-xl font-extrabold text-white mt-1">
            Engineering Validation Panel
          </h3>
          <p className="text-xs text-slate-400">
            Strict verification checks ensuring geometry consistency, endpoint matching, and zero ratio errors
          </p>
        </div>

        {/* Overall Pass/Fail Badge */}
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-black text-xs uppercase tracking-wider shadow-lg ${
            endpointValidationPass
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 shadow-emerald-500/10'
              : 'bg-amber-950/80 border-amber-500/50 text-amber-300 shadow-amber-500/10'
          }`}
        >
          {endpointValidationPass ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>ENDPOINT VALIDATION: PASS</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>ENDPOINT VALIDATION: CHECK</span>
            </>
          )}
        </div>
      </div>

      {/* Endpoint Comparison Highlight Box */}
      <div
        className={`p-4 rounded-2xl border transition-all ${
          endpointValidationPass
            ? 'bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 border-emerald-500/30'
            : 'bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border-amber-500/30'
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center md:text-left">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Expected E2 Elevation
            </span>
            <span className="text-lg font-mono font-extrabold text-white">
              {E2_m.toFixed(6)} m
            </span>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Calculated Final Z
            </span>
            <span className="text-lg font-mono font-extrabold text-teal-300">
              {calculatedFinalZM.toFixed(6)} m
            </span>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Discrepancy Error (ΔZ)
            </span>
            <span
              className={`text-lg font-mono font-extrabold ${
                endpointValidationPass ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {endpointErrorM.toFixed(6)} m
            </span>
          </div>
        </div>
      </div>

      {/* Verification Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {validations.map((val) => (
          <div
            key={val.id}
            className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
              val.passed
                ? 'bg-white/5 border-slate-800 hover:border-slate-700'
                : 'bg-rose-950/20 border-rose-800/50'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${
                val.passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}
            >
              {val.passed ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{val.name}</span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    val.passed
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {val.passed ? '✓ PASS' : '⚠ CHECK'}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-snug">{val.message}</p>
              {val.details && (
                <p className="text-[11px] font-mono text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 mt-1">
                  {val.details}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
