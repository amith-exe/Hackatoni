// frontend/src/components/Report/MiniMapPicker.tsx
'use client';

import React, { useEffect, useRef } from 'react';

interface MiniMapPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

export default function MiniMapPicker({ lat, lng, onChange }: MiniMapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      if (typeof window === 'undefined' || !mapRef.current) return;
      const L = (await import('leaflet')).default;

      if (!mapInstance.current && mapRef.current) {
        const map = L.map(mapRef.current, {
          center: [lat, lng],
          zoom: 13,
          zoomControl: true,
        });

        // 100% Free OpenStreetMap HOT Layer
        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
          maxZoom: 19,
          subdomains: ['a', 'b', 'c'],
          attribution: '&copy; OpenStreetMap | HOT',
        }).addTo(map);

        const customIcon = L.divIcon({
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
              box-shadow: 0 4px 10px rgba(0,0,0,0.4);
              border: 2px solid white;
              cursor: grab;
            ">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
          `,
          iconSize: [38, 38],
          iconAnchor: [19, 38],
        });

        const marker = L.marker([lat, lng], { draggable: true, icon: customIcon }).addTo(map);
        markerRef.current = marker;

        marker.on('dragend', (e: any) => {
          const pos = e.target.getLatLng();
          onChange(parseFloat(pos.lat.toFixed(4)), parseFloat(pos.lng.toFixed(4)));
        });

        map.on('click', (e: any) => {
          onChange(parseFloat(e.latlng.lat.toFixed(4)), parseFloat(e.latlng.lng.toFixed(4)));
        });

        mapInstance.current = map;
        [60, 200, 500, 1000].forEach((ms) => {
          setTimeout(() => {
            if (mapInstance.current) mapInstance.current.invalidateSize();
          }, ms);
        });
      } else if (markerRef.current && mapInstance.current) {
        markerRef.current.setLatLng([lat, lng]);
        mapInstance.current.panTo([lat, lng]);
      }
    }
    init();

    return () => {
      isMounted = false;
    };
  }, [lat, lng, onChange]);

  return (
    <div className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden border-2 border-emerald-500/80 shadow-md">
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute top-2.5 right-2.5 z-[400] bg-white/95 backdrop-blur px-3 py-1 rounded-xl text-[10px] font-extrabold text-gray-800 shadow border border-gray-200 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
        <span>Click map or drag pin to position</span>
      </div>
    </div>
  );
}
