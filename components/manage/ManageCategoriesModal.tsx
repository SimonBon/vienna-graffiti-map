'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { EmojiClickData } from 'emoji-picker-react';
import { useCategoriesContext } from '@/contexts/CategoriesContext';
import { GraffitiSighting } from '@/types';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

interface Props {
  sightings: GraffitiSighting[];
  onClose: () => void;
}

export default function ManageCategoriesModal({ sightings, onClose }: Props) {
  const { categories, addCategory, deleteCategory } = useCategoriesContext();
  const [label, setLabel] = useState('');
  const [emoji, setEmoji] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') { if (showPicker) setShowPicker(false); else onClose(); } }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, showPicker]);

  const usedValues = new Set(sightings.map((s) => s.category));

  function slugify(str: string) {
    return str.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  function handleEmojiClick(data: EmojiClickData) {
    setEmoji(data.emoji);
    setShowPicker(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim() || !emoji.trim()) return;
    const value = slugify(label);
    if (!value) { setError('Label must contain letters or numbers'); return; }
    if (categories.find((c) => c.value === value)) { setError('A category with this name already exists'); return; }
    setAdding(true);
    setError(null);
    try {
      await addCategory({ value, label: label.trim(), emoji: emoji.trim() });
      setLabel('');
      setEmoji('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add category');
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(value: string) {
    setDeletingId(value);
    try {
      await deleteCategory(value);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full sm:max-w-md bg-white border border-zinc-200 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-zinc-100 shrink-0">
          <h2 className="text-lg font-bold text-zinc-900">Manage Categories</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {/* Existing categories */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Current categories</p>
            <ul className="space-y-1">
              {categories.map((cat) => {
                const inUse = usedValues.has(cat.value);
                return (
                  <li key={cat.value} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-zinc-50">
                    <span className="text-xl w-7 text-center">{cat.emoji}</span>
                    <span className="flex-1 text-sm font-medium text-zinc-700">{cat.label}</span>
                    {inUse ? (
                      <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
                        {sightings.filter(s => s.category === cat.value).length} sightings
                      </span>
                    ) : (
                      <button
                        onClick={() => handleDelete(cat.value)}
                        disabled={deletingId === cat.value}
                        className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 rounded px-2 py-0.5 transition-colors disabled:opacity-50"
                      >
                        {deletingId === cat.value ? '…' : 'Delete'}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Add new */}
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Add new category</p>
            <form onSubmit={handleAdd} className="space-y-3">
              {/* Emoji picker */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Emoji</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowPicker((v) => !v)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                      showPicker ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 hover:border-zinc-400'
                    }`}
                  >
                    {emoji ? (
                      <>
                        <span className="text-2xl leading-none">{emoji}</span>
                        <span className="text-zinc-500">Change emoji</span>
                      </>
                    ) : (
                      <>
                        <span className="text-xl">😀</span>
                        <span className="text-zinc-500">Pick an emoji…</span>
                      </>
                    )}
                  </button>

                  {showPicker && (
                    <div className="absolute top-full left-0 mt-1 z-10 shadow-xl rounded-xl overflow-hidden">
                      <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        skinTonesDisabled
                        searchPlaceholder="Search emojis…"
                        width={320}
                        height={380}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Label */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Name</label>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Throw-Up"
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={adding || !label.trim() || !emoji.trim()}
                className="w-full py-2 rounded-lg bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {adding ? 'Adding…' : 'Add category'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
