'use client';

import { useEffect, useState, useCallback } from 'react';
import { GraffitiSighting } from '@/types';
import { useCategoriesContext } from '@/contexts/CategoriesContext';

const SESSION_KEY = 'admin_pw';

interface Props {
  onApprove: (sighting: GraffitiSighting) => void;
  onClose: () => void;
}

export default function AdminPanel({ onApprove, onClose }: Props) {
  const { categoryMap } = useCategoriesContext();
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem(SESSION_KEY));
  const [pending, setPending] = useState<GraffitiSighting[]>([]);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchPending = useCallback(async (pw: string) => {
    setLoading(true);
    const res = await fetch('/api/admin/pending', {
      headers: { 'x-admin-password': pw },
    });
    setLoading(false);
    if (res.status === 401) { setLoginError('Wrong password'); setAuthed(false); return; }
    const data = await res.json();
    setPending(data);
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) fetchPending(stored);
  }, [fetchPending]);

  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    const res = await fetch('/api/admin/pending', {
      headers: { 'x-admin-password': password },
    });
    if (res.status === 401) { setLoginError('Wrong password'); return; }
    sessionStorage.setItem(SESSION_KEY, password);
    setAuthed(true);
    const data = await res.json();
    setPending(data);
  }

  async function handleApprove(id: string) {
    setActionId(id);
    const pw = sessionStorage.getItem(SESSION_KEY)!;
    const res = await fetch('/api/admin/approve', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admin-password': pw },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      const sighting = pending.find((s) => s.id === id);
      if (sighting) onApprove({ ...sighting, status: 'approved' });
      setPending((prev) => prev.filter((s) => s.id !== id));
    }
    setActionId(null);
  }

  async function handleReject(id: string) {
    setActionId(id);
    const pw = sessionStorage.getItem(SESSION_KEY)!;
    await fetch('/api/admin/reject', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admin-password': pw },
      body: JSON.stringify({ id }),
    });
    setPending((prev) => prev.filter((s) => s.id !== id));
    setActionId(null);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full sm:max-w-lg bg-white border border-zinc-200 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-zinc-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">Admin Panel</h2>
            {authed && (
              <p className="text-xs text-zinc-400 mt-0.5">
                {pending.length} submission{pending.length !== 1 ? 's' : ''} waiting
              </p>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!authed ? (
            <form onSubmit={handleLogin} className="space-y-3 max-w-xs mx-auto mt-4">
              <p className="text-sm text-zinc-500 text-center">Enter your admin password</p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoFocus
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
              />
              {loginError && <p className="text-red-500 text-sm text-center">{loginError}</p>}
              <button type="submit"
                className="w-full py-2 rounded-lg bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-700 transition-colors">
                Log in
              </button>
            </form>
          ) : loading ? (
            <p className="text-sm text-zinc-400 text-center mt-8">Loading…</p>
          ) : pending.length === 0 ? (
            <div className="text-center mt-8 space-y-1">
              <p className="text-2xl">✅</p>
              <p className="text-sm font-medium text-zinc-700">All caught up!</p>
              <p className="text-xs text-zinc-400">No pending submissions.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {pending.map((s) => {
                const cat = categoryMap[s.category] ?? { emoji: '❓', label: s.category };
                const busy = actionId === s.id;
                return (
                  <li key={s.id} className="border border-zinc-100 rounded-xl overflow-hidden">
                    {s.image_url && (
                      <img src={s.image_url} alt={cat.label} className="w-full h-40 object-cover" />
                    )}
                    <div className="p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cat.emoji}</span>
                        <span className="text-sm font-semibold text-zinc-800">{cat.label}</span>
                        {s.submitted_by && <span className="text-xs text-zinc-400">by {s.submitted_by}</span>}
                        <span className="ml-auto text-xs text-zinc-400 font-mono">
                          {Number(s.lat).toFixed(4)}, {Number(s.lng).toFixed(4)}
                        </span>
                      </div>
                      {s.description && <p className="text-xs text-zinc-500">{s.description}</p>}
                      <p className="text-xs text-zinc-300">
                        {new Date(s.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => handleReject(s.id)} disabled={busy}
                          className="flex-1 py-1.5 rounded-lg border border-zinc-200 text-sm text-zinc-500 hover:bg-zinc-50 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-40">
                          {busy ? '…' : 'Reject'}
                        </button>
                        <button onClick={() => handleApprove(s.id)} disabled={busy}
                          className="flex-1 py-1.5 rounded-lg bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-700 transition-colors disabled:opacity-40">
                          {busy ? '…' : '✓ Approve'}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
