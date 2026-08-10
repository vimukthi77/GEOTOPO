'use client';

import React from 'react';
import { ArrowDownCircle, ArrowUpCircle, Scale, Compass, AlertTriangle } from 'lucide-react';
import { OptimizationResult } from '@/lib/optimization';

interface MetricsCardsProps {
  result: OptimizationResult | null;
}

export default function MetricsCards({ result }: MetricsCardsProps) {
  if (!result) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-slate-100 border border-slate-200 rounded-2xl p-5 h-28 animate-pulse" />
        ))}
      </div>
    );
  }

  const {
    optimalTargetZ,
    avgGroundHeight,
    totalCutVolumeCf,
    totalCutVolumeCy,
    totalFillVolumeCf,
    totalFillVolumeCy,
    netBalanceCf,
    netBalanceCy,
    elevationRangeWarning,
    minZ,
    maxZ,
    details,
  } = result;

  // Statistics
  const cutPointsCount = details.filter((d) => d.depthType === 'cut').length;
  const fillPointsCount = details.filter((d) => d.depthType === 'fill').length;
  const gradePointsCount = details.filter((d) => d.depthType === 'grade').length;

  // Balance status determination
  const totalMaterialMovedCf = totalCutVolumeCf + totalFillVolumeCf;
  const balanceRatio = totalMaterialMovedCf > 0 ? Math.abs(netBalanceCf) / totalMaterialMovedCf : 0;
  
  // Cut heavy vs Fill heavy vs Balanced
  let balanceStatus: 'surplus' | 'deficit' | 'balanced' = 'balanced';
  if (balanceRatio > 0.05) {
    balanceStatus = netBalanceCf > 0 ? 'surplus' : 'deficit';
  }

  // Format values
  const fmt = (val: number) => val.toLocaleString(undefined, { maximumFractionDigits: 1 });

  return (
    <div className="space-y-6">
      {/* Constraints Warning Alert */}
      {elevationRangeWarning && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3.5 text-amber-800 text-xs shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold block text-sm mb-1 uppercase tracking-wider text-amber-900">Topographic Alert: Large Elevation Range</span>
            The difference between maximum ({fmt(maxZ)} ft) and minimum ({fmt(minZ)} ft) elevations is {fmt(maxZ - minZ)} ft. 
            Because both Cut and Fill depths are constrained to a maximum of 5.0 ft, grading to the optimal grade will result in capped cuts/fills at extreme points.
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Cut Card */}
        <div className="bg-white border border-slate-200 hover:border-red-300 transition rounded-2xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-50/50 rounded-full blur-xl pointer-events-none group-hover:scale-110 transition" />
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Cut (Excavation)</span>
            <ArrowDownCircle className="w-5 h-5 text-red-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-800">{fmt(totalCutVolumeCy)}</span>
            <span className="text-xs text-red-600 font-bold ml-1">CY</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 flex items-center justify-between">
            <span>{fmt(totalCutVolumeCf)} CF</span>
            <span className="bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded font-bold">
              {cutPointsCount} points
            </span>
          </div>
        </div>

        {/* Total Fill Card */}
        <div className="bg-white border border-slate-200 hover:border-blue-300 transition rounded-2xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full blur-xl pointer-events-none group-hover:scale-110 transition" />
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Fill (Embankment)</span>
            <ArrowUpCircle className="w-5 h-5 text-[#112E81]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-800">{fmt(totalFillVolumeCy)}</span>
            <span className="text-xs text-[#112E81] font-bold ml-1">CY</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 flex items-center justify-between">
            <span>{fmt(totalFillVolumeCf)} CF</span>
            <span className="bg-[#112E81]/10 text-[#112E81] border border-[#112E81]/20 px-1.5 py-0.5 rounded font-bold">
              {fillPointsCount} points
            </span>
          </div>
        </div>

        {/* Net Balance Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
          {balanceStatus === 'surplus' && (
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-50/50 rounded-full blur-xl pointer-events-none" />
          )}
          {balanceStatus === 'deficit' && (
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full blur-xl pointer-events-none" />
          )}
          {balanceStatus === 'balanced' && (
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-full blur-xl pointer-events-none" />
          )}
          
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Balance</span>
            <Scale className="w-5 h-5 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className={`text-2xl font-black ${
              balanceStatus === 'surplus' ? 'text-red-600' :
              balanceStatus === 'deficit' ? 'text-[#112E81]' : 'text-[#36ADA3]'
            }`}>
              {netBalanceCy > 0 ? `+${fmt(netBalanceCy)}` : fmt(netBalanceCy)}
            </span>
            <span className="text-xs text-slate-500 font-semibold ml-1">CY</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 flex items-center justify-between">
            <span>{fmt(netBalanceCf)} CF</span>
            {balanceStatus === 'surplus' && (
              <span className="bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded font-bold uppercase text-[9px]">Surplus (Export)</span>
            )}
            {balanceStatus === 'deficit' && (
              <span className="bg-[#112E81]/10 text-[#112E81] border border-[#112E81]/20 px-1.5 py-0.5 rounded font-bold uppercase text-[9px]">Deficit (Import)</span>
            )}
            {balanceStatus === 'balanced' && (
              <span className="bg-[#36ADA3]/10 text-[#36ADA3] border border-[#36ADA3]/20 px-1.5 py-0.5 rounded font-bold uppercase text-[9px]">Balanced Site</span>
            )}
          </div>
        </div>

        {/* Avg Height Card */}
        <div className="bg-white border border-slate-200 hover:border-slate-300 transition rounded-2xl p-5 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Ground Height</span>
            <Compass className="w-5 h-5 text-purple-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-800">{fmt(avgGroundHeight)}</span>
            <span className="text-xs text-purple-600 font-bold ml-1">FT</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Terrain Range:</span>
            <span className="font-bold text-slate-700">
              {fmt(minZ)} - {fmt(maxZ)} ft
            </span>
          </div>
        </div>

        {/* Optimal Elevation Card */}
        <div className="bg-white border border-slate-200 hover:border-emerald-300 transition rounded-2xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-full blur-xl pointer-events-none group-hover:scale-110 transition" />
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Optimal Target Z</span>
            <Compass className="w-5 h-5 text-[#36ADA3]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-[#36ADA3]">{fmt(optimalTargetZ)}</span>
            <span className="text-xs text-[#36ADA3] font-bold ml-1">FT</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Grade Deviation:</span>
            <span className="font-bold text-[#36ADA3]">
              {fmt(optimalTargetZ - avgGroundHeight)} ft
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
