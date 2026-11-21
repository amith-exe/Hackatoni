// frontend/src/app/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  Waves,
  Sprout,
  Shield,
  TrendingUp,
  Layers,
  CloudRain,
  PlusCircle,
  Loader2,
  X,
  CheckCircle2,
  ChevronRight,
  SlidersHorizontal,
  MapPin,
  FilePlus2,
} from 'lucide-react';
import { fetchMapFeed } from '@/lib/api';
import { MapFeedData, ReportItem, TrendAnalysis } from '@/types';
import { useDemoUser } from '@/lib/demo-user';
import LocalTrendCard from '@/components/Map/LocalTrendCard';
import ThreatTracker from '@/components/Map/ThreatTracker';

// Dynamic import with SSR disabled for Leaflet Map
const KuttanadMap = dynamic(() => import('@/components/Map/KuttanadMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-500 gap-2 min-h-[550px]">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
      <span className="text-xs font-semibold">Loading Kuttanad Hydro-Topography & Satellite Map...</span>
    </div>
  ),
});

function HomeContent() {
  const searchParams = useSearchParams();
  const { t, language } = useDemoUser();

  const [data, setData] = useState<MapFeedData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTrendPanel, setShowTrendPanel] = useState<boolean>(true);
  const [selectedPinLocation, setSelectedPinLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [filters, setFilters] = useState<Record<string, string | number>>({ verification_status: 'all', days: 14 });
  const [visibleLayers, setVisibleLayers] = useState({ reports: true, clusters: true, canals: true });
  const [analysis, setAnalysis] = useState<TrendAnalysis | null>(null);

  useEffect(() => {
    fetchMapFeed(filters)
      .then((feed) => {
        setData(feed);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [filters]);

  // Pre-select location if url has lat/lng
  useEffect(() => {
    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');
    if (latParam && lngParam) {
      setSelectedPinLocation({
        lat: parseFloat(latParam),
        lng: parseFloat(lngParam),
      });
    }
  }, [searchParams]);

  const dangerCanalsCount =
    data?.affected_canals.filter((c) => c.current_alert_level === 'Danger').length || 0;
  const warningCanalsCount =
    data?.affected_canals.filter((c) => c.current_alert_level === 'Warning').length || 0;

  const cutoff = Date.now() - Number(filters.days || 14) * 86400000;
  const mapReports = (data?.reports || []).filter((r) => {
    if (new Date(r.created_at).getTime() < cutoff) return false;
    if (filters.report_type && r.report_type !== filters.report_type) return false;
    if (filters.disease_code && r.details?.disease_code !== filters.disease_code) return false;
    if (filters.verification_status === 'unconfirmed' && r.verification_status !== 'unconfirmed') return false;
    if (filters.verification_status === 'verified_only' && !['community_confirmed','officially_verified'].includes(r.verification_status)) return false;
    return true;
  });
  const mapClusters = filters.report_type && filters.report_type !== 'crop_disease' ? [] : (data?.active_clusters || []).filter((c) => !filters.disease_code || c.sub_category === filters.disease_code);
  const mapCanals = filters.report_type && filters.report_type !== 'salinity' ? [] : (data?.affected_canals || []);

  const getReportTypeIcon = (type: string) => {
    if (type === 'crop_disease') return <Sprout className="w-4 h-4 text-emerald-400" />;
    if (type === 'salinity') return <Waves className="w-4 h-4 text-blue-300" />;
    if (type === 'bird_deaths') return <AlertTriangle className="w-4 h-4 text-rose-300" />;
    if (type === 'bund_seepage') return <Shield className="w-4 h-4 text-amber-300" />;
    return <TrendingUp className="w-4 h-4 text-purple-300" />;
  };

  return (
    <div className="relative flex-1 flex flex-col w-full h-[calc(100vh-80px)] overflow-hidden">
      {/* Top Telemetry & Weather Status Bar */}
      <div className="bg-white/95 backdrop-blur border-b border-gray-200 px-4 py-2 z-10 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 overflow-x-auto py-0.5 no-scrollbar">
          {/* Active Reports Count */}
          <div className="flex items-center gap-1.5 font-bold text-gray-800 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <span>
              {t('activeReports')}: <b>{data?.reports.length || 0}</b>
            </span>
          </div>

          {/* Salinity Warning Canals */}
          <div className="flex items-center gap-1.5 font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-xl border border-red-200 shrink-0">
            <Waves className="w-3.5 h-3.5 text-red-600" />
            <span>
              {t('salineIngressCanals')}:{' '}
              <b>
                {dangerCanalsCount > 0 ? `${dangerCanalsCount} ${t('danger')}` : ''}{' '}
                {warningCanalsCount > 0 ? `${warningCanalsCount} ${t('warning')}` : '0 Normal'}
              </b>
            </span>
          </div>

          {/* Active DBSCAN Clusters */}
          <div className="flex items-center gap-1.5 font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 shrink-0">
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            <span>
              {t('activeOutbreaks')}: <b>{data?.active_clusters.length || 0}</b>
            </span>
          </div>

          {/* Open-Meteo Rainfall */}
          {data?.rainfall_summary && (
            <div className="flex items-center gap-1.5 text-blue-900 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200 shrink-0">
              <CloudRain className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {t('rain24h')}: <b>{data.rainfall_summary.total_rain_24h_mm} mm</b> (
                {data.rainfall_summary.dilution_factor.toUpperCase()} dilution)
              </span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTrendPanel(!showTrendPanel)}
            className={`flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-xl border transition text-xs ${
              showTrendPanel
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-700" />
            <span>Filters &amp; Find Trend</span>
          </button>

          <Link
            href="/report"
            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold px-3 py-1.5 rounded-xl shadow transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{t('reportIncidentBtn')}</span>
          </Link>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="relative flex-1 w-full h-full">
        {!showTrendPanel && (
          <button onClick={() => setShowTrendPanel(true)} className="absolute top-3 right-3 z-[500] flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-extrabold text-white shadow-xl hover:bg-emerald-800">
            <SlidersHorizontal className="w-4 h-4" /> Filters &amp; Find Trend
          </button>
        )}
        {data && (
          <KuttanadMap
            reports={mapReports}
            canals={mapCanals}
            clusters={mapClusters}
            visibleLayers={visibleLayers}
            trendLocation={analysis?.selected_location || null}
            trendCenters={(analysis?.spreading_diseases || []).filter((d) => d.cluster_center).map((d) => d.cluster_center!)}
            onSelectReport={(report) => setSelectedReport(report)}
            selectedLocation={selectedPinLocation}
            onLocationSelect={(lat, lng) => setSelectedPinLocation({ lat, lng })}
          />
        )}

        {/* Floating Local Trend Panel */}
        {showTrendPanel && (
          <div className="absolute top-16 left-3 sm:left-4 z-[410] w-[calc(100%-24px)] sm:w-96 max-h-[calc(100%-80px)] overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-2">
            <ThreatTracker
              breakdown={data?.outbreak_breakdown || []}
              location={selectedPinLocation}
              onLocationChange={(location) => setSelectedPinLocation(location)}
              onFiltersChange={(next) => setFilters(Object.fromEntries(Object.entries(next).filter(([, value]) => value !== undefined)))}
              onDiseaseSelect={(code) => setFilters((current) => ({ ...current, report_type: 'crop_disease', disease_code: code }))}
              visibleLayers={visibleLayers}
              onVisibleLayersChange={setVisibleLayers}
              onAnalysis={setAnalysis}
            />
          </div>
        )}
      </div>

      {/* Selected Report Inspector Drawer */}
      {selectedReport && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-[500] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="p-3.5 bg-emerald-800 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-900/60">
                {getReportTypeIcon(selectedReport.report_type)}
              </div>
              <div>
                <h4 className="font-extrabold text-sm capitalize leading-tight">
                  {selectedReport.report_type.replace('_', ' ')}
                </h4>
                <p className="text-[10px] text-emerald-200">
                  {selectedReport.canal_name || 'Nearest Canal'} • {selectedReport.verification_status}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedReport(null)}
              className="text-emerald-200 hover:text-white font-bold p-1"
              aria-label="Close details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-3 text-xs max-h-[320px] overflow-y-auto">
            {selectedReport.details?.disease_code && (
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                <span className="text-gray-500 block text-[10px] uppercase font-bold tracking-wider">
                  Identified Pathogen
                </span>
                <span className="font-extrabold text-gray-900 text-sm">
                  {selectedReport.details.disease_code}
                </span>
                <span className="text-gray-500 ml-2">
                  ({Math.round((selectedReport.details.confidence || 0) * 100)}% confidence)
                </span>
              </div>
            )}

            {selectedReport.details?.salinity_ppt && (
              <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-200 text-blue-900">
                <span className="text-blue-700 block text-[10px] uppercase font-bold tracking-wider">
                  Salinity Level
                </span>
                <span className="font-extrabold text-base">{selectedReport.details.salinity_ppt} ppt</span>
                <span className="text-xs text-blue-800 ml-2 font-bold">
                  {selectedReport.details.salinity_ppt >= 2.0 ? `(${t('danger')})` : `(${t('warning')})`}
                </span>
              </div>
            )}

            {selectedReport.details?.dead_count && (
              <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200 text-rose-900">
                <span className="text-rose-700 block text-[10px] uppercase font-bold tracking-wider">
                  Mortality Count
                </span>
                <span className="font-extrabold text-sm">
                  {selectedReport.details.dead_count} Dead
                </span>
                <span className="text-rose-700 ml-2">
                  ({selectedReport.details.sick_count || 0} Sick)
                </span>
              </div>
            )}

            {selectedReport.notes_text && (
              <div>
                <span className="text-gray-500 block text-[10px] mb-0.5 uppercase font-bold tracking-wider">
                  Farmer Notes
                </span>
                <p className="italic text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  "{selectedReport.notes_text}"
                </p>
              </div>
            )}

            {/* Quick verification summary */}
            <div className="flex items-center justify-between text-[11px] text-gray-600 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
              <span className="flex items-center gap-1 font-semibold text-emerald-900">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Confirmations: {selectedReport.confirmations_count}</span>
              </span>
              <Link
                href="/verify"
                className="text-emerald-700 font-bold hover:underline flex items-center gap-0.5"
              >
                <span>Verify Queue</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-500 gap-2 min-h-[550px]">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
          <span className="text-xs font-semibold">Loading Kuttanad Polder Network...</span>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
