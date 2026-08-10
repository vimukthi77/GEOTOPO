'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Settings, LogOut, User, Loader2 } from 'lucide-react';

interface UserSession {
  email: string;
  role: 'admin' | 'user';
}

export default function Navbar() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setSession({ email: 'admin@earthwork.com', role: 'admin' });
    setLoading(false);
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (loading) {
    return (
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-6 text-slate-500">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#112E81]" />
          <span>Synchronizing Session...</span>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 px-6 h-16 flex items-center justify-between shadow-sm text-slate-800">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#112E81]/10 rounded-xl border border-[#112E81]/20">
          <svg
            className="w-5 h-5 text-[#112E81]"
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
        <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#112E81] to-[#36ADA3]">
          GEOTOPO OPTIMA
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex items-center gap-1 md:gap-4">
        <Link
          href="/dashboard"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
            pathname.startsWith('/dashboard')
              ? 'bg-[#112E81]/10 border border-[#112E81]/20 text-[#112E81]'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="hidden md:inline">Dashboard</span>
        </Link>

        {session?.role === 'admin' && (
          <Link
            href="/settings"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              pathname.startsWith('/settings')
                ? 'bg-[#112E81]/10 border border-[#112E81]/20 text-[#112E81]'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden md:inline">User Settings</span>
          </Link>
        )}
      </nav>

      {/* Auth removed */}
    </header>
  );
}
