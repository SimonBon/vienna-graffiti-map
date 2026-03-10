'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import { GraffitiSighting } from '@/types';
import { useCategoriesContext } from '@/contexts/CategoriesContext';

interface Props {
  sightings: GraffitiSighting[];
  onImageClick: (url: string) => void;
}

function escapeHtml(str: string) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeAttr(str: string) {
  return str.replace(/"/g, '&quot;');
}

export default function ClusterLayer({ sightings, onImageClick }: Props) {
  const map = useMap();
  const { categoryMap } = useCategoriesContext();
  const groupRef = useRef<L.MarkerClusterGroup | null>(null);
  const onImageClickRef = useRef(onImageClick);
  useEffect(() => { onImageClickRef.current = onImageClick; });

  useEffect(() => {
    if (groupRef.current) {
      map.removeLayer(groupRef.current);
    }

    const group = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      iconCreateFunction(cluster) {
        const count = cluster.getChildCount();
        const size = count < 10 ? 36 : count < 100 ? 42 : 48;
        return L.divIcon({
          html: `<div class="cluster-badge">${count}</div>`,
          className: '',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
      },
    });

    for (const s of sightings) {
      const cat = categoryMap[s.category] ?? { emoji: '❓', label: s.category };

      const icon = L.divIcon({
        html: `<div class="graffiti-marker">${cat.emoji}</div>`,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20],
      });

      const marker = L.marker([Number(s.lat), Number(s.lng)], { icon });

      let popupHtml = `<div class="graffiti-popup-inner">
        <span class="popup-emoji">${cat.emoji}</span>
        <span class="popup-label">${escapeHtml(cat.label)}</span>`;
      if (s.description) {
        popupHtml += `<p class="popup-desc">${escapeHtml(s.description)}</p>`;
      }
      if (s.submitted_by) {
        popupHtml += `<p class="popup-by">by ${escapeHtml(s.submitted_by)}</p>`;
      }
      if (s.image_url) {
        popupHtml += `<img src="${escapeAttr(s.image_url)}" alt="${escapeAttr(cat.label)}" class="popup-img popup-img-clickable" data-url="${escapeAttr(s.image_url)}" />`;
      }
      popupHtml += `</div>`;

      marker.bindPopup(popupHtml, { className: 'graffiti-popup' });

      if (s.image_url) {
        marker.on('popupopen', () => {
          const img = marker.getPopup()?.getElement()?.querySelector<HTMLImageElement>('img[data-url]');
          if (img) {
            img.addEventListener('click', () => {
              onImageClickRef.current(img.dataset.url!);
            });
          }
        });
      }

      group.addLayer(marker);
    }

    map.addLayer(group);
    groupRef.current = group;

    return () => {
      map.removeLayer(group);
      groupRef.current = null;
    };
  }, [map, sightings, categoryMap]);

  return null;
}
