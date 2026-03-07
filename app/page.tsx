import { createClient } from '@/lib/supabase/server';
import HomeClient from './HomeClient';
import { GraffitiSighting } from '@/types';

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('graffiti_sightings')
    .select('*')
    .order('created_at', { ascending: false });

  return <HomeClient initial={(data ?? []) as GraffitiSighting[]} />;
}
