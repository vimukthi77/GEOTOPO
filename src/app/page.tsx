'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import {
  Calculator,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Ruler,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-[#36ADA3] selection:text-white">
      <Navbar />

      {/* Hero Section with Engineering Background */}
      <div className="relative flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 md:py-20 overflow-hidden">
        {/* Background Image Container */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-100"
          style={{
            backgroundImage: "url('/hero-bg.jpg')",
          }}
        />

        {/* Crisp Translucent Gradient Overlay for optimal image visibility and text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-900/40 to-slate-950/85 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-black/40" />

        {/* Content Container */}
        <div className="relative z-10 max-w-4xl w-full mx-auto text-center space-y-8">
          {/* Welcome Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs md:text-sm font-semibold text-teal-300 shadow-lg">
            <Sparkles className="w-4 h-4 text-[#36ADA3]" />
            <span>Welcome to Solar Engineering Suite</span>
          </div>

          {/* Main Title */}
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Solar Pile Tracker{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-300 via-sky-300 to-blue-400">
                Innovation Calculator
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
              Calculate intermediate pile-point elevations from endpoint elevations E1 and E2 across fixed engineering tracker matrices with slope and Tan⁻¹ physical inclination angle calculations.
            </p>
          </div>

          {/* Featured Calculator Card */}
          <div className="max-w-2xl mx-auto bg-slate-900/85 hover:bg-slate-900/95 border border-slate-800 hover:border-teal-500/50 rounded-3xl p-6 sm:p-10 backdrop-blur-xl transition-all duration-300 shadow-2xl hover:shadow-teal-500/10 text-left space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3.5 bg-[#112E81]/50 text-sky-300 rounded-2xl border border-sky-500/30 shadow-inner">
                  <Calculator className="w-8 h-8 text-sky-300" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    Solar Pile Tracker Innovation Calculator
                  </h2>
                  <span className="text-xs font-semibold text-teal-300">
                    6 Fixed Configurations • Zero Distance Input Errors
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Built exclusively for civil solar surveying. Simply input endpoint elevations E1 and E2. The calculator automatically selects fixed X, Y, or Z pile coordinates, computes numerical Tan slope gradient and Tan⁻¹ inclination angle in degrees, and outputs formatted engineering tables.
            </p>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>2 STRING: 8 &amp; 9 Piles (Axis X)</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>3 STRING: 11 &amp; 12 Piles (Axis Z)</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>4 STRING: 15 &amp; 16 Piles (Axis Y)</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Tan⁻¹ Inclination Angle (atan)</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Direction: UP (+), DOWN (-), LEVEL</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-white/5">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Instant 1-Click CSV Engineering Export</span>
              </div>
            </div>

            {/* Main Launch CTA Button */}
            <div className="pt-4">
              <Link
                href="/tracker"
                className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-gradient-to-r from-[#112E81] via-[#1d4ed8] to-[#36ADA3] hover:from-[#1d4ed8] hover:to-teal-500 text-white font-black text-base shadow-xl hover:shadow-teal-500/20 active:scale-[0.98] transition cursor-pointer group"
              >
                <span>Launch Solar Pile Tracker Innovation Calculator</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Value Propositions Strip */}
          <div className="pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
              <div className="text-teal-400 font-extrabold text-sm sm:text-base">64-Bit Precision</div>
              <div className="text-[11px] text-slate-400 mt-0.5">IEEE 754 Floating Accuracy</div>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
              <div className="text-teal-400 font-extrabold text-sm sm:text-base">Tan &amp; Tan⁻¹ Angle</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Gradient &amp; Degrees (atan)</div>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
              <div className="text-teal-400 font-extrabold text-sm sm:text-base">Instant CSV Export</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Ready for CAD &amp; Site Teams</div>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
              <div className="text-teal-400 font-extrabold text-sm sm:text-base">Zero Manual Distances</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Locked Engineering Axes</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
