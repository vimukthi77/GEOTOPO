'use client';

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileText, Settings, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { SurveyPointData } from '@/lib/optimization';

interface SurveyInputProps {
  onDataParsed: (data: {
    zone: string;
    area: string;
    points: SurveyPointData[];
    customGridArea?: number;
  }) => void;
}

const ZONES = ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5'];
const AREAS = ['Area A', 'Area B', 'Area C', 'Area D', 'Area E'];

export default function SurveyInput({ onDataParsed }: SurveyInputProps) {
  const [zone, setZone] = useState(ZONES[0]);
  const [area, setArea] = useState(AREAS[0]);
  const [pasteData, setPasteData] = useState('');
  const [customSpacing, setCustomSpacing] = useState(''); // Grid spacing in feet
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to parse string CSV/TSV data
  const parseTextData = (text: string): SurveyPointData[] => {
    const lines = text.split(/\r?\n/);
    const parsedPoints: SurveyPointData[] = [];
    
    let headerSkipped = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Split by tab, comma, or semicolon
      const parts = line.split(/[\t,;]+/);
      
      // Skip headers (if they contain alphabetic text like 'x', 'y', 'z', 'id', 'point')
      if (!headerSkipped && parts.some(p => isNaN(Number(p.trim())))) {
        headerSkipped = true;
        continue;
      }
      
      if (parts.length >= 4) {
        const pointId = Number(parts[0].trim());
        const x = Number(parts[1].trim());
        const y = Number(parts[2].trim());
        const z = Number(parts[3].trim());
        
        if (!isNaN(pointId) && !isNaN(x) && !isNaN(y) && !isNaN(z)) {
          parsedPoints.push({ pointId, x, y, z });
        }
      } else if (parts.length === 3) {
        // ID is omitted: auto-generate sequential point ID
        const x = Number(parts[0].trim());
        const y = Number(parts[1].trim());
        const z = Number(parts[2].trim());
        
        if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
          parsedPoints.push({ pointId: parsedPoints.length + 1, x, y, z });
        }
      }
    }
    return parsedPoints;
  };

  const handleProcessText = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!pasteData.trim()) {
      setError('Please paste survey coordinate data first.');
      return;
    }

    try {
      const points = parseTextData(pasteData);
      if (points.length === 0) {
        throw new Error('No valid coordinate points found. Ensure format is: [PointId] Easting(X) Northing(Y) Elevation(Z)');
      }

      let customGridArea: number | undefined = undefined;
      if (customSpacing) {
        const spacing = parseFloat(customSpacing);
        if (isNaN(spacing) || spacing <= 0) {
          throw new Error('Grid spacing must be a positive number.');
        }
        // Area of a square grid cell
        customGridArea = spacing * spacing;
      }

      onDataParsed({
        zone,
        area,
        points,
        customGridArea,
      });

      setSuccess(`Successfully parsed ${points.length} survey points!`);
    } catch (err: any) {
      setError(err.message || 'Failed to parse paste data.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setSuccess('');
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      reader.onload = (event) => {
        try {
          const binaryStr = event.target?.result;
          if (!binaryStr) throw new Error('Failed to read file binary data.');
          
          const workbook = XLSX.read(binaryStr, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          const points: SurveyPointData[] = [];
          let headerSkipped = false;

          for (const row of rawRows) {
            if (!row || row.length === 0) continue;
            
            // Check for header row
            if (!headerSkipped && row.some(cell => typeof cell === 'string' && isNaN(Number(cell)))) {
              headerSkipped = true;
              continue;
            }

            if (row.length >= 4) {
              const pointId = Number(row[0]);
              const x = Number(row[1]);
              const y = Number(row[2]);
              const z = Number(row[3]);
              if (!isNaN(pointId) && !isNaN(x) && !isNaN(y) && !isNaN(z)) {
                points.push({ pointId, x, y, z });
              }
            } else if (row.length === 3) {
              const x = Number(row[0]);
              const y = Number(row[1]);
              const z = Number(row[2]);
              if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
                points.push({ pointId: points.length + 1, x, y, z });
              }
            }
          }

          if (points.length === 0) {
            throw new Error('No valid coordinate rows found in Excel sheet.');
          }

          let customGridArea: number | undefined = undefined;
          if (customSpacing) {
            const spacing = parseFloat(customSpacing);
            if (!isNaN(spacing) && spacing > 0) {
              customGridArea = spacing * spacing;
            }
          }

          onDataParsed({
            zone,
            area,
            points,
            customGridArea,
          });

          setSuccess(`Successfully parsed ${points.length} points from Excel!`);
        } catch (err: any) {
          setError(err.message || 'Failed parsing Excel spreadsheet.');
        }
      };
      reader.readAsBinaryString(file);
    } else if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const points = parseTextData(text);
          
          if (points.length === 0) {
            throw new Error('No valid rows found in CSV.');
          }

          let customGridArea: number | undefined = undefined;
          if (customSpacing) {
            const spacing = parseFloat(customSpacing);
            if (!isNaN(spacing) && spacing > 0) {
              customGridArea = spacing * spacing;
            }
          }

          onDataParsed({
            zone,
            area,
            points,
            customGridArea,
          });

          setSuccess(`Successfully parsed ${points.length} points from CSV file!`);
        } catch (err: any) {
          setError(err.message || 'Failed parsing CSV file.');
        }
      };
      reader.readAsText(file);
    } else {
      setError('Unsupported file type. Please upload a .xlsx, .csv or .txt file.');
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#112E81]/10 rounded-xl border border-[#112E81]/20 text-[#112E81]">
          <Upload className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Survey Data Input</h2>
          <p className="text-xs text-slate-500">Import civil coordinates from Excel spreadsheet or copy-paste directly.</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2.5 text-xs">
          <AlertCircle className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-start gap-2.5 text-xs">
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleProcessText} className="space-y-4">
        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Zone</label>
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#112E81] focus:ring-1 focus:ring-[#112E81] transition text-sm cursor-pointer"
            >
              {ZONES.map((z) => (
                <option key={z} value={z} className="bg-white">
                  {z}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Area</label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-[#112E81] focus:ring-1 focus:ring-[#112E81] transition text-sm cursor-pointer"
            >
              {AREAS.map((a) => (
                <option key={a} value={a} className="bg-white">
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Configuration grid spacing */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            Grid Spacing (Optional)
          </label>
          <div className="relative">
            <input
              type="number"
              step="any"
              placeholder="Auto-estimate spacing from bounding box"
              value={customSpacing}
              onChange={(e) => setCustomSpacing(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#112E81] focus:ring-1 focus:ring-[#112E81] text-sm text-slate-800 placeholder-slate-400"
            />
            {customSpacing && (
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-slate-500 font-bold uppercase pointer-events-none">
                Feet spacing (A = {parseFloat(customSpacing) * parseFloat(customSpacing)} sf)
              </span>
            )}
          </div>
        </div>

        {/* File Drag and Drop / Uploader */}
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx,.xls,.csv,.txt"
            className="hidden"
          />
          <button
            type="button"
            onClick={triggerFileSelect}
            className="w-full py-4 border border-dashed border-slate-200 hover:border-[#112E81]/50 hover:bg-[#112E81]/5 bg-slate-50 rounded-xl transition flex flex-col items-center justify-center gap-2 cursor-pointer group"
          >
            <Upload className="w-6 h-6 text-slate-400 group-hover:text-[#112E81] group-hover:scale-105 transition" />
            <div className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 transition">Upload File (.xlsx, .csv)</div>
            <div className="text-[10px] text-slate-500">Excel columns: PointId, X(Easting), Y(Northing), Z(Elevation)</div>
          </button>
        </div>

        {/* Text Area Copy-Paste */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Direct Copy-Paste (TSV/CSV)
          </label>
          <textarea
            rows={5}
            placeholder="Paste cells directly from Excel or plain text...&#10;Example:&#10;1	100	100	12.5&#10;2	150	100	14.2&#10;3	100	150	10.1"
            value={pasteData}
            onChange={(e) => setPasteData(e.target.value)}
            className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#112E81] focus:ring-1 focus:ring-[#112E81] font-mono text-xs text-slate-800 placeholder-slate-400 resize-none h-[120px]"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-gradient-to-r from-[#112E81] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#2563eb] border-none font-bold rounded-xl text-white shadow-md active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Optimize Grading
        </button>
      </form>
    </div>
  );
}
