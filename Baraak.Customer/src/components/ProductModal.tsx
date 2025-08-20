import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Flame, BadgeInfo, Minus, Plus } from "lucide-react";
import { currencyAED, titleCase } from "../lib/format";
import { useCartStore } from "../store/cart";
import { supabase } from "../lib/supabaseClient";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
};

type ExtraItem = { id: string; name: string; price_delta: number };
type ExtraGroup = {
  id: string;
  name: string;
  type: "single" | "multiple";
  max?: number;
  items: ExtraItem[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  product: Product | null;
};

export default function ProductModal({ open, onClose, product }: Props) {
  const add = useCartStore(s => s.add);

  const prepMin = useMemo(() => {
    if (!product) return 15;
    const d = (product.description || "").toLowerCase();
    if (d.includes("biryani")) return 25;
    if (d.includes("tawa") || d.includes("grill")) return 18;
    return 15;
  }, [product]);

  const spicy = useMemo(() => {
    if (!product) return false;
    const d = (product.description || "").toLowerCase();
    return /(spicy|pepper|chilli|mirchi|schezwan|kanthari)/i.test(d);
  }, [product]);

  const [groups, setGroups] = useState<ExtraGroup[] | null>(null);
  useEffect(() => {
    if (!open || !product) return;
    (async () => {
      const { data: g, error } = await supabase
        .from("product_extra_groups")
        .select("id,name,type,max, product_extra_items(id,name,price_delta)")
        .eq("product_id", product.id);

      if (!error && g && g.length) {
        setGroups(g.map((row: any) => ({
          id: row.id, name: row.name, type: row.type, max: row.max ?? undefined,
          items: (row.product_extra_items || []).map((it: any) => ({
            id: it.id, name: it.name, price_delta: Number(it.price_delta || 0)
          }))
        })));
      } else {
        setGroups([
          {
            id: "sauce", name: "Sauce Choice (Max 2)", type: "multiple", max: 2,
            items: [
              { id: "homemade-bbq", name: "Homemade BBQ", price_delta: 2 },
              { id: "ranch", name: "Ranch", price_delta: 0 },
              { id: "garlic-aioli", name: "Garlic Aioli", price_delta: 1 }
            ]
          },
          {
            id: "addons", name: "Add-ons", type: "multiple",
            items: [
              { id: "extra-cheese", name: "Extra Cheese", price_delta: 3 },
              { id: "fries", name: "Fries", price_delta: 6 },
              { id: "side-salad", name: "Side Salad", price_delta: 5 }
            ]
          }
        ]);
      }
    })();
  }, [open, product]);

  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});

  useEffect(() => { if (open) { setQty(1); setNotes(""); setSelected({}); } }, [open]);

  if (!product) return null;
  const p = product; // non-null from here
  const img = p.image_url || "/images/products/image.png";

  const totalDelta = useMemo(() => {
    let t = 0;
    for (const gid of Object.keys(selected)) {
      for (const id of selected[gid]) {
        const group = groups?.find(g => g.id === gid);
        const item = group?.items.find(i => i.id === id);
        if (item) t += item.price_delta;
      }
    }
    return t;
  }, [selected, groups]);

  const unitTotal = p.price + totalDelta;
  const grand = unitTotal * qty;

  function toggle(g: ExtraGroup, item: ExtraItem) {
    setSelected(prev => {
      const copy = { ...prev };
      copy[g.id] = new Set(copy[g.id] || []);
      const s = copy[g.id];
      if (g.type === "single") {
        s.clear(); s.add(item.id);
      } else {
        if (s.has(item.id)) s.delete(item.id);
        else {
          if (g.max && s.size >= g.max) return prev;
          s.add(item.id);
        }
      }
      return copy;
    });
  }

  function confirm() {
    const mods: string[] = [];
    for (const gid of Object.keys(selected)) {
      const group = groups?.find(g => g.id === gid);
      const names = Array.from(selected[gid]).map(id => group?.items.find(i => i.id === id)?.name).filter(Boolean).join(", ");
      if (names) mods.push(`${group?.name}: ${names}`);
    }
    const note = [notes.trim(), mods.join(" | ")].filter(Boolean).join(" | ");

    for (let i = 0; i < qty; i++) {
      add({
        product_id: p.id,
        name: titleCase(p.name),
        price: unitTotal,
        image_url: p.image_url ?? undefined,
        note: note || undefined
      });
    }
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            role="dialog" aria-modal="true"
            className="absolute left-0 right-0 bottom-0 max-w-screen-sm mx-auto bg-white rounded-t-3xl shadow-2xl"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
          >
            <div className="p-4 flex items-center justify-between">
              <div className="font-semibold text-lg">{titleCase(p.name)}</div>
              <button className="p-2 rounded-full hover:bg-black/5" onClick={onClose} aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4">
              <div className="rounded-2xl overflow-hidden border border-black/5">
                <img src={img} alt={p.name} className="w-full h-52 object-cover" />
              </div>
            </div>

            <div className="px-4 pt-3 flex items-center gap-3 text-xs text-black/70">
              <div className="inline-flex items-center gap-1 bg-black/5 rounded-full px-2 py-1">
                <Clock className="w-3.5 h-3.5" /> {prepMin} min
              </div>
              {spicy && (
                <div className="inline-flex items-center gap-1 bg-black/5 rounded-full px-2 py-1">
                  <Flame className="w-3.5 h-3.5" /> Spicy
                </div>
              )}
            </div>

            <div className="px-4 pt-2 text-sm text-black/75">
              {p.description || "Freshly prepared with premium ingredients."}
            </div>

            {groups && groups.length > 0 && (
              <div className="px-4 py-3 space-y-3">
                {groups.map(g => (
                  <div key={g.id}>
                    <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <BadgeInfo className="w-4 h-4 text-gold" />
                      <span>{g.name}</span>
                      {g.type === "multiple" && g.max ? (
                        <span className="text-xs text-black/50">(Max {g.max})</span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {g.items.map(it => {
                        const active = !!selected[g.id]?.has(it.id);
                        return (
                          <button
                            key={it.id}
                            className={`px-3 py-1.5 rounded-full border text-sm ${active ? "border-gold bg-gold/10" : "border-black/10 bg-white"}`}
                            onClick={() => toggle(g, it)}
                          >
                            {it.name}{it.price_delta ? ` +${currencyAED(it.price_delta)}` : ""}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="px-4">
              <textarea
                placeholder="Custom request for the kitchen (optional)"
                className="w-full border border-black/10 rounded-xl p-3 text-sm outline-none focus:ring-2 ring-gold/40"
                value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              />
            </div>

            <div className="p-4 flex items-center justify-between gap-3">
              <div className="inline-flex items-center rounded-xl border border-black/10">
                <button className="p-2" onClick={() => setQty(q => Math.max(1, q-1))} aria-label="Decrease">
                  <Minus className="w-5 h-5" />
                </button>
                <div className="px-4 font-semibold">{qty}</div>
                <button className="p-2" onClick={() => setQty(q => q+1)} aria-label="Increase">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <button className="flex-1 btn btn-primary shadow-[0_14px_28px_rgba(201,162,39,.28)]" onClick={confirm}>
                Add to Cart ({currencyAED(grand)})
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
