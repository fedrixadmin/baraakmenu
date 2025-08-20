// D:\Baraak.Customer\src\lib\supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL!;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY!;
const storageKey = import.meta.env.VITE_STORAGE_KEY || "sb-customer";

export const supabase = createClient(url, anon, {
  auth: {
    storageKey,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
