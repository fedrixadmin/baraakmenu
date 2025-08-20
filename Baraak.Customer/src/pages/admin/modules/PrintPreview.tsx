import { useEffect, useState } from "react";
import { getAdminClient } from "../../../lib/supabaseClients";
import { currencyAED } from "../../../lib/format";
import "../../../print.css";
import { X, Printer } from "lucide-react";

export default function PrintPreview({ invoiceId, onClose }: { invoiceId: string; onClose: () => void }) {
  const sb = getAdminClient();
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await sb.from("v_invoice_print").select("*").eq("invoice_id", invoiceId).maybeSingle();
      setData(data || null);
    })();
  }, [invoiceId]);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-[420px] bg-white p-3 overflow-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">Print preview</div>
          <button className="p-2 rounded-lg hover:bg-black/5" onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <div className="receipt">
          <div className="r-head">
            <img src="/images/brand/logo.png" />
            <div>Baraak Restaurant</div>
          </div>
          <div className="r-meta">
            <div>Invoice: {data?.invoice_no ?? "—"}</div>
            <div>{new Date(data?.created_at ?? Date.now()).toLocaleString()}</div>
          </div>
          <div className="r-items">
            {(data?.items ?? []).map((it: any, idx: number) => (
              <div className="r-row" key={idx}>
                <div className="name">{it.name}</div>
                <div className="qty">{it.qty}</div>
                <div className="amt">{currencyAED(it.total)}</div>
              </div>
            ))}
          </div>
          <div className="r-total">
            <div>Subtotal: {currencyAED(data?.subtotal ?? 0)}</div>
            {!!data?.tax && <div>Tax: {currencyAED(data.tax)}</div>}
            {!!data?.discount && <div>Discount: {currencyAED(data.discount)}</div>}
            <div className="net">Grand total: {currencyAED(data?.grand_total ?? 0)}</div>
          </div>
          <div className="r-foot">Thank you! Visit again.</div>
        </div>

        <div className="mt-3 flex gap-2">
          <button className="btn btn-primary" onClick={() => window.print()}><Printer className="w-4 h-4 mr-1" />Print</button>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
