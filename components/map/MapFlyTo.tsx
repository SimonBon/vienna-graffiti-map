'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface Props {
  target: { lat: number; lng: number } | null;
}

export default function MapFlyTo({ target }: Props) {
  const map = useMap();

  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 16), {
      animate: true,
      duration: 0.8,
    });
  }, [target, map]);

  return null;
}
