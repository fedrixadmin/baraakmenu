import { useEffect, useMemo, useState } from "react";
import { getStaffClient } from "../../../lib/supabaseClients";

type Props = { search: string };

type OrderRow = {
  id: string;
  created_at: string;
  status: string;
  grand_total: number | null;
};

function startOf(range: "today" | "week" | "month") {
  const d = new Date();
  if (range === "today") {
    d.setHours(0,0,0,0);
  } else if (range === "week") {
    const day = d.getDay(); // 0=Sun
    const diff = (day + 6) % 7; // Monday as start
    d.setDate(d.getDate() - diff);
    d.setHours(0,0,0,0);
  } else {
    d.setDate(1);
    d.setHours(0,0,0,0);
  }
  return d.toISOString();
}

export default function Reports({ }: Props) {
  const sb = getStaffClient();
  const [range, setRange] = useState<"today"|"week"|"month">("today");
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const from = startOf(range);
      const { data } = await sb
        .from("orders")
        .select("id,created_at,status,grand_total")
        .gte("created_at", from)
        .order("created_at", { ascending: false });
      setRows((data ?? []) as unknown as OrderRow[]);
      setLoading(false);
    })();
  }, [sb, range]);

  const { totalRevenue, orderCount, avgTicket } = useMemo(() => {
    const paid = rows.filter(r => (r.status || "").toLowerCase() !== "cancelled");
    const rev = paid.reduce((s, r) => s + Number(r.grand_total || 0), 0);
    const cnt = paid.length;
    return {
      totalRevenue: rev,
      orderCount: cnt,
      avgTicket: cnt ? rev / cnt : 0
    };
  }, [rows]);

  return (
    <div className="space-y-3">
      <div className="card p-3 flex items-center gap-2">
        <div className="font-semibold">Reports</div>
        <div className="ml-auto flex items-center gap-2">
          <button
            className={`px-3 py-1 rounded-lg text-sm ${range === "today" ? "bg-gold text-white" : "bg-black/5"}`}
            onClick={() => setRange("today")}
          >Today</button>
          <button
            className={`px-3 py-1 rounded-lg text-sm ${range === "week" ? "bg-gold text-white" : "bg-black/5"}`}
            onClick={() => setRange("week")}
          >This Week</button>
          <button
            className={`px-3 py-1 rounded-lg text-sm ${range === "month" ? "bg-gold text-white" : "bg-black/5"}`}
            onClick={() => setRange("month")}
          >This Month</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4">
          <div className="text-xs text-black/60">Revenue</div>
          <div className="text-2xl font-extrabold">AED {totalRevenue.toFixed(2)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-black/60">Orders</div>
          <div className="text-2xl font-extrabold">{orderCount}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-black/60">Avg Ticket</div>
          <div className="text-2xl font-extrabold">AED {avgTicket.toFixed(2)}</div>
        </div>
      </div>

      <div className="card p-3">
        <div className="font-semibold mb-2">Recent Orders ({rows.length}) {loading && <span className="text-xs text-black/50">(loading…)</span>}</div>
        <div className="divide-y">
          {rows.slice(0, 20).map(r => (
            <div key={r.id} className="py-2 flex items-center justify-between">
              <div>
                <div className="font-medium">#{r.id.slice(0,8)}</div>
                <div className="text-xs text-black/60">{new Date(r.created_at).toLocaleString()}</div>
              </div>
              <div className="text-sm">{r.status}</div>
              <div className="text-sm font-semibold">AED {(r.grand_total ?? 0).toFixed(2)}</div>
            </div>
          ))}
          {rows.length === 0 && !loading && <div className="py-6 text-sm text-black/60">No orders in this range.</div>}
        </div>
      </div>
    </div>
  );
}
