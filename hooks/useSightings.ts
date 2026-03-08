'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { GraffitiSighting } from '@/types';

export function useSightings(initial: GraffitiSighting[]) {
  const [sightings, setSightings] = useState<GraffitiSighting[]>(initial);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('graffiti_sightings_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'graffiti_sightings' },
        (payload) => {
          const row = payload.new as GraffitiSighting;
          if (row.status === 'approved') {
            setSightings((prev) =>
              prev.find((s) => s.id === row.id)
                ? prev.map((s) => (s.id === row.id ? row : s))
                : [row, ...prev]
            );
          } else {
            setSightings((prev) => prev.filter((s) => s.id !== row.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function addSighting(sighting: GraffitiSighting) {
    setSightings((prev) =>
      prev.find((s) => s.id === sighting.id) ? prev : [sighting, ...prev]
    );
  }

  function updateSighting(updated: GraffitiSighting) {
    setSightings((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  function deleteSighting(id: string) {
    setSightings((prev) => prev.filter((s) => s.id !== id));
  }

  return { sightings, setSightings, addSighting, updateSighting, deleteSighting };
}
