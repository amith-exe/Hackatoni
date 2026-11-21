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

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
          maxZoom: 19,
          subdomains: ['a', 'b', 'c'],
          attribution: '&copy; OpenStreetMap | HOT',
        }).addTo(map);

        const customIcon = L.divIcon({
          className: '',
          html: `<div style="width:34px;height:34px;border-radius:50%;background:#15803d;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,0.4);border:2px solid white;color:white;font-size:16px;">📍</div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 34],
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
        setTimeout(() => {
          if (map) map.invalidateSize();
        }, 250);
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
    <div className="relative w-full h-56 rounded-xl overflow-hidden border-2 border-emerald-500/80 shadow-md">
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute top-2 right-2 z-[400] bg-white/95 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-bold text-gray-700 shadow border border-gray-200">
        👆 Tap map or drag pin
      </div>
    </div>
  );
}
