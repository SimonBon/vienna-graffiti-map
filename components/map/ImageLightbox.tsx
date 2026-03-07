'use client';

import { useEffect } from 'react';

interface Props {
  url: string;
  onClose: () => void;
}

export default function ImageLightbox({ url, onClose }: Props) {
  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-lg transition-colors"
        aria-label="Close"
      >
        ✕
      </button>
      <img
        src={url}
        alt="Graffiti sighting"
        className="max-w-[92vw] max-h-[88vh] rounded-xl shadow-2xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
