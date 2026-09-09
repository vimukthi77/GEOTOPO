'use client';

import React, { useState, useId } from 'react';
import {
  TrackerType,
  TrackerConfig,
  TrackerCalculationOutput,
  trackerConfigurations,
  calculateTracker,
  downloadTrackerCSV,
  getConfigurationsForTracker,
} from '@/lib/trackerCalculations';
import {
  Calculator,
  Download,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  Info,
  Layers,
  Ruler,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

export default function TrackerCalculator() {
  const [trackerType, setTrackerType] = useState<TrackerType>('4 STRING');
  const [configKey, setConfigKey] = useState<string>('4_STRING_16');
  const [e1Input, setE1Input] = useState<string>('100.000');
  const [e2Input, setE2Input] = useState<string>('102.500');
  const [error, setError] = useState<string>('');
  const [copiedNotification, setCopiedNotification] = useState<string>('');
  const e1InputId = useId();
  const e2InputId = useId();

  // Get active configuration
  const activeConfig: TrackerConfig = trackerConfigurations[configKey] || trackerConfigurations['4_STRING_16'];
  const availableConfigs = getConfigurationsForTracker(trackerType);

  // Handle tracker type change: update tracker type and set first available configuration
  const handleTrackerTypeChange = (type: TrackerType) => {
    setTrackerType(type);
    const configs = getConfigurationsForTracker(type);
    if (configs.length > 0) {
      setConfigKey(configs[configs.length - 1].key); // default to the latest/standard option
    }
    setError('');
  };

  // Perform calculation
  let calculatedData: TrackerCalculationOutput | null = null;
  const numE1 = parseFloat(e1Input);
  const numE2 = parseFloat(e2Input);

  if (e1Input.trim() !== '' && e2Input.trim() !== '' && !isNaN(numE1) && !isNaN(numE2)) {
    try {
      calculatedData = calculateTracker(numE1, numE2, configKey);
    } catch (err: any) {
      // Catch calculation errors if any
      console.error(err);
    }
  }

  // Handle CSV Download
  const handleDownload = () => {
    if (!calculatedData) {
      setError('Please enter valid numerical values for E1 and E2 before downloading CSV.');
      return;
    }
    setError('');
    downloadTrackerCSV(calculatedData);
  };

  // Quick Preset Handlers
  const handleSetPreset = (e1Val: number, e2Val: number) => {
    setE1Input(e1Val.toFixed(3));
    setE2Input(e2Val.toFixed(3));
    setError('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#112E81]/10 rounded-xl border border-[#112E81]/20 text-[#112E81]">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Solar Tracker Pile Calculator
                </h1>
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                  Fixed Distances
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-500 mt-1">
                Computes pile-point elevations from E1 &amp; E2 endpoints across 6 fixed engineering tracker configurations.
              </p>
            </div>
          </div>

          {calculatedData && (
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-[#112E81] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#2563eb] border-none font-bold rounded-xl text-white shadow-md hover:shadow-lg active:scale-[0.98] transition cursor-pointer text-sm"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Controls on Left / Summary & Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Configuration & Inputs (5 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Tracker Selection Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#112E81]" />
                1. Select Tracker Type
              </h2>
              <span className="text-[11px] font-bold text-slate-400">3 Types</span>
            </div>

            {/* Tracker Type Segmented Buttons */}
            <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              {(['2 STRING', '3 STRING', '4 STRING'] as TrackerType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTrackerTypeChange(type)}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-extrabold transition cursor-pointer ${
                    trackerType === type
                      ? 'bg-[#112E81] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Pile-Point Configuration Selector */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                2. Pile-Point Configuration
              </label>
              <div className="space-y-2">
                {availableConfigs.map((cfg) => {
                  const isSelected = configKey === cfg.key;
                  return (
                    <button
                      key={cfg.key}
                      type="button"
                      onClick={() => {
                        setConfigKey(cfg.key);
                        setError('');
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-[#112E81] bg-[#112E81]/5 text-slate-900 ring-1 ring-[#112E81]'
                          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {cfg.pilePoints} Pile Points
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {cfg.values.length} calculated values • Axis {cfg.axis}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-[#112E81] bg-white px-2 py-0.5 rounded border border-slate-200">
                          {cfg.overallDistance.toFixed(3)} m
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fixed Distances Display (Read-Only Notification) */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                <Info className="w-3.5 h-3.5 text-[#112E81]" />
                Fixed Engineering Distances (Read-Only)
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                All {activeConfig.values.length} {activeConfig.axis}-axis distances and the overall distance of{' '}
                <span className="font-semibold text-slate-800">{activeConfig.overallDistance.toFixed(3)}m</span> are fixed.
                Manual entry of distances is locked according to engineering design specs.
              </p>
            </div>
          </div>

          {/* Elevation Inputs Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Ruler className="w-4 h-4 text-[#112E81]" />
                3. Enter Elevation Inputs
              </h2>
              <span className="text-[11px] font-medium text-slate-400">Unit: Meters (m)</span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2 text-xs">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* E1 Input */}
              <div>
                <label htmlFor={e1InputId} className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  E1 Elevation (m) — Start Point
                </label>
                <div className="relative">
                  <input
                    id={e1InputId}
                    type="number"
                    step="any"
                    placeholder="e.g. 100.000"
                    value={e1Input}
                    onChange={(e) => {
                      setE1Input(e.target.value);
                      setError('');
                    }}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold text-base focus:outline-none focus:border-[#112E81] focus:ring-1 focus:ring-[#112E81] transition shadow-inner"
                  />
                  <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400 pointer-events-none">
                    m
                  </span>
                </div>
              </div>

              {/* E2 Input */}
              <div>
                <label htmlFor={e2InputId} className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  E2 Elevation (m) — End Point
                </label>
                <div className="relative">
                  <input
                    id={e2InputId}
                    type="number"
                    step="any"
                    placeholder="e.g. 102.500"
                    value={e2Input}
                    onChange={(e) => {
                      setE2Input(e.target.value);
                      setError('');
                    }}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold text-base focus:outline-none focus:border-[#112E81] focus:ring-1 focus:ring-[#112E81] transition shadow-inner"
                  />
                  <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400 pointer-events-none">
                    m
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Test Presets */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Quick Test Scenarios
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSetPreset(100.0, 102.5)}
                  className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  UP (+)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPreset(105.0, 101.2)}
                  className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  DOWN (-)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPreset(100.0, 100.0)}
                  className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                  LEVEL
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Calculation Summary & Results Table (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {!calculatedData ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-16 flex flex-col items-center justify-center text-center text-slate-500 shadow-sm space-y-3">
              <div className="p-4 bg-slate-100 rounded-2xl text-slate-400">
                <Calculator className="w-10 h-10" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Awaiting Valid Elevation Inputs
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Enter valid numeric values for both E1 and E2 to immediately compute pile-point elevations.
              </p>
            </div>
          ) : (
            <>
              {/* Summary Metrics Cards */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#112E81]" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                      Engineering Calculation Summary
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 text-xs font-black rounded-lg border flex items-center gap-1.5 ${
                        calculatedData.direction === 'UP (+)'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : calculatedData.direction === 'DOWN (-)'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {calculatedData.direction === 'UP (+)' && <ArrowUpRight className="w-3.5 h-3.5" />}
                      {calculatedData.direction === 'DOWN (-)' && <ArrowDownRight className="w-3.5 h-3.5" />}
                      {calculatedData.direction === 'LEVEL' && <Minus className="w-3.5 h-3.5" />}
                      Direction: {calculatedData.direction}
                    </span>
                  </div>
                </div>

                {/* KPI Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Tracker / Config
                    </div>
                    <div className="text-sm font-black text-slate-900 mt-1">
                      {calculatedData.trackerType}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                      {calculatedData.configurationName}
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Elevation Difference
                    </div>
                    <div className="text-sm font-black text-[#112E81] mt-1">
                      {calculatedData.elevationDifference.toFixed(3)} m
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                      |E2 - E1|
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Overall {calculatedData.axis} Distance
                    </div>
                    <div className="text-sm font-black text-slate-900 mt-1">
                      {calculatedData.overallDistance.toFixed(3)} m
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                      Axis {calculatedData.axis}
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Tan (Slope Gradient)
                    </div>
                    <div className="text-sm font-black text-[#36ADA3] mt-1 font-mono">
                      {calculatedData.tan.toFixed(6)}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                      ΔElev / Overall Dist
                    </div>
                  </div>
                </div>

                {/* Secondary details bar */}
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-200/60 gap-3">
                  <div className="flex items-center gap-4">
                    <span>
                      <strong className="text-slate-900">E1:</strong> {calculatedData.E1.toFixed(3)} m
                    </span>
                    <span>
                      <strong className="text-slate-900">E2:</strong> {calculatedData.E2.toFixed(3)} m
                    </span>
                    <span>
                      <strong className="text-slate-900">Pile Points:</strong> {calculatedData.pilePoints}
                    </span>
                    <span>
                      <strong className="text-slate-900">Calculated Values:</strong> {calculatedData.numberOfValues}
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-400">
                    Formula: Tan = ABS(E2 - E1) / {calculatedData.overallDistance.toFixed(3)}
                  </div>
                </div>
              </div>

              {/* Visual Profile Diagram */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-[#112E81]" />
                    Tracker Longitudinal Profile
                  </h3>
                  <div className="text-[11px] text-slate-500">
                    Start E1: <span className="font-bold text-slate-800">{calculatedData.E1.toFixed(3)}m</span> → End E2:{' '}
                    <span className="font-bold text-slate-800">{calculatedData.E2.toFixed(3)}m</span>
                  </div>
                </div>

                {/* SVG Visualizer */}
                <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-200 overflow-x-auto">
                  <div className="min-w-[600px] h-[130px] relative">
                    <svg className="w-full h-full" viewBox="0 0 700 120" preserveAspectRatio="none">
                      {/* Grid guidelines */}
                      <line x1="40" y1="20" x2="660" y2="20" stroke="#e2e8f0" strokeDasharray="3 3" />
                      <line x1="40" y1="60" x2="660" y2="60" stroke="#e2e8f0" strokeDasharray="3 3" />
                      <line x1="40" y1="100" x2="660" y2="100" stroke="#cbd5e1" strokeWidth="1.5" />

                      {/* Slope line calculation: start at (50, y1), end at (650, y2) */}
                      {(() => {
                        const isUp = calculatedData.E2 > calculatedData.E1;
                        const isDown = calculatedData.E2 < calculatedData.E1;
                        const yStart = isUp ? 80 : isDown ? 30 : 55;
                        const yEnd = isUp ? 30 : isDown ? 80 : 55;

                        return (
                          <>
                            {/* Fill underneath slope line */}
                            <polygon
                              points={`50,100 50,${yStart} 650,${yEnd} 650,100`}
                              fill="rgba(17, 46, 129, 0.04)"
                            />

                            {/* Tracker Beam Line */}
                            <line
                              x1="50"
                              y1={yStart}
                              x2="650"
                              y2={yEnd}
                              stroke="#112E81"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                            />

                            {/* Start Point E1 marker */}
                            <circle cx="50" cy={yStart} r="5" fill="#112E81" stroke="#ffffff" strokeWidth="2" />
                            <text x="50" y={yStart - 12} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#112E81">
                              E1 ({calculatedData.E1.toFixed(3)})
                            </text>

                            {/* Pile markers along the line */}
                            {calculatedData.results.map((pile, idx) => {
                              const ratio = pile.distance / calculatedData.overallDistance;
                              const px = 50 + ratio * 600;
                              const py = yStart + ratio * (yEnd - yStart);

                              return (
                                <g key={pile.point}>
                                  {/* Vertical pile post to ground line */}
                                  <line
                                    x1={px}
                                    y1={py}
                                    x2={px}
                                    y2="100"
                                    stroke={idx === calculatedData.results.length - 1 ? '#36ADA3' : '#94a3b8'}
                                    strokeWidth={idx === calculatedData.results.length - 1 ? '2' : '1'}
                                    strokeDasharray="2 2"
                                  />
                                  {/* Pile top node */}
                                  <circle
                                    cx={px}
                                    cy={py}
                                    r={idx === calculatedData.results.length - 1 ? '4.5' : '3.5'}
                                    fill={idx === calculatedData.results.length - 1 ? '#36ADA3' : '#1d4ed8'}
                                  />
                                  {/* Point label */}
                                  <text
                                    x={px}
                                    y="112"
                                    textAnchor="middle"
                                    fontSize="8"
                                    fontWeight="bold"
                                    fill={idx === calculatedData.results.length - 1 ? '#0d9488' : '#64748b'}
                                  >
                                    {pile.point}
                                  </text>
                                </g>
                              );
                            })}

                            {/* End Point E2 marker */}
                            <circle cx="650" cy={yEnd} r="5" fill="#36ADA3" stroke="#ffffff" strokeWidth="2" />
                            <text x="650" y={yEnd - 12} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0f766e">
                              E2 ({calculatedData.E2.toFixed(3)})
                            </text>
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                </div>
              </div>

              {/* Results Table Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                      Pile Elevations Calculation Table
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Fixed Distances &amp; Precise Computed Elevations (3 Decimal Places)
                    </p>
                  </div>

                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer self-start sm:self-auto"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download CSV
                  </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Point</th>
                        <th className="py-3 px-4">Distance ({calculatedData.axis})</th>
                        <th className="py-3 px-4">Result (Tan × Dist)</th>
                        <th className="py-3 px-4">Final Elevation</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {calculatedData.results.map((row, idx) => {
                        const isLast = idx === calculatedData.results.length - 1;
                        return (
                          <tr
                            key={row.point}
                            className={`transition hover:bg-slate-50/80 ${
                              isLast ? 'bg-[#36ADA3]/5 font-bold text-slate-900' : ''
                            }`}
                          >
                            {/* Point Label */}
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded font-black text-xs ${
                                  isLast
                                    ? 'bg-[#36ADA3]/20 text-teal-800 border border-[#36ADA3]/30'
                                    : 'bg-slate-100 text-slate-800 border border-slate-200'
                                }`}
                              >
                                {row.point}
                              </span>
                            </td>

                            {/* Distance */}
                            <td className="py-3 px-4 font-mono font-medium">
                              {row.distance.toFixed(3)} m
                            </td>

                            {/* Result */}
                            <td className="py-3 px-4 font-mono text-slate-600">
                              {row.result.toFixed(3)} m
                            </td>

                            {/* Final Elevation */}
                            <td className="py-3 px-4">
                              <span
                                className={`font-mono font-extrabold text-sm ${
                                  isLast ? 'text-[#112E81]' : 'text-slate-900'
                                }`}
                              >
                                {row.elevation.toFixed(3)} m
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4 text-right">
                              {isLast ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Matches E2
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-medium">
                                  Intermediate Pile
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footnote */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 px-1">
                  <span>
                    * Engineering Precision: All internal computations retain 64-bit IEEE 754 floating point accuracy.
                  </span>
                  <span>{calculatedData.results.length} rows calculated</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
