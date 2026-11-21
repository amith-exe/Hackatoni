
// frontend/src/components/Map/LocalTrendCard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  LocateFixed,
  TrendingUp,
  Waves,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Loader2,
  Shield,
  Info,
  ChevronRight,
} from 'lucide-react';
import { fetchLocalTrend } from '@/lib/api';
import { LocalTrendData } from '@/types';
import { useDemoUser } from '@/lib/demo-user';

interface LocalTrendCardProps {
  onLocationChange?: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number } | null;
}

export default function LocalTrendCard({
  onLocationChange,
  selectedLocation,
}: LocalTrendCardProps) {
  const { t, language } = useDemoUser();

  const [lat, setLat] = useState<number>(selectedLocation?.lat || 9.446);
  const [lng, setLng] = useState<number>(selectedLocation?.lng || 76.458);
  const [trendData, setTrendData] = useState<LocalTrendData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const presets = [
    { name: language === 'ml' ? 'പുളിങ്കുന്ന്' : 'Pulincunnoo', lat: 9.446, lng: 76.458 },
    { name: language === 'ml' ? 'മങ്കൊമ്പ്' : 'Moncompu', lat: 9.429, lng: 76.439 },
    { name: language === 'ml' ? 'നെടുമുടി' : 'Nedumudy', lat: 9.436, lng: 76.404 },
    { name: language === 'ml' ? 'കൈനകരി' : 'Kainakary', lat: 9.476, lng: 76.392 },
    { name: language === 'ml' ? 'ചമ്പക്കുളം' : 'Champakulam', lat: 9.42, lng: 76.423 },
    { name: language === 'ml' ? 'രാമങ്കരി' : 'Ramankary', lat: 9.412, lng: 76.482 },
    { name: language === 'ml' ? 'കാവാലം' : 'Kavalam', lat: 9.498, lng: 76.442 },
  ];

  // Update when parent sends selectedLocation
  useEffect(() => {
    if (selectedLocation) {
      setLat(selectedLocation.lat);
      setLng(selectedLocation.lng);
    }
  }, [selectedLocation]);

  // Load trend data
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    fetchLocalTrend(lat, lng)
      .then((data) => {
        if (!isCancelled) {
          setTrendData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Error fetching local trend:', err);
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [lat, lng]);

  const handleSelectPreset = (pLat: number, pLng: number) => {
    setGpsError(null);
    setLat(pLat);
    setLng(pLng);
    if (onLocationChange) {
      onLocationChange(pLat, pLng);
    }
  };

  const handleUseGps = () => {
    setGpsError(null);
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = parseFloat(position.coords.latitude.toFixed(4));
          const userLng = parseFloat(position.coords.longitude.toFixed(4));

          // Check if coordinates fall within roughly Kerala / Kuttanad region
          if (userLat >= 9.0 && userLat <= 10.2 && userLng >= 76.0 && userLng <= 77.0) {
            setLat(userLat);
            setLng(userLng);
            if (onLocationChange) onLocationChange(userLat, userLng);
          } else {
            // Default to demo Pulincunnoo with a gentle note
            setLat(9.446);
            setLng(76.458);
            if (onLocationChange) onLocationChange(9.446, 76.458);
            setGpsError(
              language === 'ml'
                ? 'നിങ്ങളുടെ ലൊക്കേഷൻ കുട്ടനാടിന് പുറത്താണ്. പുളിങ്കുന്ന് ഡെമോ സ്ഥാനം തിരഞ്ഞെടുത്തു.'
                : 'GPS position outside Kuttanad delta. Centered on Pulincunnoo demo polder.'
            );
          }
        },
        (error) => {
          setLat(9.446);
          setLng(76.458);
          if (onLocationChange) onLocationChange(9.446, 76.458);
          setGpsError(
            language === 'ml'
              ? 'ലൊക്കേഷൻ അനുമതി ലഭ്യമായില്ല. പുളിങ്കുന്ന് ഡെമോ സ്ഥാനം തിരഞ്ഞെടുത്തു.'
              : 'GPS unavailable. Showing Pulincunnoo demo polder telemetry.'
          );
        },
        { timeout: 8000 }
      );
    } else {
      setGpsError(
        language === 'ml'
          ? 'ബ്രൗസർ ലൊക്കേഷൻ ലഭ്യമല്ല.'
          : 'Geolocation not supported by browser.'
      );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden text-xs">
      {/* Top Header */}
      <div className="bg-emerald-800 text-white p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-300 shrink-0" />
          <div>
            <h3 className="font-extrabold text-sm leading-tight">{t('localTrendTitle')}</h3>
            <p className="text-[11px] text-emerald-200">
              {trendData?.nearest_landmark || `${lat.toFixed(3)}, ${lng.toFixed(3)}`}
            </p>
          </div>
        </div>
        <button
          onClick={handleUseGps}
          className="flex items-center gap-1 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white font-bold px-2.5 py-1.5 rounded-xl transition text-[11px] border border-white/20"
        >
          <LocateFixed className="w-3.5 h-3.5 text-emerald-200" />
          <span>{t('useMyGps')}</span>
        </button>
      </div>

      {/* Preset Pills */}
      <div className="p-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider shrink-0 mr-1 flex items-center gap-0.5">
          <MapPin className="w-3 h-3 text-emerald-700" />
        </span>
        {presets.map((preset) => {
          const isSelected =
            Math.abs(lat - preset.lat) < 0.005 && Math.abs(lng - preset.lng) < 0.005;
          return (
            <button
              key={preset.name}
              onClick={() => handleSelectPreset(preset.lat, preset.lng)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition shrink-0 border ${
                isSelected
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {preset.name}
            </button>
          );
        })}
      </div>

      {gpsError && (
        <div className="mx-3 mt-2.5 p-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-[11px] flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Content Area */}
      <div className="p-3.5 space-y-3">
        {loading ? (
          <div className="py-6 flex flex-col items-center justify-center text-gray-500 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-700" />
            <span className="text-xs font-semibold">
              {language === 'ml' ? 'വിവരങ്ങൾ ശേഖരിക്കുന്നു...' : 'Evaluating localized polder trends...'}
            </span>
          </div>
        ) : trendData ? (
          <>
            {/* Metric Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Reports in 7 Days */}
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">
                  {t('nearbyReports7d')}
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-lg font-black text-gray-900">
                    {trendData.nearby_reports_count_7d}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    (prev: {trendData.prior_7d_reports_count})
                  </span>
                </div>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      trendData.trend_direction === 'Growing'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : trendData.trend_direction === 'Stable'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    <TrendingUp className="w-3 h-3" />
                    <span>
                      {trendData.trend_direction === 'Growing'
                        ? t('trendGrowing')
                        : trendData.trend_direction === 'Stable'
                        ? t('trendStable')
                        : t('trendWatch')}
                    </span>
                  </span>
                </div>
              </div>

              {/* Nearest Canal Salinity */}
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">
                  {t('nearestCanal')}
                </span>
                <div className="font-extrabold text-gray-900 text-xs truncate mt-0.5">
                  {trendData.nearest_canal_name || 'Kuttanad Canal'}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                  <Waves className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="font-bold text-gray-800">
                    {trendData.nearest_canal_salinity_ppt !== undefined
                      ? `${trendData.nearest_canal_salinity_ppt} ppt`
                      : 'Fresh'}
                  </span>
                  {trendData.nearest_canal_alert_level && (
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase ${
                        trendData.nearest_canal_alert_level === 'Danger'
                          ? 'bg-red-100 text-red-800'
                          : trendData.nearest_canal_alert_level === 'Warning'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {trendData.nearest_canal_alert_level}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Outbreak Cluster Status */}
            <div
              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                trendData.active_outbreak_nearby
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="flex items-center gap-2">
                {trendData.active_outbreak_nearby ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <div>
                  <span className="font-bold text-xs block">
                    {trendData.active_outbreak_nearby
                      ? language === 'ml'
                        ? 'സമീപത്ത് രോഗബാധ ക്ലസ്റ്റർ സജീവം'
                        : 'Active Pest/Mortality Cluster Nearby'
                      : language === 'ml'
                      ? 'സമീപത്ത് സജീവ ക്ലസ്റ്ററുകളില്ല'
                      : 'No Outbreak Clusters Within 2.0 km'}
                  </span>
                  {trendData.nearest_cluster_name && (
                    <span className="text-[10px] opacity-85 block">
                      {trendData.nearest_cluster_name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Guidance */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-emerald-900 font-extrabold text-[11px] mb-1 uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5 text-emerald-700" />
                <span>{t('recommendedAction')}</span>
              </div>
              <p className="text-gray-800 text-xs font-medium leading-relaxed">
                {trendData.recommended_action}
              </p>
            </div>
          </>
        ) : (
          <div className="text-gray-500 text-center py-4">{t('noNearbyIncidents')}</div>
        )}
      </div>
    </div>
  );
}
