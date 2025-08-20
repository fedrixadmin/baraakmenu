import { useEffect, useMemo, useState } from "react";
import { getStaffClient } from "../../../lib/supabaseClients";

type Props = { search: string; };
type Product = { id: string; name: string; price: number; is_featured?: boolean | null; };

export default function Products({ search }: Props) {
  const sb = getStaffClient();
  const [rows, setRows] = useState<Product[]>([]);

  useEffect(() => {
    (async () => {
      let q = sb.from("products").select("id,name,price,is_featured").order("sort_order, name", { ascending: true });
      const { data } = await q;
      setRows((data ?? []) as unknown as Product[]);
    })();
  }, [sb]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r => r.name.toLowerCase().includes(s));
  }, [rows, search]);

  return (
    <div className="card p-4">
      <div className="font-semibold mb-3">Products</div>
      <div className="space-y-2">
        {filtered.map(p => (
          <div key={p.id} className="flex items-center justify-between py-2 border-b">
            <div className="font-medium">{p.name}</div>
            <div className="text-sm">AED {p.price.toFixed(2)}</div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-sm text-black/60">No products.</div>}
      </div>
    </div>
  );
}
