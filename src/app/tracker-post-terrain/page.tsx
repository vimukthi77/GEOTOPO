'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import TrackerPostTerrainPage from '@/components/tracker-post-terrain/TrackerPostTerrainPage';

export default function TrackerPostTerrainRoute() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-[#36ADA3] selection:text-white">
      <Navbar />

      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
        <TrackerPostTerrainPage />
      </main>
    </div>
  );
}
