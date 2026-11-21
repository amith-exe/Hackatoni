// frontend/src/components/Navbar.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Shield,
  Map,
  FilePlus2,
  CheckCircle2,
  Bell,
  Languages,
  LogIn,
  HelpCircle,
  Phone,
  ScanLine,
} from 'lucide-react';
import { useDemoUser } from '@/lib/demo-user';
import HowItWorksModal from '@/components/Modals/HowItWorksModal';
import DemoLoginModal from '@/components/Modals/DemoLoginModal';

export function Navbar() {
  const pathname = usePathname();
  const { currentUser, language, toggleLanguage, t, unreadCount } = useDemoUser();

  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showDemoLogin, setShowDemoLogin] = useState(false);

  const navLinks = [
    { href: '/', labelKey: 'liveMap' as const, icon: Map },
    { href: '/scan', labelKey: 'leafScan' as const, icon: ScanLine },
    { href: '/report', labelKey: 'reportIssue' as const, icon: FilePlus2 },
    { href: '/verify', labelKey: 'verifyQueue' as const, icon: CheckCircle2 },
    { href: '/alerts', labelKey: 'alertsInbox' as const, icon: Bell, hasBadge: true },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        {/* Top telemetry & helpline bar */}
        <div className="bg-slate-900 text-white text-xs px-3.5 py-1.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold tracking-wide">{t('networkName')}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href="tel:18001801551"
              className="flex items-center gap-1.5 text-[11px] text-slate-300 hover:text-white transition"
            >
              <Phone className="w-3 h-3 text-emerald-400" />
              <span>1800-180-1551</span>
            </a>

            {/* Language Toggle Button */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition"
              title="Toggle English / Malayalam"
            >
              <Languages className="w-3 h-3" />
              <span>{language === 'en' ? 'മലയാളം' : 'English'}</span>
            </button>
          </div>
        </div>

        {/* Main navigation */}
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Logo & Platform Name */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 group-hover:bg-emerald-800 transition">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-slate-900 text-base leading-tight tracking-tight flex items-center gap-1.5">
                <span>Karshakan Lens</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">{t('tagline')}</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{t(link.labelKey)}</span>
                  {link.hasBadge && unreadCount > 0 && (
                    <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-extrabold bg-rose-600 text-white">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Utility Controls: How It Works & Persona Switcher */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHowItWorks(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
            >
              <HelpCircle className="w-4 h-4 text-slate-500" />
              <span>{t('howItWorks')}</span>
            </button>

            {/* Persona Indicator & Modal Trigger */}
            <button
              type="button"
              onClick={() => setShowDemoLogin(true)}
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800 transition shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-700" />
              <div className="text-left">
                <span className="block leading-tight text-[11px] text-slate-900">{currentUser.name}</span>
                <span className="block text-[10px] font-semibold text-slate-500 capitalize">
                  {currentUser.role} • Switch
                </span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Modals */}
      <HowItWorksModal isOpen={showHowItWorks} onClose={() => setShowHowItWorks(false)} />
      <DemoLoginModal isOpen={showDemoLogin} onClose={() => setShowDemoLogin(false)} />
    </>
  );
}
