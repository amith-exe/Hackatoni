// frontend/src/components/Modals/DemoLoginModal.tsx
'use client';

import React, { useState } from 'react';
import { X, LogIn, User, Phone, MapPin, CheckCircle2 } from 'lucide-react';
import { useDemoUser } from '@/lib/demo-user';
import { demoLogin } from '@/lib/api';

interface DemoLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DemoLoginModal({ isOpen, onClose }: DemoLoginModalProps) {
  const { availableUsers, currentUser, setCurrentUser } = useDemoUser();

  const [customName, setCustomName] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [customPadasekharam, setCustomPadasekharam] = useState('Pulincunnoo Padasekharam');
  const [role, setRole] = useState<'farmer' | 'officer'>('farmer');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customPhone) return;

    setLoading(true);
    try {
      const res = await demoLogin(customName, customPhone, customPadasekharam, role);
      setCurrentUser(res.profile);
      setSuccessMsg(`Logged in as ${res.profile.name} (${res.profile.village_or_padasekharam})`);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Sign In / Switch Persona</h2>
              <p className="text-xs text-slate-500">Select a verified test profile or enter demo farmer details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {successMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Preset Test Profiles */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Preset Test Profile
            </label>
            <div className="space-y-2">
              {availableUsers.map((u) => {
                const isSelected = currentUser.id === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setCurrentUser(u);
                      onClose();
                    }}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition text-xs ${
                      isSelected
                        ? 'border-emerald-700 bg-emerald-50/70 text-emerald-950 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{u.name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-100 text-slate-600">
                          {u.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {u.village_or_padasekharam} • {u.phone}
                      </div>
                    </div>
                    {isSelected && <span className="text-emerald-700 text-xs font-bold">Active</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider absolute">
              Or Sign In with Demo Farmer Phone
            </span>
          </div>

          {/* Custom Demo Form */}
          <form onSubmit={handleCustomSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Varghese K."
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 94470 00000"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-emerald-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Padasekharam / Sector</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={customPadasekharam}
                    onChange={(e) => setCustomPadasekharam(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-emerald-600"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('farmer')}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${
                    role === 'farmer'
                      ? 'border-emerald-700 bg-emerald-700 text-white shadow-sm'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Farmer
                </button>
                <button
                  type="button"
                  onClick={() => setRole('officer')}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${
                    role === 'officer'
                      ? 'border-emerald-700 bg-emerald-700 text-white shadow-sm'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Krishi Officer
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow transition flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Initializing Session...' : 'Instant Demo Sign In (Bypass OTP)'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
