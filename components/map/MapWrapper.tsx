'use client';

import dynamic from 'next/dynamic';
import { GraffitiSighting } from '@/types';

const GraffitiMap = dynamic(() => import('./GraffitiMap'), { ssr: false });

interface Props {
  sightings: GraffitiSighting[];
  onMapClick: (lat: number, lng: number) => void;
  onImageClick: (url: string) => void;
  flyTarget: { lat: number; lng: number } | null;
}

export default function MapWrapper({ sightings, onMapClick, onImageClick, flyTarget }: Props) {
  return (
    <div className="h-full w-full">
      <GraffitiMap
        sightings={sightings}
        onMapClick={onMapClick}
        onImageClick={onImageClick}
        flyTarget={flyTarget}
      />
    </div>
  );
}
