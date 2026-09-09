'use client';

import React, { useState, useEffect, useId } from 'react';
import Link from 'next/link';
import {
  TrackerType,
  TrackerConfig,
  TrackerCalculationOutput,
  SavedTrackerRecord,
  trackerConfigurations,
  calculateTracker,
  downloadTrackerCSV,
  downloadStyledExcel,
  renderTrackerChartToCanvasPng,
  getConfigurationsForTracker,
} from '@/lib/trackerCalculations';
import {
  Calculator,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeft,
  Minus,
  Sparkles,
  Info,
  Layers,
  Ruler,
  TrendingUp,
  RefreshCw,
  Table,
  BookmarkPlus,
  History,
  Trash2,
  RotateCcw,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function TrackerCalculator() {
  const [trackerType, setTrackerType] = useState<TrackerType>('4 STRING');
  const [configKey, setConfigKey] = useState<string>('4_STRING_16');
  const [e1Input, setE1Input] = useState<string>('100.000');
  const [e2Input, setE2Input] = useState<string>('102.500');
  const [error, setError] = useState<string>('');
  const [showFixedTable, setShowFixedTable] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'results' | 'chart' | 'history'>('results');
  const [savedRecords, setSavedRecords] = useState<SavedTrackerRecord[]>([]);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string>('');
  const [expandedSavedId, setExpandedSavedId] = useState<string | null>(null);
  const e1InputId = useId();
  const e2InputId = useId();

  // Load saved calculations from localStorage on initial render
  useEffect(() => {
    try {
      const stored = localStorage.getItem('solar_tracker_saved_records');
      if (stored) {
        setSavedRecords(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load saved tracker records:', e);
    }
  }, []);

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

  // Handle Styled Excel Download
  const handleDownloadExcel = () => {
    if (!calculatedData) {
      setError('Please enter valid numerical values for E1 and E2 before downloading Excel report.');
      return;
    }
    setError('');
    const chartPng = renderTrackerChartToCanvasPng(calculatedData);
    downloadStyledExcel(calculatedData, chartPng);
  };

  // Quick Preset Handlers
  const handleSetPreset = (e1Val: number, e2Val: number) => {
    setE1Input(e1Val.toFixed(3));
    setE2Input(e2Val.toFixed(3));
    setError('');
  };

  // Save current calculation to History
  const handleSaveCalculation = () => {
    if (!calculatedData) {
      setError('Please enter valid numerical values for E1 and E2 before saving.');
      return;
    }
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const newRecord: SavedTrackerRecord = {
      id: 'calc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp,
      isoDate: now.toISOString(),
      calculation: { ...calculatedData },
    };
    const updated = [newRecord, ...savedRecords];
    setSavedRecords(updated);
    try {
      localStorage.setItem('solar_tracker_saved_records', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save calculation to localStorage:', e);
    }
    setSaveSuccessMessage(`Saved to History at ${timestamp}`);
    setTimeout(() => setSaveSuccessMessage(''), 4000);
  };

  // Delete a saved calculation
  const handleDeleteSaved = (id: string) => {
    const updated = savedRecords.filter((r) => r.id !== id);
    setSavedRecords(updated);
    try {
      localStorage.setItem('solar_tracker_saved_records', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update localStorage:', e);
    }
    if (expandedSavedId === id) setExpandedSavedId(null);
  };

  // Clear all saved calculations
  const handleClearAllSaved = () => {
    if (typeof window !== 'undefined' && window.confirm('Are you sure you want to delete all saved calculations from history?')) {
      setSavedRecords([]);
      try {
        localStorage.removeItem('solar_tracker_saved_records');
      } catch (e) {
        console.error('Failed to clear localStorage:', e);
      }
      setExpandedSavedId(null);
    }
  };

  // Load a saved calculation into active inputs
  const handleLoadSaved = (record: SavedTrackerRecord) => {
    setTrackerType(record.calculation.trackerType);
    setConfigKey(record.calculation.configurationKey);
    setE1Input(record.calculation.E1.toFixed(3));
    setE2Input(record.calculation.E2.toFixed(3));
    setError('');
    setActiveTab('results');
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
                  Solar Pile Tracker Innovation Calculator
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

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-xs cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Welcome Screen</span>
            </Link>

            {calculatedData && (
              <>
                <button
                  onClick={handleDownloadExcel}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#0d9488] via-[#0f766e] to-[#112E81] hover:brightness-110 border-none font-bold rounded-xl text-white shadow-md hover:shadow-lg active:scale-[0.98] transition cursor-pointer text-xs"
                  title="Download styled Excel spreadsheet with custom header colors and tables"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                  <span>Download Excel (Coloured Tables)</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-black bg-white/20 text-white rounded uppercase tracking-wider">
                    .XLS
                  </span>
                </button>

                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border-none font-bold rounded-xl text-white shadow-sm hover:shadow active:scale-[0.98] transition cursor-pointer text-xs"
                  title="Download raw CSV file"
                >
                  <Download className="w-3.5 h-3.5 text-slate-300" />
                  <span>CSV</span>
                </button>
              </>
            )}
          </div>
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

            {/* Fixed Distances Display (Read-Only Notification + Toggleable Table) */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
                  <Info className="w-3.5 h-3.5 text-[#112E81]" />
                  <span>Fixed Engineering Distances</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFixedTable(!showFixedTable)}
                  className="text-[10px] font-bold text-[#112E81] hover:underline flex items-center gap-1 cursor-pointer bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60 transition hover:bg-blue-100"
                >
                  <Table className="w-3 h-3" />
                  {showFixedTable ? 'Hide Table' : 'View Distances Table'}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                All {activeConfig.values.length} {activeConfig.axis}-axis distances and the overall distance of{' '}
                <span className="font-semibold text-slate-800">{activeConfig.overallDistance.toFixed(3)}m</span> are fixed.
                Manual entry of distances is locked according to engineering design specs.
              </p>

              {showFixedTable && (
                <div className="mt-2 pt-2 border-t border-slate-200 overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-[#112E81] text-white font-bold text-[10px] uppercase tracking-wider">
                        <th className="py-1.5 px-2.5 rounded-l">Point</th>
                        <th className="py-1.5 px-2.5 text-right rounded-r">Fixed Dist ({activeConfig.axis}) [m]</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono text-slate-700">
                      {activeConfig.values.map((val, i) => (
                        <tr key={i} className="hover:bg-slate-100/70">
                          <td className="py-1 px-2.5 font-bold text-slate-900">{activeConfig.axis}{i + 1}</td>
                          <td className="py-1 px-2.5 text-right">{val.toFixed(3)} m</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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

                <button
                  type="button"
                  onClick={() => {
                    handleTrackerTypeChange('2 STRING');
                    setConfigKey('2_STRING_8');
                    handleSetPreset(100.0, 101.0);
                  }}
                  className="py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer col-span-3 mt-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Standard Example: Δ=1.000m (Tan: 0.016327, 0.935°)
                </button>
              </div>
            </div>

            {/* Save Calculation Details Button */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <button
                type="button"
                onClick={handleSaveCalculation}
                disabled={!calculatedData}
                className={`w-full py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition shadow-sm active:scale-[0.99] cursor-pointer ${
                  calculatedData
                    ? 'bg-gradient-to-r from-[#112E81] via-[#1e3a8a] to-[#0d9488] hover:brightness-110 text-white shadow-md'
                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
                title="Save current calculation details with date and time into history"
              >
                <BookmarkPlus className="w-4 h-4 text-emerald-300" />
                <span>Save Calculation Details to History</span>
              </button>

              {saveSuccessMessage && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{saveSuccessMessage}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Tabbed View (Table & Results | Profile Chart | Saved History) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Tabs Header Navigation */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('results')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'results'
                    ? 'bg-white text-[#112E81] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Table className="w-3.5 h-3.5 text-[#112E81]" />
                <span>Table &amp; Results</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('chart')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'chart'
                    ? 'bg-white text-[#112E81] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
                <span>Profile Chart</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-white text-[#112E81] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-3.5 h-3.5 text-amber-600" />
                <span>Saved History</span>
                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 text-[10px] font-black rounded-full border border-amber-200">
                  {savedRecords.length}
                </span>
              </button>
            </div>

            {activeTab === 'results' && calculatedData && (
              <span className="text-xs font-semibold text-slate-500">
                {calculatedData.results.length} piles computed
              </span>
            )}
          </div>

          {/* TAB 1: RESULTS TABLE */}
          {activeTab === 'results' && (
            <>
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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

                      <div className="p-3.5 bg-teal-50/60 border border-teal-200/80 rounded-xl">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                          Tan (Slope/Gradient)
                        </div>
                        <div className="text-sm font-black text-[#0f766e] mt-1 font-mono">
                          {calculatedData.tan.toFixed(6)}
                        </div>
                        <div className="text-[11px] font-semibold text-teal-600 mt-0.5">
                          ΔElev / Overall Dist
                        </div>
                      </div>

                      <div className="p-3.5 bg-indigo-50/60 border border-indigo-200/80 rounded-xl col-span-2 sm:col-span-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                          Tan⁻¹ Angle (Degrees)
                        </div>
                        <div className="text-sm font-black text-[#112E81] mt-1 font-mono">
                          {calculatedData.angleDeg.toFixed(3)}°
                        </div>
                        <div className="text-[11px] font-semibold text-indigo-600 mt-0.5">
                          atan(Tan) × 180 / π
                        </div>
                      </div>
                    </div>

                    {/* Secondary details bar */}
                    <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-200/60 gap-3">
                      <div className="flex flex-wrap items-center gap-4">
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
                      <div className="text-[11px] font-medium text-slate-500 flex items-center gap-2">
                        <span>Tan: <strong className="text-slate-800">{calculatedData.tan.toFixed(6)}</strong></span>
                        <span>•</span>
                        <span>Tan⁻¹: <strong className="text-[#112E81]">{calculatedData.angleDeg.toFixed(3)}°</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Results Table Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                          <Table className="w-4 h-4 text-[#112E81]" />
                          Pile Elevations Calculation Table
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Fixed Distances &amp; Precise Computed Elevations (3 Decimal Places)
                        </p>
                      </div>

                      {/* Dual Action Export Buttons */}
                      <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                        <button
                          onClick={handleDownloadExcel}
                          className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-[#0d9488] via-[#0f766e] to-[#112E81] hover:brightness-110 text-white rounded-xl text-xs font-black shadow-sm hover:shadow-md transition active:scale-[0.98] cursor-pointer"
                          title="Download beautifully styled Excel report with header colors, formatted tables, and profile chart image"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Download Excel (Coloured Tables &amp; Chart)</span>
                          <span className="px-1.5 py-0.5 text-[9px] font-black bg-white/20 text-white rounded uppercase tracking-wider">
                            .XLS
                          </span>
                        </button>

                        <button
                          onClick={handleDownload}
                          className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                          title="Download raw CSV file"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-300" />
                          <span>CSV</span>
                        </button>
                      </div>
                    </div>

                    {/* Table with rich header colors */}
                    <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-inner">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-gradient-to-r from-[#0B1E5B] via-[#112E81] to-[#0F766E] text-white font-bold border-b border-blue-900 uppercase tracking-wider text-[11px]">
                            <th className="py-3 px-4 font-black">
                              <div className="flex items-center gap-1.5">
                                <span>Point</span>
                              </div>
                            </th>
                            <th className="py-3 px-4 font-black">
                              <div className="flex items-center gap-1.5">
                                <span>Distance ({calculatedData.axis})</span>
                                <span className="text-[10px] font-normal text-blue-200 lowercase">[m]</span>
                              </div>
                            </th>
                            <th className="py-3 px-4 font-black">
                              <div className="flex items-center gap-1.5">
                                <span>Result (Tan × Dist)</span>
                                <span className="text-[10px] font-normal text-blue-200 lowercase">[m]</span>
                              </div>
                            </th>
                            <th className="py-3 px-4 font-black text-amber-200">
                              <div className="flex items-center gap-1.5">
                                <span className="text-amber-300">Final Elevation</span>
                                <span className="text-[10px] font-normal text-amber-200/80 lowercase">[m]</span>
                              </div>
                            </th>
                            <th className="py-3 px-4 text-right font-black">
                              <span>Verification Status</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {calculatedData.results.map((row, idx) => {
                            const isLast = idx === calculatedData.results.length - 1;
                            return (
                              <tr
                                key={row.point}
                                className={`transition hover:bg-teal-50/30 ${
                                  isLast
                                    ? 'bg-emerald-50/70 font-bold text-slate-900 border-t-2 border-b-2 border-emerald-300'
                                    : idx % 2 === 1
                                    ? 'bg-slate-50/60'
                                    : 'bg-white'
                                }`}
                              >
                                {/* Point Label */}
                                <td className="py-3 px-4">
                                  <span
                                    className={`px-2.5 py-1 rounded-md font-black text-xs ${
                                      isLast
                                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs'
                                        : 'bg-slate-100 text-slate-800 border border-slate-200'
                                    }`}
                                  >
                                    {row.point}
                                  </span>
                                </td>

                                {/* Distance */}
                                <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                                  {row.distance.toFixed(3)} m
                                </td>

                                {/* Result */}
                                <td className="py-3 px-4 font-mono text-slate-600">
                                  {row.result.toFixed(3)} m
                                </td>

                                {/* Final Elevation */}
                                <td className="py-3 px-4">
                                  <span
                                    className={`font-mono font-black text-sm px-2.5 py-0.5 rounded-lg border ${
                                      isLast
                                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300 shadow-xs'
                                        : 'bg-blue-50/80 text-[#112E81] border-blue-100/80'
                                    }`}
                                  >
                                    {row.elevation.toFixed(3)} m
                                  </span>
                                </td>

                                {/* Status */}
                                <td className="py-3 px-4 text-right">
                                  {isLast ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300 shadow-xs">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      Matches E2 ({calculatedData.E2.toFixed(3)} m)
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 pt-2 px-1 gap-2">
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>Endpoint Verified: Final pile matches E2 elevation with exact floating-point precision.</span>
                      </span>
                      <span className="font-semibold text-slate-600">{calculatedData.results.length} piles computed</span>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* TAB 2: PROFILE CHART VISUALIZER */}
          {activeTab === 'chart' && (
            <>
              {!calculatedData ? (
                <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-16 flex flex-col items-center justify-center text-center text-slate-500 shadow-sm space-y-3">
                  <div className="p-4 bg-slate-100 rounded-2xl text-slate-400">
                    <TrendingUp className="w-10 h-10" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">
                    Awaiting Valid Elevation Inputs
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Enter valid numeric values for both E1 and E2 on the left to render the longitudinal profile inclination chart.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Dedicated Profile Chart Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-[#112E81]" />
                          Longitudinal Tracker Profile &amp; Inclination Diagram
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Engineering visual model of beam slope, intermediate pile posts, and angle θ
                        </p>
                      </div>

                      <button
                        onClick={handleDownloadExcel}
                        className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-[#0d9488] via-[#0f766e] to-[#112E81] hover:brightness-110 text-white rounded-xl text-xs font-black shadow-sm hover:shadow-md transition active:scale-[0.98] cursor-pointer self-start sm:self-auto"
                        title="Download styled Excel spreadsheet with this profile chart image embedded"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Download Excel with Chart</span>
                      </button>
                    </div>

                    {/* SVG Visualizer Container */}
                    <div className="w-full bg-[#0A192F] rounded-2xl p-6 border border-slate-800 shadow-inner overflow-x-auto">
                      <div className="min-w-[650px] h-[190px] relative">
                        <svg className="w-full h-full" viewBox="0 0 700 160" preserveAspectRatio="none">
                          {/* Grid guidelines */}
                          <line x1="40" y1="30" x2="660" y2="30" stroke="#1E293B" strokeDasharray="3 3" />
                          <line x1="40" y1="70" x2="660" y2="70" stroke="#1E293B" strokeDasharray="3 3" />
                          <line x1="40" y1="130" x2="660" y2="130" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 4" />
                          <text x="45" y="124" fontSize="8" fill="#64748B" fontStyle="italic">Datum Ground Level</text>

                          {/* Slope line calculation: start at (50, yStart), end at (650, yEnd) */}
                          {(() => {
                            const isUp = calculatedData.E2 > calculatedData.E1;
                            const isDown = calculatedData.E2 < calculatedData.E1;
                            const yStart = isUp ? 100 : isDown ? 40 : 70;
                            const yEnd = isUp ? 40 : isDown ? 100 : 70;
                            const midY = (yStart + yEnd) / 2;

                            return (
                              <>
                                {/* Fill underneath slope line */}
                                <polygon
                                  points={`50,130 50,${yStart} 650,${yEnd} 650,130`}
                                  fill="rgba(56, 189, 248, 0.06)"
                                />

                                {/* Reference horizontal dashed line from E1 to show angle theta */}
                                <line
                                  x1="50"
                                  y1={yStart}
                                  x2="170"
                                  y2={yStart}
                                  stroke="#64748B"
                                  strokeWidth="1.5"
                                  strokeDasharray="4 3"
                                />

                                {/* Angle indicator arc & label near E1 */}
                                {calculatedData.elevationDifference > 0 && (
                                  <g>
                                    <path
                                      d={
                                        isUp
                                          ? 'M 110,100 A 60,60 0 0,0 106,75'
                                          : 'M 110,40 A 60,60 0 0,1 106,65'
                                      }
                                      fill="none"
                                      stroke="#FDE047"
                                      strokeWidth="2"
                                    />
                                    <text
                                      x="120"
                                      y={isUp ? 90 : 55}
                                      fontSize="10"
                                      fontWeight="extrabold"
                                      fill="#FDE047"
                                    >
                                      θ = {calculatedData.angleDeg.toFixed(3)}°
                                    </text>
                                  </g>
                                )}

                                {/* Main Tracker Beam Line */}
                                <line
                                  x1="50"
                                  y1={yStart}
                                  x2="650"
                                  y2={yEnd}
                                  stroke="#38BDF8"
                                  strokeWidth="4.5"
                                  strokeLinecap="round"
                                />

                                {/* Midpoint Slope & Tan Inverse Badge on Beam */}
                                <g transform={`translate(350, ${midY - 14})`}>
                                  <rect
                                    x="-125"
                                    y="-12"
                                    width="250"
                                    height="24"
                                    rx="6"
                                    fill="#1E293B"
                                    stroke="#38BDF8"
                                    strokeWidth="1.5"
                                  />
                                  <text
                                    x="0"
                                    y="4"
                                    textAnchor="middle"
                                    fontSize="9.5"
                                    fontWeight="bold"
                                    fill="#F8FAFC"
                                  >
                                    Tan: {calculatedData.tan.toFixed(6)} | Angle: {calculatedData.angleDeg.toFixed(3)}°
                                  </text>
                                </g>

                                {/* Start Point E1 marker */}
                                <circle cx="50" cy={yStart} r="6.5" fill="#10B981" stroke="#ffffff" strokeWidth="2" />
                                <text x="50" y={yStart > 70 ? yStart - 12 : yStart + 20} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#34D399">
                                  E1 ({calculatedData.E1.toFixed(3)}m)
                                </text>

                                {/* Pile markers along the line */}
                                {calculatedData.results.map((pile, idx) => {
                                  const ratio = pile.distance / calculatedData.overallDistance;
                                  const px = 50 + ratio * 600;
                                  const py = yStart + ratio * (yEnd - yStart);
                                  const isLastPile = idx === calculatedData.results.length - 1;

                                  return (
                                    <g key={pile.point}>
                                      {/* Vertical pile post to ground line */}
                                      <line
                                        x1={px}
                                        y1={py}
                                        x2={px}
                                        y2="130"
                                        stroke={isLastPile ? '#34D399' : '#94A3B8'}
                                        strokeWidth={isLastPile ? '2' : '1'}
                                        strokeDasharray="2 2"
                                      />
                                      {/* Marker dot on beam */}
                                      <circle
                                        cx={px}
                                        cy={py}
                                        r={isLastPile ? '4.5' : '3'}
                                        fill={isLastPile ? '#10B981' : '#38BDF8'}
                                        stroke="#0F172A"
                                        strokeWidth="1.5"
                                      />
                                      {/* Pile point label */}
                                      <text
                                        x={px}
                                        y="144"
                                        textAnchor="middle"
                                        fontSize="8"
                                        fontWeight="bold"
                                        fill={isLastPile ? '#34D399' : '#94A3B8'}
                                      >
                                        {pile.point}
                                      </text>
                                    </g>
                                  );
                                })}

                                {/* End Point E2 marker */}
                                <circle cx="650" cy={yEnd} r="6.5" fill="#38BDF8" stroke="#ffffff" strokeWidth="2" />
                                <text x="650" y={yEnd > 70 ? yEnd - 12 : yEnd + 20} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#38BDF8">
                                  E2 ({calculatedData.E2.toFixed(3)}m)
                                </text>
                              </>
                            );
                          })()}
                        </svg>
                      </div>
                    </div>

                    {/* Chart Specs Matrix */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Slope Gradient (Tan)</div>
                        <div className="text-base font-black text-[#0f766e] font-mono mt-0.5">{calculatedData.tan.toFixed(6)}</div>
                        <div className="text-[11px] text-slate-500">ΔElev / Total Distance</div>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Inclination Angle (θ)</div>
                        <div className="text-base font-black text-[#112E81] font-mono mt-0.5">{calculatedData.angleDeg.toFixed(3)}°</div>
                        <div className="text-[11px] text-slate-500">arctan(Tan) × 180 / π</div>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Elevation Difference</div>
                        <div className="text-base font-black text-slate-900 mt-0.5">{calculatedData.elevationDifference.toFixed(3)} m</div>
                        <div className="text-[11px] text-slate-500">|E2 − E1|</div>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Total Axis Distance</div>
                        <div className="text-base font-black text-slate-900 mt-0.5">{calculatedData.overallDistance.toFixed(3)} m</div>
                        <div className="text-[11px] text-slate-500">Axis {calculatedData.axis}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 3: SAVED CALCULATIONS HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <History className="w-4 h-4 text-amber-600" />
                      Saved Calculations History
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {savedRecords.length} saved calculation record{savedRecords.length === 1 ? '' : 's'} stored in browser
                    </p>
                  </div>

                  {savedRecords.length > 0 && (
                    <button
                      onClick={handleClearAllSaved}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition cursor-pointer self-start sm:self-auto"
                      title="Clear all saved history"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      <span>Clear All</span>
                    </button>
                  )}
                </div>

                {savedRecords.length === 0 ? (
                  <div className="p-12 text-center border border-dashed border-slate-200 rounded-xl text-slate-500 space-y-3">
                    <div className="p-3 bg-slate-100 rounded-2xl text-slate-400 inline-block">
                      <History className="w-8 h-8" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">No Saved Calculations Yet</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      After entering your E1 and E2 elevations, click the <strong>&ldquo;Save Calculation Details to History&rdquo;</strong> button located under the Section 3 elevation inputs.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedRecords.map((rec) => {
                      const isExpanded = expandedSavedId === rec.id;

                      return (
                        <div
                          key={rec.id}
                          className="border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-300 transition space-y-3 shadow-xs"
                        >
                          {/* Top Row: Meta & Badges */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200">
                                <Clock className="w-3 h-3 text-slate-500" />
                                {rec.timestamp}
                              </span>

                              <span className="px-2.5 py-0.5 bg-[#112E81]/10 text-[#112E81] text-[11px] font-black rounded-lg border border-[#112E81]/20">
                                {rec.calculation.trackerType}
                              </span>

                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-semibold rounded-lg">
                                {rec.calculation.configurationName}
                              </span>

                              <span
                                className={`px-2 py-0.5 text-[11px] font-bold rounded-lg border ${
                                  rec.calculation.direction === 'UP (+)'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : rec.calculation.direction === 'DOWN (-)'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                              >
                                {rec.calculation.direction}
                              </span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1.5 self-end sm:self-auto">
                              <button
                                onClick={() => handleLoadSaved(rec)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-[#112E81] hover:bg-[#0c215e] text-white rounded-lg text-xs font-bold transition cursor-pointer"
                                title="Load this calculation back into active inputs"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Load</span>
                              </button>

                              <button
                                onClick={() => {
                                  const chartPng = renderTrackerChartToCanvasPng(rec.calculation);
                                  downloadStyledExcel(rec.calculation, chartPng);
                                }}
                                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                                title="Download Excel report for this calculation with embedded chart"
                              >
                                <FileSpreadsheet className="w-3 h-3" />
                                <span>Excel</span>
                              </button>

                              <button
                                onClick={() => setExpandedSavedId(isExpanded ? null : rec.id)}
                                className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                                title="Toggle full pile table view"
                              >
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                <span>{isExpanded ? 'Hide' : 'View Piles'}</span>
                              </button>

                              <button
                                onClick={() => handleDeleteSaved(rec.id)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                title="Delete this saved calculation"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Metric summary line */}
                          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                              <div className="text-[10px] font-bold text-slate-400 uppercase">E1 Elevation</div>
                              <div className="font-mono font-bold text-slate-800">{rec.calculation.E1.toFixed(3)} m</div>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                              <div className="text-[10px] font-bold text-slate-400 uppercase">E2 Elevation</div>
                              <div className="font-mono font-bold text-slate-800">{rec.calculation.E2.toFixed(3)} m</div>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                              <div className="text-[10px] font-bold text-slate-400 uppercase">ΔElev |E2-E1|</div>
                              <div className="font-mono font-bold text-[#112E81]">{rec.calculation.elevationDifference.toFixed(3)} m</div>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                              <div className="text-[10px] font-bold text-slate-400 uppercase">Axis Distance</div>
                              <div className="font-mono font-bold text-slate-800">{rec.calculation.overallDistance.toFixed(3)} m</div>
                            </div>
                            <div className="bg-teal-50/60 p-2 rounded-lg border border-teal-200/60">
                              <div className="text-[10px] font-bold text-teal-700 uppercase">Tan (Slope)</div>
                              <div className="font-mono font-bold text-[#0f766e]">{rec.calculation.tan.toFixed(6)}</div>
                            </div>
                            <div className="bg-indigo-50/60 p-2 rounded-lg border border-indigo-200/60">
                              <div className="text-[10px] font-bold text-indigo-700 uppercase">Tan⁻¹ Angle</div>
                              <div className="font-mono font-bold text-[#112E81]">{rec.calculation.angleDeg.toFixed(3)}°</div>
                            </div>
                          </div>

                          {/* Expanded Table */}
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Calculated Pile Elevations Table ({rec.calculation.results.length} piles):
                              </div>
                              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                                <table className="w-full text-left text-[11px] border-collapse">
                                  <thead>
                                    <tr className="bg-[#112E81] text-white font-bold uppercase text-[10px]">
                                      <th className="py-2 px-3">Point</th>
                                      <th className="py-2 px-3">Distance ({rec.calculation.axis}) [m]</th>
                                      <th className="py-2 px-3">Result (Tan × Dist) [m]</th>
                                      <th className="py-2 px-3 text-amber-200">Final Elevation [m]</th>
                                      <th className="py-2 px-3 text-right">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                                    {rec.calculation.results.map((p, pIdx) => {
                                      const isLast = pIdx === rec.calculation.results.length - 1;
                                      return (
                                        <tr key={p.point} className={isLast ? 'bg-emerald-50/70 font-bold' : pIdx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                                          <td className="py-1.5 px-3 font-sans font-bold text-slate-900">{p.point}</td>
                                          <td className="py-1.5 px-3">{p.distance.toFixed(3)}</td>
                                          <td className="py-1.5 px-3">{p.result.toFixed(3)}</td>
                                          <td className={`py-1.5 px-3 font-black ${isLast ? 'text-emerald-800' : 'text-[#112E81]'}`}>{p.elevation.toFixed(3)}</td>
                                          <td className="py-1.5 px-3 text-right font-sans">
                                            {isLast ? (
                                              <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                                                Matches E2
                                              </span>
                                            ) : (
                                              <span className="text-[10px] text-slate-400">Intermediate</span>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
