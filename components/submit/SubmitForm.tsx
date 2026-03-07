'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { resizeImageToWebP } from '@/lib/utils/image';
import { useCategoriesContext } from '@/contexts/CategoriesContext';
import { GraffitiCategory } from '@/types';
import PhotoDropzone from './PhotoDropzone';

interface Props {
  lat: number;
  lng: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function SubmitForm({ lat, lng, onSuccess, onCancel }: Props) {
  const { categories } = useCategoriesContext();
  const [category, setCategory] = useState<GraffitiCategory>('tag');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handlePhotoChange(file: File) {
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
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
        .insert({ lat, lng, category, description: description.trim() || null, image_url });
      if (insertError) throw new Error(insertError.message);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2 text-xs text-zinc-400 font-mono">
        <span>lat {lat.toFixed(5)}</span>
        <span>lng {lng.toFixed(5)}</span>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">Category</label>
        <div className="grid grid-cols-3 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded border text-sm transition-colors ${
                category === cat.value
                  ? 'border-zinc-900 bg-zinc-900 text-white'
                  : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
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
        <PhotoDropzone
          preview={preview}
          onChange={handlePhotoChange}
          onClear={() => { setImageFile(null); setPreview(null); }}
        />
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
