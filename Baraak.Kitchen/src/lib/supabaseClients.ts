// src/lib/supabaseClients.ts
import {
  createClient,
  type SupabaseClient,
  type RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

/**
 * One Supabase client per persona, shared across HMR reloads.
 * This avoids the “Multiple GoTrueClient instances” warning.
 */
const URL = import.meta.env.VITE_SUPABASE_URL!;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY!;

type Persona = "customer" | "admin" | "kitchen" | "staff";
type Registry = Partial<Record<Persona, SupabaseClient>>;

// global cache across HMR
const g = globalThis as unknown as { __sbClients?: Registry };
if (!g.__sbClients) g.__sbClients = {};
const registry: Registry = g.__sbClients;

function storageKeyFor(persona: Persona) {
  switch (persona) {
    case "customer": return "sb-customer";
    case "admin": return "sb-admin";
    case "kitchen": return "sb-kitchen";
    case "staff": return "sb-staff";
  }
}

function make(persona: Persona): SupabaseClient {
  const existing = registry[persona];
  if (existing) return existing;

  const client = createClient(URL, ANON, {
    auth: {
      storageKey: storageKeyFor(persona),
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  registry[persona] = client;
  return client;
}

export const getCustomerClient = () => make("customer");
export const getAdminClient = () => make("admin");
export const getKitchenClient = () => make("kitchen");
export const getStaffClient = () => make("staff");

// Re-export for convenience where needed
export type { RealtimePostgresChangesPayload };
