'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { resizeImageToWebP } from '@/lib/utils/image';
import { useCategoriesContext } from '@/contexts/CategoriesContext';
import { GraffitiCategory, GraffitiSighting } from '@/types';
import PhotoDropzone from '@/components/submit/PhotoDropzone';

interface Props {
  sighting: GraffitiSighting;
  onSuccess: (updated: GraffitiSighting) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
}

export default function EditForm({ sighting, onSuccess, onDelete, onCancel }: Props) {
  const { categories } = useCategoriesContext();
  const [category, setCategory] = useState<GraffitiCategory>(sighting.category);
  const [description, setDescription] = useState(sighting.description ?? '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(sighting.image_url ?? null);
  const [clearImage, setClearImage] = useState(false);
  const [editPassword, setEditPassword] = useState(() => sessionStorage.getItem('admin_pw') ?? '');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handlePhotoChange(file: File) {
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setClearImage(false);
  }

  function handlePhotoClear() {
    setImageFile(null);
    setPreview(null);
    setClearImage(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editPassword) {
      setError('Admin password required to save changes.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      let image_url: string | null = sighting.image_url ?? null;
      if (imageFile) {
        const webp = await resizeImageToWebP(imageFile);
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
        const { error: uploadError } = await supabase.storage
          .from('graffiti-images')
          .upload(filename, webp, { contentType: 'image/webp', upsert: false });
        if (uploadError) throw new Error(uploadError.message);
        image_url = supabase.storage.from('graffiti-images').getPublicUrl(filename).data.publicUrl;
      } else if (clearImage) {
        image_url = null;
      }

      const res = await fetch('/api/admin/edit', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-admin-password': editPassword,
        },
        body: JSON.stringify({ id: sighting.id, category, description: description.trim() || null, image_url }),
      });

      if (res.status === 401) throw new Error('Wrong admin password');
      if (!res.ok) throw new Error('Update failed');
      const data = await res.json();
      sessionStorage.setItem('admin_pw', editPassword);
      onSuccess(data as GraffitiSighting);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    const res = await fetch('/api/admin/delete', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admin-password': deletePassword },
      body: JSON.stringify({ id: sighting.id }),
    });
    if (res.status === 401) {
      setDeleteError('Wrong password');
      setDeleting(false);
      return;
    }
    if (!res.ok) {
      setDeleteError('Delete failed');
      setDeleting(false);
      return;
    }
    sessionStorage.setItem('admin_pw', deletePassword);
    onDelete(sighting.id);
  }

  function handleShowDelete() {
    setDeletePassword(sessionStorage.getItem('admin_pw') ?? '');
    setDeleteError(null);
    setConfirmDelete(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2 text-xs text-zinc-400 font-mono">
        <span>lat {sighting.lat}</span>
        <span>lng {sighting.lng}</span>
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
        <PhotoDropzone preview={preview} onChange={handlePhotoChange} onClear={handlePhotoClear} />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">Admin password</label>
        <input
          type="password"
          value={editPassword}
          onChange={(e) => setEditPassword(e.target.value)}
          placeholder="Required to save changes"
          className="w-full bg-white border border-zinc-200 rounded px-3 py-2 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-500"
        />
      </div>

      {error && <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded px-3 py-2">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2 rounded border border-zinc-200 text-zinc-500 hover:text-zinc-700 hover:border-zinc-400 transition-colors text-sm">
          Cancel
        </button>
        <button type="submit" disabled={loading || deleting}
          className="flex-1 py-2 rounded bg-zinc-900 text-white font-semibold text-sm hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      {/* Delete */}
      <div className="pt-2 border-t border-zinc-100">
        {confirmDelete ? (
          <div className="rounded-xl border border-red-100 bg-red-50 p-3 space-y-3">
            <p className="text-sm font-medium text-red-700 text-center">Delete this sighting?</p>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Admin password"
              autoFocus
              className="w-full border border-red-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400 placeholder-red-300"
            />
            {deleteError && <p className="text-red-500 text-xs text-center">{deleteError}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-600 hover:bg-zinc-50 transition-colors font-medium">
                No, keep it
              </button>
              <button type="button" onClick={handleDelete} disabled={deleting || !deletePassword}
                className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-sm text-white font-semibold transition-colors disabled:opacity-50">
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={handleShowDelete}
            className="w-full py-2 text-sm text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            Delete sighting
          </button>
        )}
      </div>
    </form>
  );
}
