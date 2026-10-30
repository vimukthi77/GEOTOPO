'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import BulkTrackerTerrainPage from '@/components/tracker-post-terrain/bulk/BulkTrackerTerrainPage';
import { useTheme } from '@/context/ThemeContext';

export default function BulkTrackerTerrainRoute() {
  const { theme } = useTheme();

  return (
    <div
      className={`min-h-screen flex flex-col font-sans selection:bg-[#36ADA3] selection:text-white transition-colors duration-300 ${
        theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      <Navbar />

      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1700px] w-full mx-auto">
        <BulkTrackerTerrainPage />
      </main>
    </div>
  );
}
