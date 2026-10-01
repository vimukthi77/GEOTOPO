'use client';

import React from 'react';
import { TrackerTerrainCalculationResult } from '@/lib/tracker-post-terrain/calculateTrackerCoordinates';
import { ShieldCheck, CheckCircle2, AlertTriangle, Info, Check, AlertCircle } from 'lucide-react';

interface EngineeringValidationPanelProps {
  result: TrackerTerrainCalculationResult;
}

import { useTheme } from '@/context/ThemeContext';

interface EngineeringValidationPanelProps {
  result: TrackerTerrainCalculationResult;
}

export default function EngineeringValidationPanel({ result }: EngineeringValidationPanelProps) {
  const { validations, endpointValidationPass, endpointErrorM, calculatedFinalZM, E2_m } = result;
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      className={`border rounded-3xl p-5 md:p-7 shadow-2xl backdrop-blur-xl space-y-6 transition-colors duration-200 ${
        isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
      }`}
    >
      {/* Header */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <div>
          <div className="flex items-center gap-2 text-teal-500 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#36ADA3]" />
            <span>Quality Assurance &amp; Verification</span>
          </div>
          <h3 className={`text-xl font-extrabold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Engineering Validation Panel
          </h3>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Strict verification checks ensuring geometry consistency, endpoint matching, and zero ratio errors
          </p>
        </div>

        {/* Overall Pass/Fail Badge */}
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-black text-xs uppercase tracking-wider shadow-lg ${
            endpointValidationPass
              ? isDark
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 shadow-emerald-500/10'
                : 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-emerald-500/10'
              : isDark
              ? 'bg-amber-950/80 border-amber-500/50 text-amber-300 shadow-amber-500/10'
              : 'bg-amber-50 border-amber-300 text-amber-800 shadow-amber-500/10'
          }`}
        >
          {endpointValidationPass ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>ENDPOINT VALIDATION: PASS</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>ENDPOINT VALIDATION: CHECK</span>
            </>
          )}
        </div>
      </div>

      {/* Endpoint Comparison Highlight Box */}
      <div
        className={`p-4 rounded-2xl border transition-all ${
          endpointValidationPass
            ? isDark
              ? 'bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 border-emerald-500/30'
              : 'bg-gradient-to-r from-emerald-50/50 via-white to-slate-50 border-emerald-200'
            : isDark
            ? 'bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border-amber-500/30'
            : 'bg-gradient-to-r from-amber-50/50 via-white to-slate-50 border-amber-200'
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center md:text-left">
          <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'}`}>
            <span className={`text-[11px] font-semibold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Expected E2 Elevation
            </span>
            <span className={`text-lg font-mono font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {E2_m.toFixed(6)} m
            </span>
          </div>

          <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'}`}>
            <span className={`text-[11px] font-semibold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Calculated Final Z
            </span>
            <span className="text-lg font-mono font-extrabold text-teal-600 dark:text-teal-300">
              {calculatedFinalZM.toFixed(6)} m
            </span>
          </div>

          <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'}`}>
            <span className={`text-[11px] font-semibold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Discrepancy Error (ΔZ)
            </span>
            <span
              className={`text-lg font-mono font-extrabold ${
                endpointValidationPass
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
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
                ? isDark
                  ? 'bg-white/5 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                : 'bg-rose-950/20 border-rose-800/50'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${
                val.passed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
              }`}
            >
              {val.passed ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{val.name}</span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    val.passed
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                      : 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                  }`}
                >
                  {val.passed ? '✓ PASS' : '⚠ CHECK'}
                </span>
              </div>
              <p className={`text-xs leading-snug ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{val.message}</p>
              {val.details && (
                <p className={`text-[11px] font-mono p-2 rounded-lg border mt-1 ${isDark ? 'text-slate-400 bg-slate-950/60 border-slate-800/80' : 'text-slate-600 bg-white border-slate-200'}`}>
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
