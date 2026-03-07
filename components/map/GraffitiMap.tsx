'use client';

import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import { GraffitiSighting } from '@/types';
import { VIENNA_CENTER, DEFAULT_ZOOM, MIN_ZOOM } from '@/lib/constants/map';
import GraffitiMarker from './GraffitiMarker';
import MapClickHandler from './MapClickHandler';

interface Props {
  sightings: GraffitiSighting[];
  onMapClick: (lat: number, lng: number) => void;
  onImageClick: (url: string) => void;
}

export default function GraffitiMap({ sightings, onMapClick, onImageClick }: Props) {
  return (
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
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        maxNativeZoom={19}
        maxZoom={22}
      />
      <ZoomControl position="bottomright" />
      <MapClickHandler onMapClick={onMapClick} />
      {sightings.map((s) => (
        <GraffitiMarker key={s.id} sighting={s} onImageClick={onImageClick} />
      ))}
    </MapContainer>
  );
}
