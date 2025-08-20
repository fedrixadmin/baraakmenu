import { useEffect, useMemo, useState } from "react";
import { getStaffClient } from "../../../lib/supabaseClients";

type Props = { search: string; };
type Category = { id: string; name: string; sort_order: number | null; };

export default function Categories({ search }: Props) {
  const sb = getStaffClient();
  const [rows, setRows] = useState<Category[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await sb.from("categories").select("id,name,sort_order").order("sort_order, name");
      setRows((data ?? []) as unknown as Category[]);
    })();
  }, [sb]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r => r.name.toLowerCase().includes(s));
  }, [rows, search]);

  return (
    <div className="card p-4">
      <div className="font-semibold mb-3">Categories</div>
      <ul className="space-y-2">
        {filtered.map(c => <li key={c.id} className="py-2 border-b">{c.name}</li>)}
      </ul>
    </div>
  );
}
