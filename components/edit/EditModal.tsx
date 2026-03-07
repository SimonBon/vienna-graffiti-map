'use client';

import { useEffect } from 'react';
import { GraffitiSighting } from '@/types';
import EditForm from './EditForm';

interface Props {
  sighting: GraffitiSighting;
  onSuccess: (updated: GraffitiSighting) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function EditModal({ sighting, onSuccess, onDelete, onClose }: Props) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full sm:max-w-md bg-white border border-zinc-200 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Edit Sighting</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 text-xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <EditForm sighting={sighting} onSuccess={onSuccess} onDelete={onDelete} onCancel={onClose} />
      </div>
    </div>
  );
}
