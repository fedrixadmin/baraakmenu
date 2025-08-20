import { create } from "zustand";

type CartLine = {
  product_id: string;
  name: string;
  price: number;
  image_url?: string;
  qty: number;
  note?: string;
  modifiers?: { group_name: string; item_name: string; price_delta: number }[];
};

type State = {
  tableToken: string;
  carts: Record<string, CartLine[]>;
  setTableToken: (t: string) => void;
  add: (line: Omit<CartLine, "qty">) => void;
  inc: (pid: string, modsKey?: string) => void;
  dec: (pid: string, modsKey?: string) => void;
  remove: (pid: string, modsKey?: string) => void;
  clear: () => void;
  total: () => number;
  itemsCount: () => number;
};

function keyFor(pid: string, mods?: CartLine["modifiers"], note?: string) {
  const m = (mods && mods.length) ? mods.map(x => `${x.group_name}:${x.item_name}:${x.price_delta}`).sort().join("|") : "";
  return `${pid}__${m}__${note ?? ""}`;
}

export const useCartStore = create<State>((set, get) => ({
  tableToken: "",
  carts: {},
  setTableToken: (t) => set({ tableToken: t }),
  add: (line) => {
    const token = get().tableToken || "default";
    const carts = { ...get().carts };
    const arr = carts[token] ? [...carts[token]] : [];
    const idx = arr.findIndex(l => keyFor(l.product_id, l.modifiers, l.note) === keyFor(line.product_id, line.modifiers, line.note));
    if (idx >= 0) arr[idx] = { ...arr[idx], qty: arr[idx].qty + 1 };
    else arr.push({ ...line, qty: 1 });
    carts[token] = arr;
    set({ carts });
  },
  inc: (pid, modsKey) => {
    const token = get().tableToken || "default";
    const carts = { ...get().carts };
    carts[token] = (carts[token] || []).map(l => (keyFor(l.product_id, l.modifiers, l.note) === (modsKey || keyFor(pid,l.modifiers,l.note)) ? { ...l, qty: l.qty + 1 } : l));
    set({ carts });
  },
  dec: (pid, modsKey) => {
    const token = get().tableToken || "default";
    const carts = { ...get().carts };
    carts[token] = (carts[token] || []).map(l => (keyFor(l.product_id, l.modifiers, l.note) === (modsKey || keyFor(pid,l.modifiers,l.note)) ? { ...l, qty: Math.max(0, l.qty - 1) } : l)).filter(l => l.qty > 0);
    set({ carts });
  },
  remove: (pid, modsKey) => {
    const token = get().tableToken || "default";
    const carts = { ...get().carts };
    carts[token] = (carts[token] || []).filter(l => keyFor(l.product_id, l.modifiers, l.note) !== (modsKey || keyFor(pid,l.modifiers,l.note)));
    set({ carts });
  },
  clear: () => {
    const token = get().tableToken || "default";
    const carts = { ...get().carts }; carts[token] = []; set({ carts });
  },
  total: () => {
    const token = get().tableToken || "default";
    const arr = get().carts[token] || [];
    return arr.reduce((s, l) => s + l.qty * l.price, 0);
  },
  itemsCount: () => {
    const token = get().tableToken || "default";
    const arr = get().carts[token] || [];
    return arr.reduce((s, l) => s + l.qty, 0);
  },
}));
