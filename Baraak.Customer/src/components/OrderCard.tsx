import { memo } from "react";

type Item = { product_id: string; quantity: number; products?: { name: string } };
export type OrderVM = {
  id: string;
  table_id: number;
  status: "pending"|"accepted"|"preparing"|"served"|"cancelled";
  total_amount: number;
  created_at: string;
  order_items: Item[];
};

export const OrderCard = memo(function OrderCard({
  order,
  onAdvance,
  onCancel
}:{
  order: OrderVM;
  onAdvance?: (id: string) => void;
  onCancel?: (id: string) => void;
}) {
  const fmt = (v:number) => `AED ${v.toFixed(2)}`;
  const steps: Record<OrderVM["status"], OrderVM["status"] | null> = {
    pending: "accepted",
    accepted: "preparing",
    preparing: "served",
    served: null,
    cancelled: null
  };
  const next = steps[order.status];
  return (
    <div className="card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-semibold">#{order.id.slice(0,8)} · Table {order.table_id}</div>
        <span className="px-2 py-1 rounded-full text-xs bg-black/5">{order.status}</span>
      </div>
      <ul className="text-sm text-black/70 space-y-1">
        {order.order_items.map((it, i) => (<li key={i}>×{it.quantity} — {it.products?.name || it.product_id}</li>))}
      </ul>
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="font-semibold">{fmt(order.total_amount)}</div>
        <div className="flex gap-2">
          {next && <button className="pill" onClick={() => onAdvance?.(order.id)}>{next}</button>}
          {(order.status !== "served" && order.status !== "cancelled") && (
            <button className="pill" onClick={() => onCancel?.(order.id)}>cancel</button>
          )}
        </div>
      </div>
    </div>
  );
});
