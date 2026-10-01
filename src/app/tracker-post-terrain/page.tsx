'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import TrackerPostTerrainPage from '@/components/tracker-post-terrain/TrackerPostTerrainPage';

import { useTheme } from '@/context/ThemeContext';

export default function TrackerPostTerrainRoute() {
  const { theme } = useTheme();

  return (
    <div
      className={`min-h-screen flex flex-col font-sans selection:bg-[#36ADA3] selection:text-white transition-colors duration-300 ${
        theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      <Navbar />

      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
        <TrackerPostTerrainPage />
      </main>
    </div>
  );
}
