import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Browser client (uses anon key — safe to expose)
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!url || !anonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(url, anonKey);
}

// Server client (uses service role key — never expose to browser)
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase server environment variables');
  }

  return createClient(url, serviceKey);
}

// Singleton browser client for use in components
let browserClient: SupabaseClient | null = null;

export function getSupabase() {
  if (!browserClient) {
    browserClient = createBrowserClient();
  }
  return browserClient;
}
