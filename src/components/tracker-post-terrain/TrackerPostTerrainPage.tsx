'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TRACKER_TERRAIN_CONFIGS,
  TRACKER_TERRAIN_CONFIG_LIST,
} from '@/lib/tracker-post-terrain/trackerConfigurations';
import {
  calculateTrackerCoordinates,
  TrackerTerrainCalculationResult,
} from '@/lib/tracker-post-terrain/calculateTrackerCoordinates';
import { exportTrackerTerrainToExcel } from '@/lib/tracker-post-terrain/TrackerTerrainExcelReport';
import { exportTrackerTerrainToPdf } from '@/lib/tracker-post-terrain/TrackerTerrainPdfReport';
import ElevationProfileChart from './ElevationProfileChart';
import CoordinateTable from './CoordinateTable';
import EngineeringValidationPanel from './EngineeringValidationPanel';
import CalculationDetailsPanel from './CalculationDetailsPanel';

import {
  Compass,
  Ruler,
  Layers,
  ArrowRight,
  Calculator,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Building2,
  Tag,
  Info,
  MapPin,
  Calendar,
} from 'lucide-react';

export default function TrackerPostTerrainPage() {
  // Input states
  const [zoneName, setZoneName] = useState<string>('Zone A');
  const [trackerId, setTrackerId] = useState<string>('TRK-01'); // Tracker ID right after Zone Name
  const [locationGrid, setLocationGrid] = useState<string>('Grid A-1');
  const [docNo, setDocNo] = useState<string>('DOC-TRK-001');
  const [startX, setStartX] = useState<string>('0.000'); // Starting X Coordinate (X1)
  const [startY, setStartY] = useState<string>('0.000'); // Starting Y Coordinate (Y1)
  const [yDirection, setYDirection] = useState<'DECREASING (-)' | 'INCREASING (+)'>('DECREASING (-)');
  const [E1, setE1] = useState<string>('100.000');
  const [E2, setE2] = useState<string>('101.500');
  const [selectedConfigId, setSelectedConfigId] = useState<string>('2S-CORNER');
  const [elevationUnit, setElevationUnit] = useState<'m' | 'mm'>('m');

  // Elevation input mode: E1+E2 or E1+Tracker Angle θ
  const [inputMode, setInputMode] = useState<'E1_E2' | 'E1_THETA'>('E1_E2');
  const [thetaInput, setThetaInput] = useState<string>(''); // angle θ in degrees
  const [thetaDirection, setThetaDirection] = useState<'UP' | 'DOWN'>('UP'); // slope direction

  // Calculation state
  const [result, setResult] = useState<TrackerTerrainCalculationResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const selectedConfig = TRACKER_TERRAIN_CONFIGS[selectedConfigId];

  // Derived E2 in theta mode: sin(θ) = ΔE / L_total → ΔE = sin(θ) × L_total → E2 = E1 ± ΔE
  const numTheta = parseFloat(thetaInput);
  const numE1Preview = parseFloat(E1);
  const unitMult = elevationUnit === 'mm' ? 0.001 : 1;
  let derivedE2: number | null = null;
  let derivedThetaDeg: number | null = null;

  if (inputMode === 'E1_THETA') {
    if (!isNaN(numTheta) && numTheta >= 0 && numTheta <= 90 && !isNaN(numE1Preview) && selectedConfig) {
      const sinTheta = Math.sin(numTheta * (Math.PI / 180));
      const totalLengthInInputUnit = selectedConfig.totalLengthM / unitMult;
      const deltaE = sinTheta * totalLengthInInputUnit;
      derivedE2 = thetaDirection === 'UP' ? numE1Preview + deltaE : numE1Preview - deltaE;
    }
  } else {
    // In E1_E2 mode, compute θ from E1 and E2 for display
    const numE2Preview = parseFloat(E2);
    if (!isNaN(numE1Preview) && !isNaN(numE2Preview) && selectedConfig) {
      const e1M = numE1Preview * unitMult;
      const e2M = numE2Preview * unitMult;
      const deltaE_m = e2M - e1M;
      const ratioSin = deltaE_m / selectedConfig.totalLengthM;
      if (ratioSin >= -1 && ratioSin <= 1) {
        derivedThetaDeg = Math.asin(ratioSin) * (180 / Math.PI);
      }
    }
  }

  const handleGenerate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setValidationError(null);

    if (!zoneName.trim()) {
      setValidationError('Zone Name is required. Please enter a valid zone name.');
      return;
    }

    if (!trackerId.trim()) {
      setValidationError('Tracker ID is required. Please enter a valid tracker ID (e.g. TRK-01).');
      return;
    }

    const startXNum = parseFloat(startX);
    const startYNum = parseFloat(startY);
    const e1Num = parseFloat(E1);

    // Determine effective E2 based on input mode
    let e2Num: number;
    if (inputMode === 'E1_THETA') {
      if (derivedE2 === null || isNaN(e1Num)) {
        setValidationError('Please enter a valid E1 and Tracker Angle θ to derive E2.');
        return;
      }
      e2Num = derivedE2;
    } else {
      e2Num = parseFloat(E2);
    }

    if (isNaN(startXNum)) {
      setValidationError('Starting X Coordinate must be a valid numeric value.');
      return;
    }

    if (isNaN(startYNum)) {
      setValidationError('Starting Y Coordinate must be a valid numeric value.');
      return;
    }

    if (isNaN(e1Num)) {
      setValidationError('E1 Elevation must be a valid numeric value.');
      return;
    }

    if (isNaN(e2Num)) {
      setValidationError('E2 Elevation must be a valid numeric value.');
      return;
    }

    const calcResult = calculateTrackerCoordinates({
      zoneName: zoneName.trim(),
      trackerId: trackerId.trim(),
      docNo: docNo.trim() || 'DOC-TRK-001',
      locationGrid: locationGrid.trim() || 'Grid A-1',
      startX: startXNum,
      startY: startYNum,
      yDirection,
      E1: e1Num,
      E2: e2Num,
      configId: selectedConfigId,
      elevationUnit,
    });

    if (!calcResult.isValid) {
      setValidationError(calcResult.errorMessage || 'Invalid calculation parameters.');
      setResult(null);
      return;
    }

    setResult(calcResult);

    // Smooth scroll to results
    setTimeout(() => {
      const el = document.getElementById('terrain-results-dashboard');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleReset = () => {
    setResult(null);
    setValidationError(null);
  };

  const handleExportExcel = () => {
    if (!result) return;
    try {
      exportTrackerTerrainToExcel(result);
    } catch (err) {
      console.error('Excel Export failed:', err);
      alert('Failed to generate Excel report.');
    }
  };

  const handleExportPdf = async () => {
    if (!result) return;
    setIsExportingPdf(true);
    try {
      await exportTrackerTerrainToPdf(result);
    } catch (err) {
      console.error('PDF Export failed:', err);
      alert('Failed to generate PDF report.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 font-sans selection:bg-[#36ADA3] selection:text-white">
      {/* Top Banner Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-teal-400">
              <span className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-[#36ADA3]">
                <Compass className="w-4 h-4" />
              </span>
              <span>Civil &amp; Surveying Module</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Tracker Post Terrain Coordinate Generator
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Calculate deterministic pile post 3D terrain coordinates (X, Y, Z), inclination angle θ (ASIN), cumulative horizontal projections, and vertical increments across 6 standard solar tracker configurations.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 text-xs font-bold transition"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400" />
              <span>Module Selector</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Input Form Section */}
      <form
        onSubmit={handleGenerate}
        className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-8"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-sky-400" />
            <h2 className="text-xl font-extrabold text-white">Engineering Input Parameters</h2>
          </div>
          <span className="text-xs text-slate-400 font-semibold">Step 1 of 2: Configure &amp; Calculate</span>
        </div>

        {/* Validation Alert */}
        {validationError && (
          <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs sm:text-sm flex items-start gap-3 animate-headshake">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Engineering Validation Error:</span>
              <p>{validationError}</p>
            </div>
          </div>
        )}

        {/* Inputs Grid: Zone Name, Tracker ID (RIGHT AFTER ZONE NAME), Location/Grid, Doc No */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Zone Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-teal-400" />
              <span>Zone Name *</span>
            </label>
            <input
              type="text"
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              placeholder="e.g. Zone A / Block 01"
              required
              className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 text-sm font-semibold transition shadow-inner"
            />
            <p className="text-[11px] text-slate-500">Structure / Zone identifier</p>
          </div>

          {/* Tracker ID (REQUIRED RIGHT AFTER ZONE NAME) */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#36ADA3] flex items-center gap-2 font-black">
              <Tag className="w-3.5 h-3.5 text-teal-400" />
              <span>Tracker ID *</span>
            </label>
            <input
              type="text"
              value={trackerId}
              onChange={(e) => setTrackerId(e.target.value)}
              placeholder="e.g. TRK-01"
              required
              className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-teal-500/40 text-teal-200 font-mono font-bold placeholder-slate-600 focus:outline-none focus:border-teal-400 text-sm transition shadow-inner"
            />
            <p className="text-[11px] text-teal-300/80 font-semibold">Included in official header report</p>
          </div>

          {/* Location / Grid */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-purple-400" />
              <span>Location / Grid</span>
            </label>
            <input
              type="text"
              value={locationGrid}
              onChange={(e) => setLocationGrid(e.target.value)}
              placeholder="e.g. Grid A-1"
              className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 text-sm font-semibold transition shadow-inner"
            />
            <p className="text-[11px] text-slate-500">Site location / grid coordinates</p>
          </div>

          {/* Doc No */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>Doc No</span>
            </label>
            <input
              type="text"
              value={docNo}
              onChange={(e) => setDocNo(e.target.value)}
              placeholder="e.g. DOC-TRK-001"
              className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 text-sm font-semibold transition shadow-inner"
            />
            <p className="text-[11px] text-slate-500">Official document reference number</p>
          </div>
        </div>

        {/* Inputs Grid: X1 Starting X, Y1 Starting Y, Y Progression Mode, E1, E2, Elevation Unit */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 pt-2 border-t border-slate-800/80">
          {/* Starting X Coordinate (X1) */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2 font-black">
              <Ruler className="w-3.5 h-3.5 text-teal-400" />
              <span>X1 Starting X ({elevationUnit}) *</span>
            </label>
            <input
              type="number"
              step="any"
              value={startX}
              onChange={(e) => setStartX(e.target.value)}
              placeholder="e.g. 0.000"
              required
              className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-teal-500/40 text-teal-200 font-mono font-bold placeholder-slate-600 focus:outline-none focus:border-teal-400 text-sm transition shadow-inner"
            />
            <p className="text-[11px] text-teal-300/80 font-semibold">Starting X coordinate datum for piles</p>
          </div>

          {/* Starting Y Coordinate (Y1) */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2 font-black">
              <Ruler className="w-3.5 h-3.5 text-teal-400" />
              <span>Y1 Starting Y ({elevationUnit}) *</span>
            </label>
            <input
              type="number"
              step="any"
              value={startY}
              onChange={(e) => setStartY(e.target.value)}
              placeholder="e.g. 0.000"
              required
              className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-teal-500/40 text-teal-200 font-mono font-bold placeholder-slate-600 focus:outline-none focus:border-teal-400 text-sm transition shadow-inner"
            />
            <p className="text-[11px] text-teal-300/80 font-semibold">Starting Y coordinate datum for piles</p>
          </div>

          {/* Y Progression Mode Toggle */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 font-black">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Y Coordinate Mode</span>
            </label>
            <div className="flex rounded-2xl bg-slate-950/80 p-1 border border-slate-800 h-[46px] items-center">
              <button
                type="button"
                onClick={() => setYDirection('DECREASING (-)')}
                className={`flex-1 h-full rounded-xl text-xs font-bold transition ${
                  yDirection === 'DECREASING (-)'
                    ? 'bg-amber-600 text-white shadow-md border border-amber-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Subtract ground projection: Y_i = Y1 - cumGroundY (Reduce Y)"
              >
                Reduce Y (-)
              </button>
              <button
                type="button"
                onClick={() => setYDirection('INCREASING (+)')}
                className={`flex-1 h-full rounded-xl text-xs font-bold transition ${
                  yDirection === 'INCREASING (+)'
                    ? 'bg-teal-600 text-white shadow-md border border-teal-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Add ground projection: Y_i = Y1 + cumGroundY (Add Y)"
              >
                Add Y (+)
              </button>
            </div>
            <p className="text-[11px] text-amber-300/80 font-semibold">
              {yDirection === 'DECREASING (-)' ? 'Reduce Y: Y_i = Y1 - ΔY' : 'Add Y: Y_i = Y1 + ΔY'}
            </p>
          </div>

          {/* E1 Elevation — always editable */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Ruler className="w-3.5 h-3.5 text-emerald-400" />
              <span>E1 Start Elevation ({elevationUnit}) *</span>
            </label>
            <input
              type="number"
              step="any"
              value={E1}
              onChange={(e) => setE1(e.target.value)}
              placeholder="e.g. 100.000"
              required
              className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 text-sm font-semibold transition font-mono shadow-inner"
            />
            <p className="text-[11px] text-slate-500">Starting pile post elevation datum</p>
          </div>

          {/* E2 Elevation — editable in E1_E2 mode, read-only derived in E1_THETA mode */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Ruler className="w-3.5 h-3.5 text-sky-400" />
              <span className={inputMode === 'E1_E2' ? 'text-slate-300' : 'text-slate-500'}>
                E2 End Elevation ({elevationUnit})
              </span>
              {inputMode === 'E1_THETA' && (
                <span className="px-1.5 py-0.5 text-[9px] font-black bg-indigo-900/60 text-indigo-300 rounded border border-indigo-500/40 uppercase tracking-wider">
                  Auto-Derived
                </span>
              )}
            </label>
            {inputMode === 'E1_E2' ? (
              <input
                type="number"
                step="any"
                value={E2}
                onChange={(e) => setE2(e.target.value)}
                placeholder="e.g. 101.500"
                required
                className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 text-sm font-semibold transition font-mono shadow-inner"
              />
            ) : (
              <div className="w-full px-4 py-3 rounded-2xl bg-indigo-950/60 border-2 border-indigo-500/40 text-indigo-200 font-mono font-bold text-sm min-h-[50px] flex items-center select-none">
                {derivedE2 !== null
                  ? `${derivedE2.toFixed(6)} ${elevationUnit}`
                  : <span className="text-indigo-500/60 font-normal text-xs">Enter E1 + θ to derive…</span>}
              </div>
            )}
            {inputMode === 'E1_THETA' && derivedE2 !== null && (
              <p className="text-[11px] text-indigo-400/80 font-semibold">
                E1 {thetaDirection === 'UP' ? '+' : '−'} sin({parseFloat(thetaInput).toFixed(3)}°) × {selectedConfig.totalLengthM.toFixed(3)} m
              </p>
            )}
            {inputMode === 'E1_E2' && (
              <p className="text-[11px] text-slate-500">Ending pile post elevation datum</p>
            )}
          </div>

          {/* Elevation & Coordinate Unit Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-purple-400" />
              <span>Input Unit (X, Y, E1, E2)</span>
            </label>
            <div className="flex rounded-2xl bg-slate-950/80 p-1 border border-slate-800 h-[46px] items-center">
              <button
                type="button"
                onClick={() => setElevationUnit('m')}
                className={`flex-1 h-full rounded-xl text-xs font-bold transition ${
                  elevationUnit === 'm'
                    ? 'bg-[#112E81] text-white shadow-md border border-sky-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Meters (m)
              </button>
              <button
                type="button"
                onClick={() => setElevationUnit('mm')}
                className={`flex-1 h-full rounded-xl text-xs font-bold transition ${
                  elevationUnit === 'mm'
                    ? 'bg-[#112E81] text-white shadow-md border border-sky-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Millimeters (mm)
              </button>
            </div>
            <p className="text-[11px] text-slate-500">Unit for X, Y, E1, and E2 inputs</p>
          </div>
        </div>

        {/* Tracker Angle θ Input Row — always visible, full width */}
        <div className="pt-2 border-t border-slate-800/60 space-y-4">
          {/* Input Mode Toggle */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Elevation Input Mode:</span>
            <div className="flex rounded-2xl bg-slate-950/80 p-1 border border-slate-700 gap-1">
              <button
                type="button"
                onClick={() => { setInputMode('E1_E2'); setValidationError(null); }}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
                  inputMode === 'E1_E2'
                    ? 'bg-[#112E81] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Ruler className="w-3.5 h-3.5" />
                E1 + E2
              </button>
              <button
                type="button"
                onClick={() => { setInputMode('E1_THETA'); setValidationError(null); }}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
                  inputMode === 'E1_THETA'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-sm leading-none font-black">θ</span>
                E1 + Tracker Angle θ
              </button>
            </div>
            {inputMode === 'E1_E2' && (
              <span className="text-[11px] text-slate-500">Enter both E1 and E2 elevations above — θ will be auto-calculated.</span>
            )}
            {inputMode === 'E1_THETA' && (
              <span className="text-[11px] text-indigo-400">Enter E1 and Tracker Angle θ — E2 will be derived using ASIN formula.</span>
            )}
          </div>

          {/* θ Input Row: Angle field + Direction + Read-only display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            {/* θ field — editable in E1_THETA, read-only in E1_E2 */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <span className={`text-lg leading-none font-black ${inputMode === 'E1_THETA' ? 'text-indigo-400' : 'text-slate-500'}`}>θ</span>
                <span className={inputMode === 'E1_THETA' ? 'text-indigo-300' : 'text-slate-500'}>
                  Tracker Angle θ (°)
                </span>
                {inputMode === 'E1_E2' && (
                  <span className="px-1.5 py-0.5 text-[9px] font-black bg-slate-800 text-slate-400 rounded border border-slate-700 uppercase tracking-wider">Auto-Calc</span>
                )}
              </label>
              {inputMode === 'E1_THETA' ? (
                <>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max="90"
                      value={thetaInput}
                      onChange={(e) => { setThetaInput(e.target.value); setValidationError(null); }}
                      placeholder="e.g. 1.400"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border-2 border-indigo-500/60 text-indigo-200 font-mono font-bold placeholder-slate-600 focus:outline-none focus:border-indigo-400 text-sm transition shadow-inner"
                    />
                    <span className="absolute right-4 top-3.5 text-base font-black text-indigo-400 pointer-events-none">°</span>
                  </div>
                  <p className="text-[11px] text-indigo-400/80">ASIN formula: sin(θ) = ΔE / L_total</p>
                </>
              ) : (
                <div className="w-full px-4 py-3 rounded-2xl bg-slate-900/60 border border-slate-700 text-slate-300 font-mono font-bold text-sm min-h-[50px] flex items-center select-none">
                  {derivedThetaDeg !== null
                    ? `${derivedThetaDeg.toFixed(6)}°`
                    : <span className="text-slate-600 font-normal text-xs">Enter E1 + E2 to calculate…</span>}
                </div>
              )}
            </div>

            {/* Slope Direction — only editable in E1_THETA mode */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                Slope Direction
                {inputMode === 'E1_E2' && (
                  <span className="px-1.5 py-0.5 text-[9px] font-black bg-slate-800 text-slate-500 rounded border border-slate-700 uppercase tracking-wider">From E1/E2</span>
                )}
              </label>
              {inputMode === 'E1_THETA' ? (
                <div className="flex rounded-2xl bg-slate-950/80 p-1 border border-slate-700 h-[50px] items-center gap-1">
                  <button
                    type="button"
                    onClick={() => { setThetaDirection('UP'); setValidationError(null); }}
                    className={`flex-1 h-full rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      thetaDirection === 'UP'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ArrowRight className="w-3.5 h-3.5 rotate-[-45deg]" />
                    UP (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setThetaDirection('DOWN'); setValidationError(null); }}
                    className={`flex-1 h-full rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      thetaDirection === 'DOWN'
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <ArrowRight className="w-3.5 h-3.5 rotate-45" />
                    DOWN (-)
                  </button>
                </div>
              ) : (
                <div className="w-full px-4 py-3 rounded-2xl bg-slate-900/60 border border-slate-700 text-sm min-h-[50px] flex items-center select-none">
                  {derivedThetaDeg !== null ? (
                    <span className={`font-bold font-mono ${
                      derivedThetaDeg > 0 ? 'text-emerald-400' : derivedThetaDeg < 0 ? 'text-amber-400' : 'text-slate-400'
                    }`}>
                      {derivedThetaDeg > 0 ? 'UP (+)' : derivedThetaDeg < 0 ? 'DOWN (-)' : 'LEVEL'}
                    </span>
                  ) : (
                    <span className="text-slate-600 font-normal text-xs">—</span>
                  )}
                </div>
              )}
              {inputMode === 'E1_THETA' && (
                <p className="text-[11px] text-slate-500">Direction of slope from E1 to E2</p>
              )}
            </div>

            {/* Summary info box */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Config Length (L_total)</label>
              <div className="w-full px-4 py-3 rounded-2xl bg-slate-900/60 border border-slate-700 text-teal-300 font-mono font-bold text-sm min-h-[50px] flex items-center select-none">
                {selectedConfig ? `${selectedConfig.totalLengthMm.toLocaleString()} mm = ${selectedConfig.totalLengthM.toFixed(3)} m` : '—'}
              </div>
              <p className="text-[11px] text-slate-500">Total physical inclined tracker length</p>
            </div>
          </div>
        </div>

        {/* Tracker Configuration Selection Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-400" />
              <span>Select Tracker Configuration (6 Standard Options)</span>
            </label>
            <span className="text-xs text-slate-400">Locked engineering segment matrices</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 2 String Column: Corner on top, Internal under */}
            <div className="space-y-4">
              {['2S-CORNER', '2S-INTERNAL'].map((cfgId) => {
                const cfg = TRACKER_TERRAIN_CONFIGS[cfgId];
                const isSelected = cfg.id === selectedConfigId;
                return (
                  <button
                    type="button"
                    key={cfg.id}
                    onClick={() => setSelectedConfigId(cfg.id)}
                    className={`w-full p-5 rounded-2xl text-left border transition-all duration-200 cursor-pointer relative overflow-hidden group ${
                      isSelected
                        ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-[#112E81]/50 border-teal-500 shadow-xl shadow-teal-500/10 ring-2 ring-teal-500/40'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950/90'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block">
                          {cfg.stringCount} String • {cfg.position}
                        </span>
                        <h3 className="text-lg font-extrabold text-white mt-0.5">{cfg.name}</h3>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border flex items-center justify-center transition ${
                          isSelected
                            ? 'bg-teal-500 border-teal-400 text-slate-950'
                            : 'border-slate-700 bg-slate-900 text-transparent'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 font-semibold text-slate-300">
                        {cfg.pileCount} Piles
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 font-semibold text-slate-300">
                        {cfg.segmentCount} Segments
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 font-bold text-teal-300">
                        {cfg.totalLengthMm.toLocaleString()} mm ({cfg.totalLengthM.toFixed(3)}m)
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 3 String Column: Corner on top, Internal under */}
            <div className="space-y-4">
              {['3S-CORNER', '3S-INTERNAL'].map((cfgId) => {
                const cfg = TRACKER_TERRAIN_CONFIGS[cfgId];
                const isSelected = cfg.id === selectedConfigId;
                return (
                  <button
                    type="button"
                    key={cfg.id}
                    onClick={() => setSelectedConfigId(cfg.id)}
                    className={`w-full p-5 rounded-2xl text-left border transition-all duration-200 cursor-pointer relative overflow-hidden group ${
                      isSelected
                        ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-[#112E81]/50 border-teal-500 shadow-xl shadow-teal-500/10 ring-2 ring-teal-500/40'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950/90'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block">
                          {cfg.stringCount} String • {cfg.position}
                        </span>
                        <h3 className="text-lg font-extrabold text-white mt-0.5">{cfg.name}</h3>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border flex items-center justify-center transition ${
                          isSelected
                            ? 'bg-teal-500 border-teal-400 text-slate-950'
                            : 'border-slate-700 bg-slate-900 text-transparent'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 font-semibold text-slate-300">
                        {cfg.pileCount} Piles
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 font-semibold text-slate-300">
                        {cfg.segmentCount} Segments
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 font-bold text-teal-300">
                        {cfg.totalLengthMm.toLocaleString()} mm ({cfg.totalLengthM.toFixed(3)}m)
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 4 String Column: Corner on top, Internal under */}
            <div className="space-y-4">
              {['4S-CORNER', '4S-INTERNAL'].map((cfgId) => {
                const cfg = TRACKER_TERRAIN_CONFIGS[cfgId];
                const isSelected = cfg.id === selectedConfigId;
                return (
                  <button
                    type="button"
                    key={cfg.id}
                    onClick={() => setSelectedConfigId(cfg.id)}
                    className={`w-full p-5 rounded-2xl text-left border transition-all duration-200 cursor-pointer relative overflow-hidden group ${
                      isSelected
                        ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-[#112E81]/50 border-teal-500 shadow-xl shadow-teal-500/10 ring-2 ring-teal-500/40'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950/90'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block">
                          {cfg.stringCount} String • {cfg.position}
                        </span>
                        <h3 className="text-lg font-extrabold text-white mt-0.5">{cfg.name}</h3>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border flex items-center justify-center transition ${
                          isSelected
                            ? 'bg-teal-500 border-teal-400 text-slate-950'
                            : 'border-slate-700 bg-slate-900 text-transparent'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 font-semibold text-slate-300">
                        {cfg.pileCount} Piles
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 font-semibold text-slate-300">
                        {cfg.segmentCount} Segments
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 font-bold text-teal-300">
                        {cfg.totalLengthMm.toLocaleString()} mm ({cfg.totalLengthM.toFixed(3)}m)
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Configuration Segment Summary Card */}
        {selectedConfig && (
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Info className="w-4 h-4 text-sky-400" />
                <span>Inclined Segment Length Sequence for {selectedConfig.name}</span>
              </span>
              <span className="text-xs text-slate-400">
                Total Length: <strong className="text-teal-300 font-mono">{selectedConfig.totalLengthMm} mm</strong> ({selectedConfig.totalLengthM.toFixed(3)} m)
              </span>
            </div>

            {/* Segment Pills */}
            <div className="flex flex-wrap gap-2 pt-1">
              {selectedConfig.segmentLengths.map((len, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 flex items-center gap-1.5"
                >
                  <span className="text-slate-500 text-[10px] uppercase font-sans">L{idx + 1}:</span>
                  <span className="font-bold text-sky-300">{len} mm</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Generate Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 py-4 px-8 rounded-2xl bg-gradient-to-r from-[#112E81] via-[#1d4ed8] to-[#36ADA3] hover:from-[#1d4ed8] hover:to-teal-500 text-white font-black text-base shadow-xl hover:shadow-teal-500/20 active:scale-[0.99] transition cursor-pointer group"
          >
            <Sparkles className="w-5 h-5 text-teal-300" />
            <span>GENERATE COORDINATES</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
          </button>
        </div>
      </form>

      {/* Results Dashboard Section */}
      {result && result.isValid && (
        <div id="terrain-results-dashboard" className="space-y-8 pt-4">
          {/* Official Engineering Header Report Card (MATCHING THE REFERENCE IMAGE) */}
          <div className="bg-white text-slate-900 border-2 border-slate-900 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="text-center border-b-2 border-slate-900 pb-3 space-y-1">
              <h2 className="text-base sm:text-xl font-black tracking-wide uppercase text-slate-950">
                100 MW SOLAR PARK FACILITY, SIYAMBALANDUWA, SRI LANKA.
              </h2>
              <h3 className="text-sm sm:text-lg font-extrabold uppercase underline tracking-wider text-slate-800">
                TRACKER - GRADIENT CHECKLIST
              </h3>
            </div>

            {/* Official 4-Row Header Grid */}
            <div className="border-2 border-slate-900 divide-y-2 divide-slate-900 text-xs sm:text-sm font-semibold">
              {/* Row 1: Client & Doc No */}
              <div className="grid grid-cols-1 md:grid-cols-12 divide-y-2 md:divide-y-0 md:divide-x-2 divide-slate-900">
                <div className="md:col-span-8 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
                  <div>
                    <span className="font-extrabold text-slate-900">CLIENT:</span> Rividhanavi (Private) Limited
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-600">
                    <img src="/rivilogo.png" alt="Rividhanavi" className="h-6 object-contain" />
                    <span>No. 67, Park Street, Colombo 02, Sri Lanka</span>
                  </div>
                </div>
                <div className="md:col-span-4 p-3 bg-slate-50 font-mono flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 font-sans">Doc. No:</span>
                  <span className="font-bold text-slate-800">{result.docNo}</span>
                </div>
              </div>

              {/* Row 2: EPC Contractors & Sheet No */}
              <div className="grid grid-cols-1 md:grid-cols-12 divide-y-2 md:divide-y-0 md:divide-x-2 divide-slate-900">
                <div className="md:col-span-8 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                  <div>
                    <span className="font-extrabold text-slate-900">EPC CONTRACTORS:</span> Windforce PLC &amp; Lakdhanavi Limited
                  </div>
                  <div className="flex items-center gap-3">
                    <img src="/windlogo.png" alt="Windforce" className="h-5 object-contain" />
                    <img src="/laklogo.png" alt="Lakdhanavi" className="h-5 object-contain" />
                  </div>
                </div>
                <div className="md:col-span-4 p-3 bg-white font-mono flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 font-sans">Sheet No:</span>
                  <span className="font-bold text-slate-800">01 of 01</span>
                </div>
              </div>

              {/* Row 3: Structure & Location/Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 divide-y-2 md:divide-y-0 md:divide-x-2 divide-slate-900">
                <div className="md:col-span-8 p-3 bg-slate-50 flex items-center gap-2">
                  <span className="font-extrabold text-slate-900">Structure / Zone :</span>
                  <span className="font-bold text-teal-800">{result.zoneName}</span>
                </div>
                <div className="md:col-span-4 p-3 bg-slate-50 flex items-center justify-between">
                  <span className="font-extrabold text-slate-900">Location/ Grid :</span>
                  <span className="font-bold text-slate-800">{result.locationGrid}</span>
                </div>
              </div>

              {/* Row 4: TRACKER ID & Inspection Date */}
              <div className="grid grid-cols-1 md:grid-cols-12 divide-y-2 md:divide-y-0 md:divide-x-2 divide-slate-900">
                <div className="md:col-span-8 p-3 bg-teal-50/80 flex items-center gap-2">
                  <span className="font-black text-slate-950 text-base">TRACKER ID :</span>
                  <span className="font-black text-teal-700 text-lg font-mono bg-teal-200/60 px-3 py-0.5 rounded border border-teal-400">
                    {result.trackerId}
                  </span>
                </div>
                <div className="md:col-span-4 p-3 bg-teal-50/80 flex items-center justify-between font-mono">
                  <span className="font-extrabold text-slate-900 font-sans">Inspection Date :</span>
                  <span className="font-extrabold text-slate-900">{result.inspectionDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar Header */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-[#36ADA3]" />
                <span>Calculation Completed</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white mt-1">
                Engineering Results Dashboard
              </h2>
              <p className="text-xs text-slate-400">
                Tracker ID: <strong className="text-teal-300 font-mono">{result.trackerId}</strong> • Zone: <strong className="text-white">{result.zoneName}</strong> • Config: <strong className="text-white">{result.config.name}</strong>
              </p>
            </div>

            {/* Export Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Download Excel (.xlsx)</span>
              </button>

              <button
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white font-extrabold text-xs shadow-lg hover:shadow-sky-500/20 active:scale-95 transition cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>{isExportingPdf ? 'Generating PDF...' : 'Download PDF (.pdf)'}</span>
              </button>

              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>New Calculation</span>
              </button>
            </div>
          </div>

          {/* Top Key Metric Cards Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl backdrop-blur-md">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                TRACKER ID
              </span>
              <span className="text-lg font-extrabold text-teal-300 font-mono truncate block mt-1">
                {result.trackerId}
              </span>
            </div>

            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl backdrop-blur-md">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                PHYSICAL LENGTH (L)
              </span>
              <span className="text-lg font-extrabold text-sky-300 mt-1 block font-mono" title="Total Physical Sloped Tracker Length">
                {result.totalLengthM.toFixed(3)} m
              </span>
            </div>

            <div className="p-4 bg-slate-900/90 border border-[#36ADA3]/40 bg-teal-950/20 rounded-2xl backdrop-blur-md">
              <span className="text-[11px] font-bold text-teal-300 uppercase tracking-wider block">
                GROUND PROJECTION (Y)
              </span>
              <span className="text-lg font-extrabold text-teal-200 mt-1 block font-mono" title="Total 90° Horizontal Ground Projection Footprint">
                {result.totalHorizontalProjectionM.toFixed(3)} m
              </span>
            </div>

            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl backdrop-blur-md">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                TRACKER ANGLE θ
              </span>
              <span className="text-lg font-extrabold text-amber-300 mt-1 block font-mono" title="θ = ASIN(ΔE / L_total)">
                {result.thetaDeg.toFixed(6)}°
              </span>
            </div>

            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl backdrop-blur-md">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                SLOPE DIRECTION
              </span>
              <span
                className={`text-sm font-extrabold mt-1 block ${
                  result.direction === 'UP SLOPE'
                    ? 'text-emerald-400'
                    : result.direction === 'DOWN SLOPE'
                    ? 'text-rose-400'
                    : 'text-slate-300'
                }`}
              >
                {result.direction}
              </span>
            </div>

            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl backdrop-blur-md">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                ENDPOINT QA
              </span>
              <span
                className={`text-sm font-extrabold mt-1 block ${
                  result.endpointValidationPass ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {result.endpointValidationPass ? '✓ PASS (≤1mm)' : '⚠ CHECK'}
              </span>
            </div>
          </div>



          {/* Secondary Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <span className="text-xs font-semibold text-slate-400 block">E1 Starting Elevation</span>
              <span className="text-base font-bold font-mono text-white mt-0.5 block">
                {result.E1_m.toFixed(3)} m
              </span>
            </div>

            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <span className="text-xs font-semibold text-slate-400 block">E2 Ending Elevation</span>
              <span className="text-base font-bold font-mono text-white mt-0.5 block">
                {result.E2_m.toFixed(3)} m
              </span>
            </div>

            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <span className="text-xs font-semibold text-slate-400 block">Elevation Difference (ΔE)</span>
              <span className="text-base font-bold font-mono text-teal-300 mt-0.5 block">
                {result.deltaElevation_m >= 0 ? '+' : ''}
                {result.deltaElevation_m.toFixed(3)} m
              </span>
            </div>

            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <span className="text-xs font-semibold text-slate-400 block">sin(θ) Multiplier</span>
              <span className="text-base font-bold font-mono text-sky-300 mt-0.5 block">
                {result.sinTheta.toFixed(8)}
              </span>
            </div>

            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <span className="text-xs font-semibold text-slate-400 block">cos(θ) Multiplier</span>
              <span className="text-base font-bold font-mono text-sky-300 mt-0.5 block">
                {result.cosTheta.toFixed(8)}
              </span>
            </div>
          </div>

          {/* Interactive Elevation Profile Charts */}
          <ElevationProfileChart result={result} />

          {/* Point Coordinate Table (X, Y, Z) */}
          <CoordinateTable result={result} />

          {/* Engineering QA & Validation Panel */}
          <EngineeringValidationPanel result={result} />

          {/* Expandable Engineering Explanation / Formulas */}
          <CalculationDetailsPanel result={result} />
        </div>
      )}
    </div>
  );
}
