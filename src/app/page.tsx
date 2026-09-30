'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import {
  Calculator,
  Compass,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Ruler,
  Layers,
  FileSpreadsheet,
  ShieldCheck,
  Activity,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-[#36ADA3] selection:text-white">
      <Navbar />

      {/* Hero Section with Engineering Background */}
      <div className="relative flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 md:py-16 overflow-hidden">
        {/* Background Image Container */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-100 opacity-40"
          style={{
            backgroundImage: "url('/hero-bg.jpg')",
          }}
        />

        {/* Crisp Translucent Gradient Overlay for optimal image visibility and text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-900/60 to-slate-950/90 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/30 via-transparent to-black/50" />

        {/* Content Container */}
        <div className="relative z-10 max-w-6xl w-full mx-auto text-center space-y-10">
          {/* Welcome Pill */}
          <div className="inline-flex items-center gap-2 px-4.5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs md:text-sm font-semibold text-teal-300 shadow-xl">
            <Sparkles className="w-4 h-4 text-[#36ADA3]" />
            <span>Solar Civil &amp; Surveying Engineering Suite</span>
          </div>

          {/* Main Title */}
          <div className="space-y-4 max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight">
              GEOTOPO OPTIMA{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-300 via-sky-300 to-blue-400 block mt-1">
                Engineering Module Suite
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
              Select an independent engineering calculator below to compute post elevations, 3D terrain coordinates, inclination angles, and generate site-ready CAD reports.
            </p>
          </div>

          {/* TWO LARGE MODULE SELECTION CARDS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left max-w-5xl mx-auto pt-2">
            {/* MODULE CARD 1: Solar Pile Tracker Innovation Calculator */}
            <div className="bg-slate-900/85 hover:bg-slate-900/95 border border-slate-800 hover:border-teal-500/50 rounded-3xl p-6 sm:p-8 backdrop-blur-xl transition-all duration-300 shadow-2xl hover:shadow-teal-500/10 flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3.5 bg-[#112E81]/60 text-sky-300 rounded-2xl border border-sky-500/30 shadow-inner group-hover:scale-105 transition-transform">
                    <Calculator className="w-8 h-8 text-sky-300" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
                    Module 01 • Tracker Axis Calculator
                  </span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-teal-300 transition-colors">
                    Solar Pile Tracker Innovation Calculator
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Calculate intermediate pile-point elevations from endpoint elevations E1 and E2 across fixed engineering tracker matrices with slope gradient and Tan⁻¹ inclination angle calculations.
                  </p>
                </div>

                {/* Feature Highlights List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs text-slate-300 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>2, 3, 4 String Fixed Axes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>Tan slope &amp; Tan⁻¹ angle</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>UP / DOWN / LEVEL Direction</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span>1-Click CSV Engineering Export</span>
                  </div>
                </div>
              </div>

              {/* Card CTA Link */}
              <div className="pt-4 border-t border-slate-800/80">
                <Link
                  href="/tracker"
                  className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-gradient-to-r from-[#112E81] via-[#1d4ed8] to-[#36ADA3] hover:from-[#1d4ed8] hover:to-teal-500 text-white font-extrabold text-sm shadow-xl hover:shadow-teal-500/20 active:scale-[0.98] transition cursor-pointer"
                >
                  <span>Open Solar Pile Tracker Calculator</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* MODULE CARD 2: Tracker Post Terrain Coordinate Generator */}
            <div className="bg-slate-900/85 hover:bg-slate-900/95 border border-slate-800 hover:border-sky-500/50 rounded-3xl p-6 sm:p-8 backdrop-blur-xl transition-all duration-300 shadow-2xl hover:shadow-sky-500/10 flex flex-col justify-between space-y-6 group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3.5 bg-teal-950/60 text-teal-300 rounded-2xl border border-teal-500/30 shadow-inner group-hover:scale-105 transition-transform">
                    <Compass className="w-8 h-8 text-[#36ADA3]" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-300 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
                    Module 02 • Terrain 3D Coordinates
                  </span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-sky-300 transition-colors">
                    Tracker Post Terrain Coordinate Generator
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Generate deterministic 3D terrain coordinates (X, Y, Z) for inclined tracker beams using ASIN angle derivation, cumulative horizontal projections, interactive charts, and PDF/Excel reports.
                  </p>
                </div>

                {/* Feature Highlights List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs text-slate-300 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>6 Inclined Tracker Configurations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>θ = sin⁻¹(ΔE / L) Sloped Angle</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Sequential Y-Z Coordinate Array</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>3-Sheet Excel &amp; PDF Reports</span>
                  </div>
                </div>
              </div>

              {/* Card CTA Link */}
              <div className="pt-4 border-t border-slate-800/80">
                <Link
                  href="/tracker-post-terrain"
                  className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-gradient-to-r from-teal-600 via-sky-600 to-[#112E81] hover:from-teal-500 hover:to-blue-600 text-white font-extrabold text-sm shadow-xl hover:shadow-sky-500/20 active:scale-[0.98] transition cursor-pointer"
                >
                  <span>Open Terrain Coordinate Generator</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

          {/* Value Propositions Strip */}
          <div className="pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center max-w-4xl mx-auto">
            <div className="p-3.5 bg-white/5 rounded-2xl border border-white/5">
              <div className="text-teal-400 font-extrabold text-sm sm:text-base">64-Bit Precision</div>
              <div className="text-[11px] text-slate-400 mt-0.5">IEEE 754 Floating Accuracy</div>
            </div>
            <div className="p-3.5 bg-white/5 rounded-2xl border border-white/5">
              <div className="text-sky-400 font-extrabold text-sm sm:text-base">Dual Engine Suite</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Tan⁻¹ &amp; Sin⁻¹ Geometry</div>
            </div>
            <div className="p-3.5 bg-white/5 rounded-2xl border border-white/5">
              <div className="text-teal-400 font-extrabold text-sm sm:text-base">Instant Reports</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Excel .xlsx &amp; PDF Export</div>
            </div>
            <div className="p-3.5 bg-white/5 rounded-2xl border border-white/5">
              <div className="text-sky-400 font-extrabold text-sm sm:text-base">Zero Data Loss</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Fully Isolated Modules</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
