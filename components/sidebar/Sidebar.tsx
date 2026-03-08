'use client';

import { GraffitiSighting, GraffitiCategory } from '@/types';
import { useCategoriesContext } from '@/contexts/CategoriesContext';

interface Props {
  sightings: GraffitiSighting[];
  activeFilter: GraffitiCategory | null;
  onFilterChange: (cat: GraffitiCategory | null) => void;
  onEdit: (sighting: GraffitiSighting) => void;
  onSelect: (sighting: GraffitiSighting) => void;
  onManageCategories: () => void;
  onAdminPanel: () => void;
  open: boolean;
  onToggle: () => void;
}

export default function Sidebar({ sightings, activeFilter, onFilterChange, onEdit, onSelect, onManageCategories, onAdminPanel, open, onToggle }: Props) {
  const { categories } = useCategoriesContext();

  const counts = Object.fromEntries(
    categories.map((cat) => [cat.value, sightings.filter((s) => s.category === cat.value).length])
  );

  const filtered = activeFilter
    ? sightings.filter((s) => s.category === activeFilter)
    : sightings;

  return (
    <>
      <button
        onClick={onToggle}
        aria-label="Open sidebar"
        className={`fixed top-4 left-4 z-30 flex items-center gap-2 bg-white border border-zinc-200 shadow-md rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-all duration-300 ${
          open ? 'opacity-0 pointer-events-none -translate-x-2' : 'opacity-100 translate-x-0'
        }`}
      >
        <span className="text-base">☰</span>
        <span>Sightings</span>
      </button>

      <div
        onClick={onToggle}
        className={`fixed inset-0 z-20 bg-black/20 transition-opacity duration-300 sm:hidden ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      <div
        className={`fixed top-0 left-0 h-full w-72 z-20 flex flex-col bg-white border-r border-zinc-100 shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-5 pb-4 border-b border-zinc-100 shrink-0">
          <div>
            <h1 className="font-bold text-zinc-900 text-base tracking-tight">🎨 Vienna Graffiti</h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              {sightings.length} sighting{sightings.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onToggle} aria-label="Close sidebar"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors">
            ✕
          </button>
        </div>

        {/* Category filter */}
        <div className="px-4 py-3 border-b border-zinc-100 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Filter</p>
            <button onClick={onManageCategories}
              className="text-xs text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded px-1.5 py-0.5 transition-colors">
              Manage ›
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => onFilterChange(null)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                activeFilter === null ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-500 hover:border-zinc-400'
              }`}>
              All ({sightings.length})
            </button>
            {categories.map((cat) =>
              counts[cat.value] > 0 ? (
                <button key={cat.value}
                  onClick={() => onFilterChange(activeFilter === cat.value ? null : cat.value)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    activeFilter === cat.value ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-500 hover:border-zinc-400'
                  }`}>
                  {cat.emoji} {cat.label} ({counts[cat.value]})
                </button>
              ) : null
            )}
          </div>
        </div>

        {/* Sightings list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center mt-8 px-4">
              No sightings yet.<br />Tap the map to add one!
            </p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {filtered.map((s) => {
                const cat = categories.find((c) => c.value === s.category) ?? { emoji: '❓', label: s.category, value: s.category };
                return (
                  <li
                    key={s.id}
                    onClick={() => onSelect(s)}
                    className="group flex gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors cursor-pointer"
                  >
                    {s.image_url ? (
                      <img src={s.image_url} alt={cat.label}
                        className="w-12 h-12 rounded-lg object-cover shrink-0 border border-zinc-100" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-zinc-100 flex items-center justify-center text-2xl shrink-0">
                        {cat.emoji}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">{cat.label}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); onEdit(s); }}
                          className="opacity-0 group-hover:opacity-100 text-xs text-zinc-400 hover:text-zinc-700 border border-zinc-200 hover:border-zinc-400 rounded px-1.5 py-0.5 transition-all shrink-0">
                          Edit
                        </button>
                      </div>
                      {s.description && (
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{s.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-zinc-300">
                          {new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </p>
                        {s.submitted_by && (
                          <p className="text-xs text-zinc-400">· {s.submitted_by}</p>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Admin button */}
        <div className="px-4 py-3 border-t border-zinc-100 shrink-0">
          <button onClick={onAdminPanel}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-colors">
            <span>🔒</span>
            <span>Admin</span>
          </button>
        </div>
      </div>
    </>
  );
}
