// src/pages/Kitchen.tsx
import { useEffect, useState } from "react";
import { getKitchenClient } from "../lib/supabaseClients";
import { Clock, Utensils } from "lucide-react";

type KOrder = {
  id: string;
  created_at: string;
  status: string;
  table_number: number | null;
};

export default function Kitchen() {
  const sb = getKitchenClient();
  const [orders, setOrders] = useState<KOrder[]>([]);

  async function load() {
    const { data } = await sb.from("orders")
      .select("id,created_at,status,table_number")
      .in("status", ["accepted","preparing","ready"])
      .order("created_at", { ascending: true });
    setOrders(data ?? []);
  }

  async function next(o: KOrder) {
    const map: Record<string,string> = { accepted: "preparing", preparing: "ready", ready: "served" };
    const to = map[o.status] || "served";
    const { error } = await sb.from("orders").update({ status: to }).eq("id", o.id);
    if (error) return alert(error.message);
    load();
  }

  useEffect(() => {
    load();
    const ch = sb.channel("kitchen:orders")
      .on("postgres_changes", { schema: "public", table: "orders", event: "*" }, load)
      .subscribe();
    return () => { ch.unsubscribe(); };
  }, [sb]);

  return (
    <div className="max-w-screen-xl mx-auto p-4">
      <div className="mb-4 flex items-center gap-2">
        <Utensils className="w-5 h-5 text-gold" />
        <h1 className="text-xl font-bold">Kitchen Orders</h1>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {orders.map(o => (
          <div key={o.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">#{o.id.slice(0,8)}</div>
              <div className="text-xs inline-flex items-center gap-1 text-black/60">
                <Clock className="w-3.5 h-3.5" />
                {new Date(o.created_at).toLocaleTimeString()}
              </div>
            </div>
            <div className="text-sm text-black/60 mt-1">Table: {o.table_number ?? "-"}</div>
            <div className="mt-3">
              <span className="px-2 py-1 rounded-full text-xs bg-black/5">{o.status}</span>
            </div>
            <button className="mt-3 btn btn-primary w-full" onClick={() => next(o)}>
              Advance
            </button>
          </div>
        ))}
        {orders.length === 0 && <div className="text-black/50">No active tickets.</div>}
      </div>
    </div>
  );
}
