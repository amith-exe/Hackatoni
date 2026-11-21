// frontend/src/components/Navbar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, AlertTriangle, CheckCircle2, User, PhoneCall, ShieldCheck } from 'lucide-react';
import { useDemoUser } from '@/lib/demo-user';

export function Navbar() {
  const pathname = usePathname();
  const { currentUser, setCurrentUser, availableUsers, isOfficer } = useDemoUser();

  const navLinks = [
    { href: '/', label: 'Live Map', labelMl: 'മാപ്പ്', icon: Map },
    { href: '/report', label: 'Report Incident', labelMl: 'അറിയിക്കുക', icon: AlertTriangle },
    { href: '/verify', label: 'Verify Queue', labelMl: 'സ്ഥിരീകരണം', icon: CheckCircle2 },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-emerald-100 shadow-sm">
      {/* Top emergency & user bar */}
      <div className="bg-emerald-800 text-white text-xs px-3 py-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>കുട്ടനാട് നെല്ല് - താറാവ് മുൻകരുതൽ നെറ്റ്‌വർക്ക്</span>
          <span className="hidden sm:inline text-emerald-200">| Kuttanad Polder Early Warning</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Demo Role Picker */}
          <div className="flex items-center gap-1 bg-emerald-900/80 px-2 py-0.5 rounded border border-emerald-700/60">
            <User className="w-3 h-3 text-emerald-300" />
            <span className="text-[11px] text-emerald-200">User:</span>
            <select
              value={currentUser.id}
              onChange={(e) => {
                const found = availableUsers.find((u) => u.id === e.target.value);
                if (found) setCurrentUser(found);
              }}
              className="bg-transparent text-white text-[11px] font-semibold focus:outline-none cursor-pointer"
            >
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id} className="text-gray-900 bg-white">
                  {u.role === 'officer' ? '🏛️ ' : '🌾 '}
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          <a
            href="tel:18001801551"
            className="hidden md:flex items-center gap-1 text-[11px] bg-emerald-700 hover:bg-emerald-600 px-2 py-0.5 rounded transition"
          >
            <PhoneCall className="w-3 h-3" />
            <span>Kisan: 1800-180-1551</span>
          </a>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-700 to-green-500 flex items-center justify-center text-white shadow-md">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-gray-900 text-base leading-tight tracking-tight flex items-center gap-1.5">
              <span>Karshakan Lens</span>
              <span className="text-xs font-semibold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">PWA</span>
            </h1>
            <p className="text-[11px] text-emerald-700 font-medium">കർഷകൻ ലെൻസ് • കുട്ടനാട്</p>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-gray-600 hover:text-emerald-800 hover:bg-emerald-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
                <span className="hidden sm:inline font-normal opacity-80 text-[10px]">({link.labelMl})</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
