'use client';

import { useRef, useState, useCallback } from 'react';

interface Props {
  preview: string | null;
  onChange: (file: File) => void;
  onClear: () => void;
}

export default function PhotoDropzone({ preview, onChange, onClear }: Props) {
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    onChange(file);
  }, [onChange]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  if (preview) {
    return (
      <div className="relative">
        <img
          src={preview}
          alt="preview"
          className="w-full h-36 object-cover rounded-lg border border-zinc-200"
        />
        <button
          type="button"
          onClick={onClear}
          className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
      />
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`w-full border-2 border-dashed rounded-lg py-6 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors select-none ${
          dragging
            ? 'border-zinc-500 bg-zinc-50'
            : 'border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50'
        }`}
      >
        <span className="text-2xl">{dragging ? '⬇️' : '📷'}</span>
        <span className="text-sm text-zinc-500">
          {dragging ? 'Drop to upload' : 'Click or drag a photo here'}
        </span>
        <span className="text-xs text-zinc-400">JPEG, PNG, WebP, HEIC</span>
      </div>
    </>
  );
}
