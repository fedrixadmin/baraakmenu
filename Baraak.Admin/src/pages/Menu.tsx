import { useEffect, useMemo, useState } from "react";
import { getCustomerClient } from "../lib/supabaseClients";
import ProductCard, { type Product } from "../components/ProductCard";
import { Search } from "lucide-react";

type Category = { id: string; name: string; sort_order?: number | null };

export default function Menu() {
  const sb = getCustomerClient();
  const [cats, setCats] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data: c } = await sb.from("categories").select("*").order("sort_order, name");
      setCats(c ?? []);
      // Pull category and dietary flags so UI & typing stay correct
      const { data: p } = await sb
        .from("products")
        .select("id,name,description,price,image_url,category_id,is_veg,contains_egg,is_spicy")
        .order("name");
      setProducts((p ?? []) as unknown as Product[]);
    })();
  }, [sb]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return products;
    return products.filter(p => p.name.toLowerCase().includes(qq) || (p.description || "").toLowerCase().includes(qq));
  }, [products, q]);

  // Gather uncategorized items (category_id null or not found)
  const uncategorized = useMemo(() => {
    const catIds = new Set(cats.map(c => c.id));
    return filtered.filter(p => !p.category_id || !catIds.has(p.category_id));
  }, [filtered, cats]);

  return (
    <div className="space-y-3 page-with-bottombar">
      <div className="card p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
          <input
            className="w-full border border-black/10 rounded-xl py-2 pl-9 pr-3 outline-none focus:ring-2 ring-gold/30"
            placeholder="Search menu…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {cats.map(c => {
          const items = filtered.filter(p => p.category_id === c.id);
          if (items.length === 0) return null;
          return (
            <section key={c.id} className="space-y-2">
              <h3 className="px-1 text-sm font-semibold">{c.name}</h3>
              <div className="grid grid-cols-2 gap-3">
                {items.map(p => <ProductCard key={p.id} p={p} variant="grid" />)}
              </div>
            </section>
          );
        })}

        {uncategorized.length > 0 && (
          <section className="space-y-2">
            <h3 className="px-1 text-sm font-semibold">Other</h3>
            <div className="grid grid-cols-2 gap-3">
              {uncategorized.map(p => <ProductCard key={p.id} p={p} variant="grid" />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
