// src/lib/supabaseClients.ts
import {
  createClient,
  type SupabaseClient,
  type RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

/**
 * Single client per app/site.
 * Because each app is on a different Netlify domain, storageKey collisions are not a problem,
 * but we still use persona-specific keys for clarity.
 */
const URL = import.meta.env.VITE_SUPABASE_URL!;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY!;

const cache: Partial<Record<"customer" | "admin" | "kitchen" | "staff", SupabaseClient>> = {};

function make(persona: "customer" | "admin" | "kitchen" | "staff"): SupabaseClient {
  if (cache[persona]) return cache[persona]!;
  const storageKey =
    persona === "customer" ? "sb-customer" :
    persona === "admin"    ? "sb-admin"    :
    persona === "kitchen"  ? "sb-kitchen"  : "sb-staff";

  const client = createClient(URL, ANON, {
    auth: {
      storageKey,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  cache[persona] = client;
  return client;
}

export const getCustomerClient = () => make("customer");
export const getAdminClient    = () => make("admin");
export const getKitchenClient  = () => make("kitchen");
export const getStaffClient    = () => make("staff");

export type { RealtimePostgresChangesPayload };
