import { AnimatePresence, motion } from "framer-motion";
import { useCartStore } from "../store/cart";
import Quantity from "./Quantity";
import SmartImage from "./SmartImage";
import { titleCase } from "../lib/format";
import { Egg, Flame, Leaf } from "lucide-react";

export type Product = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  image_url: string | null;

  // NEW: category + dietary flags (kept optional for backward-compat)
  category_id?: string | null;
  is_veg?: boolean | null;
  contains_egg?: boolean | null;
  is_spicy?: boolean | null;

  is_featured?: boolean | null;
};

type Props = {
  p: Product;
  expanded?: boolean;
  onToggle?: (id: string) => void;
  variant?: "grid" | "list";
};

function Badges({ p }: { p: Product }) {
  const items: Array<{ key: string; icon: JSX.Element; label: string }> = [];
  if (p.is_veg) items.push({ key: "veg", icon: <Leaf className="w-3.5 h-3.5" />, label: "Veg" });
  if (p.contains_egg) items.push({ key: "egg", icon: <Egg className="w-3.5 h-3.5" />, label: "Egg" });
  if (p.is_spicy) items.push({ key: "spicy", icon: <Flame className="w-3.5 h-3.5" />, label: "Spicy" });

  if (items.length === 0) return null;
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-black/70">
      {items.map(i => (
        <span
          key={i.key}
          className="inline-flex items-center gap-1 bg-black/5 rounded-full px-2 py-0.5"
          title={i.label}
          aria-label={i.label}
        >
          {i.icon}
          {i.label}
        </span>
      ))}
    </div>
  );
}

export default function ProductCard({ p, expanded, onToggle, variant = "list" }: Props) {
  const add = useCartStore(s => s.add);
  const inc = useCartStore(s => s.inc);
  const dec = useCartStore(s => s.dec);
  const lines = useCartStore(s => s.carts[s.tableToken] ?? []);
  const inCart = lines.find(l => l.product_id === p.id)?.qty ?? 0;

  if (variant === "grid") {
    return (
      <div className="card card-hover overflow-hidden">
        <button className="w-full text-left" onClick={() => onToggle?.(p.id)}>
          <SmartImage src={p.image_url} alt={p.name} ratio="4/3" className="w-full rounded-b-none" />
          <div className="p-3">
            <div className="font-semibold leading-tight line-clamp-2">{titleCase(p.name)}</div>
            <div className="mt-1 text-sm font-extrabold">AED {p.price.toFixed(2)}</div>
            <div className="mt-1"><Badges p={p} /></div>
          </div>
        </button>
        <div className="px-3 pb-3">
          {inCart === 0 ? (
            <button
              className="btn btn-primary w-full"
              onClick={(e) => {
                e.stopPropagation();
                add({ product_id: p.id, name: p.name, price: p.price, image_url: p.image_url ?? undefined });
              }}
            >
              Add
            </button>
          ) : (
            <div className="flex items-center justify-between">
              <Quantity value={inCart} onInc={() => inc(p.id)} onDec={() => dec(p.id)} />
              <div className="text-sm text-black/60">in cart</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // list variant (expandable row)
  return (
    <motion.div
      layout
      className="card card-hover overflow-hidden"
      transition={{ layout: { duration: 0.25, ease: [0.2, 0.8, 0.2, 1] } }}
      onClick={() => onToggle?.(p.id)}
      role="button"
      aria-expanded={expanded}
    >
      <div className="flex gap-4 p-3">
        <SmartImage src={p.image_url} alt={p.name} ratio="1/1" className="w-24" />
        <div className="flex-1">
          <div className="font-semibold leading-tight flex items-center gap-2">
            {titleCase(p.name)}
            <Badges p={p} />
          </div>
          <div className="text-sm text-black/60 line-clamp-2">{p.description}</div>
          <div className="mt-2 flex items-center justify-between">
            <div className="font-extrabold tracking-tight">AED {p.price.toFixed(2)}</div>
            <div onClick={(e) => e.stopPropagation()}>
              {inCart === 0 ? (
                <button
                  className="btn btn-primary"
                  onClick={() => add({ product_id: p.id, name: p.name, price: p.price, image_url: p.image_url ?? undefined })}
                >
                  Add
                </button>
              ) : (
                <Quantity value={inCart} onInc={() => inc(p.id)} onDec={() => dec(p.id)} />
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="exp"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="px-3 pb-3"
            onClick={(e) => e.stopPropagation()}
          >
            <SmartImage src={p.image_url} alt={p.name} ratio="4/3" className="w-full" />
            <div className="mt-3 text-sm text-black/70">{p.description || "Freshly prepared."}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
