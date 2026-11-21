// frontend/src/components/Modals/HowItWorksModal.tsx
'use client';

import React from 'react';
import { X, Waves, Layers, ShieldCheck, Sprout, Info, Check } from 'lucide-react';
import { useDemoUser } from '@/lib/demo-user';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
  const { t } = useDemoUser();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{t('howItWorksModalTitle')}</h2>
              <p className="text-xs text-slate-500">Kuttanad agro-hydrology, DBSCAN clustering & community verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs sm:text-sm text-slate-700">
          {/* Card 1: Hydrology */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Waves className="w-4 h-4 text-sky-600" />
              <span>{t('howItWorksPolderTitle')}</span>
            </div>
            <p className="text-slate-600 leading-relaxed">{t('howItWorksPolderDesc')}</p>
          </div>

          {/* Card 2: DBSCAN */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Layers className="w-4 h-4 text-amber-600" />
              <span>{t('howItWorksDbscanTitle')}</span>
            </div>
            <p className="text-slate-600 leading-relaxed">{t('howItWorksDbscanDesc')}</p>
            <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500">
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Metric: Haversine</span>
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Epsilon: 2.0 km</span>
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Window: 7 Days</span>
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200">Min Samples: 2</span>
            </div>
          </div>

          {/* Card 3: Trust */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{t('howItWorksTrustTitle')}</span>
            </div>
            <p className="text-slate-600 leading-relaxed">{t('howItWorksTrustDesc')}</p>
            <ul className="space-y-1 text-slate-600 pt-1 text-xs">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Reporters are strictly blocked from self-confirming their own submissions.</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Names and phone numbers are stripped from all public map feeds to protect privacy.</span>
              </li>
            </ul>
          </div>

          {/* Card 4: KAU Grounded */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Sprout className="w-4 h-4 text-green-700" />
              <span>{t('howItWorksKauTitle')}</span>
            </div>
            <p className="text-slate-600 leading-relaxed">{t('howItWorksKauDesc')}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
          >
            {t('closeBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}
