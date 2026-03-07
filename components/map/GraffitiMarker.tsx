'use client';

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { GraffitiSighting } from '@/types';
import { useCategoriesContext } from '@/contexts/CategoriesContext';

function createEmojiIcon(emoji: string) {
  return L.divIcon({
    html: `<div class="graffiti-marker">${emoji}</div>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

interface Props {
  sighting: GraffitiSighting;
  onImageClick: (url: string) => void;
}

export default function GraffitiMarker({ sighting, onImageClick }: Props) {
  const { categoryMap } = useCategoriesContext();
  const cat = categoryMap[sighting.category] ?? { emoji: '❓', label: sighting.category };
  const icon = createEmojiIcon(cat.emoji);

  return (
    <Marker position={[sighting.lat, sighting.lng]} icon={icon}>
      <Popup className="graffiti-popup">
        <div className="graffiti-popup-inner">
          <span className="popup-emoji">{cat.emoji}</span>
          <span className="popup-label">{cat.label}</span>
          {sighting.description && (
            <p className="popup-desc">{sighting.description}</p>
          )}
          {sighting.image_url && (
            <img
              src={sighting.image_url}
              alt={cat.label}
              className="popup-img popup-img-clickable"
              onClick={() => onImageClick(sighting.image_url!)}
            />
          )}
        </div>
      </Popup>
    </Marker>
  );
}
