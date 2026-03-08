'use client';

import 'leaflet/dist/leaflet.css';
import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import { GraffitiSighting } from '@/types';
import { VIENNA_CENTER, DEFAULT_ZOOM, MIN_ZOOM } from '@/lib/constants/map';
import GraffitiMarker from './GraffitiMarker';
import MapClickHandler from './MapClickHandler';
import MapFlyTo from './MapFlyTo';

const LAYERS = {
  map: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxNativeZoom: 19,
    label: '🛰️',
    title: 'Switch to satellite',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxNativeZoom: 19,
    label: '🗺️',
    title: 'Switch to map',
  },
} as const;

type LayerKey = keyof typeof LAYERS;

interface Props {
  sightings: GraffitiSighting[];
  onMapClick: (lat: number, lng: number) => void;
  onImageClick: (url: string) => void;
  flyTarget: { lat: number; lng: number } | null;
  sidebarOpen: boolean;
}

function FlyToLocation({ target }: { target: [number, number] | null }) {
  const map = useMap();
  if (target) map.flyTo(target, Math.max(map.getZoom(), 17), { animate: true, duration: 0.8 });
  return null;
}

export default function GraffitiMap({ sightings, onMapClick, onImageClick, flyTarget, sidebarOpen }: Props) {
  const [layer, setLayer] = useState<LayerKey>('map');
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [locTarget, setLocTarget] = useState<[number, number] | null>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  // Prevent touch events on the controls from leaking into Leaflet
  useEffect(() => {
    const el = controlsRef.current;
    if (!el) return;
    const stop = (e: Event) => e.stopPropagation();
    el.addEventListener('touchstart', stop, { capture: true, passive: true });
    el.addEventListener('touchmove', stop, { capture: true, passive: true });
    el.addEventListener('touchend', stop, { capture: true });
    return () => {
      el.removeEventListener('touchstart', stop, { capture: true });
      el.removeEventListener('touchmove', stop, { capture: true });
      el.removeEventListener('touchend', stop, { capture: true });
    };
  }, []);

  const current = LAYERS[layer];
  const next: LayerKey = layer === 'map' ? 'satellite' : 'map';

  function handleLocate() {
    if (!navigator.geolocation) { setLocError('Not supported'); return; }
    setLocating(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocating(false);
        setLocTarget([latitude, longitude]);
        setTimeout(() => setLocTarget(null), 100);
        onMapClick(latitude, longitude);
      },
      () => {
        setLocating(false);
        setLocError('Location denied');
        setTimeout(() => setLocError(null), 3000);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={VIENNA_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={MIN_ZOOM}
        maxZoom={22}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          key={layer}
          attribution={current.attribution}
          url={current.url}
          maxNativeZoom={current.maxNativeZoom}
          maxZoom={22}
        />
        <ZoomControl position="bottomright" />
        <MapClickHandler onMapClick={onMapClick} />
        <MapFlyTo target={flyTarget} />
        <FlyToLocation target={locTarget} />
        {sightings.map((s) => (
          <GraffitiMarker key={s.id} sighting={s} onImageClick={onImageClick} />
        ))}
      </MapContainer>

      {/* Bottom-left controls — shift right on desktop when sidebar open, up on mobile when sheet open */}
      <div ref={controlsRef} className={`absolute z-[400] flex flex-row gap-1.5 transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'bottom-[72vh] sm:bottom-8 left-2.5 sm:left-[19rem]' : 'bottom-8 left-2.5'}
      `}>
        {/* Use my location */}
        <button
          onClick={handleLocate}
          disabled={locating}
          title="Pin my current location"
          className="flex items-center gap-1.5 bg-white border border-zinc-200 shadow-md rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors disabled:opacity-60"
        >
          <span className="text-sm">{locating ? '⏳' : '📍'}</span>
          <span className="hidden sm:inline">{locating ? 'Locating…' : 'Pin my location'}</span>
        </button>

        {/* Layer toggle */}
        <button
          onClick={() => setLayer(next)}
          title={current.title}
          className="flex items-center gap-1.5 bg-white border border-zinc-200 shadow-md rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          <span className="text-sm">{LAYERS[next].label}</span>
          <span className="hidden sm:inline">{layer === 'map' ? 'Satellite' : 'Map'}</span>
        </button>
      </div>

      {/* Location error toast */}
      {locError && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[400] bg-zinc-900 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg">
          {locError}
        </div>
      )}
    </div>
  );
}
