import { useEffect, useMemo, useState } from "react";
import { getStaffClient } from "../../../lib/supabaseClients";

type Props = { search: string; };
type Order = { id: string; created_at: string; status: string; grand_total: number | null; };

export default function Orders({ search }: Props) {
  const sb = getStaffClient();
  const [rows, setRows] = useState<Order[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await sb.from("orders").select("id,created_at,status,grand_total").order("created_at", { ascending: false }).limit(100);
      setRows((data ?? []) as unknown as Order[]);
    })();
  }, [sb]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r =>
      r.id.toLowerCase().includes(s) ||
      (r.status || "").toLowerCase().includes(s)
    );
  }, [rows, search]);

  return (
    <div className="card p-4">
      <div className="font-semibold mb-3">Orders</div>
      <div className="space-y-2">
        {filtered.map(o => (
          <div key={o.id} className="flex items-center justify-between py-2 border-b">
            <div>
              <div className="font-medium">#{o.id.slice(0,8)}</div>
              <div className="text-xs text-black/60">{new Date(o.created_at).toLocaleString()}</div>
            </div>
            <div className="text-sm">{o.status}</div>
            <div className="text-sm font-semibold">AED {(o.grand_total ?? 0).toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
