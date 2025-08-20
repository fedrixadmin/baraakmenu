// src/store/cart.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartItem = {
  product_id: string;
  name: string;
  price: number;
  qty: number;
  image_url?: string | null;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (product_id: string) => void;
  setQty: (product_id: string, qty: number) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item, qty = 1) =>
        set((state) => {
          const found = state.items.find((x) => x.product_id === item.product_id);
          if (found) {
            return {
              items: state.items.map((x) =>
                x.product_id === item.product_id ? { ...x, qty: x.qty + qty } : x
              ),
            };
          }
          return { items: [...state.items, { ...item, qty }] };
        }),
      remove: (product_id) =>
        set((state) => ({ items: state.items.filter((x) => x.product_id !== product_id) })),
      setQty: (product_id, qty) =>
        set((state) => ({
          items: state.items.map((x) => (x.product_id === product_id ? { ...x, qty } : x)),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "cart",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// --- Legacy alias so existing imports keep working ---
export const useCartStore = useCart;

// --- Convenient selectors (optional but useful) ---
export const useCartCount = () => useCart((s) => s.items.reduce((n, i) => n + i.qty, 0));
export const useCartSubtotal = () => useCart((s) => s.items.reduce((sum, i) => sum + i.qty * i.price, 0));
