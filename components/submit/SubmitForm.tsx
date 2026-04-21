'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { resizeImageToWebP } from '@/lib/utils/image';
import { useCategoriesContext } from '@/contexts/CategoriesContext';
import { GraffitiCategory } from '@/types';
import PhotoDropzone from './PhotoDropzone';

const NAME_KEY = 'graffiti_submitted_by';

interface Props {
  lat: number;
  lng: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function SubmitForm({ lat, lng, onSuccess, onCancel }: Props) {
  const { categories } = useCategoriesContext();
  const [category, setCategory] = useState<GraffitiCategory>('tag');
  const [pickingCategory, setPickingCategory] = useState(false);
  const [description, setDescription] = useState('');
  const [submittedBy, setSubmittedBy] = useState(() => localStorage.getItem(NAME_KEY) ?? '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCat = categories.find(c => c.value === category);

  function handlePhotoChange(file: File) {
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  }

  function handlePickCategory(value: GraffitiCategory) {
    setCategory(value);
    setPickingCategory(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const name = submittedBy.trim();
      if (name) localStorage.setItem(NAME_KEY, name);

      const supabase = createClient();
      let image_url: string | null = null;
      if (imageFile) {
        const webp = await resizeImageToWebP(imageFile);
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
        const { error: uploadError } = await supabase.storage
          .from('graffiti-images')
          .upload(filename, webp, { contentType: 'image/webp', upsert: false });
        if (uploadError) throw new Error(uploadError.message);
        image_url = supabase.storage.from('graffiti-images').getPublicUrl(filename).data.publicUrl;
      }
      const { error: insertError } = await supabase
        .from('graffiti_sightings')
        .insert({ lat, lng, category, description: description.trim() || null, image_url, submitted_by: name || null });
      if (insertError) throw new Error(insertError.message);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (pickingCategory) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setPickingCategory(false)}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
        >
          ← Back
        </button>
        <p className="text-sm font-medium text-zinc-700">Choose a category</p>
        <div className="flex flex-col gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => handlePickCategory(cat.value as GraffitiCategory)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded border text-sm transition-colors text-left ${
                category === cat.value
                  ? 'border-zinc-900 bg-zinc-900 text-white'
                  : 'border-zinc-200 text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50'
              }`}
            >
              <span className="text-lg">{cat.emoji}</span>
              <span>{cat.label}</span>
              {category === cat.value && <span className="ml-auto text-xs opacity-70">selected</span>}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2 text-xs text-zinc-400 font-mono">
        <span>lat {lat.toFixed(5)}</span>
        <span>lng {lng.toFixed(5)}</span>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">Category</label>
        <button
          type="button"
          onClick={() => setPickingCategory(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded border border-zinc-200 hover:border-zinc-400 transition-colors text-sm text-left"
        >
          <span className="text-lg">{selectedCat?.emoji}</span>
          <span className="text-zinc-800">{selectedCat?.label}</span>
          <span className="ml-auto text-zinc-400 text-xs">tap to change →</span>
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">
          Your name <span className="text-zinc-400">(optional)</span>
        </label>
        <input
          value={submittedBy}
          onChange={(e) => setSubmittedBy(e.target.value)}
          placeholder="Anonymous"
          className="w-full bg-white border border-zinc-200 rounded px-3 py-2 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">
          Description <span className="text-zinc-400">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Where exactly? What does it look like?"
          className="w-full bg-white border border-zinc-200 rounded px-3 py-2 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">
          Photo <span className="text-zinc-400">(optional)</span>
        </label>
        <PhotoDropzone preview={preview} onChange={handlePhotoChange} onClear={() => { setImageFile(null); setPreview(null); }} />
      </div>

      {error && <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded px-3 py-2">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2 rounded border border-zinc-200 text-zinc-500 hover:text-zinc-700 hover:border-zinc-400 transition-colors text-sm">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 py-2 rounded bg-zinc-900 text-white font-semibold text-sm hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? 'Uploading…' : 'Pin It'}
        </button>
      </div>
    </form>
  );
}
