// src/pages/Cart.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { getCustomerClient } from "../lib/supabaseClients";
import { useCartStore } from "../store/cart";
import { useTableToken } from "../hooks/useTableToken";
import Quantity from "../components/Quantity";
import SmartImage from "../components/SmartImage";
import { titleCase } from "../lib/format";

type OpenOrderItem = {
  id?: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  status: "active"|"preparing"|"ready"|"served"|"cancelled";
  products?: { name: string; image_url: string | null };
  order_item_modifiers?: { group_name: string; item_name: string; price_delta: number }[];
};
type OpenOrder = {
  id: string; status: string; created_at: string;
  total_amount: number; grand_total: number; discount_amount: number; tip_amount: number;
  order_items: OpenOrderItem[];
};

export default function Cart() {
  const sb = getCustomerClient();
  const token = useTableToken();
  const { tableToken, carts, inc, dec, remove, clear, total } = useCartStore();
  const lines = carts[tableToken] ?? [];
  const [note, setNote] = useState("");
  const [openOrder, setOpenOrder] = useState<OpenOrder | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const orderChannelRef = useRef<ReturnType<typeof sb.channel> | null>(null);

  const grand = useMemo(() => total(), [lines, total]);

  const submit = async () => {
    if (!token) { alert("Scan table QR to order."); return; }
    if (lines.length === 0) { alert("Cart is empty."); return; }
    const items = lines.map(l => ({
      product_id: l.product_id,
      quantity: l.qty,
      unit_price: l.price,
      note: l.note,
      modifiers: l.modifiers || []
    }));
    const { data, error } = await sb.rpc("create_order_with_items_v2",
      { p_table_token: token, p_items: items, p_customer_note: note });
    if (error) { alert(error.message); return; }
    clear();
    await fetchOpenOrder();
    alert(`Order placed! #${String(data.id).slice(0,8)}`);
  };

  const fetchOpenOrder = async () => {
    if (!token) return;
    setLoadingOrder(true);
    const { data, error } = await sb
      .from("orders")
      .select("id,status,created_at,total_amount,grand_total,discount_amount,tip_amount,order_items(id,product_id,quantity,unit_price,status,products(name,image_url),order_item_modifiers(group_name,item_name,price_delta))")
      .in("status", ["pending","accepted","preparing","ready","served"])
      .order("created_at", { ascending: false })
      .limit(1);
    setLoadingOrder(false);
    if (!error && data && data.length) setOpenOrder(data[0] as any);
    else setOpenOrder(null);
  };

  useEffect(() => {
    if (!openOrder) return;
    orderChannelRef.current?.unsubscribe();
    const ch = sb.channel(`order:${openOrder.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `id=eq.${openOrder.id}` },
        payload => { if (payload.new) setOpenOrder(prev => ({ ...(prev as any), ...(payload.new as any) })); })
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items", filter: `order_id=eq.${openOrder.id}` },
        () => fetchOpenOrder())
      .on("postgres_changes", { event: "*", schema: "public", table: "order_item_modifiers" },
        () => fetchOpenOrder())
      .subscribe();
    orderChannelRef.current = ch;
    return () => { ch.unsubscribe(); };
  }, [openOrder?.id, sb]);

  useEffect(() => { fetchOpenOrder(); }, [token]);

  const cancelItem = async (order_item_id?: string) => {
    if (!openOrder || !order_item_id) return;
    const { error } = await sb.from("order_items").update({ status: "cancelled" }).eq("id", order_item_id);
    if (error) { alert(error.message); return; }
  };

  const canCancel = (createdAt: string) => (Date.now() - new Date(createdAt).getTime()) < 5 * 60 * 1000;

  return (
    <div className="space-y-4 page-with-bottombar">
      <h2 className="text-xl font-bold">Your Cart</h2>

      {lines.length === 0 ? (
        <div className="card p-4">Your cart is empty.</div>
      ) : (
        <div className="space-y-3">
          {lines.map(l => (
            <div key={l.product_id + (l.note||"") + (l.modifiers||[]).length} className="card p-4">
              <div className="flex items-center gap-3">
                <SmartImage src={l.image_url} alt={l.name} ratio="1/1" className="w-16" />
                <div className="flex-1">
                  <div className="font-semibold">{titleCase(l.name)}</div>
                  {l.modifiers?.length ? (
                    <div className="text-xs text-black/60 line-clamp-2">{l.modifiers.map(m => m.item_name).join(", ")}</div>
                  ) : null}
                  {l.note ? <div className="text-xs text-black/60">Note: {l.note}</div> : null}
                  <div className="text-sm text-black/60">AED {l.price.toFixed(2)}</div>
                </div>
                <Quantity value={l.qty} onInc={() => inc(l.product_id)} onDec={() => dec(l.product_id)} />
                <button className="ml-2 btn btn-ghost" onClick={() => remove(l.product_id)}>Remove</button>
              </div>
            </div>
          ))}

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold">Total</div>
              <div className="text-lg font-extrabold">AED {grand.toFixed(2)}</div>
            </div>
            <textarea
              placeholder="Any note for the kitchen?"
              className="mt-3 w-full border rounded-xl p-3 outline-none focus:ring-2 ring-gold/50"
              value={note} onChange={e => setNote(e.target.value)} rows={3}
            />
            <button className="mt-4 w-full btn btn-primary shadow-[0_10px_26px_rgba(201,162,39,.25)]" onClick={submit}>
              Place Order to Table
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-lg font-bold mt-6">Open Order</h3>
        {loadingOrder ? (
          <div className="card p-4 animate-pulse">Loading…</div>
        ) : !openOrder ? (
          <div className="card p-4">No open order yet.</div>
        ) : (
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Order #{openOrder.id.slice(0,8)}</div>
                <div className="text-sm text-black/60">{new Date(openOrder.created_at).toLocaleString()}</div>
              </div>
              <span className="px-2 py-1 rounded-full text-xs bg-black/5">{openOrder.status}</span>
            </div>
            <div className="space-y-2">
              {openOrder.order_items.map(it => (
                <div key={it.id || it.product_id} className="flex items-center gap-3">
                  <SmartImage src={it.products?.image_url} alt={it.products?.name || ""} ratio="1/1" className="w-12" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{titleCase(it.products?.name || "")}</div>
                    {it.order_item_modifiers?.length ? (
                      <div className="text-xs text-black/60">{it.order_item_modifiers.map(m => m.item_name).join(", ")}</div>
                    ) : null}
                    <div className="text-xs text-black/60">AED {(it.unit_price * it.quantity).toFixed(2)}</div>
                  </div>
                  {it.status === "cancelled" ? (
                    <span className="text-xs text-black/50">Cancelled</span>
                  ) : canCancel(openOrder.created_at) ? (
                    <button className="btn btn-ghost" onClick={() => cancelItem(it.id)}>Cancel</button>
                  ) : (
                    <span className="text-xs text-black/50">{it.status}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="font-semibold">Grand total</div>
              <div className="font-extrabold">AED {(openOrder.grand_total ?? openOrder.total_amount ?? 0).toFixed(2)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
