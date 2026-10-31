'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import {
  BulkTrackerBatchResult,
  BulkTrackerItemResult,
  parseBulkTrackerSheet,
  processBulkTrackers,
  SAMPLE_USER_BULK_CSV,
} from '@/lib/tracker-post-terrain/bulkTrackerCalculations';
import {
  exportBulkTrackersToExcel,
  exportSampleBulkExcelTemplate,
} from '@/lib/tracker-post-terrain/BulkTrackerExcelReport';
import { exportTrackerTerrainToPdf } from '@/lib/tracker-post-terrain/TrackerTerrainPdfReport';
import { YDirectionType } from '@/lib/tracker-post-terrain/calculateTrackerCoordinates';
import ElevationProfileChart from '../ElevationProfileChart';

import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  FileText,
  Layers,
  Compass,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Search,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Eye,
  Building2,
  MapPin,
  Calendar,
  Sparkles,
  Table,
  Check,
  X,
  SlidersHorizontal,
  Info,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function BulkTrackerTerrainPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Project Header Settings
  const [facilityTitle, setFacilityTitle] = useState<string>(
    '100 MW SOLAR PARK FACILITY, SIYAMBALANDUWA, SRI LANKA.'
  );
  const [clientName, setClientName] = useState<string>('Rividhanavi (Private) Limited');
  const [epcContractors, setEpcContractors] = useState<string>(
    'Windforce PLC & Lakdhanavi Limited'
  );
  const [structureZone, setStructureZone] = useState<string>('Tracker Mounting Structure');
  const [locationGrid, setLocationGrid] = useState<string>('Z6');
  const [docNo, setDocNo] = useState<string>('DOC-TRK-Z6-01');
  const [yDirection, setYDirection] = useState<YDirectionType>('DECREASING (-)');

  // Upload & Calculation State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [batchResult, setBatchResult] = useState<BulkTrackerBatchResult | null>(null);

  // Filter & Inspection State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<BulkTrackerItemResult | null>(null);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle File Upload (.xlsx, .xls, .csv)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  const processSelectedFile = (file: File) => {
    setUploadError(null);
    setIsProcessing(true);
    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const sheetJson: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const parsed = parseBulkTrackerSheet(sheetJson);

        if (parsed.errors.length > 0) {
          setUploadError(parsed.errors.join(' '));
          setIsProcessing(false);
          return;
        }

        if (parsed.rows.length === 0) {
          setUploadError('No valid tracker rows found in the uploaded file.');
          setIsProcessing(false);
          return;
        }

        // Apply any detected metadata from file if present
        if (parsed.metadata.facilityTitle) setFacilityTitle(parsed.metadata.facilityTitle);
        if (parsed.metadata.clientName) setClientName(parsed.metadata.clientName);
        if (parsed.metadata.epcContractors) setEpcContractors(parsed.metadata.epcContractors);
        if (parsed.metadata.structureZone) setStructureZone(parsed.metadata.structureZone);
        if (parsed.metadata.locationGrid) setLocationGrid(parsed.metadata.locationGrid);
        if (parsed.metadata.docNo) setDocNo(parsed.metadata.docNo);

        const result = processBulkTrackers(parsed.rows, {
          facilityTitle: parsed.metadata.facilityTitle || facilityTitle,
          clientName: parsed.metadata.clientName || clientName,
          epcContractors: parsed.metadata.epcContractors || epcContractors,
          zoneName: parsed.metadata.structureZone || structureZone,
          locationGrid: parsed.metadata.locationGrid || locationGrid,
          docNo: parsed.metadata.docNo || docNo,
          yDirection,
        });

        setBatchResult(result);
        if (result.items.length > 0) {
          setSelectedItem(result.items[0]);
        }
      } catch (err: any) {
        console.error('File parsing error:', err);
        setUploadError(`Failed to parse file: ${err.message || 'Unknown error'}`);
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setUploadError('Failed to read the file.');
      setIsProcessing(false);
    };

    reader.readAsBinaryString(file);
  };

  // Pre-load user's 17 sample trackers with 1 click
  const handleLoadSampleData = () => {
    setUploadError(null);
    setIsProcessing(true);
    setFileName('Sample_Site_Trackers_Z6.csv');

    try {
      const workbook = XLSX.read(SAMPLE_USER_BULK_CSV, { type: 'string' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const sheetJson: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      const parsed = parseBulkTrackerSheet(sheetJson);

      const result = processBulkTrackers(parsed.rows, {
        facilityTitle: '100 MW SOLAR PARK FACILITY, SIYAMBALANDUWA, SRI LANKA.',
        clientName: 'Rividhanavi (Private) Limited',
        epcContractors: 'Windforce PLC & Lakdhanavi Limited',
        zoneName: 'Tracker Mounting Structure',
        locationGrid: 'Z6',
        docNo: 'DOC-TRK-Z6-01',
        yDirection,
      });

      setBatchResult(result);
      if (result.items.length > 0) {
        setSelectedItem(result.items[0]);
      }
    } catch (err: any) {
      setUploadError(`Failed to load sample data: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Re-calculate if Y-Direction or project settings are toggled
  const handleRecalculate = (newYDir: YDirectionType) => {
    setYDirection(newYDir);
    if (!batchResult) return;

    const rows = batchResult.items.map((it) => it.input);
    const updated = processBulkTrackers(rows, {
      facilityTitle,
      clientName,
      epcContractors,
      zoneName: structureZone,
      locationGrid,
      docNo,
      yDirection: newYDir,
    });

    setBatchResult(updated);
    if (selectedItem) {
      const found = updated.items.find((it) => it.input.trackerId === selectedItem.input.trackerId);
      if (found) setSelectedItem(found);
    }
  };

  // Export Combined Master Excel (.xlsx) with one sheet per tracker ID
  const handleDownloadMasterExcel = () => {
    if (!batchResult || batchResult.items.length === 0) return;
    exportBulkTrackersToExcel(batchResult);
  };

  // Export Single Tracker PDF Checklist
  const handleDownloadSinglePdf = (item: BulkTrackerItemResult) => {
    if (!item.calcResult) return;
    exportTrackerTerrainToPdf(item.calcResult);
  };

  // Filter items
  const filteredItems = (batchResult?.items || []).filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.input.trackerId.toLowerCase().includes(q) ||
      (item.input.trackerTypeRaw || '').toLowerCase().includes(q) ||
      (item.input.pilePointStart || '').toLowerCase().includes(q) ||
      (item.input.pileNumberEnd || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 pb-16 font-sans selection:bg-[#36ADA3] selection:text-white">
      {/* Top Banner Header */}
      <div
        className={`border rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-colors ${
          isDark
            ? 'bg-slate-900/90 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-36 -bottom-16 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-teal-400">
              <span className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-[#36ADA3]">
                <Layers className="w-4 h-4" />
              </span>
              <span>Bulk Processing Engine • Module 02B</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black">
                ALL VALUES IN METERS (m)
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Bulk Tracker Post Terrain Coordinate Generator
            </h1>

            <p
              className={`text-sm max-w-3xl leading-relaxed ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              Batch process multi-tracker Excel files with Northing, Easting, E1, and E2 endpoints.
              Generates unified multi-sheet Excel workbooks with a Master Summary sheet plus dedicated
              individual sheets for every Tracker ID — calculated with full 64-bit precision in Meters.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href="/tracker-post-terrain"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-bold transition ${
                isDark
                  ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              <Compass className="w-4 h-4 text-teal-400" />
              <span>Single Tracker Generator</span>
            </Link>

            <button
              onClick={exportSampleBulkExcelTemplate}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-teal-300 border-teal-500/30'
                  : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-300'
              }`}
              title="Download empty Excel template formatted with standard columns"
            >
              <Download className="w-4 h-4 text-teal-500" />
              <span>Download Excel Template</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Upload & Parameters Card */}
      <div
        className={`border rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6 transition-colors ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-slate-800/60">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-sky-400" />
            <h2 className="text-xl font-extrabold">Batch File Upload &amp; Schedule Parameters</h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                showSettings
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : isDark
                  ? 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showSettings ? 'Hide Metadata Settings' : 'Project Header Settings'}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Project Metadata Inputs */}
        {showSettings && (
          <div
            className={`p-5 rounded-2xl border grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200 ${
              isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Facility / Project Title</span>
              </label>
              <input
                type="text"
                value={facilityTitle}
                onChange={(e) => setFacilityTitle(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none focus:border-teal-500 ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Client Name
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none focus:border-teal-500 ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                EPC Contractors
              </label>
              <input
                type="text"
                value={epcContractors}
                onChange={(e) => setEpcContractors(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none focus:border-teal-500 ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-purple-400" />
                <span>Location / Grid &amp; Doc No</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={locationGrid}
                  onChange={(e) => setLocationGrid(e.target.value)}
                  placeholder="Grid Z6"
                  className={`w-1/2 px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none focus:border-teal-500 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
                <input
                  type="text"
                  value={docNo}
                  onChange={(e) => setDocNo(e.target.value)}
                  placeholder="Doc No"
                  className={`w-1/2 px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none focus:border-teal-500 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Drag & Drop Upload Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all duration-300 cursor-pointer relative group ${
            isDark
              ? 'bg-slate-950/40 border-slate-700 hover:border-teal-400 hover:bg-slate-950/80'
              : 'bg-slate-50 border-slate-300 hover:border-teal-500 hover:bg-slate-100/80'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-teal-500/10 border border-teal-500/20 text-[#36ADA3] flex items-center justify-center group-hover:scale-110 transition-transform">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold">
                {fileName ? `Loaded: ${fileName}` : 'Upload Tracker Schedule Spreadsheet'}
              </h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Drag and drop your Excel (.xlsx, .xls) or CSV file here, or click to browse.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] font-semibold text-slate-400">
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5">
                No.
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-teal-300">
                Tracker ID
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5">
                Tracker Type
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5">
                Northing
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5">
                Easting
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-sky-300">
                Elevation (E1)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5">
                Pile Point
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-sky-300">
                Elevation (E2)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5">
                Pile Number
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5">
                Gradient( Degrees)
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action Strip (Sample Data & Y-Direction Toggle) */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/60">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Y Coordinate Progression:
            </span>
            <div
              className={`flex rounded-xl p-1 border ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'
              }`}
            >
              <button
                type="button"
                onClick={() => handleRecalculate('DECREASING (-)')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  yDirection === 'DECREASING (-)'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Subtract ground projection: Y_i = Y1 - cumGroundY (Reduce Y)"
              >
                Reduce Y (-)
              </button>
              <button
                type="button"
                onClick={() => handleRecalculate('INCREASING (+)')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  yDirection === 'INCREASING (+)'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Add ground projection: Y_i = Y1 + cumGroundY (Add Y)"
              >
                Add Y (+)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLoadSampleData}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-teal-600 to-sky-600 hover:brightness-110 text-white text-xs font-extrabold shadow-md active:scale-95 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Load 17 Sample Site Trackers</span>
            </button>

            {batchResult && (
              <button
                type="button"
                onClick={() => {
                  setBatchResult(null);
                  setFileName(null);
                  setSelectedItem(null);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Upload Error Banner */}
        {uploadError && (
          <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Excel Parsing Error:</span>
              <p>{uploadError}</p>
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      {batchResult && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              className={`p-5 rounded-2xl border shadow-lg ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Trackers Processed
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-teal-400 mt-1">
                {batchResult.validTrackers}
                <span className="text-sm font-semibold text-slate-400 ml-1">
                  / {batchResult.totalTrackers} Valid
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">100% deterministic geometry</p>
            </div>

            <div
              className={`p-5 rounded-2xl border shadow-lg ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Piles Generated
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-sky-400 mt-1">
                {batchResult.totalPiles}
                <span className="text-sm font-semibold text-slate-400 ml-1">Points</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Sequential 3D (X, Y, Z) coordinates</p>
            </div>

            <div
              className={`p-5 rounded-2xl border shadow-lg ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Physical Array Length
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">
                {batchResult.totalLengthM.toFixed(1)}
                <span className="text-sm font-semibold text-slate-400 ml-1">m</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {(batchResult.totalLengthM / 1000).toFixed(3)} km total sloped steel
              </p>
            </div>

            <div
              className={`p-5 rounded-2xl border shadow-lg ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Unit Standard &amp; Status
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-400 mt-1">
                Meters (m)
              </div>
              <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                Zero mm in Excel exports
              </p>
            </div>
          </div>

          {/* Master Action Strip & Combined Excel Download */}
          <div
            className={`border rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              isDark
                ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-[#112E81]/40 border-slate-800'
                : 'bg-gradient-to-r from-teal-50 via-white to-sky-50 border-teal-200'
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                <h3 className="text-lg font-black tracking-tight">
                  Combined Master Excel Export (.xlsx)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase">
                  {batchResult.validTrackers} Sheets Included
                </span>
              </div>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Generates one workbook with a <strong>Master Summary</strong> sheet plus{' '}
                <strong>dedicated individual sheets for every Tracker ID</strong> named after the
                tracker (e.g. <code>STS17-C-ET01</code>). All values formatted in Meters.
              </p>
            </div>

            <button
              onClick={handleDownloadMasterExcel}
              className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-[#112E81] hover:brightness-110 text-white font-black text-sm shadow-xl active:scale-95 transition cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4 text-emerald-200" />
              <span>DOWNLOAD MASTER EXCEL (ALL TRACKERS)</span>
            </button>
          </div>

          {/* Main Layout: Master Table (Left/Top) + Single Tracker Inspection (Right/Bottom) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Master Tracker Table (7 cols) */}
            <div
              className={`lg:col-span-7 border rounded-3xl p-6 shadow-xl space-y-4 ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-800/60">
                <div>
                  <h3 className="text-lg font-extrabold flex items-center gap-2">
                    <Table className="w-4 h-4 text-teal-400" />
                    <span>Master Tracker Schedule</span>
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Click any row to inspect pile-by-pile coordinates &amp; elevation profile
                  </p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Tracker ID..."
                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none focus:border-teal-500 ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>

              {/* Scrollable Table */}
              <div className="overflow-x-auto max-h-[620px] rounded-2xl border border-slate-800/80">
                <table className="w-full text-left text-xs border-collapse">
                  <thead
                    className={`sticky top-0 z-10 text-[11px] font-bold uppercase tracking-wider ${
                      isDark ? 'bg-slate-950 text-slate-400' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <tr>
                      <th className="p-3">No.</th>
                      <th className="p-3">Tracker ID</th>
                      <th className="p-3">Type</th>
                      <th className="p-3 text-right">E1 (m)</th>
                      <th className="p-3 text-right">E2 (m)</th>
                      <th className="p-3 text-right">ΔE (m)</th>
                      <th className="p-3 text-right">Angle θ</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {filteredItems.map((item, idx) => {
                      const isSelected = selectedItem?.input.trackerId === item.input.trackerId;
                      const { input, calcResult, isValid } = item;
                      return (
                        <tr
                          key={item.input.trackerId + idx}
                          onClick={() => setSelectedItem(item)}
                          className={`transition cursor-pointer ${
                            isSelected
                              ? 'bg-teal-500/15 text-white font-bold ring-1 ring-teal-500'
                              : isDark
                              ? 'hover:bg-slate-800/60 text-slate-300'
                              : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <td className="p-3 text-slate-500 font-sans">{input.no || idx + 1}</td>
                          <td className="p-3 font-bold text-teal-300 font-sans">{input.trackerId}</td>
                          <td className="p-3 text-slate-400 font-sans text-[11px]">
                            {calcResult?.config.name || input.trackerTypeRaw}
                          </td>
                          <td className="p-3 text-right font-mono">{input.E1.toFixed(3)}</td>
                          <td className="p-3 text-right font-mono">{input.E2.toFixed(3)}</td>
                          <td className="p-3 text-right font-mono">
                            {calcResult ? calcResult.deltaElevation_m.toFixed(3) : (input.E2 - input.E1).toFixed(3)}
                          </td>
                          <td className="p-3 text-right font-mono text-sky-300">
                            {calcResult ? `${calcResult.thetaDeg.toFixed(2)}°` : '—'}
                          </td>
                          <td className="p-3 text-center">
                            {isValid ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                PASS
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                ERR
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedItem(item);
                              }}
                              className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 hover:bg-teal-500 hover:text-slate-950 transition"
                              title="Inspect Tracker Coordinates"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Single Tracker Inspection & Profile (5 cols) */}
            <div
              className={`lg:col-span-5 border rounded-3xl p-6 shadow-xl space-y-6 ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              {selectedItem && selectedItem.calcResult ? (
                <div className="space-y-6">
                  {/* Top Bar for Selected Tracker */}
                  <div className="flex items-center justify-between border-b pb-4 border-slate-800/60">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                          Tracker Inspection
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-black rounded bg-teal-500/15 text-teal-300 border border-teal-500/30">
                          {selectedItem.calcResult.config.name}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black text-white mt-0.5 font-mono">
                        {selectedItem.input.trackerId}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {selectedItem.calcResult.config.pileCount} Piles • Inclined Length:{' '}
                        <strong className="text-teal-300">
                          {selectedItem.calcResult.totalLengthM.toFixed(3)} m
                        </strong>
                      </p>
                    </div>

                    <button
                      onClick={() => handleDownloadSinglePdf(selectedItem)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-md transition cursor-pointer"
                      title="Download 1-Page Official A4 PDF Report for this tracker"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Single PDF</span>
                    </button>
                  </div>

                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">E1 Datum</span>
                      <span className="text-sm font-black font-mono text-emerald-400">
                        {selectedItem.calcResult.E1_m.toFixed(3)} m
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">E2 Datum</span>
                      <span className="text-sm font-black font-mono text-sky-400">
                        {selectedItem.calcResult.E2_m.toFixed(3)} m
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Slope θ</span>
                      <span className="text-sm font-black font-mono text-purple-400">
                        {selectedItem.calcResult.thetaDeg.toFixed(3)}°
                      </span>
                    </div>
                  </div>

                  {/* Visual Elevation Profile Chart */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                      Elevation Profile Preview
                    </span>
                    <ElevationProfileChart result={selectedItem.calcResult} />
                  </div>

                  {/* Pile Point Coordinates Table (All in Meters) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Pile Point Coordinates (All in Meters)
                      </span>
                      <span className="text-[11px] text-teal-400 font-mono font-bold">
                        {selectedItem.calcResult.points.length} Points
                      </span>
                    </div>

                    <div className="overflow-x-auto max-h-[320px] rounded-2xl border border-slate-800/80">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="sticky top-0 z-10 bg-slate-950 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          <tr>
                            <th className="p-2.5">Pile</th>
                            <th className="p-2.5 text-right">Seg (m)</th>
                            <th className="p-2.5 text-right">Easting X (m)</th>
                            <th className="p-2.5 text-right">Northing Y (m)</th>
                            <th className="p-2.5 text-right">Elev Z (m)</th>
                            <th className="p-2.5 text-right text-emerald-400">Foundation Top (m)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                          {selectedItem.calcResult.points.map((pt, pIdx) => {
                            const customLabel =
                              selectedItem.pileLabels && selectedItem.pileLabels[pIdx]
                                ? selectedItem.pileLabels[pIdx]
                                : pt.label;
                            return (
                              <tr key={pIdx} className="hover:bg-slate-800/40">
                                <td className="p-2.5 font-bold text-sky-300 font-sans">
                                  {customLabel}
                                </td>
                                <td className="p-2.5 text-right text-slate-400">
                                  {pt.segmentLengthM !== null ? pt.segmentLengthM.toFixed(3) : '—'}
                                </td>
                                <td className="p-2.5 text-right text-slate-300">
                                  {pt.xM.toFixed(3)}
                                </td>
                                <td className="p-2.5 text-right text-slate-300">
                                  {pt.yM.toFixed(3)}
                                </td>
                                <td className="p-2.5 text-right font-bold text-sky-400">
                                  {pt.zM.toFixed(3)}
                                </td>
                                <td className="p-2.5 text-right font-bold text-emerald-400">
                                  {(pt.zM + 0.150).toFixed(3)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-500 space-y-3">
                  <Table className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-xs">
                    Select a tracker row from the Master Schedule on the left to inspect its
                    individual pile coordinates, elevation profile, and download single PDF checklists.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

