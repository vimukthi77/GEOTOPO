'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Calculator, Compass, Home, Loader2, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface UserSession {
  email: string;
  role: 'admin' | 'user';
}

export default function Navbar() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setSession({ email: 'admin@earthwork.com', role: 'admin' });
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <header className={`backdrop-blur-md border-b h-16 flex items-center justify-between px-6 transition-colors duration-200 ${
        theme === 'dark' ? 'bg-slate-900/90 border-slate-800 text-slate-400' : 'bg-white/90 border-slate-200 text-slate-500'
      }`}>
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#36ADA3]" />
          <span>Synchronizing Session...</span>
        </div>
      </header>
    );
  }

  const isDark = theme === 'dark';

  return (
    <header className={`backdrop-blur-md border-b sticky top-0 z-50 px-4 md:px-6 h-16 flex items-center justify-between shadow-sm transition-colors duration-200 ${
      isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white/90 border-slate-200 text-slate-800'
    }`}>
      {/* Brand Logo */}
      <Link href="/" className="flex items-center gap-2.5 group transition shrink-0">
        <div className={`p-2 rounded-xl border transition ${
          isDark ? 'bg-teal-500/10 group-hover:bg-teal-500/20 border-teal-500/30' : 'bg-[#112E81]/10 group-hover:bg-[#112E81]/20 border-[#112E81]/20'
        }`}>
          <svg
            className={`w-5 h-5 ${isDark ? 'text-teal-400' : 'text-[#112E81]'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <span className={`font-extrabold text-base md:text-lg tracking-tight bg-clip-text text-transparent ${
          isDark ? 'bg-gradient-to-r from-teal-400 via-sky-300 to-emerald-400' : 'bg-gradient-to-r from-[#112E81] to-[#36ADA3]'
        }`}>
          GEOTOPO OPTIMA
        </span>
      </Link>

      {/* Navigation & Controls */}
      <nav className="flex items-center gap-1.5 md:gap-3">
        <Link
          href="/"
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs md:text-sm font-semibold transition ${
            pathname === '/'
              ? isDark
                ? 'bg-teal-500/15 border border-teal-500/30 text-teal-300'
                : 'bg-[#112E81]/10 border border-[#112E81]/20 text-[#112E81]'
              : isDark
              ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-transparent'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </Link>

        <Link
          href="/tracker"
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs md:text-sm font-semibold transition ${
            pathname === '/tracker'
              ? isDark
                ? 'bg-sky-500/15 border border-sky-500/30 text-sky-300'
                : 'bg-[#112E81]/10 border border-[#112E81]/20 text-[#112E81]'
              : isDark
              ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-transparent'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
          }`}
        >
          <Calculator className="w-4 h-4 text-sky-500" />
          <span className="hidden lg:inline">Solar Pile Tracker Innovation Calculator</span>
          <span className="lg:hidden">Pile Tracker</span>
        </Link>

        <Link
          href="/tracker-post-terrain"
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs md:text-sm font-semibold transition ${
            pathname.startsWith('/tracker-post-terrain')
              ? isDark
                ? 'bg-teal-500/15 border border-teal-500/30 text-teal-300'
                : 'bg-[#112E81]/10 border border-[#112E81]/20 text-[#112E81]'
              : isDark
              ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-transparent'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
          }`}
        >
          <Compass className="w-4 h-4 text-[#36ADA3]" />
          <span className="hidden lg:inline">Tracker Post Terrain Coordinate Generator</span>
          <span className="lg:hidden">Terrain Generator</span>
        </Link>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          type="button"
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs md:text-sm font-bold border transition-all duration-200 cursor-pointer shadow-sm ${
            isDark
              ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-750 hover:border-amber-400/50'
              : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 hover:border-amber-400'
          }`}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-700" />
              <span className="hidden sm:inline">Dark Mode</span>
            </>
          )}
        </button>
      </nav>
    </header>
  );
}
