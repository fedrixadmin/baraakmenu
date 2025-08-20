// src/pages/Kitchen.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  Clock,
  Utensils,
  Search,
  ChevronRight,
  CheckCircle2,
  TimerReset,
  RefreshCcw,
} from "lucide-react";

type KItem = {
  id: string;
  quantity: number;
  products?: { name: string | null } | null;
};

type KOrder = {
  id: string;
  created_at: string;
  status: "pending" | "accepted" | "preparing" | "ready" | "served" | "cancelled";
  table_number: number | null;
  order_items: KItem[];
};

const STATUS_FLOW: Record<KOrder["status"], KOrder["status"]> = {
  pending: "accepted",
  accepted: "preparing",
  preparing: "ready",
  ready: "served",
  served: "served",
  cancelled: "cancelled",
};

function since(ts: string): string {
  const sec = Math.max(0, Math.floor((Date.now() - new Date(ts).getTime()) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Kitchen() {
  // UI state
  const [filter, setFilter] =
    useState<"all" | "accepted" | "preparing" | "ready">("all");
  const [search, setSearch] = useState("");
  // Data
  const [orders, setOrders] = useState<KOrder[]>([]);
  const lastIdsRef = useRef<Set<string>>(new Set());
  // timer tick (for elapsed)
  const [, force] = useState(0);

  // gentle ding on new order
  const dingRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    dingRef.current = new Audio("/sounds/ding.mp3"); // optional; safe if not found
    dingRef.current.volume = 0.25;
  }, []);

  async function load() {
    const base = supabase
      .from("orders")
      .select(
        "id,created_at,status,table_number,order_items(id,quantity,products(name))",
      )
      .in("status", ["accepted", "preparing", "ready"])
      .order("created_at", { ascending: true });

    const { data, error } = await base;
    if (error) {
      console.error(error);
      return;
    }

    // play ding if there are new ids we didn't have before
    const incoming = new Set((data ?? []).map((o) => o.id));
    let newOrderArrived = false;
    for (const id of incoming) if (!lastIdsRef.current.has(id)) newOrderArrived = true;
    lastIdsRef.current = incoming;
    if (newOrderArrived) dingRef.current?.play().catch(() => {});

    setOrders((data ?? []) as KOrder[]);
  }

  async function advance(o: KOrder) {
    const to = STATUS_FLOW[o.status];
    if (to === o.status) return;
    const { error } = await supabase.from("orders").update({ status: to }).eq("id", o.id);
    if (error) return alert(error.message);
  }

  function resetBoard() {
    load();
  }

  // initial + realtime
  useEffect(() => {
    load();
    const ch = supabase
      .channel("kds:orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, load)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items" },
        load,
      )
      .subscribe();
    const t = setInterval(() => force((x) => x + 1), 1000);
    return () => {
      ch.unsubscribe();
      clearInterval(t);
    };
  }, []);

  const visible = useMemo(() => {
    let out = orders;
    if (filter !== "all") out = out.filter((o) => o.status === filter);
    const s = search.trim().toLowerCase();
    if (s) {
      out = out.filter(
        (o) =>
          o.id.slice(0, 8).includes(s) ||
          String(o.table_number ?? "").includes(s) ||
          o.order_items.some((it) =>
            (it.products?.name || "").toLowerCase().includes(s),
          ),
      );
    }
    return out;
  }, [orders, filter, search]);

  const counts = useMemo(() => {
    const c = { all: orders.length, accepted: 0, preparing: 0, ready: 0 };
    for (const o of orders) {
      if (o.status === "accepted") c.accepted++;
      if (o.status === "preparing") c.preparing++;
      if (o.status === "ready") c.ready++;
    }
    return c;
  }, [orders]);

  return (
    <div className="max-w-screen-2xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="card p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Utensils className="w-5 h-5 text-gold" />
          <h1 className="text-lg font-bold">Kitchen Orders</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-black/40 absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              className="pl-8 pr-3 py-2 rounded-xl border border-black/10 w-60"
              placeholder="Search order, table or item"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-ghost" onClick={resetBoard}>
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {([
          ["all", `All (${counts.all})`],
          ["accepted", `Accepted (${counts.accepted})`],
          ["preparing", `Preparing (${counts.preparing})`],
          ["ready", `Ready (${counts.ready})`],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-sm border ${
              filter === key
                ? "border-gold bg-gold/10 text-black"
                : "border-black/10 text-black/70"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {visible.map((o) => (
          <div key={o.id} className="card p-4 flex flex-col">
            {/* Top bar */}
            <div className="flex items-center justify-between">
              <div className="font-semibold">#{o.id.slice(0, 8)}</div>
              <div className="text-xs inline-flex items-center gap-1 text-black/60">
                <Clock className="w-3.5 h-3.5" />
                {since(o.created_at)}
              </div>
            </div>

            {/* Table + status */}
            <div className="mt-1 flex items-center justify-between">
              <div className="text-sm text-black/70">
                Table: <span className="font-medium">{o.table_number ?? "-"}</span>
              </div>
              <span className="px-2 py-1 rounded-full text-xs bg-black/5">
                {o.status}
              </span>
            </div>

            {/* Items */}
            <div className="mt-3 space-y-1.5">
              {o.order_items.map((it) => (
                <div
                  key={it.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="line-clamp-1">
                    {it.products?.name || "Item"}{" "}
                  </div>
                  <div className="font-semibold">× {it.quantity}</div>
                </div>
              ))}
              {o.order_items.length === 0 && (
                <div className="text-sm text-black/50">No items</div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-2">
              {o.status !== "served" && o.status !== "cancelled" ? (
                <button
                  className="btn btn-primary flex-1 inline-flex items-center justify-center gap-1"
                  onClick={() => advance(o)}
                  title="Advance status"
                >
                  {o.status === "ready" ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Mark Served
                    </>
                  ) : (
                    <>
                      <ChevronRight className="w-4 h-4" /> Advance
                    </>
                  )}
                </button>
              ) : (
                <button className="btn btn-ghost flex-1" disabled>
                  <TimerReset className="w-4 h-4" /> Done
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty */}
      {visible.length === 0 && (
        <div className="text-black/50">No active tickets.</div>
      )}
    </div>
  );
}
