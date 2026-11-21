// frontend/src/components/Map/KuttanadMap.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { ReportItem, CanalSegment, ClusterItem, ReportType } from '@/types';
import { AlertTriangle, Droplets, Bug, AlertOctagon, Layers, Filter, CheckCircle, Info } from 'lucide-react';

interface KuttanadMapProps {
  reports: ReportItem[];
  canals: CanalSegment[];
  clusters: ClusterItem[];
  selectedType?: ReportType | 'all';
  onSelectReport?: (report: ReportItem) => void;
  interactivePinPicker?: boolean;
  selectedLocation?: { lat: number; lng: number } | null;
  onLocationSelect?: (lat: number, lng: number) => void;
}

export default function KuttanadMap({
  reports,
  canals,
  clusters,
  selectedType = 'all',
  onSelectReport,
  interactivePinPicker = false,
  selectedLocation = null,
  onLocationSelect,
}: KuttanadMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const [filterType, setFilterType] = useState<ReportType | 'all'>(selectedType);
  const [showSeedBanner, setShowSeedBanner] = useState<boolean>(true);

  // Kuttanad Centroid (Pulincunnoo / Moncompu)
  const defaultCenter = [9.446, 76.435];
  const defaultZoom = 12;

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;
      
      const L = (await import('leaflet')).default;

      // Ensure default icon paths work in Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapInstanceRef.current && mapContainerRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [defaultCenter[0], defaultCenter[1]],
          zoom: defaultZoom,
          zoomControl: false,
        });

        // Add Zoom Control at bottom right
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // 100% Free OpenStreetMap Humanitarian Layer (Zero API key required)
        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
          maxZoom: 19,
          subdomains: ['a', 'b', 'c'],
          attribution: '&copy; OpenStreetMap contributors | HOT | Karshakan Lens',
        }).addTo(map);

        const layerGroup = L.layerGroup().addTo(map);
        layerGroupRef.current = layerGroup;

        // Interactive click handler for pin picking
        if (interactivePinPicker && onLocationSelect) {
          map.on('click', (e: any) => {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
          });
        }

        mapInstanceRef.current = map;
      }
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, [interactivePinPicker]);

  // Re-render layers when data or filters change
  useEffect(() => {
    async function updateLayers() {
      if (!mapInstanceRef.current || !layerGroupRef.current) return;
      const L = (await import('leaflet')).default;
      const group = layerGroupRef.current;
      group.clearLayers();

      // 1. Draw Canal Network (LineStrings)
      canals.forEach((canal) => {
        const latLngs = canal.coordinates.map(([lng, lat]) => [lat, lng]);

        let color = '#0284c7'; // default water blue
        let weight = 4;
        let dashArray = undefined;

        if (canal.current_alert_level === 'Danger') {
          color = '#dc2626'; // Red
          weight = 6;
        } else if (canal.current_alert_level === 'Warning') {
          color = '#f97316'; // Orange
          weight = 5;
        } else if (canal.current_alert_level === 'Watch') {
          color = '#eab308'; // Amber
          weight = 4;
          dashArray = '6, 6';
        }

        const polyline = L.polyline(latLngs as any, {
          color,
          weight,
          dashArray,
          opacity: 0.85,
        });

        const alertBadge = canal.current_alert_level
          ? `<span style="padding: 2px 6px; font-size: 11px; font-weight: bold; border-radius: 4px; background: ${
              canal.current_alert_level === 'Danger'
                ? '#fee2e2; color: #991b1b;'
                : '#ffedd5; color: #9a3412;'
            }">${canal.current_alert_level} Salinity</span>`
          : '<span style="color: #0369a1; font-size: 11px;">Normal Canal</span>';

        polyline.bindPopup(`
          <div style="font-family: sans-serif; min-width: 180px;">
            <div style="font-weight: bold; font-size: 13px; margin-bottom: 4px;">🌊 ${canal.name}</div>
            <div style="margin-bottom: 6px;">${alertBadge}</div>
            ${canal.salinity_ppt ? `<div style="font-size: 12px; color: #374151;">Salinity: <b>${canal.salinity_ppt} ppt</b></div>` : ''}
            ${canal.alert_reason ? `<div style="font-size: 11px; color: #4b5563; margin-top: 4px;">${canal.alert_reason}</div>` : ''}
          </div>
        `);

        polyline.addTo(group);
      });

      // 2. Draw DBSCAN Cluster Circles
      clusters.forEach((cluster) => {
        let fillColor = '#f59e0b';
        let strokeColor = '#b45309';

        if (cluster.alert_level === 'Danger') {
          fillColor = '#ef4444';
          strokeColor = '#b91c1c';
        } else if (cluster.alert_level === 'Warning') {
          fillColor = '#f97316';
          strokeColor = '#c2410c';
        }

        const circle = L.circle([cluster.center_latitude, cluster.center_longitude], {
          color: strokeColor,
          fillColor,
          fillOpacity: 0.22,
          radius: (cluster.radius_km || 2.0) * 1000,
          weight: 2,
        });

        circle.bindPopup(`
          <div style="font-family: sans-serif;">
            <div style="font-weight: bold; font-size: 13px; color: ${strokeColor};">
              ⚠️ ${cluster.alert_level} Outbreak Cluster
            </div>
            <div style="font-size: 12px; margin-top: 4px;">
              <b>${cluster.report_count}</b> reports in ${cluster.radius_km} km radius.
            </div>
            <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">
              Sub-type: ${cluster.sub_category || cluster.report_type} | Trend: <b>${cluster.trend}</b>
            </div>
          </div>
        `);

        circle.addTo(group);
      });

      // 3. Draw Report Pins
      const filtered = reports.filter((r) => filterType === 'all' || r.report_type === filterType);

      filtered.forEach((report) => {
        let pinBg = '#f59e0b'; // Amber for unconfirmed
        let statusLabel = 'Unconfirmed';
        let statusBadge = 'bg-amber-100 text-amber-800';

        if (report.verification_status === 'community_confirmed') {
          pinBg = '#2563eb'; // Blue for community confirmed
          statusLabel = 'Community Confirmed';
          statusBadge = 'bg-blue-100 text-blue-800';
        } else if (report.verification_status === 'officially_verified') {
          pinBg = '#16a34a'; // Emerald for officially verified
          statusLabel = 'Officially Verified';
          statusBadge = 'bg-emerald-100 text-emerald-800';
        } else if (report.verification_status === 'rejected') {
          pinBg = '#9ca3af'; // Gray
          statusLabel = 'Rejected';
          statusBadge = 'bg-gray-100 text-gray-700';
        }

        // Icon symbol based on report type
        let iconSymbol = '⚠️';
        if (report.report_type === 'crop_disease') iconSymbol = '🌾';
        if (report.report_type === 'salinity') iconSymbol = '🌊';
        if (report.report_type === 'bird_deaths') iconSymbol = '🦆';
        if (report.report_type === 'bund_seepage') iconSymbol = '🧱';
        if (report.report_type === 'crop_loss') iconSymbol = '📉';

        const customIcon = L.divIcon({
          className: '',
          html: `
            <div style="
              width: 34px;
              height: 34px;
              border-radius: 50%;
              background: ${pinBg};
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 6px rgba(0,0,0,0.3);
              border: 2px solid white;
              font-size: 16px;
              cursor: pointer;
            ">
              ${iconSymbol}
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        const marker = L.marker([report.latitude, report.longitude], { icon: customIcon });

        marker.bindPopup(`
          <div style="font-family: sans-serif; min-width: 200px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-weight: bold; font-size: 13px; text-transform: capitalize;">${report.report_type.replace('_', ' ')}</span>
              <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; background: ${pinBg}; color: white;">
                ${statusLabel}
              </span>
            </div>
            ${report.details?.disease_code ? `<div style="font-size: 12px; color: #1f2937;">Pathogen: <b>${report.details.disease_code}</b></div>` : ''}
            ${report.details?.salinity_ppt ? `<div style="font-size: 12px; color: #1f2937;">Salinity: <b>${report.details.salinity_ppt} ppt</b></div>` : ''}
            ${report.details?.dead_count ? `<div style="font-size: 12px; color: #dc2626;">Dead: <b>${report.details.dead_count}</b> | Sick: <b>${report.details.sick_count || 0}</b></div>` : ''}
            ${report.notes_text ? `<div style="font-size: 11px; color: #4b5563; margin-top: 6px; font-style: italic;">"${report.notes_text}"</div>` : ''}
            <div style="font-size: 10px; color: #9ca3af; margin-top: 6px; border-top: 1px solid #f3f4f6; padding-top: 4px;">
              Confirmations: <b>${report.confirmations_count}</b> | Canal: <b>${report.canal_name || 'Nearest canal'}</b>
            </div>
          </div>
        `);

        if (onSelectReport) {
          marker.on('click', () => onSelectReport(report));
        }

        marker.addTo(group);
      });

      // 4. Draw Selected Location Pin (when picking a location)
      if (selectedLocation) {
        const pickerIcon = L.divIcon({
          className: '',
          html: `
            <div style="
              width: 40px;
              height: 40px;
              border-radius: 50%;
              background: #15803d;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 0 0 6px rgba(21, 128, 61, 0.35);
              border: 3px solid white;
              color: white;
              font-size: 18px;
            ">
              📍
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        L.marker([selectedLocation.lat, selectedLocation.lng], { icon: pickerIcon }).addTo(group);
      }
    }

    updateLayers();
  }, [reports, canals, clusters, filterType, selectedLocation, onSelectReport]);

  return (
    <div className="relative w-full h-full min-h-[500px] flex flex-col">
      {/* Demo Data Banner */}
      {showSeedBanner && (
        <div className="absolute top-3 left-3 right-3 sm:left-6 sm:right-auto z-[400] max-w-md bg-emerald-900/90 text-white backdrop-blur px-3 py-2 rounded-xl text-xs shadow-lg border border-emerald-700/60 flex items-start gap-2">
          <Info className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold text-emerald-200">Kuttanad Seeded Demo: </span>
            Sample pins around Pulincunnoo, Moncompu, and Nedumudy are preloaded to demonstrate community confirmation & canal salinity routing.
          </div>
          <button
            onClick={() => setShowSeedBanner(false)}
            className="text-emerald-300 hover:text-white font-bold ml-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating Filter Bar */}
      <div className="absolute top-16 sm:top-3 right-3 z-[400] flex flex-wrap gap-1.5 bg-white/95 backdrop-blur p-1.5 rounded-xl shadow-md border border-gray-200">
        <button
          onClick={() => setFilterType('all')}
          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
            filterType === 'all' ? 'bg-emerald-700 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterType('crop_disease')}
          className={`px-2 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
            filterType === 'crop_disease' ? 'bg-emerald-700 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          🌾 Disease
        </button>
        <button
          onClick={() => setFilterType('salinity')}
          className={`px-2 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
            filterType === 'salinity' ? 'bg-emerald-700 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          🌊 Salinity
        </button>
        <button
          onClick={() => setFilterType('bird_deaths')}
          className={`px-2 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
            filterType === 'bird_deaths' ? 'bg-emerald-700 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          🦆 Ducks
        </button>
      </div>

      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full flex-1 z-0" />

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white/90 backdrop-blur px-3 py-2 rounded-xl text-[11px] shadow border border-gray-200 hidden sm:flex flex-col gap-1">
        <div className="font-bold text-gray-800 text-[10px] uppercase tracking-wider mb-0.5">Verification Legend</div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Unconfirmed (0-1 confirms)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
          <span>Community Confirmed (2+ neighbors)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
          <span>Officially Verified (Krishi Bhavan)</span>
        </div>
        <div className="flex items-center gap-2 border-t border-gray-100 pt-1 mt-0.5">
          <span className="w-4 h-1 bg-red-600 rounded"></span>
          <span>Salinity Intrusion Canal</span>
        </div>
      </div>
    </div>
  );
}
