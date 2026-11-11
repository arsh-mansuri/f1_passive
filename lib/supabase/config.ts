export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL.startsWith("https://") && SUPABASE_ANON_KEY.length > 20,
);

/** Local-only escape hatch so the race player can be previewed without a
 *  Supabase project. Never set this in production. */
export const isDemoMode = process.env.PITWALL_DEMO === "1";
