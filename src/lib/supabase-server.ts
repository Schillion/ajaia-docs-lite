import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

/**
 * Service-role Supabase client. Server-only by construction (the
 * `server-only` import throws if this module is ever pulled into a client
 * bundle). Authorization is enforced entirely in application code
 * (see src/lib/access-control.ts) rather than via Postgres RLS, since this
 * single service-role client is the only thing that talks to the database.
 */
export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.example)."
    );
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  return cachedClient;
}
