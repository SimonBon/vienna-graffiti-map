'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { GraffitiSighting } from '@/types';

export function useSightings(initial: GraffitiSighting[]) {
  const [sightings, setSightings] = useState<GraffitiSighting[]>(initial);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('graffiti_sightings_inserts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'graffiti_sightings' },
        (payload) => {
          setSightings((prev) => [payload.new as GraffitiSighting, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function updateSighting(updated: GraffitiSighting) {
    setSightings((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  function deleteSighting(id: string) {
    setSightings((prev) => prev.filter((s) => s.id !== id));
  }

  return { sightings, setSightings, updateSighting, deleteSighting };
}
