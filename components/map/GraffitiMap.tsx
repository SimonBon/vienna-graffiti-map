'use client';

import 'leaflet/dist/leaflet.css';
import { useState } from 'react';
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
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
}

export default function GraffitiMap({ sightings, onMapClick, onImageClick, flyTarget }: Props) {
  const [layer, setLayer] = useState<LayerKey>('map');
  const current = LAYERS[layer];
  const next: LayerKey = layer === 'map' ? 'satellite' : 'map';

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
        {sightings.map((s) => (
          <GraffitiMarker key={s.id} sighting={s} onImageClick={onImageClick} />
        ))}
      </MapContainer>

      {/* Layer toggle button */}
      <button
        onClick={() => setLayer(next)}
        title={current.title}
        className="absolute bottom-8 left-2.5 z-[400] flex items-center gap-1.5 bg-white border border-zinc-200 shadow-md rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
      >
        <span className="text-sm">{LAYERS[next].label}</span>
        <span className="hidden sm:inline">{layer === 'map' ? 'Satellite' : 'Map'}</span>
      </button>
    </div>
  );
}
