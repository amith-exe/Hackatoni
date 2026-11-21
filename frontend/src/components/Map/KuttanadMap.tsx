// frontend/src/components/Map/KuttanadMap.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Waves,
  Sprout,
  Shield,
  TrendingUp,
  Layers,
  CheckCircle2,
  Info,
  MapPin,
  X,
  PlusCircle,
  ChevronRight,
} from 'lucide-react';
import { ReportItem, CanalSegment, ClusterItem, ReportType } from '@/types';
import { useDemoUser } from '@/lib/demo-user';

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
  const router = useRouter();
  const { t, language } = useDemoUser();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const baseLayersRef = useRef<Record<string, any>>({});

  const [activeBaseLayer, setActiveBaseLayer] = useState<'waterways' | 'topo' | 'satellite'>('waterways');
  const [filterType, setFilterType] = useState<ReportType | 'all'>(selectedType);
  const [showSeedBanner, setShowSeedBanner] = useState<boolean>(true);
  const [droppedPin, setDroppedPin] = useState<{ lat: number; lng: number; landmark?: string } | null>(
    selectedLocation || null
  );

  // Kuttanad Centroid (Pulincunnoo / Moncompu)
  const defaultCenter = [9.446, 76.435];
  const defaultZoom = 12;

  // Initialize Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = (await import('leaflet')).default;

      // Ensure leaflet default icon fix
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

        // 1. Waterways Base Layer: Humanitarian OpenStreetMap (100% Free, Zero Key)
        const waterwaysLayer = L.tileLayer(
          'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
          {
            maxZoom: 19,
            subdomains: ['a', 'b', 'c'],
            attribution: '&copy; OpenStreetMap contributors | HOT | Karshakan Lens',
          }
        );

        // 2. Topo Street Layer: Standard OpenStreetMap
        const topoLayer = L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors',
          }
        );

        // 3. Satellite Imagery Layer: Esri World Imagery (Zero Key)
        const satelliteLayer = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          {
            maxZoom: 19,
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
          }
        );

        baseLayersRef.current = {
          waterways: waterwaysLayer,
          topo: topoLayer,
          satellite: satelliteLayer,
        };

        waterwaysLayer.addTo(map);

        const layerGroup = L.layerGroup().addTo(map);
        layerGroupRef.current = layerGroup;

        // Map Click Handler for Dropped Pin
        map.on('click', (e: any) => {
          const lat = parseFloat(e.latlng.lat.toFixed(4));
          const lng = parseFloat(e.latlng.lng.toFixed(4));
          setDroppedPin({ lat, lng });

          if (onLocationSelect) {
            onLocationSelect(lat, lng);
          }
        });

        mapInstanceRef.current = map;
      }
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Base Layer Switching
  const switchBaseLayer = (layerKey: 'waterways' | 'topo' | 'satellite') => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const layers = baseLayersRef.current;

    Object.values(layers).forEach((layer) => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });

    if (layers[layerKey]) {
      layers[layerKey].addTo(map);
      setActiveBaseLayer(layerKey);
    }
  };

  // Re-render layers when data, filters, or droppedPin changes
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
            <div style="font-weight: bold; font-size: 13px; margin-bottom: 4px; color: #0f172a;">${canal.name}</div>
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
          <div style="font-family: sans-serif; min-width: 190px;">
            <div style="font-weight: bold; font-size: 13px; color: ${strokeColor}; margin-bottom: 4px;">
              ${cluster.alert_level} Outbreak Cluster
            </div>
            <div style="font-size: 12px; color: #1e293b;">
              <b>${cluster.report_count}</b> reports within ${cluster.radius_km} km radius.
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
              Sub-type: <b>${cluster.sub_category || cluster.report_type}</b> | Trend: <b>${cluster.trend}</b>
            </div>
          </div>
        `);

        circle.addTo(group);
      });

      // 3. Draw Report Pins (Crisp SVG Markers with Zero Emojis)
      const filtered = reports.filter((r) => filterType === 'all' || r.report_type === filterType);

      filtered.forEach((report) => {
        let pinBg = '#f59e0b'; // Amber for unconfirmed
        let statusLabel = 'Unconfirmed';

        if (report.verification_status === 'community_confirmed') {
          pinBg = '#2563eb'; // Blue for community confirmed
          statusLabel = 'Community Confirmed';
        } else if (report.verification_status === 'officially_verified') {
          pinBg = '#16a34a'; // Emerald for officially verified
          statusLabel = 'Officially Verified';
        } else if (report.verification_status === 'rejected') {
          pinBg = '#9ca3af'; // Gray
          statusLabel = 'Rejected';
        }

        // SVG icon inside pin
        let iconSvg = '';
        if (report.report_type === 'crop_disease') {
          iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/></svg>`;
        } else if (report.report_type === 'salinity') {
          iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>`;
        } else if (report.report_type === 'bird_deaths') {
          iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
        } else if (report.report_type === 'bund_seepage') {
          iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
        } else {
          iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`;
        }

        const customIcon = L.divIcon({
          className: '',
          html: `
            <div style="
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: ${pinBg};
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 8px rgba(0,0,0,0.3);
              border: 2px solid white;
              cursor: pointer;
            ">
              ${iconSvg}
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([report.latitude, report.longitude], { icon: customIcon });

        marker.bindPopup(`
          <div style="font-family: sans-serif; min-width: 210px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-weight: bold; font-size: 13px; text-transform: capitalize; color: #0f172a;">${report.report_type.replace('_', ' ')}</span>
              <span style="font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; background: ${pinBg}; color: white;">
                ${statusLabel}
              </span>
            </div>
            ${report.details?.disease_code ? `<div style="font-size: 12px; color: #1f2937;">Pathogen: <b>${report.details.disease_code}</b></div>` : ''}
            ${report.details?.salinity_ppt ? `<div style="font-size: 12px; color: #1f2937;">Salinity: <b>${report.details.salinity_ppt} ppt</b></div>` : ''}
            ${report.details?.dead_count ? `<div style="font-size: 12px; color: #dc2626;">Dead: <b>${report.details.dead_count}</b> | Sick: <b>${report.details.sick_count || 0}</b></div>` : ''}
            ${report.notes_text ? `<div style="font-size: 11px; color: #4b5563; margin-top: 6px; font-style: italic;">"${report.notes_text}"</div>` : ''}
            <div style="font-size: 10px; color: #94a3b8; margin-top: 6px; border-top: 1px solid #f1f5f9; padding-top: 4px;">
              Confirmations: <b>${report.confirmations_count}</b> | Canal: <b>${report.canal_name || 'Nearest canal'}</b>
            </div>
          </div>
        `);

        if (onSelectReport) {
          marker.on('click', () => onSelectReport(report));
        }

        marker.addTo(group);
      });

      // 4. Draw Active Dropped Pin (Pin-to-Report Workflow)
      if (droppedPin) {
        const droppedIcon = L.divIcon({
          className: '',
          html: `
            <div style="
              width: 38px;
              height: 38px;
              border-radius: 50%;
              background: #15803d;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 0 0 6px rgba(21, 128, 61, 0.35), 0 4px 10px rgba(0,0,0,0.3);
              border: 3px solid white;
              cursor: pointer;
            ">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
          `,
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        });

        const dropMarker = L.marker([droppedPin.lat, droppedPin.lng], {
          icon: droppedIcon,
          draggable: true,
        }).addTo(group);

        dropMarker.on('dragend', (e: any) => {
          const pos = e.target.getLatLng();
          const lat = parseFloat(pos.lat.toFixed(4));
          const lng = parseFloat(pos.lng.toFixed(4));
          setDroppedPin({ lat, lng });
          if (onLocationSelect) onLocationSelect(lat, lng);
        });
      }
    }

    updateLayers();
  }, [reports, canals, clusters, filterType, droppedPin, onSelectReport]);

  const handleClearPin = () => {
    setDroppedPin(null);
  };

  const handleReportAtPin = () => {
    if (droppedPin) {
      router.push(`/report?lat=${droppedPin.lat}&lng=${droppedPin.lng}`);
    } else {
      router.push('/report');
    }
  };

  return (
    <div className="relative w-full h-full min-h-[500px] flex flex-col">
      {/* Pin-to-Report Friendly Hint Bar */}
      <div className="absolute top-3 left-3 right-3 sm:left-4 sm:right-auto z-[400] max-w-lg bg-white/95 backdrop-blur px-3 py-2 rounded-xl text-xs shadow-md border border-emerald-300 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="font-bold text-gray-800 text-[11px] sm:text-xs">
            {t('pinHint')}
          </span>
        </div>
      </div>

      {/* Demo Data Banner */}
      {showSeedBanner && (
        <div className="absolute top-14 sm:top-14 left-3 right-3 sm:left-4 sm:right-auto z-[399] max-w-md bg-emerald-900/90 text-white backdrop-blur px-3 py-2 rounded-xl text-xs shadow-lg border border-emerald-700/60 flex items-start gap-2">
          <Info className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
          <div className="flex-1 text-[11px] leading-relaxed">
            <span className="font-bold text-emerald-200">{t('demoBannerTitle')} </span>
            {t('demoBannerDesc')}
          </div>
          <button
            onClick={() => setShowSeedBanner(false)}
            className="text-emerald-300 hover:text-white font-bold ml-1 p-0.5"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Right Controls: Map Layer Switcher & Filter Pills */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col items-end gap-2">
        {/* Layer Switcher */}
        <div className="flex items-center bg-white/95 backdrop-blur p-1 rounded-xl shadow-md border border-gray-200 text-xs">
          <button
            onClick={() => switchBaseLayer('waterways')}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
              activeBaseLayer === 'waterways'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('waterwaysLayer')}</span>
          </button>
          <button
            onClick={() => switchBaseLayer('topo')}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
              activeBaseLayer === 'topo'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('topoLayer')}</span>
          </button>
          <button
            onClick={() => switchBaseLayer('satellite')}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
              activeBaseLayer === 'satellite'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('satelliteLayer')}</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1 bg-white/95 backdrop-blur p-1 rounded-xl shadow-md border border-gray-200">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              filterType === 'all'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('crop_disease')}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              filterType === 'crop_disease'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Sprout className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">Disease</span>
          </button>
          <button
            onClick={() => setFilterType('salinity')}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              filterType === 'salinity'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Waves className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden md:inline">Salinity</span>
          </button>
          <button
            onClick={() => setFilterType('bird_deaths')}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              filterType === 'bird_deaths'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden md:inline">Ducks</span>
          </button>
        </div>
      </div>

      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full flex-1 z-0" />

      {/* Active Dropped Pin Action Card (Pop-up above bottom controls) */}
      {droppedPin && (
        <div className="absolute bottom-16 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 z-[450] sm:w-80 bg-white rounded-2xl shadow-2xl border-2 border-emerald-600 p-3.5 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-gray-900 leading-tight">
                  {t('droppedPinTitle')}
                </h4>
                <p className="text-[11px] text-gray-500">
                  Lat: <b>{droppedPin.lat}</b> | Lng: <b>{droppedPin.lng}</b>
                </p>
              </div>
            </div>
            <button
              onClick={handleClearPin}
              className="text-gray-400 hover:text-gray-700 p-1"
              aria-label="Clear dropped pin"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleReportAtPin}
              className="flex-1 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-extrabold py-2 px-3 rounded-xl text-xs shadow transition flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('reportAtPinBtn')}</span>
            </button>
            <button
              onClick={handleClearPin}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-3 rounded-xl text-xs transition"
            >
              {t('clearPinBtn')}
            </button>
          </div>
        </div>
      )}

      {/* Map Legend (Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur px-3 py-2 rounded-xl text-[11px] shadow border border-gray-200 hidden sm:flex flex-col gap-1">
        <div className="font-bold text-gray-800 text-[10px] uppercase tracking-wider mb-0.5">
          {t('legendTitle')}
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>{t('unconfirmed')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
          <span>{t('communityConfirmed')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
          <span>{t('officiallyVerified')}</span>
        </div>
        <div className="flex items-center gap-2 border-t border-gray-100 pt-1 mt-0.5">
          <span className="w-4 h-1 bg-red-600 rounded"></span>
          <span>{t('salineCanalLegend')}</span>
        </div>
      </div>
    </div>
  );
}
