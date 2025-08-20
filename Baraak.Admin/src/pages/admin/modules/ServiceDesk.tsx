// src/pages/admin/modules/ServiceDesk.tsx
import { useEffect, useMemo, useState } from "react";
import { getStaffClient } from "../../../lib/supabaseClients";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { Bell, Receipt, Check, Clock } from "lucide-react";

type Props = {
  search: string;
  /** "dashboard" shows compact cards; "desk" shows full list */
  mode?: "dashboard" | "desk";
};

type RequestRow = {
  id: string;
  table_number: number | null;
  table_token: string | null;
  kind: "WAITER" | "BILL";
  status: "PENDING" | "ACKNOWLEDGED";
  note: string | null;
  created_at: string;
  seconds_waiting: number;
};

type Toast = { id: string; text: string; kind: "WAITER"|"BILL"; table?: string; };

export default function ServiceDesk({ search, mode = "desk" }: Props) {
  const sb = getStaffClient();
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  async function load() {
    const q = sb.from("v_open_service_requests").select("*").order("created_at", { ascending: true });
    const { data } = await q;
    setRows((data ?? []) as unknown as RequestRow[]);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const ch = sb
      .channel("svc-requests")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "table_service_requests" },
        (payload: RealtimePostgresChangesPayload<any>) => {
          // Show toast only on new PENDING request
          if (payload.eventType === "INSERT") {
            const r = payload.new as any;
            if (String(r.status).toUpperCase() === "PENDING") {
              setToasts((ts) => [
                ...ts,
                {
                  id: r.id,
                  text: r.kind === "WAITER" ? "Waiter requested" : "Bill requested",
                  kind: r.kind,
                  table: r.table_number ? `Table ${r.table_number}` : r.table_token || ""
                }
              ]);
            }
          }
          // Always reload list
          load();
        }
      )
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r =>
      (r.table_number?.toString() || "").includes(s) ||
      (r.table_token || "").toLowerCase().includes(s) ||
      r.kind.toLowerCase().includes(s) ||
      (r.note || "").toLowerCase().includes(s)
    );
  }, [rows, search]);

  async function acknowledge(id: string) {
    await sb.from("table_service_requests").update({ status: "ACKNOWLEDGED" }).eq("id", id);
  }
  async function resolve(id: string) {
    await sb.from("table_service_requests").update({ status: "RESOLVED", resolved_at: new Date().toISOString() }).eq("id", id);
  }
  function dismissToast(id: string) {
    setToasts(ts => ts.filter(t => t.id !== id));
  }

  return (
    <>
      {/* Toasts */}
      <div className="fixed right-4 top-4 z-50 space-y-2">
        {toasts.map(t => (
          <div key={t.id} className="rounded-xl shadow-lg bg-white border border-black/10 p-3 w-72">
            <div className="flex items-center gap-2">
              {t.kind === "WAITER" ? <Bell className="w-4 h-4 text-gold" /> : <Receipt className="w-4 h-4 text-gold" />}
              <div className="font-semibold text-sm">{t.text}</div>
            </div>
            <div className="text-xs text-black/60 mt-1">{t.table}</div>
            <div className="flex gap-2 mt-2">
              <button className="px-3 py-1 rounded-lg bg-black/5 text-sm" onClick={() => dismissToast(t.id)}>Dismiss</button>
            </div>
          </div>
        ))}
      </div>

      {/* List / dashboard cards */}
      {mode === "dashboard" ? (
        <div className="grid grid-cols-3 gap-3">
          {filtered.slice(0, 6).map(r => (
            <div key={r.id} className="card p-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{r.table_number ? `Table ${r.table_number}` : r.table_token}</div>
                <div className="text-xs text-black/60 inline-flex items-center gap-1"><Clock className="w-3 h-3" />{r.seconds_waiting}s</div>
              </div>
              <div className="text-sm text-black/70 mt-1">{r.kind}</div>
              <div className="mt-2 flex gap-2">
                <button className="px-3 py-1 rounded-lg bg-black/5 text-sm" onClick={() => acknowledge(r.id)}>Acknowledge</button>
                <button className="px-3 py-1 rounded-lg bg-gold text-white text-sm" onClick={() => resolve(r.id)}>
                  <Check className="w-3.5 h-3.5 inline mr-1" />Resolve
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="card p-3">No open requests.</div>}
        </div>
      ) : (
        <div className="card p-3">
          <div className="font-semibold mb-2">Open Requests</div>
          <div className="divide-y">
            {filtered.map(r => (
              <div key={r.id} className="py-2 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full grid place-items-center bg-gold/15 text-gold">
                  {r.kind === "WAITER" ? <Bell className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium">
                    {r.table_number ? `Table ${r.table_number}` : r.table_token}
                    <span className="ml-2 text-xs text-black/60">{r.kind}</span>
                  </div>
                  <div className="text-xs text-black/60">{new Date(r.created_at).toLocaleString()} • {r.seconds_waiting}s</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 rounded-lg bg-black/5 text-sm" onClick={() => acknowledge(r.id)}>Acknowledge</button>
                  <button className="px-3 py-1 rounded-lg bg-gold text-white text-sm" onClick={() => resolve(r.id)}>
                    <Check className="w-3.5 h-3.5 inline mr-1" />Resolve
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="py-6 text-sm text-black/60">No open requests.</div>}
          </div>
        </div>
      )}
    </>
  );
}
