'use client';

import { useEffect } from 'react';
import SubmitForm from './SubmitForm';

interface Props {
  lat: number;
  lng: number;
  onSuccess: () => void;
  onClose: () => void;
}

export default function SubmitModal({ lat, lng, onSuccess, onClose }: Props) {
  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full sm:max-w-md bg-white border border-zinc-200 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
            Pin Graffiti
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 text-xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <SubmitForm lat={lat} lng={lng} onSuccess={onSuccess} onCancel={onClose} />
      </div>
    </div>
  );
}
