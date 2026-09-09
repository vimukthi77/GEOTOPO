'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import TrackerCalculator from '@/components/TrackerCalculator';

export default function TrackerPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-6">
        <TrackerCalculator />
      </main>
    </div>
  );
}
