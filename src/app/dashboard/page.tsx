'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import SurveyInput from '@/components/SurveyInput';
import MetricsCards from '@/components/MetricsCards';
import SpatialScatterPlot from '@/components/ScatterPlot';
import TerrainMap from '@/components/TerrainMap';
import PastRecords from '@/components/PastRecords';
import { optimizeTargetGrade, OptimizationResult, SurveyPointData } from '@/lib/optimization';
import { Database, Table, Map, AlertCircle, CheckCircle2, Loader2, Landmark, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

export default function DashboardPage() {
  const [activeResult, setActiveResult] = useState<OptimizationResult | null>(null);
  
  // Survey Metadata for current session
  const [zone, setZone] = useState('');
  const [area, setArea] = useState('');
  const [points, setPoints] = useState<SurveyPointData[]>([]);
  const [gridArea, setGridArea] = useState(0);

  // Operation states
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  
  // History panel reload trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Tab state: 'visuals' | 'table'
  const [activeTab, setActiveTab] = useState<'visuals' | 'table'>('visuals');

  // Grading Mode state: 'flat' | 'sloped'
  const [gradingMode, setGradingMode] = useState<'flat' | 'sloped'>('sloped');

  // Callback when survey coordinates are paste-processed or uploaded
  const handleDataParsed = (data: {
    zone: string;
    area: string;
    points: SurveyPointData[];
    customGridArea?: number;
  }) => {
    setZone(data.zone);
    setArea(data.area);
    setPoints(data.points);
    setSaveSuccess('');
    setSaveError('');

    // Execute Earthwork Bisection Optimization
    const result = optimizeTargetGrade(data.points, data.customGridArea);
    setActiveResult(result);
    setGridArea(result.gridArea);
  };

  // Save current optimized model to MongoDB
  const handleSaveToDatabase = async () => {
    if (!activeResult || points.length === 0) return;

    setSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const res = await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zone,
          area,
          points,
          targetZ: activeResult.optimalTargetZ,
          gridArea,
          metrics: {
            totalCutVolume: activeResult.totalCutVolumeM3,
            totalFillVolume: activeResult.totalFillVolumeM3,
            netBalance: activeResult.netBalanceM3,
            avgGroundHeight: activeResult.avgGroundHeight,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save survey record to database');
      }

      setSaveSuccess(`Survey grading model for ${zone} - ${area} saved successfully.`);
      setRefreshTrigger((prev) => prev + 1); // Refresh Sidebar listing
    } catch (err: any) {
      setSaveError(err.message || 'Error occurred while saving to MongoDB.');
    } finally {
      setSaving(false);
    }
  };

  // Export current visuals and coordinate details to a multi-page PDF
  const handleExportPDF = async () => {
    if (!activeResult) return;
    setExportingPDF(true);

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: 'a4'
      });

      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = doc.internal.pageSize.getHeight();

      // Page 1: Scatter Plot
      const scatterEl = document.getElementById('recharts-scatter-plot-container');
      if (scatterEl) {
        const canvas = await html2canvas(scatterEl, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(17, 46, 129); // #112E81
        doc.text(`Survey Optimization Report: 2D Profile View (Z vs Y)`, 30, 30);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Zone: ${zone} • Area: ${area} • Generated: ${new Date().toLocaleString()}`, 30, 45);
        
        const imgWidth = pdfWidth - 60;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        doc.addImage(imgData, 'PNG', 30, 60, imgWidth, Math.min(imgHeight, pdfHeight - 80));
      }

      // Page 2: 3D Topography Mesh
      doc.addPage();
      const terrainEl = document.getElementById('plotly-terrain-map-container');
      if (terrainEl) {
        const canvas = await html2canvas(terrainEl, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(17, 46, 129); // #112E81
        doc.text(`Survey Optimization Report: 3D Topography Mesh`, 30, 30);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Zone: ${zone} • Area: ${area} • Target Elevation Z: ${activeResult.optimalTargetZ.toFixed(2)} m`, 30, 45);
        
        const imgWidth = pdfWidth - 60;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        doc.addImage(imgData, 'PNG', 30, 60, imgWidth, Math.min(imgHeight, pdfHeight - 80));
      }

      // Page 3+: Details Table in Portrait
      doc.addPage('a4', 'portrait');
      
      const printTableEl = document.getElementById('pdf-print-table-container');
      if (printTableEl) {
        const canvas = await html2canvas(printTableEl, { scale: 2 });
        const imgWidth = doc.internal.pageSize.getWidth() - 40;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const pageHeight = doc.internal.pageSize.getHeight();
        
        const sliceCanvas = (cv: HTMLCanvasElement, startY: number, height: number) => {
          const slice = document.createElement('canvas');
          slice.width = cv.width;
          slice.height = Math.min(height, cv.height - startY);
          const ctx = slice.getContext('2d');
          if (ctx) {
            ctx.drawImage(cv, 0, startY, cv.width, slice.height, 0, 0, cv.width, slice.height);
          }
          return slice;
        };

        const pxPageHeight = (canvas.width * (pageHeight - 40)) / imgWidth;
        let startY = 0;
        let isFirstTablePage = true;

        while (startY < canvas.height) {
          if (!isFirstTablePage) {
            doc.addPage('a4', 'portrait');
          }
          const slice = sliceCanvas(canvas, startY, pxPageHeight);
          const sliceData = slice.toDataURL('image/png');
          const sliceWidth = imgWidth;
          const sliceHeight = (slice.height * imgWidth) / canvas.width;
          
          doc.addImage(sliceData, 'PNG', 20, 20, sliceWidth, sliceHeight);
          startY += pxPageHeight;
          isFirstTablePage = false;
        }
      }

      doc.save(`Survey_Grading_Report_${zone}_${area}.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setExportingPDF(false);
    }
  };

  // Load a historical survey run from MongoDB history panel
  const handleLoadRecord = async (id: string) => {
    setLoadingRecord(true);
    setSaveError('');
    setSaveSuccess('');
    try {
      const res = await fetch(`/api/survey?id=${id}`);
      if (!res.ok) {
        throw new Error('Failed to load past survey record');
      }

      const data = await res.json();
      const survey = data.survey;

      if (!survey) {
        throw new Error('Survey record is empty');
      }

      setZone(survey.zone);
      setArea(survey.area);
      setPoints(survey.points);
      setGridArea(survey.gridArea);

      // Re-run the optimizer dynamically to re-populate the details arrays
      const result = optimizeTargetGrade(survey.points, survey.gridArea);
      setActiveResult(result);
    } catch (err: any) {
      setSaveError(err.message || 'Failed loading survey run.');
    } finally {
      setLoadingRecord(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Earthwork Cut & Fill Optimization
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Compute optimal site grading levels, minimize export/import volumes, and visualize coordinates.
            </p>
          </div>

          {activeResult && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleExportPDF}
                disabled={exportingPDF}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#112E81] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#112E81] border-none font-bold rounded-xl text-white shadow-md hover:shadow-lg active:scale-[0.98] transition cursor-pointer self-start md:self-center"
              >
                {exportingPDF ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4" />
                    Export Survey PDF
                  </>
                )}
              </button>

              <button
                onClick={handleSaveToDatabase}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#36ADA3] to-teal-600 hover:from-teal-500 hover:to-[#36ADA3] border-none font-bold rounded-xl text-white shadow-md hover:shadow-lg active:scale-[0.98] transition cursor-pointer self-start md:self-center"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving to Cloud...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    Save Survey Run
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Top level alerts */}
        {saveError && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3 text-sm shadow">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <span>{saveError}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-start gap-3 text-sm shadow">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {/* Master Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Inputs Section */}
          <div className="lg:col-span-1 space-y-6">
            <SurveyInput onDataParsed={handleDataParsed} />
            <PastRecords onLoadRecord={handleLoadRecord} refreshTrigger={refreshTrigger} />
          </div>

          {/* Metrics & Plots Section */}
          <div className="lg:col-span-3 space-y-6">
            {loadingRecord ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-20 flex flex-col items-center justify-center gap-3 text-slate-500 shadow-sm min-h-[500px]">
                <Loader2 className="w-10 h-10 animate-spin text-[#112E81]" />
                <span className="font-semibold tracking-wide">Loading Survey Dataset...</span>
              </div>
            ) : !activeResult ? (
              <div className="bg-white border border-slate-200 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center text-center shadow-sm min-h-[500px] text-slate-500 space-y-4">
                <div className="p-4 bg-[#112E81]/5 rounded-3xl border border-[#112E81]/10">
                  <Landmark className="w-12 h-12 text-[#112E81]/80" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">No Active Survey Grading Model</h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">
                    Upload an Excel file or paste CSV coordinate rows in the left sidebar to run the bisection balance algorithm.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Metric Indicators */}
                <MetricsCards result={activeResult} gradingMode={gradingMode} />

                {/* Dashboard Tabs */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="px-2.5 py-1 text-xs font-black bg-[#112E81]/10 text-[#112E81] border border-[#112E81]/20 rounded">
                        {zone}
                      </span>
                      <span className="text-xs text-slate-600 font-extrabold uppercase">{area}</span>
                      <span className="text-xs text-slate-400">• {points.length} coordinates loaded</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Grading Mode Toggle Selector */}
                      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                          onClick={() => setGradingMode('sloped')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            gradingMode === 'sloped' ? 'bg-[#36ADA3] text-white shadow' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Sloped Plane (0-5°)
                        </button>
                        <button
                          onClick={() => setGradingMode('flat')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            gradingMode === 'flat' ? 'bg-[#112E81] text-white shadow' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Flat Plane
                        </button>
                      </div>

                      {/* Visuals vs Table Toggle */}
                      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                          onClick={() => setActiveTab('visuals')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            activeTab === 'visuals' ? 'bg-[#112E81] text-white shadow' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <Map className="w-3.5 h-3.5" />
                          Visual Maps
                        </button>
                        <button
                          onClick={() => setActiveTab('table')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            activeTab === 'table' ? 'bg-[#112E81] text-white shadow' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <Table className="w-3.5 h-3.5" />
                          Details Table
                        </button>
                      </div>
                    </div>
                  </div>

                  {activeTab === 'visuals' ? (
                    /* Visual Analysis: XY Scatter and Plotly 3D Terrain */
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 min-h-[460px]">
                      <div className="h-full">
                        <SpatialScatterPlot
                          data={activeResult.details}
                          optimalTargetZ={activeResult.optimalTargetZ}
                          optimalSlopeY={activeResult.optimalSlopeY}
                        />
                      </div>
                      <div className="h-full">
                        <TerrainMap
                          data={activeResult.details}
                          targetZ={activeResult.optimalTargetZ}
                          optimalSlopeX={activeResult.optimalSlopeX}
                          optimalSlopeY={activeResult.optimalSlopeY}
                        />
                      </div>
                    </div>
                  ) : (
                    /* Tabular coordinate inspection list */
                    <div className="overflow-x-auto max-h-[460px] overflow-y-auto pr-1">
                      <table className="w-full text-left text-xs border-collapse text-slate-700">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wide">
                            <th className="pb-3 pl-2">Point ID</th>
                            <th className="pb-3">Easting (X)</th>
                            <th className="pb-3">Northing (Y)</th>
                            <th className="pb-3">Elevation (Z)</th>
                            <th className="pb-3">Optimal Grade (Z)</th>
                            <th className="pb-3">Cut Depth (m)</th>
                            <th className="pb-3">Fill Depth (m)</th>
                            <th className="pb-3 pr-2 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {activeResult.details.map((p) => (
                            <tr key={p.pointId} className="hover:bg-slate-50 transition">
                              <td className="py-2.5 pl-2 font-bold text-slate-900">{p.pointId}</td>
                              <td className="py-2.5">{p.x.toFixed(1)}</td>
                              <td className="py-2.5">{p.y.toFixed(1)}</td>
                              <td className="py-2.5 font-bold text-slate-850">{p.z.toFixed(2)}</td>
                              <td className="py-2.5 font-bold text-[#36ADA3]">
                                {gradingMode === 'sloped' ? p.targetZ.toFixed(2) : p.flatTargetZ.toFixed(2)}
                              </td>
                              <td className="py-2.5 text-red-600">
                                {gradingMode === 'sloped'
                                  ? (p.cutDepth > 0 ? p.cutDepth.toFixed(2) : '-')
                                  : (p.flatCutDepth > 0 ? p.flatCutDepth.toFixed(2) : '-')}
                              </td>
                              <td className="py-2.5 text-[#112E81]">
                                {gradingMode === 'sloped'
                                  ? (p.fillDepth > 0 ? p.fillDepth.toFixed(2) : '-')
                                  : (p.flatFillDepth > 0 ? p.flatFillDepth.toFixed(2) : '-')}
                              </td>
                              <td className="py-2.5 pr-2 text-right">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    (gradingMode === 'sloped' ? p.depthType : p.flatDepthType) === 'cut'
                                      ? 'bg-red-50 text-red-700 border border-red-250'
                                      : (gradingMode === 'sloped' ? p.depthType : p.flatDepthType) === 'fill'
                                      ? 'bg-[#112E81]/10 text-[#112E81] border border-[#112E81]/20'
                                      : 'bg-[#36ADA3]/10 text-[#36ADA3] border border-[#36ADA3]/20'
                                  }`}
                                >
                                  {gradingMode === 'sloped' ? p.depthType : p.flatDepthType}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Off-screen Container for PDF Export */}
        {activeResult && (
          <div id="pdf-print-table-container" className="absolute -left-[9999px] top-0 bg-white p-8 w-[800px] font-sans text-slate-800 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#112E81]">Survey Grading Optimization Report</h2>
              <p className="text-xs text-slate-500">{zone} - {area} • {points.length} Coordinate Points</p>
              <p className="text-xs text-slate-500">Optimal Target Z: {activeResult.optimalTargetZ.toFixed(2)} m • Average Height: {activeResult.avgGroundHeight.toFixed(2)} m</p>
            </div>
            <table className="w-full text-left text-xs border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                  <th className="p-2 border-r border-slate-200">Point ID</th>
                  <th className="p-2 border-r border-slate-200">Easting (X)</th>
                  <th className="p-2 border-r border-slate-200">Northing (Y)</th>
                  <th className="p-2 border-r border-slate-200">Elevation (Z)</th>
                  <th className="p-2 border-r border-slate-200">Optimal Grade (Z)</th>
                  <th className="p-2 border-r border-slate-200">Cut Depth (m)</th>
                  <th className="p-2 border-r border-slate-200">Fill Depth (m)</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {activeResult.details.map((p) => (
                  <tr key={p.pointId} className="border-b border-slate-150">
                    <td className="p-2 border-r border-slate-200 font-bold text-slate-900">{p.pointId}</td>
                    <td className="p-2 border-r border-slate-200">{p.x.toFixed(1)}</td>
                    <td className="p-2 border-r border-slate-200">{p.y.toFixed(1)}</td>
                    <td className="p-2 border-r border-slate-200">{p.z.toFixed(2)}</td>
                    <td className="p-2 border-r border-slate-200 font-bold text-[#36ADA3]">
                      {gradingMode === 'sloped' ? p.targetZ.toFixed(2) : p.flatTargetZ.toFixed(2)}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-red-600">
                      {gradingMode === 'sloped'
                        ? (p.cutDepth > 0 ? p.cutDepth.toFixed(2) : '-')
                        : (p.flatCutDepth > 0 ? p.flatCutDepth.toFixed(2) : '-')}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-[#112E81]">
                      {gradingMode === 'sloped'
                        ? (p.fillDepth > 0 ? p.fillDepth.toFixed(2) : '-')
                        : (p.flatFillDepth > 0 ? p.flatFillDepth.toFixed(2) : '-')}
                    </td>
                    <td className="p-2 uppercase font-bold text-[10px]">
                      {gradingMode === 'sloped' ? p.depthType : p.flatDepthType}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
