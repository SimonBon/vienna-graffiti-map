'use client';

import { useEffect, useRef } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const LONG_PRESS_MS = 500;

interface Props {
  onMapClick: (lat: number, lng: number) => void;
}

function isOnMarkerOrPopup(el: EventTarget | null) {
  if (!(el instanceof Element)) return false;
  return !!(el.closest('.graffiti-marker') || el.closest('.leaflet-popup'));
}

export default function MapClickHandler({ onMapClick }: Props) {
  const map = useMap();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const movedRef = useRef(false);
  const justFiredRef = useRef(false);

  // Desktop: right-click
  useMapEvents({
    contextmenu(e) {
      e.originalEvent.preventDefault();
      if (justFiredRef.current) return;
      if (isOnMarkerOrPopup(e.originalEvent.target)) return;
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });

  // Mobile: long-press
  useEffect(() => {
    const container = map.getContainer();

    function onTouchStart(e: TouchEvent) {
      movedRef.current = false;
      if (isOnMarkerOrPopup(e.target)) return;

      const touch = e.touches[0];
      const rect = container.getBoundingClientRect();
      const latlng = map.containerPointToLatLng(
        L.point(touch.clientX - rect.left, touch.clientY - rect.top)
      );

      timerRef.current = setTimeout(() => {
        if (!movedRef.current) {
          justFiredRef.current = true;
          setTimeout(() => { justFiredRef.current = false; }, 300);
          if (navigator.vibrate) navigator.vibrate(40);
          onMapClick(latlng.lat, latlng.lng);
        }
      }, LONG_PRESS_MS);
    }

    function onTouchMove() {
      movedRef.current = true;
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    }

    function onTouchEnd() {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    }

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('touchend', onTouchEnd);

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [map, onMapClick]);

  return null;
}
