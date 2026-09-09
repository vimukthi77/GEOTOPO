'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import {
  Calculator,
  Compass,
  ArrowRight,
  TrendingUp,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-[#36ADA3] selection:text-white">
      <Navbar />

      {/* Hero Section with High-Resolution Engineering Background */}
      <div className="relative flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 md:py-20 overflow-hidden">
        {/* Background Image Container */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
          style={{
            backgroundImage: "url('/hero-bg.jpg')",
          }}
        />

        {/* Multi-layered Gradient & Glassmorphism Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/70 to-slate-950/95 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#112E81]/30 via-transparent to-transparent" />

        {/* Content Container */}
        <div className="relative z-10 max-w-6xl w-full mx-auto text-center space-y-8">
          {/* Welcome Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs md:text-sm font-semibold text-teal-300 shadow-lg animate-fade-in">
            <Sparkles className="w-4 h-4 text-[#36ADA3]" />
            <span>Welcome to GEOTOPO OPTIMA Civil Suite</span>
          </div>

          {/* Main Title */}
          <div className="space-y-4 max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Precision Civil Surveying &amp;{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-300 via-sky-300 to-blue-400">
                Solar Earthwork Intelligence
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
              Unified engineering platform for terrain cut &amp; fill bisection optimization and automated solar tracker pile elevation computations.
            </p>
          </div>

          {/* Navigation Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 pt-6 text-left">
            {/* Card 1: Earthwork Cut & Fill Optimization */}
            <div className="group relative bg-slate-900/80 hover:bg-slate-900/95 border border-slate-800 hover:border-teal-500/50 rounded-3xl p-6 sm:p-8 backdrop-blur-xl transition-all duration-300 shadow-2xl hover:shadow-teal-500/10 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-[#36ADA3]/20 text-teal-300 rounded-2xl border border-teal-500/30">
                    <Compass className="w-7 h-7" />
                  </div>
                  <span className="px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider bg-teal-500/10 text-teal-300 rounded-full border border-teal-500/20">
                    Site Grading
                  </span>
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-teal-300 transition-colors">
                    Earthwork Cut &amp; Fill Optimization
                  </h2>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    Compute balanced cut &amp; fill levels using iterative bisection. Features 0–5° sloped plane grading, 1D bar/beam leveling, and interactive 3D topography meshes.
                  </p>
                </div>

                <div className="pt-2 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Sloped Plane (0–5°) &amp; Flat Grading Modes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>1D Bar/Beam &amp; 2D Terrain Topography Models</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Interactive 3D Mesh &amp; Elevation Profile Charts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Multi-Page PDF Reports &amp; Cloud History Storage</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <Link
                  href="/dashboard"
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#36ADA3] to-teal-600 hover:from-teal-400 hover:to-[#36ADA3] text-white font-bold text-sm shadow-lg hover:shadow-teal-500/20 active:scale-[0.98] transition cursor-pointer"
                >
                  <span>Launch Earthwork Optimizer</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Card 2: Solar Tracker Pile Calculator */}
            <div className="group relative bg-slate-900/80 hover:bg-slate-900/95 border border-slate-800 hover:border-blue-500/50 rounded-3xl p-6 sm:p-8 backdrop-blur-xl transition-all duration-300 shadow-2xl hover:shadow-blue-500/10 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-[#112E81]/40 text-blue-300 rounded-2xl border border-blue-500/30">
                    <Calculator className="w-7 h-7" />
                  </div>
                  <span className="px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider bg-blue-500/10 text-blue-300 rounded-full border border-blue-500/20">
                    Pile Elevations
                  </span>
                </div>

                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-blue-300 transition-colors">
                    Solar Tracker Pile Calculator
                  </h2>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    Calculate intermediate pile-point elevations from E1 &amp; E2 endpoints across 6 fixed engineering tracker types with zero manual distance input.
                  </p>
                </div>

                <div className="pt-2 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>2 STRING (8 &amp; 9 Piles, Axis X: 61.25m / 61.20m)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>3 STRING (11 &amp; 12 Piles, Axis Z: 91.30m / 93.20m)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>4 STRING (15 &amp; 16 Piles, Axis Y: 123.50m / 125.30m)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Tan Slope Gradient, Longitudinal Diagram &amp; CSV Export</span>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <Link
                  href="/tracker"
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#112E81] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#2563eb] text-white font-bold text-sm shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition cursor-pointer"
                >
                  <span>Launch Tracker Calculator</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

          {/* Value Propositions Strip */}
          <div className="pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
              <div className="text-teal-400 font-extrabold text-sm sm:text-base">64-Bit Precision</div>
              <div className="text-[11px] text-slate-400 mt-0.5">IEEE 754 Floating Accuracy</div>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
              <div className="text-teal-400 font-extrabold text-sm sm:text-base">6 Fixed Configs</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Pre-locked Engineering Axes</div>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
              <div className="text-teal-400 font-extrabold text-sm sm:text-base">Instant CSV Export</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Ready for CAD &amp; Site Teams</div>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
              <div className="text-teal-400 font-extrabold text-sm sm:text-base">Zero Manual Distances</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Locked to Eliminate Input Typos</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
