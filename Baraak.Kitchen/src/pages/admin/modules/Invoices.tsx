import { useEffect, useMemo, useState } from "react";
import { getStaffClient } from "../../../lib/supabaseClients";

type Props = { search: string; };
type Invoice = { id: string; invoice_no: string; created_at: string; total_amount: number; vat_amount: number; grand_total: number; status: string; };

export default function Invoices({ search }: Props) {
  const sb = getStaffClient();
  const [rows, setRows] = useState<Invoice[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await sb.from("invoices").select("*").order("created_at", { ascending: false }).limit(100);
      setRows((data ?? []) as unknown as Invoice[]);
    })();
  }, [sb]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r =>
      r.invoice_no.toLowerCase().includes(s) || (r.status || "").toLowerCase().includes(s)
    );
  }, [rows, search]);

  return (
    <div className="card p-4">
      <div className="font-semibold mb-3">Invoices</div>
      <div className="space-y-2">
        {filtered.map(i => (
          <div key={i.id} className="flex items-center justify-between py-2 border-b">
            <div>
              <div className="font-medium">{i.invoice_no}</div>
              <div className="text-xs text-black/60">{new Date(i.created_at).toLocaleString()}</div>
            </div>
            <div className="text-sm">{i.status}</div>
            <div className="text-sm font-semibold">AED {i.grand_total.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
