import { useEffect, useState } from "react";
import type { SupabaseClient, Session } from "@supabase/supabase-js";

export type StaffRow = {
  user_id: string;
  role: "admin" | "manager" | "kitchen";
  created_at?: string;
};

export function useStaff(client: SupabaseClient) {
  const [session, setSession] = useState<Session | null>(null);
  const [staff, setStaff] = useState<StaffRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    client.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session ?? null);
    });

    const { data: sub } = client.auth.onAuthStateChange((_e, s) => {
      if (!active) return;
      setSession(s);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [client]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setStaff(null);
      if (!session) {
        setLoading(false);
        return;
      }
      const { data, error } = await client
        .from("staff")
        .select("user_id, role, created_at")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (!cancelled) {
        if (error) {
          // eslint-disable-next-line no-console
          console.warn("staff lookup error:", error.message);
          setStaff(null);
        } else {
          setStaff((data as any) ?? null);
        }
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [client, session?.user?.id]);

  return { session, staff, loading, client };
}
