'use client';

import React from 'react';
import { ArrowDownCircle, ArrowUpCircle, Scale, Compass, AlertTriangle } from 'lucide-react';
import { OptimizationResult } from '@/lib/optimization';

interface MetricsCardsProps {
  result: OptimizationResult | null;
  gradingMode?: 'flat' | 'sloped';
}

export default function MetricsCards({ result, gradingMode = 'sloped' }: MetricsCardsProps) {
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
    optimalSlopeX,
    optimalSlopeY,
    optimalSlopeAngleDeg,
    optimalSlopeDirectionDeg,
    avgGroundHeight,
    
    totalCutVolumeM3,
    totalFillVolumeM3,
    netBalanceM3,
    
    flatTargetZ,
    flatCutVolumeM3,
    flatFillVolumeM3,
    flatNetBalanceM3,
    
    elevationRangeWarning,
    minZ,
    maxZ,
    gridArea,
    details,
    is1DBarMode,
    barLength,
    barWidth,
  } = result;

  const isSloped = gradingMode === 'sloped';
  const is1D = !!is1DBarMode;

  // Statistics
  const activeCutVolume = isSloped ? totalCutVolumeM3 : flatCutVolumeM3;
  const activeFillVolume = isSloped ? totalFillVolumeM3 : flatFillVolumeM3;
  const activeNetBalance = isSloped ? netBalanceM3 : flatNetBalanceM3;
  const activeTargetZ = isSloped ? optimalTargetZ : flatTargetZ;

  const cutPointsCount = details.filter((d) => (isSloped ? d.depthType : d.flatDepthType) === 'cut').length;
  const fillPointsCount = details.filter((d) => (isSloped ? d.depthType : d.flatDepthType) === 'fill').length;
  const gradePointsCount = details.filter((d) => (isSloped ? d.depthType : d.flatDepthType) === 'grade').length;

  // Balance status determination
  const totalMaterialMovedM3 = activeCutVolume + activeFillVolume;
  const balanceRatio = totalMaterialMovedM3 > 0 ? Math.abs(activeNetBalance) / totalMaterialMovedM3 : 0;
  
  // Cut heavy vs Fill heavy vs Balanced
  let balanceStatus: 'surplus' | 'deficit' | 'balanced' = 'balanced';
  if (balanceRatio > 0.05) {
    balanceStatus = activeNetBalance > 0 ? 'surplus' : 'deficit';
  }

  // Format values
  const fmt = (val: number) => val.toLocaleString(undefined, { maximumFractionDigits: 1 });

  // Volume savings calculation
  const flatTotalVolume = flatCutVolumeM3 + flatFillVolumeM3;
  const slopedTotalVolume = totalCutVolumeM3 + totalFillVolumeM3;
  const savingsPercent = flatTotalVolume > 0 ? ((flatTotalVolume - slopedTotalVolume) / flatTotalVolume) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Comparative Savings Alert Card */}
      {flatTotalVolume > 0 && (
        <div className="bg-gradient-to-r from-[#112E81] to-[#1d4ed8] text-white p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div>
            <h4 className="text-sm font-extrabold uppercase tracking-wider text-[#36ADA3] flex items-center gap-1.5">
              <Scale className="w-4 h-4" />
              {is1D ? 'Sloped Bar Leveling Savings' : 'Sloped Grading Optimization Savings'}
            </h4>
            <p className="text-xs text-slate-100 mt-1">
              By grading at an optimized slope of <span className="font-bold text-white">{optimalSlopeAngleDeg.toFixed(1)}°</span> {!is1D && <> (directed at <span className="font-bold text-white">{optimalSlopeDirectionDeg}°</span>)</>}, 
              the total earthwork volume was reduced from <span className="font-bold">{fmt(flatTotalVolume)} m³</span> ({is1D ? 'flat bar' : 'flat plane'}) to <span className="font-bold">{fmt(slopedTotalVolume)} m³</span>.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/20 px-4 py-2.5 rounded-xl self-start md:self-center text-center">
            <span className="block text-[10px] uppercase font-bold text-slate-200">Earthwork Saved</span>
            <span className="text-lg font-black text-[#36ADA3]">{savingsPercent.toFixed(1)}%</span>
          </div>
        </div>
      )}

      {/* Constraints Warning Alert */}
      {elevationRangeWarning && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3.5 text-amber-800 text-xs shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold block text-sm mb-1 uppercase tracking-wider text-amber-900">Topographic Alert: Large Elevation Range</span>
            The difference between maximum ({fmt(maxZ)} m) and minimum ({fmt(minZ)} m) elevations is {fmt(maxZ - minZ)} m. 
            Deep cuts/fills exceeding 1.5 m will be required at extreme points.
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
            <span className="text-2xl font-black text-slate-800">{fmt(activeCutVolume)}</span>
            <span className="text-xs text-red-650 font-bold ml-1">m³</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 flex items-center justify-between">
            <span>{is1D ? `Bar Width: ${fmt(barWidth || 1)} m` : `Grid Cell Area: ${fmt(gridArea)} m²`}</span>
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
            <span className="text-2xl font-black text-slate-800">{fmt(activeFillVolume)}</span>
            <span className="text-xs text-[#112E81] font-bold ml-1">m³</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 flex items-center justify-between">
            <span>{is1D ? `Bar Width: ${fmt(barWidth || 1)} m` : `Grid Cell Area: ${fmt(gridArea)} m²`}</span>
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
              {activeNetBalance > 0 ? `+${fmt(activeNetBalance)}` : fmt(activeNetBalance)}
            </span>
            <span className="text-xs text-slate-500 font-semibold ml-1">m³</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Status:</span>
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
            <span className="text-xs text-purple-600 font-bold ml-1">m</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Range:</span>
            <span className="font-bold text-slate-700">
              {fmt(minZ)} - {fmt(maxZ)} m
            </span>
          </div>
        </div>

        {/* Optimal Elevation Card */}
        <div className="bg-white border border-slate-200 hover:border-emerald-300 transition rounded-2xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-full blur-xl pointer-events-none group-hover:scale-110 transition" />
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Optimal Grade</span>
            <Compass className="w-5 h-5 text-[#36ADA3]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-[#36ADA3]">{fmt(activeTargetZ)}</span>
            <span className="text-xs text-[#36ADA3] font-bold ml-1">m</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Slope configuration:</span>
            <span className="font-extrabold text-[#36ADA3] uppercase text-[9px] bg-[#36ADA3]/10 px-1.5 py-0.5 rounded border border-[#36ADA3]/25">
              {isSloped && optimalSlopeAngleDeg > 0 ? (is1D ? `${optimalSlopeAngleDeg.toFixed(1)}°` : `${optimalSlopeAngleDeg.toFixed(1)}° @ ${optimalSlopeDirectionDeg}°`) : 'Flat (0°)'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
