import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_API_KEY
);

export async function getDrawingUrl(roundId: string): Promise<string | null> {
  const { data, error } = await supabase
    .storage
    .from('drawings')
    .getPublicUrl(`round_${roundId}.png`);

  if (error) {
    console.error('Error fetching drawing:', error);
    return null;
  }

  return data.publicUrl;
}

export default supabase;
