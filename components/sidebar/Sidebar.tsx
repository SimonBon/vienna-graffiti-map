'use client';

import { useState, useEffect, useRef } from 'react';
import { GraffitiSighting, GraffitiCategory } from '@/types';
import { useCategoriesContext } from '@/contexts/CategoriesContext';

interface Props {
  sightings: GraffitiSighting[];
  activeFilter: GraffitiCategory | null;
  onFilterChange: (cat: GraffitiCategory | null) => void;
  onEdit: (sighting: GraffitiSighting) => void;
  onSelect: (sighting: GraffitiSighting) => void;
  onImageClick: (url: string) => void;
  onManageCategories: () => void;
  onAdminPanel: () => void;
  open: boolean;
  onToggle: () => void;
}

type SortKey = 'newest' | 'oldest' | 'category' | 'submitter';

const DISMISS_THRESHOLD = 120;

export default function Sidebar({ sightings, activeFilter, onFilterChange, onEdit, onSelect, onImageClick, onManageCategories, onAdminPanel, open, onToggle }: Props) {
  const { categories } = useCategoriesContext();
  const panelRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const currentDY = useRef(0);
  const onToggleRef = useRef(onToggle);
  useEffect(() => { onToggleRef.current = onToggle; });

  const [sort, setSort] = useState<SortKey>('newest');
  const [detail, setDetail] = useState<GraffitiSighting | null>(null);
  const [showStats, setShowStats] = useState(false);

  // Keep detail view in sync when sightings are updated/deleted externally
  useEffect(() => {
    if (!detail) return;
    const updated = sightings.find((s) => s.id === detail.id);
    if (updated) setDetail(updated);
    else setDetail(null);
  }, [sightings]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset detail when sidebar closes
  useEffect(() => {
    if (!open) setDetail(null);
  }, [open]);

  // Window-level touch handlers for drag tracking
  useEffect(() => {
    function onTouchMove(e: TouchEvent) {
      if (!isDragging.current || !panelRef.current) return;
      const dy = Math.max(0, e.touches[0].clientY - startY.current);
      currentDY.current = dy;
      panelRef.current.style.transform = `translateY(${dy}px)`;
    }

    function onTouchEnd() {
      if (!isDragging.current || !panelRef.current) return;
      isDragging.current = false;
      const dy = currentDY.current;
      currentDY.current = 0;

      if (dy > DISMISS_THRESHOLD) {
        panelRef.current.style.transform = '';
        panelRef.current.style.transition = '';
        onToggleRef.current();
      } else {
        panelRef.current.style.transition = 'transform 280ms ease-out';
        panelRef.current.style.transform = 'translateY(0)';
        const el = panelRef.current;
        setTimeout(() => {
          el.style.transform = '';
          el.style.transition = '';
        }, 280);
      }
    }

    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  function onDragHandleTouchStart(e: React.TouchEvent) {
    if (!panelRef.current) return;
    isDragging.current = true;
    startY.current = e.touches[0].clientY;
    currentDY.current = 0;
    panelRef.current.style.transition = 'none';
  }

  function handleSightingClick(s: GraffitiSighting) {
    setDetail(s);
    onSelect(s);
  }

  // Stats: submitter → count
  const submitterCounts: Record<string, number> = {};
  for (const s of sightings) {
    const name = s.submitted_by ?? 'Anonymous';
    submitterCounts[name] = (submitterCounts[name] ?? 0) + 1;
  }
  const topSubmitters = Object.entries(submitterCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const counts = Object.fromEntries(
    categories.map((cat) => [cat.value, sightings.filter((s) => s.category === cat.value).length])
  );

  const filtered = (activeFilter ? sightings.filter((s) => s.category === activeFilter) : sightings).slice().sort((a, b) => {
    if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sort === 'category') return a.category.localeCompare(b.category);
    if (sort === 'submitter') return (a.submitted_by ?? '').localeCompare(b.submitted_by ?? '');
    return 0;
  });

  return (
    <>
      {/* Desktop toggle */}
      <button
        onClick={onToggle}
        aria-label="Open sidebar"
        className={`hidden sm:flex fixed top-4 left-4 z-30 items-center gap-2 bg-white border border-zinc-200 shadow-md rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-all duration-300 ${
          open ? 'opacity-0 pointer-events-none -translate-x-2' : 'opacity-100 translate-x-0'
        }`}
      >
        <span className="text-base">☰</span>
        <span>Sightings</span>
      </button>

      {/* Mobile toggle */}
      <button
        onClick={onToggle}
        aria-label="Open sightings"
        className={`sm:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-white border border-zinc-200 shadow-lg rounded-full px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-all duration-300 ${
          open ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100 translate-y-0'
        }`}
      >
        <span>🎨</span>
        <span>{sightings.length} Sightings</span>
      </button>

      {/* Backdrop (mobile only) */}
      <div
        onClick={onToggle}
        className={`fixed inset-0 z-20 bg-black/20 transition-opacity duration-300 sm:hidden ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed z-20 flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out
          bottom-0 left-0 right-0 h-[68vh] rounded-t-2xl border-t border-zinc-100
          sm:top-0 sm:bottom-auto sm:right-auto sm:h-full sm:w-72 sm:rounded-none sm:border-r sm:border-t-0
          ${open ? 'translate-y-0 sm:translate-x-0' : 'translate-y-full sm:-translate-x-full sm:translate-y-0'}
        `}
      >
        {detail ? (
          /* ── Detail view ── */
          <>
            {/* Drag zone */}
            <div onTouchStart={onDragHandleTouchStart} className="shrink-0 touch-none">
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-zinc-300" />
              </div>
              <div className="flex items-center justify-between px-4 pt-3 pb-4 sm:pt-5 border-b border-zinc-100">
                <button
                  onClick={() => setDetail(null)}
                  className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
                >
                  ← Back
                </button>
                <button onClick={onToggle} aria-label="Close"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors">
                  ✕
                </button>
              </div>
            </div>

            {/* Detail content */}
            <div className="flex-1 overflow-y-auto">
              {detail.image_url && (
                <button
                  onClick={() => onImageClick(detail.image_url!)}
                  className="block w-full"
                >
                  <img
                    src={detail.image_url}
                    alt="Graffiti"
                    className="w-full h-48 object-cover"
                  />
                </button>
              )}

              <div className="px-4 py-4 space-y-3">
                {/* Category badge */}
                <div className="flex items-center gap-2">
                  {(() => {
                    const cat = categories.find((c) => c.value === detail.category) ?? { emoji: '❓', label: detail.category };
                    return (
                      <span className="inline-flex items-center gap-1.5 bg-zinc-100 text-zinc-700 px-3 py-1 rounded-full text-sm font-medium">
                        {cat.emoji} {cat.label}
                      </span>
                    );
                  })()}
                </div>

                {/* Description */}
                {detail.description && (
                  <p className="text-sm text-zinc-700 leading-relaxed">{detail.description}</p>
                )}

                {/* Meta */}
                <div className="space-y-1 text-xs text-zinc-400">
                  <p>
                    📅{' '}
                    {new Date(detail.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  {detail.submitted_by && <p>👤 {detail.submitted_by}</p>}
                  <p className="font-mono">
                    {Number(detail.lat).toFixed(5)}, {Number(detail.lng).toFixed(5)}
                  </p>
                </div>

                {/* Edit button */}
                <button
                  onClick={() => onEdit(detail)}
                  className="w-full mt-2 py-2 rounded-lg border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50 hover:border-zinc-400 transition-colors font-medium"
                >
                  Edit sighting
                </button>
              </div>
            </div>
          </>
        ) : (
          /* ── List view ── */
          <>
            {/* Drag zone — handle + header */}
            <div onTouchStart={onDragHandleTouchStart} className="shrink-0 touch-none">
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-zinc-300" />
              </div>
              <div className="flex items-center justify-between px-4 pt-3 pb-4 sm:pt-5 border-b border-zinc-100">
                <div>
                  <h1 className="font-bold text-zinc-900 text-base tracking-tight">🎨 Vienna Graffiti</h1>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {sightings.length} sighting{sightings.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button onClick={onToggle} aria-label="Close"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors">
                  ✕
                </button>
              </div>
            </div>

            {/* Stats section */}
            {topSubmitters.length > 0 && (
              <div className="px-4 py-2 border-b border-zinc-100 shrink-0">
                <button
                  onClick={() => setShowStats((v) => !v)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider py-1"
                >
                  <span>Top submitters</span>
                  <span>{showStats ? '▲' : '▼'}</span>
                </button>
                {showStats && (
                  <ul className="mt-1.5 space-y-1">
                    {topSubmitters.map(([name, count], i) => (
                      <li key={name} className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500">
                          <span className="text-zinc-300 mr-1.5">#{i + 1}</span>
                          {name}
                        </span>
                        <span className="font-semibold text-zinc-700">{count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Filter + Sort */}
            <div className="px-4 py-3 border-b border-zinc-100 shrink-0 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Filter</p>
                <div className="flex items-center gap-2">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    className="text-xs text-zinc-500 border border-zinc-200 rounded px-1.5 py-0.5 bg-white focus:outline-none focus:border-zinc-400"
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="category">Category</option>
                    <option value="submitter">Submitter</option>
                  </select>
                  <button onClick={onManageCategories}
                    className="text-xs text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded px-1.5 py-0.5 transition-colors">
                    Manage ›
                  </button>
                </div>
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
                  No sightings yet.<br />Hold the map to add one!
                </p>
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {filtered.map((s) => {
                    const cat = categories.find((c) => c.value === s.category) ?? { emoji: '❓', label: s.category, value: s.category };
                    return (
                      <li
                        key={s.id}
                        onClick={() => handleSightingClick(s)}
                        className="group flex gap-3 px-4 py-3 hover:bg-zinc-50 active:bg-zinc-50 transition-colors cursor-pointer"
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
                              className="sm:opacity-0 sm:group-hover:opacity-100 text-xs text-zinc-400 hover:text-zinc-700 border border-zinc-200 hover:border-zinc-400 rounded px-1.5 py-0.5 transition-all shrink-0">
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
          </>
        )}
      </div>
    </>
  );
}
