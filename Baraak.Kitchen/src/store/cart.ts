// src/store/cart.ts
import { create } from "zustand";

export type CartItem = {
  id: string;
  name?: string;
  price?: number;      // per unit
  quantity?: number;   // default 1
  [key: string]: any;
};

type CartState = {
  items: CartItem[];

  // actions
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, quantity: number) => void;
  clear: () => void;

  // selectors (both names kept for compatibility)
  itemsCount: () => number;
  count: () => number;           // alias of itemsCount
  total: () => number;           // total price
};

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],

  addItem: (item) =>
    set((state) => {
      const idx = state.items.findIndex((i) => i.id === item.id);
      if (idx >= 0) {
        const next = [...state.items];
        const currentQty = typeof next[idx].quantity === "number" ? next[idx].quantity! : 1;
        const addQty = typeof item.quantity === "number" ? item.quantity! : 1;
        next[idx] = { ...next[idx], ...item, quantity: currentQty + addQty };
        return { items: next };
      }
      return { items: [...state.items, { quantity: 1, ...item }] };
    }),

  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

  updateQty: (id, quantity) =>
    set((state) => ({
      items: state.items
        .map((i) => (i.id === id ? { ...i, quantity } : i))
        .filter((i) => (i.quantity ?? 0) > 0),
    })),

  clear: () => set({ items: [] }),

  itemsCount: () => {
    const items = get().items;
    return items.reduce((sum, i) => sum + (typeof i.quantity === "number" ? i.quantity : 1), 0);
  },

  // alias for components that call count()
  count: () => {
    const items = get().items;
    return items.reduce((sum, i) => sum + (typeof i.quantity === "number" ? i.quantity : 1), 0);
  },

  total: () => {
    const items = get().items;
    return items.reduce((sum, i) => {
      const qty = typeof i.quantity === "number" ? i.quantity : 1;
      const price = typeof i.price === "number" ? i.price : 0;
      return sum + qty * price;
    }, 0);
  },
}));
