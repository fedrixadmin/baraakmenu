import { useEffect, useState } from "react";
import { getAdminClient } from "../../../lib/supabaseClients";
import { currencyAED } from "../../../lib/format";

export default function Dashboard() {
  const sb = getAdminClient();
  const [cards, setCards] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await sb.from("v_sales_summary_daily").select("*").limit(7);
      const today = data?.[0];
      setCards([
        { label: "Invoices (today)", value: String(today?.invoices ?? 0) },
        { label: "Net Sales (today)", value: currencyAED(today?.net ?? 0) },
        { label: "Gross (today)", value: currencyAED(today?.gross ?? 0) },
      ]);
    })();
  }, [sb]);

  return (
    <div className="grid md:grid-cols-3 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="card p-4">
          <div className="text-black/60 text-xs">{c.label}</div>
          <div className="text-2xl font-extrabold mt-1">{c.value}</div>
        </div>
      ))}
      <div className="card p-4 md:col-span-3">
        <div className="text-sm text-black/70">Recent activity (orders, alerts) appears here.</div>
      </div>
    </div>
  );
}
